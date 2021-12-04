// Copyright 2020-2021 the AloeDB authors. All rights reserved. MIT license.

import { Writer } from './writer.ts';
import { Reader } from './reader.ts';
import { Cursor } from './cursor.ts';

import {
	findOneDocument,
	findMultipleDocuments,
	updateDocument,
	deserializeStorage
} from './core.ts';

import {
	Document,
	DatabaseConfig,
	Query,
	QueryFunction,
	Update,
	UpdateFunction,
	Acceptable,
	Options
} from './types.ts';

import {
	deepClone,
	cleanArray,
	isObjectEmpty,
	isString,
	isBoolean,
	isNull,
	isArray,
	isObject,
	isFunction,
	isUndefined,
	sanitizeObject
} from './utils.ts';

// TODO: Add sort, limit, skip as options
// TODO: Add new cursor methods: filter, map, forEach, reverse
// TODO: Add projections
// TODO: Finish testing

/**
 * # AloeDB 🌿
 * Light, Embeddable, NoSQL database for Deno
 *
 * [Deno](https://deno.land/x/aloedb) | [Github](https://github.com/Kirlovon/AloeDB)
 */
export class Database<Schema extends Acceptable<Schema> = Document> {

	/**
	 * In-Memory documents storage.
	 *
	 * ***WARNING:*** It is better not to modify these documents manually, as the changes will not pass the necessary checks.
	 * ***However, if you modify storage manualy, call the method `await db.save()` to save your changes.***
	 */
	public documents: Schema[] = [];

	/** Data writing manager. */
	private readonly writer?: Writer;

	/** Database configuration. */
	private readonly config: DatabaseConfig = {
		path: undefined,
		pretty: true,
		autoload: true,
		autosave: true,
		batching: true,
		immutable: true,
		sanitize: true,
		foolproof: true,
		validator: undefined
	};

	/**
	 * Create database collection to store documents.
	 * @param config Database configuration or path to the database file.
	 */
	constructor(config?: Partial<DatabaseConfig> | string) {
		if (isUndefined(config)) config = { autoload: false, autosave: false };
		if (isString(config)) config = { path: config, autoload: true, autosave: true };
		if (!isObject(config)) throw new TypeError('Config must be an object or a string');

		// Disable autosave if path is not specified
		if (isUndefined(config?.path)) config.autosave = false;

		// Merge default config with users config
		this.config = { ...this.config, ...config };

		// Writer initialization
		if (this.config.path) {
			this.writer = new Writer(this.config.path, this.config.pretty, this.config.foolproof);
			if (this.config.autoload) this.loadSync();
		}
	}

	/**
	 * Select documents by search query.
	 * @param query Documents selection criteria.
	 * @returns Cursor instance.
	 */
	public select(query?: Query<Schema> | QueryFunction<Schema>) {
		return new Cursor<Schema>(this, query);
	}

	/**
	 * Insert a document.
	 * @param document Document to insert.
	 * @param options Additional configurations.
	 * @returns Inserted document.
	 */
	public async insertOne(document: Schema, options?: Options): Promise<Schema> {
		if (!isObject(document)) throw new TypeError('Document must be an object');

		let { immutable, validator, autosave, sanitize } = this.config;
		if (options) {
			if (isBoolean(options.autosave)) autosave = options.autosave;
			if (isBoolean(options.immutable)) immutable = options.immutable;
		}

		if (sanitize) sanitizeObject(document);
		if (validator) validator(document);
		if (isObjectEmpty(document)) return {} as Schema;

		const internal: Schema = deepClone(document);
		this.documents.push(internal);
		if (autosave) await this.save();

		return immutable ? deepClone(internal) : internal;
	}

