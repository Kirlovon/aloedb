import type { Database } from './database.ts';
import { Search } from './core/search.ts';
import { Query } from './query.ts';
import { sortDocuments } from './utils.ts';
import { Document, SortQuery } from './types.ts';

/** Cursor skipping method. */
export type SkipMethod = { type: 'skip'; parameter: number };

/** Cursor sorting method. */
export type SortMethod = { type: 'sort'; parameter: SortQuery<any> };

/** Cursor limiting method. */
export type LimitMethod = { type: 'limit'; parameter: number };

/** All Cursor methods. */
export type CursorMethod = SkipMethod | SortMethod | LimitMethod;

interface CursorParams {
	db: Database;
	query: Query;
	indexedKeys: Set<string>;
	collectionName: string;
}

/**
 * AloeDB Cursor. Used for searching in the database.
 */
export class Cursor<Schema extends Document = Document> {
	protected db: Database;
	protected query: Query;
	protected collectionName: string;
	protected indexedKeys: Set<string>;
	protected methods: CursorMethod[] = [];

	constructor({ db, query, indexedKeys, collectionName }: CursorParams) {
		this.db = db;
		this.query = query;
		this.indexedKeys = indexedKeys;
		this.collectionName = collectionName;
	}

	/**
	 * Skip Nth number of documents.
	 * @param offset The number of documents to skip.
	 * @returns Cursor instance.
	 */
	public skip(offset: number) {
		if (offset < 0) throw new Error('Offset must be a positive number');
		this.methods.push({ type: 'skip', parameter: offset });
		return this;
	}

	/**
	 * Limit the number of documents.
	 * @param size Maximum number of documents.
	 * @returns Cursor instance.
	 */
	public limit(size: number) {
		if (size < 0) throw new Error('Limit must be positive number');
		this.methods.push({ type: 'limit', parameter: size });
		return this;
	}

	/**
	 * Sort documents by sort query.
	 * @param sort Documents sort query.
	 * @returns Cursor instance.
	 */
	public sort(sort: SortQuery<Schema>) {
		this.methods.push({ type: 'sort', parameter: sort });
		return this;
	}

	/**
	 * Get the number of matching documents.
	 * @returns Number of documents.
	 */
	public async count(): Promise<number> {
		const { collectionName, indexedKeys, query } = this;
		let count = 0;

		if (this.methods.length > 0) {
			const documents = await this.getMany();
			return documents.length;
		} else {
			const kv = await this.db.getKv();
			const iterator = Search({ kv, query, indexedKeys, collectionName });
			for await (const _entity of iterator) count += 1;
		}

		return count;
	}

	/**
	 * Get one matched document.
	 * @returns One document. Null if nothing found.
	 */
	public async getOne(): Promise<Schema | null> {
		const { collectionName, indexedKeys } = this;

		if (this.methods.length > 0) {
			const documents = await this.getMany();
			return documents[0] || null;
		} else {
			const kv = await this.db.getKv();
			const iterator = Search({ kv, query: this.query, indexedKeys, collectionName });
			for await (const entity of iterator) return entity.value as Schema;
		}

		return null;
	}

	/**
	 * Get all matched documents.
	 * @returns Found documents.
	 */
	public async getMany(): Promise<Schema[]> {
		const { collectionName, indexedKeys, query } = this;
		let documents: Schema[] = [];

		// Get limit of the documents, required to execute methods
		const limit = this.getRequiredDocumentsNumber();

		// Collect documents
		const kv = await this.db.getKv();
		const iterator = Search({ kv, query, indexedKeys, collectionName });

		for await (const entity of iterator) {
			documents.push(entity.value as Schema);
			if (documents.length >= limit) break;
		}

		// Apply methods
		if (this.methods.length > 0) documents = this.executeMethods(documents);

		return documents;
	}

	/**
	 * Get Iterator to iterate over found documents.
	 * @returns Iterator.
	 */
	public async *list(): AsyncGenerator<Document> {
		const { collectionName, indexedKeys, query } = this;

		const kv = await this.db.getKv();
		const iterator = Search({ kv, query, indexedKeys, collectionName });

		if (this.methods.length > 0) {
			const documents: Schema[] = [];
			for await (const entity of iterator) documents.push(entity.value as Schema);
			for (const document of this.executeMethods(documents)) yield document as Document;
		} else {
			for await (const entity of iterator) yield entity.value as Document;
		}
	}

	/**
	 * Get minimal required number of documents to fetch.
	 * Needed mostly for the optimization purposes.
	 */
	private getRequiredDocumentsNumber() {
		let minLimitSize: number | undefined = undefined;
		let skipOffsets = 0;

		for (let i = 0; i < this.methods.length; i++) {
			const method = this.methods[i];

			switch (method.type) {
				case 'limit':
					if (typeof minLimitSize == 'undefined') minLimitSize = method.parameter;
					break;
				case 'skip':
					if (typeof minLimitSize === 'undefined') skipOffsets += method.parameter;
					break;
				case 'sort':
					if (typeof minLimitSize !== 'undefined') return minLimitSize + skipOffsets;
					return Infinity;
				default:
					break;
			}
		}

		return (minLimitSize || 0) + skipOffsets;
	}

	/**
	 * Execute methods on the documents array.
	 * @param documents List of documents to process.
	 */
	private executeMethods(documents: Schema[]) {
		for (let i = 0; i < this.methods.length; i++) {
			const method = this.methods[i];

			switch (method.type) {
				case 'limit':
					documents = documents.slice(0, method.parameter);
					break;
				case 'skip':
					documents = documents.slice(method.parameter);
					break;
				case 'sort':
					documents = sortDocuments<Schema>(documents, method.parameter);
					break;
				default:
					break;
			}
		}

		return documents;
	}
}
