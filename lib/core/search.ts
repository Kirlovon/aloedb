import { Query } from '../query.ts';
import { isIndexable } from '../utils.ts';
import { Document, SearchQueryObject } from '../types.ts';

interface SearchParams {
	kv: Deno.Kv;
	query: Query;
	indexedKeys: Set<string>;
	collectionName: string;
}

/**
 * Query Deno KV storage
 */
export async function* Search({ kv, query, indexedKeys, collectionName }: SearchParams) {
	// Get any document
	if (query.type === 'undefined') {
		const iterator = kv.list({ prefix: [collectionName, '_id'] }, { batchSize: 1 });
		for await (const entity of iterator) yield entity;
		return;
	}

	// Find documents using custom search function
	if (query.type === 'function') {
		const iterator = kv.list({ prefix: [collectionName, '_id'] });

		for await (const entity of iterator) {
			if (query.run(entity.value as Document)) yield entity;
		}

		return;
	}

	// Find object using object query
	if (query.type === 'object') {
		const [type, selector] = getKvQuery(query, collectionName, indexedKeys);

		// Get single entity
		if (type === 'get') {
			const entity = await kv.get(selector);
			if (!entity.versionstamp) return;
			if (query.run(entity.value as Document)) yield entity;
			return;
		}

		// Iterate thought entities
		if (type === 'list') {
			const iterator = kv.list(selector);

			for await (const entity of iterator) {
				if (query.run(entity.value as Document)) yield entity;
			}

			return;
		}
	}
}

/**
 * Get optimal Deno.Kv query for searching.
 * @param query Query to analyze
 * @param collectionName Name of the collection
 * @param indexedKeys Set of indexed keys
 */
function getKvQuery(query: Query, collectionName: string, indexedKeys: Set<string>): ['list', Deno.KvListSelector] | ['get', Deno.KvKey] {
	const { value, keys } = query as typeof query & { value: SearchQueryObject };

	// Check if query contains "_id"
	if (isIndexable(value?._id)) return ['get', [collectionName, '_id', value._id]];

	// Check if query contains indexed keys
	if (indexedKeys.size > 0) {
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (key === '_id') continue;

			if (indexedKeys.has(key) && isIndexable(value[key])) {
				return ['list', { prefix: [collectionName, key, value[key] as Deno.KvKeyPart] }];
			}
		}
	}

	// Just iterate thought all entities
	return ['list', { prefix: [collectionName, '_id'] }];
}