	/**
	 * Inserts multiple documents.
	 * @param documents Array of documents to insert.
	 * @param options Additional configurations.
	 * @returns Array of inserted documents.
	 */
	public async insertMany(documents: Schema[], options?: Options): Promise<Schema[]> {
		if (!isArray(documents)) throw new TypeError('Input must be an array');

		let { immutable, validator, autosave, sanitize } = this.config;
		if (options) {
			if (isBoolean(options.autosave)) autosave = options.autosave;
			if (isBoolean(options.immutable)) immutable = options.immutable;
		}

		const inserted: Schema[] = [];

		for (let i = 0; i < documents.length; i++) {
			const document: Schema = documents[i];
			if (!isObject(document)) throw new TypeError('Documents must be an objects');

			if (sanitize) sanitizeObject(document);
			if (validator) validator(document);
			if (isObjectEmpty(document)) continue;

			const internal: Schema = deepClone(document);
			inserted.push(internal);
		}

		this.documents = [...this.documents, ...inserted];
		if (autosave) await this.save();

		return immutable ? deepClone(inserted) : inserted;
	}

	/**
	 * Find document by search query.
	 * @param query Document selection criteria.
	 * @param options Additional configurations.
	 * @returns Found document.
	 */
	public async findOne(query?: Query<Schema> | QueryFunction<Schema>, options?: Omit<Options, 'autosave'>): Promise<Schema | null> {
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

		let { immutable } = this.config;
		if (options && isBoolean(options.immutable)) immutable = options.immutable;

		const found: number | null = findOneDocument<Schema>(query, this.documents);
		if (isNull(found)) return null;

		const document: Schema = this.documents[found];
		return immutable ? deepClone(document) : document;
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents selection criteria.
	 * @param options Additional configurations.
	 * @returns Found documents.
	 */
	public async findMany(query?: Query<Schema> | QueryFunction<Schema>, options?: Omit<Options, 'autosave'>): Promise<Schema[]> {
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

		let { immutable } = this.config;
		if (options && isBoolean(options.immutable)) immutable = options.immutable;

		// Optimization for empty queries
		if (isUndefined(query) || (isObject(query) && isObjectEmpty(query))) {
			return immutable ? deepClone(this.documents) : [...this.documents];
		}

		const found: number[] = findMultipleDocuments<Schema>(query, this.documents);
		if (found.length === 0) return [];

		const documents: Schema[] = [];
		for (let i = 0; i < found.length; i++) {
			const position: number = found[i];
			const document: Schema = this.documents[position];
			documents.push(document);
		}

		return immutable ? deepClone(documents) : documents;
	}

	/**
	 * Modifies an existing document that match search query.
	 * @param query Document selection criteria.
	 * @param update The modifications to apply.
	 * @param options Additional configurations.
	 * @returns Found document with applied modifications.
	 */
	public async updateOne(query: Query<Schema> | QueryFunction<Schema>, update: Update<Schema> | UpdateFunction<Schema>, options?: Options): Promise<Schema | null> {
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');
		if (!isObject(update) && !isFunction(update)) throw new TypeError('Update must be an object or function');

		let { validator, autosave, immutable, sanitize } = this.config;
		if (options) {
			if (isBoolean(options.autosave)) autosave = options.autosave;
			if (isBoolean(options.immutable)) immutable = options.immutable;
		}

		const found: number | null = findOneDocument<Schema>(query, this.documents);
		if (isNull(found)) return null;

		const position: number = found;
		const document: Schema = this.documents[position];
		const updated: Schema = updateDocument<Schema>(document, update);

		if (sanitize) sanitizeObject(updated);
		if (validator) validator(updated);

		if (isObjectEmpty(updated)) {
			this.documents.splice(position, 1);
			if (autosave) await this.save();
			return {} as Schema;
		}

		this.documents[position] = updated;
		if (autosave) await this.save();

		return immutable ? deepClone(updated) : updated;
	}

	/**
	 * Modifies all documents that match search query.
	 * @param query Documents selection criteria.
	 * @param update The modifications to apply.
	 * @param options Additional configurations.
	 * @returns Found documents with applied modifications.
	 */
	public async updateMany(query: Query<Schema> | QueryFunction<Schema>, update: Update<Schema> | UpdateFunction<Schema>, options?: Options): Promise<Schema[]> {
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');
		if (!isObject(update) && !isFunction(update)) throw new TypeError('Update must be an object or function');

		let { validator, autosave, immutable, sanitize } = this.config;
		if (options) {
			if (isBoolean(options.autosave)) autosave = options.autosave;
			if (isBoolean(options.immutable)) immutable = options.immutable;
		}

		const found: number[] = findMultipleDocuments<Schema>(query, this.documents);
		if (found.length === 0) return [];

		const temporary: Schema[] = [...this.documents];
		const updatedDocuments: Schema[] = [];
		let deleted: boolean = false;

		for (let i = 0; i < found.length; i++) {
			const position: number = found[i];
			const document: Schema = temporary[position];
			const updated: Schema = updateDocument<Schema>(document, update);

			if (sanitize) sanitizeObject(updated);
			if (validator) validator(updated);

			if (isObjectEmpty(updated)) {
				delete temporary[position];
				deleted = true;
				continue;
			}

			temporary[position] = updated;
			updatedDocuments.push(updated);
		}

		this.documents = temporary;
		if (deleted) this.documents = cleanArray(this.documents);
		if (autosave) await this.save();

		return immutable ? deepClone(updatedDocuments) : updatedDocuments;
	}

	/**
	 * Deletes first found document that matches the search query.
	 * @param query Document selection criteria.
	 * @param options Additional configurations.
	 * @returns Deleted document.
	 */
	public async deleteOne(query?: Query<Schema> | QueryFunction<Schema>, options?: Omit<Options, 'immutable'>): Promise<Schema | null> {
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

		let { autosave } = this.config;
		if (options && isBoolean(options.autosave)) autosave = options.autosave;

		const found: number | null = findOneDocument<Schema>(query, this.documents);
		if (isNull(found)) return null;

		const position: number = found;
		const deleted: Schema = this.documents[position];

		this.documents.splice(position, 1);
		if (autosave) await this.save();

		return deleted;
	}

	/**
	 * Deletes all documents that matches the search query.
	 * @param query Document selection criteria.
	 * @param options Additional configurations.
	 * @returns Array of deleted documents.
	 */
	public async deleteMany(query?: Query<Schema> | QueryFunction<Schema>, options?: Omit<Options, 'immutable'>): Promise<Schema[]> {
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

		let { autosave } = this.config;
		if (options && isBoolean(options.autosave)) autosave = options.autosave;

		const found: number[] = findMultipleDocuments<Schema>(query, this.documents);
		if (found.length === 0) return [];

		const temporary: Schema[] = [...this.documents];
		const deleted: Schema[] = [];

		for (let i = 0; i < found.length; i++) {
			const position: number = found[i];
			const document: Schema = temporary[position];

			deleted.push(document);
			delete temporary[position];
		}

		this.documents = cleanArray(temporary);
		if (autosave) await this.save();

		return deleted;
	}

	/**
	 * Count found documents.
	 * @param query Documents selection criteria.
	 * @returns Documents count.
	 */
	public async count(query?: Query<Schema> | QueryFunction<Schema>): Promise<number> {
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

		// Optimization for empty queries
		if (isUndefined(query) || (isObject(query) && isObjectEmpty(query))) return this.documents.length;

		const found: number[] = findMultipleDocuments<Schema>(query, this.documents);
		return found.length;
	}

	/**
	 * Delete all documents.
	 */
	public async drop(): Promise<void> {
		this.documents = [];
		if (this.config.autosave) await this.save();
	}

	/**
	 * Load data from storage file.
	 */
	public async load(): Promise<void> {
		const { path, validator } = this.config;
		if (!path) return;

		const content: string = await Reader.read(path);
		const documents: Document[] = deserializeStorage(content);

		if (validator) {
			for (let i = 0; i < documents.length; i++) validator(documents[i])
		}

		this.documents = documents as Schema[];
	}

	/**
	 * Synchronously load data from storage file.
	 */
	public loadSync(): void {
		const { path, validator } = this.config;
		if (!path) return;

		const content: string = Reader.readSync(path);
		const documents: Document[] = deserializeStorage(content);

		if (validator) {
			for (let i = 0; i < documents.length; i++) validator(documents[i])
		}

		this.documents = documents as Schema[];
	}

	/**
	 * Write documents to the database storage file.
	 * Called automatically after each insert, update or delete operation. _(Only if `autosave` parameter is set to `true`)_
	 */
	public async save(): Promise<void> {
		if (!this.writer) return;

		if (this.config.batching) {
			this.writer.write(this.documents); // Should be without await
		} else {
			await this.writer.write(this.documents);
		}
	}
}
