import { Query } from '../query.ts';
import { Search } from './search.ts';
import { Document, UpdateQuery } from '../types.ts';
import { isIndexable } from '../utils.ts';

interface UpdateParams {
	kv: Deno.Kv;
	query: Query;
	update: UpdateQuery;
	multiple: boolean;
	indexedKeys: Set<string>;
	collectionName: string;
}

/**
 * Create update operation
 */
export async function Update({ kv, query, update, multiple, indexedKeys, collectionName }: UpdateParams) {
	const updatedDocuments: Document[] = [];
	const iterator = Search({ kv, query, indexedKeys, collectionName });

	for await (const entity of iterator) {
		const documentId = (entity.value as Document)._id;
		const entityKey = [collectionName, '_id', documentId];

		let response = { ok: false };
		let firstTry = true;

		while (!response.ok) {
			const ao = kv.atomic();

			// Get fresh entity (If checks failed)
			const freshEntity = firstTry ? entity : await kv.get(entityKey);

			// Check if main entity changed
			ao.check(freshEntity);

			const oldDocument = freshEntity.value as Document;
			const newDocument = applyChanges(oldDocument, update);

			// Delete old document if ID changed
			if (oldDocument._id !== newDocument._id) throw new Error('It is not allowed to modify ID of the document')

			// Add document to the main collection
			ao.set([collectionName, '_id', newDocument._id], newDocument);

			// Modify indices related to the document
			for (const key of indexedKeys) {
				const oldDocumentValue = oldDocument[key] as Deno.KvKeyPart;
				const newDocumentValue = newDocument[key] as Deno.KvKeyPart;
				if (!isIndexable(newDocumentValue)) throw new TypeError(`Document contains not indexable value in the "${key}" field`);

				if (oldDocumentValue !== newDocumentValue) ao.delete([collectionName, key, oldDocumentValue, oldDocument._id as string]);
				ao.set([collectionName, key, newDocumentValue, newDocument._id as string], newDocument);
			}

			// Commit changes
			response = await ao.commit();
			if (response.ok) updatedDocuments.push(newDocument);

			firstTry = false;
		}

		if (!multiple) break;
	}

	return updatedDocuments;
}

/**
 * Update document using update query.
 * @param document Document to update.
 * @param update Update query to apply.
 */
export function applyChanges(document: Document, update: UpdateQuery) {
	const newDocument = { ...document };

	// Update function
	if (typeof update === 'function') return update(newDocument);

	// Update object
	for (const key in update) {
		const value = update[key];
		newDocument[key] = typeof value === 'function' ? value(newDocument) : value;
	}

	return newDocument;
}
