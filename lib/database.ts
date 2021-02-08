import { Storage } from './storage.ts';
import { DatabaseError } from './error.ts';
import { searchDocuments, updateDocument } from './core.ts';
import { Document, DatabaseConfig, Query, QueryFunction, Update, UpdateFunction, Acceptable } from './types.ts';
import { cleanArray, deepClone, isObjectEmpty, prepareObject, isArray, isFunction, isObject, isString, isUndefined } from './utils.ts';

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
	 * ***However, if you modify storage manualy, call the method `db.save()` to save your changes.***
	 */
	public documents: Schema[] = [];

	/** Data storage manager. */
	private readonly storage: Storage;

	/** Database configuration. */
	private readonly config: DatabaseConfig = {
		path: undefined,
		pretty: true,
		immutable: true,
		onlyInMemory: true,
		schemaValidator: undefined,
	};

	/**
	 * Database initialization.
	 * @param config Database configuration.
	 */
	constructor(config?: Partial<DatabaseConfig> | string) {
		if (isUndefined(config)) config = { onlyInMemory: true };
		if (isString(config)) config = { path: config, onlyInMemory: false };
		if (!isObject(config)) throw new DatabaseError('Database initialization error', 'Config must be an object');

		if (isUndefined(config?.path) && isUndefined(config?.onlyInMemory)) config.onlyInMemory = true;
		if (isString(config?.path) && isUndefined(config?.onlyInMemory)) config.onlyInMemory = false;
		if (isUndefined(config?.path) && config?.onlyInMemory === false) throw new DatabaseError('Database initialization error', 'It is impossible to disable "onlyInMemory" mode if the "path" is not specified');

		this.config = { ...this.config, ...config };
		this.storage = new Storage(this.config);
		this.documents = this.storage.read() as Schema[];
	}

	/**
	 * Insert a document.
	 * @param document Document to insert.
	 * @returns Inserted document.
	 */
	public async insertOne(document: Schema): Promise<Schema> {
		try {
			const { immutable, schemaValidator } = this.config;
			if (!isObject(document)) throw new TypeError('Document must be an object');

			prepareObject(document);
			if (schemaValidator) schemaValidator(document);

			const internal: Schema = deepClone(document);
			this.documents.push(internal);
			await this.save();

			return immutable ? deepClone(internal) : internal;
		} catch (error) {
			throw new DatabaseError('Error inserting document', error);
		}
	}

	/**
	 * Inserts multiple documents.
	 * @param documents Array of documents to insert.
	 * @returns Array of inserted documents.
	 */
	public async insertMany(documents: Schema[]): Promise<Schema[]> {
		try {
			const { immutable, schemaValidator } = this.config;
			if (!isArray(documents)) throw new TypeError('Input must be an array');

			const inserted: Schema[] = [];

			for (let i = 0; i < documents.length; i++) {
				const document: Schema = documents[i];
				if (!isObject(document)) {
					throw new TypeError('Documents must be an objects');
				}

				prepareObject(document);
				if (schemaValidator) schemaValidator(document);

				const internal: Schema = deepClone(document);
				inserted.push(internal);
			}

			this.documents = [...this.documents, ...inserted];
			await this.save();

			return immutable ? deepClone(inserted) : inserted;
		} catch (error) {
			throw new DatabaseError('Error inserting documents', error);
		}
	}

	/**
	 * Find document by search query.
	 * @param query Document selection criteria.
	 * @returns Found document.
	 */
	public async findOne(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema | null> {
		try {
			const { immutable } = this.config;
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object or function');

			// Optimization for empty queries
			if (!isFunction(query) && (isUndefined(query) || isObjectEmpty(query))) {
				if (this.documents.length === 0) return null;
				const document: Schema = this.documents[0];
				return immutable ? deepClone(document) : document;
			}

			const found: number[] = searchDocuments(query as Query, this.documents);
			if (found.length === 0) return null;

			const position: number = found[0];
			const document: Schema = this.documents[position];

			return immutable ? deepClone(document) : document;
		} catch (error) {
			throw new DatabaseError('Error searching document', error);
		}
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents selection criteria.
	 * @returns Found documents.
	 */
	public async findMany(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema[]> {
		try {
			const { immutable } = this.config;
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object or function');

			// Optimization for empty queries
			if (!isFunction(query) && (isUndefined(query) || isObjectEmpty(query))) {
				return immutable ? deepClone(this.documents) : [...this.documents];
			}

			const found: number[] = searchDocuments(query as Query, this.documents);
			if (found.length === 0) return [];

			const documents: Schema[] = [];

			for (let i = 0; i < found.length; i++) {
				const position: number = found[i];
				const document: Schema = this.documents[position];
				documents.push(document);
			}

			return immutable ? deepClone(documents) : documents;
		} catch (error) {
			throw new DatabaseError('Error searching document', error);
		}
	}

	/**
	 * Modifies an existing document.
	 * @param query Document selection criteria.
	 * @param update The modifications to apply.
	 * @returns Original document that has been modified.
	 */
	public async updateOne(query: Query<Schema> | QueryFunction<Schema>, update: Update<Schema> | UpdateFunction<Schema>): Promise<Schema | null> {
		try {
			const { schemaValidator } = this.config;
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object or function');
			if (!isObject(update) && !isFunction(update)) throw new TypeError('Update must be an object or function');

			const found: number[] = searchDocuments(query as Query, this.documents);
			if (found.length === 0) return null;

			const position: number = found[0];
			const document: Schema = this.documents[position];

			const updated: Schema = updateDocument(document, update as Update) as Schema;
			if (schemaValidator) schemaValidator(updated);

			this.documents[position] = updated;
			await this.save();

			return document;
		} catch (error) {
			throw new DatabaseError('Error updating document', error);
		}
	}

	/**
	 * Modifies all documents that match search query.
	 * @param query Documents selection criteria.
	 * @param update The modifications to apply.
	 * @returns Original documents that has been modified.
	 */
	public async updateMany(query: Query<Schema> | QueryFunction<Schema>, update: Update<Schema> | UpdateFunction<Schema>): Promise<Schema[]> {
		try {
			const { schemaValidator } = this.config;
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object or function');
			if (!isObject(update) && !isFunction(update)) throw new TypeError('Update must be an object');

			const found: number[] = searchDocuments(query as Query, this.documents);
			if (found.length === 0) return [];

			let temporary: Schema[] = [...this.documents];
			const originals: Schema[] = [];

			for (let i = 0; i < found.length; i++) {
				const position: number = found[i];
				const document: Schema = temporary[position];
				const updated: Schema = updateDocument(document, update as Update | UpdateFunction) as Schema;
				if (schemaValidator) schemaValidator(updated);

				temporary[position] = updated;
				originals.push(document);
			}

			this.documents = temporary;
			await this.save();

			return originals;
		} catch (error) {
			throw new DatabaseError('Error updating documents', error);
		}
	}

	/**
	 * Delete one document.
	 * @param query Document selection criteria.
	 * @returns Deleted document.
	 */
	public async deleteOne(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema | null> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object or function');

			const found: number[] = searchDocuments(query as Query, this.documents);
			if (found.length === 0) return null;

			const position: number = found[0];
			const deleted: Schema = this.documents[position];

			this.documents.splice(position, 1);
			await this.save();

			return deleted;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	/**
	 * Delete many documents.
	 * @param query Document selection criteria.
	 * @returns Array of deleted documents.
	 */
	public async deleteMany(query?: Query<Schema> | QueryFunction<Schema>): Promise<Schema[]> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object or function');

			const found: number[] = searchDocuments(query as Query, this.documents);
			if (found.length === 0) return [];

			let temporary: Schema[] = [...this.documents];
			const deleted: Schema[] = [];

			for (let i = 0; i < found.length; i++) {
				const position: number = found[i];
				const document: Schema = temporary[position];

				deleted.push(document);
				delete temporary[position];
			}

			temporary = cleanArray(temporary);

			this.documents = temporary;
			await this.save();

			return deleted;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	/**
	 * Count found documents.
	 * @param query Documents selection criteria.
	 * @returns Documents count.
	 */
	public async count(query?: Query<Schema> | QueryFunction<Schema>): Promise<number> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object or function');

			// Optimization for empty queries
			if (!isFunction(query) && (isUndefined(query) || isObjectEmpty(query))) return this.documents.length;

			const found: number[] = searchDocuments(query as Query, this.documents);
			return found.length;
		} catch (error) {
			throw new DatabaseError('Error counting documents', error);
		}
	}

	/**
	 * Delete all documents.
	 */
	public async drop(): Promise<void> {
		try {
			this.documents = [];
			await this.save();
		} catch (error) {
			throw new DatabaseError('Error dropping database', error);
		}
	}

	/**
	 * Write documents to the database file.
	 * Called automatically after each insert, update or delete operation.
	 */
	public async save(): Promise<void> {
		if (this.config.onlyInMemory || isUndefined(this.config.path)) return;
		this.storage.write(this.documents);
	}
}
