import { Document, DocumentValue, SearchQuery } from './types.ts';
import { isObjectLiteral } from './utils.ts';

export class Query {
	public type!: 'undefined' | 'function' | 'object';
	public value: SearchQuery;
	public keys: string[] = [];
	protected executor!: (document: Document) => boolean;

	constructor(value: SearchQuery) {
		this.value = value;

		// Function query
		if (typeof value === 'function') {
			this.type = 'function';
			this.executor = (document) => value(document);
			return;
		}

		// Undefined query
		if (typeof value === 'undefined') {
			this.type = 'undefined';
			this.executor = () => true;
			return;
		}

		// Normal query
		if (isObjectLiteral(value)) {
			let keys = Object.keys(value);

			// Empty query
			if (keys.length === 0) {
				this.value = undefined;
				this.type = 'undefined';
				this.executor = () => true;
				return;
			}

			// Prioritize "_id" key
			if (value._id && keys[0] !== '_id') {
				keys = keys.filter((key) => key !== '_id');
				keys.unshift('_id');
			}

			this.keys = keys;
			this.type = 'object';

			// Match all query keys values
			this.executor = (document) => {
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					const matches = Query.matchValue(value[key], document[key]);
					if (matches) continue;
					return false;
				}

				return true;
			};

			return;
		}

		throw new TypeError('Invalid query type');
	}

	/**
	 * Match query value with the document value
	 * @param queryValue Value from the query
	 * @param documentValue Value from the document
	 */
	static matchValue(queryValue: any, documentValue: DocumentValue): boolean {
		const type = typeof queryValue;

		// Match primitives
		if (type === 'string' || type === 'boolean' || type === 'undefined') {
			return queryValue === documentValue;
		}

		// Match numbers
		if (type === 'number' || type === 'bigint') {
			if (Number.isNaN(queryValue)) return Number.isNaN(documentValue);
			return queryValue === documentValue;
		}

		// Custom match functions
		if (type === 'function') {
			return queryValue(documentValue) ? true : false;
		}

		// Match all objects
		if (type === 'object') {
			// Match arrays
			if (Array.isArray(queryValue)) {
				if (!Array.isArray(documentValue)) return false;
				return queryValue.every((value: any) => documentValue.includes(value));
			}

			// Match nested values
			if (isObjectLiteral(queryValue)) {
				if (!isObjectLiteral(documentValue)) return false;

				for (const key in queryValue) {
					if (Query.matchValue(queryValue[key], documentValue[key])) continue;
					return false;
				}

				return true;
			}

			// Match regular expressions
			if (queryValue instanceof RegExp) {
				if (documentValue instanceof RegExp) return String(queryValue) === String(documentValue);
				return queryValue.test(documentValue + '');
			}

			// Match dates
			if (queryValue instanceof Date) {
				return queryValue.valueOf() === documentValue?.valueOf();
			}

			// Match Map
			if (queryValue instanceof Map) {
				if (!(documentValue instanceof Map)) return false;
				if (queryValue.size !== documentValue.size) return false;

				for (const [key, value] of queryValue.entries()) {
					if (documentValue.get(key) !== value) return false;
				}

				return true;
			}

			// Match Set
			if (queryValue instanceof Set) {
				if (!(documentValue instanceof Set)) return false;
				if (queryValue.size !== documentValue.size) return false;

				for (const [_key, value] of queryValue.entries()) {
					if (documentValue.has(value)) return false;
				}

				return [...queryValue].every((value) => documentValue.has(value));
			}

			// Match Uint8Arrays
			if (queryValue instanceof Uint8Array) {
				if (!(documentValue instanceof Uint8Array)) return false;
				if (queryValue.length !== documentValue.length) return false;
				return queryValue.every((value, index) => value === documentValue[index]);
			}
		}

		return queryValue === documentValue;
	}

	/**
	 * Run query on the specified document
	 * @param document Document to match
	 */
	public run(document: Document) {
		return this.executor(document);
	}
}
