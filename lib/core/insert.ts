import { Document } from '../types.ts';
import { isIndexable } from '../utils.ts';

interface InsertParams {
	kv: Deno.Kv;
	document: Document;
	indexedKeys: Set<string>;
	collectionName: string;
}

/**
 * Insert document into KV store
 */
export async function Insert({ kv, document, indexedKeys, collectionName }: InsertParams) {
	const insertedEntities: Deno.KvEntry<Document>[] = [];
	const ao = kv.atomic();

	// Check that Document with the same key not exists
	ao.check({ key: [collectionName, '_id', document._id], versionstamp: null });

	// Add document in to collection
	ao.set([collectionName, '_id', document._id], document);

	// Check if fields can be indexed
	for (const key of indexedKeys) {
		const documentValue = document[key];
		if (!isIndexable(documentValue)) throw new TypeError(`Document contains not indexable value in the "${key}" field`);

		// Check if index already exists
		ao.check({ key: [collectionName, key, documentValue, document._id], versionstamp: null });

		// Set index
		ao.set([collectionName, key, documentValue, document._id as string], document);
	}

	const result = await ao.commit();
	if (!result.ok) throw new Error('Document with the specified ID is already exists');

	const entity: Deno.KvEntry<Document> = {
		key: [collectionName, '_id', document._id],
		value: document,
		versionstamp: result.versionstamp,
	}

	return entity;
}
