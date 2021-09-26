import { Database } from './database.ts';

import {
	Document,
	Query,
	QueryFunction,
	Acceptable,
	SortQuery,
	Options
} from './types.ts';

import {
	isString,
	isNumber,
	isObject,
	sortDocuments
} from './utils.ts';

/** Cursor skipping method. */
type SkipMethod = { type: 'skip', parameter: number };

/** Cursor sorting method. */
type SortMethod = { type: 'sort', parameter: SortQuery };

/** Cursor limiting method. */
type LimitMethod = { type: 'limit', parameter: number };

/** All Cursor methods. */
type CursorMethod = SkipMethod | SortMethod | LimitMethod;

/**
 * Database Cursor.
 * Used for `db.select()` method.
 */
export class Cursor<Schema extends Acceptable<Schema> = Document> {

	/** Cursor methods to execute. */
	private methods: CursorMethod[] = [];

	/** Database instance. */
	private instance: Database<Schema>;

	/** Documents selection criteria. */
	private query?: Query<Schema> | QueryFunction<Schema>;

	/** Additional configurations. */
	private options?: Options;

	/**
	 * Cursor initialization
	 * @param instance Database instance.
	 * @param query Documents selection criteria.
	 * @param options Additional configurations.
	 */
	constructor(instance: Database<Schema>, query?: Query<Schema> | QueryFunction<Schema>, options?: any) {
		this.instance = instance;
		this.query = query;
		this.options = options;
	}

	/**
	 * Skip Nth number of documents.
	 * @param offset The number of documents to skip.
	 * @returns Cursor instance.
	 */
	public skip(offset: number): this {
		if (!isNumber(offset)) throw new TypeError('Offset must be a number');
		this.methods.push({ type: 'skip', parameter: offset });
		return this;
	}

	/**
	 * Limit the number of documents.
	 * @param size Maximum number of documents.
	 * @returns Cursor instance.
	 */
	public limit(size: number): this {
		if (!isNumber(size)) throw new TypeError('Size must be a number');
		this.methods.push({ type: 'limit', parameter: size });
		return this;
	}

	/**
	 * Sort documents by sort query.
	 * @param sort Documents sort query. If string, will be sorted by specfied field in ascecending order.
	 * @returns Cursor instance.
	 */
	public sort(sort: SortQuery | string): this {
		if (isString(sort)) sort = { [sort]: 'asc' };
		if (!isObject(sort)) throw new TypeError('Sort query must be a string or an object');

		this.methods.push({ type: 'sort', parameter: sort });
		return this;
	}

	/**
	 * Get the number of documents.
	 * @returns Number of documents.
	 */
	async count(): Promise<number> {
		const documents: Schema[] = await this.execute();
		return documents.length;
	}

	/**
	 * Get one documents.
	 * @returns One document. Null if nothing found.
	 */
	async getOne(): Promise<Schema | null> {
		const documents: Schema[] = await this.execute();
		return documents.length > 0 ? documents[0] : null;
	}

	/**
	 * Get all documents.
	 * @returns Found documents.
	 */
	async getMany(): Promise<Schema[]> {
		const documents: Schema[] = await this.execute();
		return documents;
	}

	/**
	 * Execute cursor methods.
	 * @returns Documents found by cursor.
	 */
	private async execute(): Promise<Schema[]> {

		// Select documents
		let documents: Schema[] = await this.instance.findMany(this.query, this.options);

		// Execute cursor methods
		for (let i = 0; i < this.methods.length; i++) {
			const method = this.methods[i];
			if (documents.length === 0) return [];

			if (method.type === 'skip') {
				documents = documents.slice(method.parameter);
				continue;
			}

			if (method.type === 'sort') {
				documents = sortDocuments(documents, method.parameter);
				continue;
			}

			if (method.type === 'limit') {
				documents = documents.slice(0, method.parameter);
				continue;
			}
		}

		return documents;
	}
}
