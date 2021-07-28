// Copyright 2020-2021 the AloeDB authors. All rights reserved. MIT license.

import { Writer } from './writer.ts';
import { Reader } from './reader.ts';
import { findOneDocument, findMultipleDocuments, updateDocument, parseDatabaseStorage } from './core.ts';
import { Document, DatabaseConfig, Query, QueryFunction, Update, UpdateFunction, Acceptable } from './types.ts';
import { cleanArray, deepClone, isObjectEmpty, prepareObject, isArray, isFunction, isObject, isString, isUndefined, isNull } from './utils.ts';

// * Version 1.0:
// * Searching for single document
// * Refactor internal types

// TODO: Rename optimize to batching, add batching timing configuration
// TODO: JSON stringify during batching for speedup
// TODO: Before Writing & After Reading configuration
// TODO: Config with skip, limit, sort, immutable
// TODO: Finish testing
// TODO: Examples
// TODO: Indexing (Optional)

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
		optimize: true,
		immutable: true,
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
			this.writer = new Writer(this.config.path)
			if (this.config.autoload) this.loadSync();
		}
	}

	/**
	 * Insert a document.
	 * @param document Document to insert.
	 * @returns Inserted document.
	 */
	public async insertOne(document: Schema): Promise<Schema> {
		const { immutable, validator, autosave } = this.config;
		if (!isObject(document)) throw new TypeError('Document must be an object');

		prepareObject(document);
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
	 * @returns Array of inserted documents.
	 */
	public async insertMany(documents: Schema[]): Promise<Schema[]> {
		const { immutable, validator, autosave } = this.config;
		if (!isArray(documents)) throw new TypeError('Input must be an array');

		const inserted: Schema[] = [];

		for (let i = 0; i < documents.length; i++) {
			const document: Schema = documents[i];
			if (!isObject(document)) throw new TypeError('Documents must be an objects');

			prepareObject(document);
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
	 * @returns Found document.
	 */
	public async findOne(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema | null> {
		const { immutable } = this.config;
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

		const found: number | null = findOneDocument<Schema>(query, this.documents);
		if (isNull(found)) return null;

		const position: number = found;
		const document: Schema = this.documents[position];

		return immutable ? deepClone(document) : document;
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents selection criteria.
	 * @returns Found documents.
	 */
	public async findMany(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema[]> {
		const { immutable } = this.config;
		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

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
	 * @returns Found document with applied modifications.
	 */
	public async updateOne(query: Query<Schema> | QueryFunction<Schema>, update: Update<Schema> | UpdateFunction<Schema>): Promise<Schema | null> {
		const { validator, autosave, immutable } = this.config;

		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');
		if (!isObject(update) && !isFunction(update)) throw new TypeError('Update must be an object or function');

		const found: number | null = findOneDocument<Schema>(query, this.documents);
		if (isNull(found)) return null;

		const position: number = found;
		const document: Schema = this.documents[position];
		const updated: Schema = updateDocument<Schema>(document, update);

		if (validator) validator(updated);

		if (isObjectEmpty(updated)) {
			this.documents.splice(position, 1);
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
	 * @returns Found documents with applied modifications.
	 */
	public async updateMany(query: Query<Schema> | QueryFunction<Schema>, update: Update<Schema> | UpdateFunction<Schema>): Promise<Schema[]> {
		const { validator, autosave, immutable } = this.config;

		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');
		if (!isObject(update) && !isFunction(update)) throw new TypeError('Update must be an object or function');

		const found: number[] = findMultipleDocuments<Schema>(query, this.documents);
		if (found.length === 0) return [];

		const temporary: Schema[] = [...this.documents];
		const updatedDocuments: Schema[] = [];
		let deleted: boolean = false;

		for (let i = 0; i < found.length; i++) {
			const position: number = found[i];
			const document: Schema = temporary[position];
			const updated: Schema = updateDocument<Schema>(document, update);

			if (validator) validator(updated);

			if (isObjectEmpty(updated)) {
				deleted = true;
				delete temporary[position];
				continue;
			}

			temporary[position] = updated;
			updatedDocuments.push(updated);
		}

		this.documents = deleted ? cleanArray(temporary) : temporary;
		if (autosave) await this.save();

		return immutable ? deepClone(updatedDocuments) : updatedDocuments;
	}

	/**
	 * Deletes first found document that matches the search query.
	 * @param query Document selection criteria.
	 * @returns Deleted document.
	 */
	public async deleteOne(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema | null> {
		const { autosave } = this.config;

		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

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
	 * @returns Array of deleted documents.
	 */
	public async deleteMany(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema[]> {
		const { autosave } = this.config;

		if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Query must be an object or function');

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
		const documents: Document[] = parseDatabaseStorage(content);

		// Schema validation
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
		const documents: Document[] = parseDatabaseStorage(content);

		// Schema validation
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

		const encoded: string = this.config.pretty
			? JSON.stringify(this.documents, null, '\t')
			: JSON.stringify(this.documents);

		if (this.config.optimize) {
			this.writer.add(encoded); // Should be without await
		} else {
			await this.writer.write(encoded);
		}
	}
}
