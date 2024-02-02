import { Document, DocumentObject, SortQuery, ValidSchema } from './types.ts';

/**
 * Checks whether the value is a plain object
 * @param target Target to check
 * @returns Result of checking
 */
export function isObjectLiteral(target: unknown): target is DocumentObject {
	return Object.prototype.toString.call(target) === '[object Object]';
}

/**
 * Sorting an array of documents by multiple fields.
 * @param array Documents array to sort.
 * @param query Sorting query.
 * @returns Sorted array.
 */
export function sortDocuments<T>(array: T[], query: SortQuery<any>): T[] {
	const fields = Object.keys(query);

	array.sort((a, b) => {
		let index = 0;
		let result = 0;

		while (result === 0 && index < fields.length) {
			const field = fields[index] as keyof T;
			const order = (query[field] === 'desc' || query[field] === -1) ? -1 : 1;

			if (a[field] < b[field]) result = -1 * order;
			if (a[field] > b[field]) result = 1 * order;
			index++;
		}

		return result;
	});

	return array;
}

/**
 * Ensure that document contains valid ID. If not, generate and assign it.
 * @param document Document to ensure in
 */
export function ensureId(document: Partial<Document>): ValidSchema<Document> {
	const documentWithId = { _id: crypto.randomUUID(), ...document };
	if (typeof documentWithId._id !== 'string') throw new TypeError('Document "_id" must be a string or a number');
	// TODO: Make it string or number

	return documentWithId;
}

/**
 * Checks whether the value is possible to index
 * @param target Target to check
 */
export function isIndexable(target: unknown): target is Deno.KvKeyPart {
	if (typeof target === 'string') return true;
	if (typeof target === 'number') return true;
	if (typeof target === 'bigint') return true;
	if (typeof target === 'boolean') return true;
	if (target instanceof Uint8Array) return true;
	return false;
}

/**
 * Create Set with the indexed keys
 * @param keys List of keys to index
 */
export function createIndexesSet(keys: string[]) {
	const set = new Set<string>();

	// Validate and store keys
	for (const key of keys) {
		const trimmedKey = key.trim();

		if (trimmedKey === '_id') continue;
		if (trimmedKey === '') throw new Error('Indexed keys cant be empty');

		set.add(trimmedKey);
	}

	// Limit amount of indexed keys (Due to atomic operations which do not support more than 10 mutations)
	if (set.size > 6) throw new Error('It is not allowed to index more than 6 keys');

	return set;
}

export function getDocumentEntitiesKeys(document: Document, collectionName: string, indexedKeys: Set<string>) {
	const keys: Deno.KvKey[] = [[collectionName, '_id', document._id]];

	for (const key of indexedKeys) {
		const documentValue = document[key];
		if (!isIndexable(documentValue)) throw new TypeError(`Document contains not indexable value in the "${key}" field`);

		keys.push([collectionName, key, documentValue, document._id])
	}

	return keys;
}