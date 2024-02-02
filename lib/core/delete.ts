import { Query } from '../query.ts';
import { Document } from '../types.ts';
import { Search } from './search.ts';

interface DeleteParams {
	kv: Deno.Kv;
	query: Query;
	multiple: boolean;
	indexedKeys: Set<string>;
	collectionName: string;
}

/**
 * Delete documents from KV store
 */
export async function Delete({ kv, query, multiple, indexedKeys, collectionName }: DeleteParams) {
	const deletedEntities: Deno.KvEntry<Document>[] = [];
	const iterator = Search({ kv, query, indexedKeys, collectionName });

	for await (const entity of iterator) {
		const document = entity.value as Document;
		const ao = kv.atomic();

		// Check if entity not changes
		ao.check(entity);

		// Delete main document
		ao.delete([collectionName, '_id', document._id]);

		// Delete indexes
		for (const key of indexedKeys) {
			ao.delete([collectionName, key, document[key] as Deno.KvKeyPart, document._id]);
		}

		// Commit
		const response = await ao.commit();
		if (response.ok) deletedEntities.push(entity as Deno.KvEntry<Document>);

		if (!multiple) break;
	}

	return deletedEntities;
}
