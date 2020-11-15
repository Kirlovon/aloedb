import { Search } from './search.ts';
import { Cursor } from './cursor.ts';
import { Storage } from './storage.ts';
import { DatabaseError } from './error.ts';
import { isUndefined, isString, isBoolean, isObject, isArray, isFunction } from './types.ts';
import { deepClone, cleanArray, isObjectEmpty, updateObject, prepareObject } from './utils.ts';
import { Document, Acceptable, DatabaseConfig, SearchQuery, UpdateQuery, MethodConfig, UpdateMethodConfig } from './declarations.ts';

/**
 * # AloeDB 🌿
 * Light, Embeddable, NoSQL database for Deno
 */
class AloeDB<Schema extends Acceptable<Schema> = Document> {
	/**
	 * In-Memory documents storage.
	 *
	 * ___WARNING:___ It is better not to modify these documents manually, as the changes will not pass the necessary checks.
	 * ___However, if you modify storage manualy ( bypassing compiler checks ), call the function `db.save()` to write your changes to a database file.___
	 */
	private documents: Schema[] = [];

	/** File storage manager. */
	private readonly storage: Storage;

	/** Database configuration. */
	private readonly config: DatabaseConfig = {
		filePath: undefined,
		pretty: true,
		immutable: true,
		safeWrite: true,
		onlyInMemory: true,
		schemaValidator: undefined,
	};

	/** Default config for methods. */
	private readonly defaultConfig: UpdateMethodConfig = { 
		old: false,
		return: true, 
		immutable: this.config.immutable
	};

	/**
	 * Database initialization.
	 * @param config Database configuration.
	 */
	constructor(config?: Partial<DatabaseConfig> | string) {
		if (isUndefined(config)) config = { onlyInMemory: true };
		if (isString(config)) config = { filePath: config, onlyInMemory: false };
		if (!isObject(config)) throw new DatabaseError('Database initialization error', 'Config must be an object');

		if (isUndefined(config?.filePath) && isUndefined(config?.onlyInMemory)) config.onlyInMemory = true;
		if (isString(config?.filePath) && isUndefined(config?.onlyInMemory)) config.onlyInMemory = false;
		if (isUndefined(config?.filePath) && config?.onlyInMemory === false)
			throw new DatabaseError('Database initialization error', 'It is impossible to disable "onlyInMemory" mode if the "filePath" is not specified');

		this.config = { ...this.config, ...config };
		this.defaultConfig = { ...this.defaultConfig, immutable: this.config.immutable };
		
		this.storage = new Storage(this.config);
		this.documents = this.storage.read() as Schema[];
	}

	/**
	 * Insert a document.
	 * @param document Document to insert.
	 * @returns Inserted document.
	 */
	public async insertOne(document: Schema, config?: Partial<MethodConfig> & { return: false }): Promise<undefined>;
	public async insertOne(document: Schema, config?: Partial<MethodConfig>): Promise<Schema>;
	public async insertOne(document: Schema, config?: Partial<MethodConfig>): Promise<Schema | undefined> {
		try {
			const { immutable, schemaValidator } = this.config;
			
			if (!isObject(document)) throw new TypeError('Input must be an object');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as MethodConfig;

			prepareObject(document);
			if (schemaValidator) schemaValidator(document);

			const documentClone: Schema = deepClone(document);
			this.documents.push(documentClone);

			if (!config?.return) return;
			return config?.immutable ? deepClone(documentClone) : documentClone;
		} catch (error) {
			throw new DatabaseError('Error inserting document', error);
		} finally {
			await this.save();
		}
	}

	/**
	 * Inserts multiple documents.
	 * @param documents Array of documents to insert.
	 * @returns Array of inserted documents.
	 */
	public async insertMany(documents: Schema[], config?: Partial<MethodConfig> & { return: false }): Promise<undefined>;
	public async insertMany(documents: Schema[], config?: Partial<MethodConfig>): Promise<Schema[]>;
	public async insertMany(documents: Schema[], config?: Partial<MethodConfig>): Promise<Schema[] | undefined> {
		try {
			const { schemaValidator } = this.config;

			if (!isArray(documents)) throw new TypeError('Input must be an array');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as MethodConfig;

			for (let i = 0; i < documents.length; i++) {
				const document: Schema = documents[i];
				if (!isObject(document)) throw new TypeError('Values must be an objects');

				prepareObject(document);
				if (schemaValidator) schemaValidator(document);
			}

			const documentsClone: Schema[] = deepClone(documents);
			this.documents = [...this.documents, ...documentsClone];

			if (!config?.return) return;
			return config?.immutable ? deepClone(documentsClone) : documentsClone;
		} catch (error) {
			throw new DatabaseError('Error inserting documents', error);
		} finally {
			await this.save();
		}
	}

	/**
	 * Find document by search query.
	 * @param query Document selection criteria.
	 * @returns Found document.
	 */
	public async findOne(query?: SearchQuery<Schema>, config?: Partial<MethodConfig> & { return: false }): Promise<undefined>;
	public async findOne(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema | null>;
	public async findOne(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema | null | undefined> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as MethodConfig;

			if (isUndefined(query) || isObjectEmpty(query)) {
				if (!config?.return) return;
				if (this.documents.length === 0) return null;

				const found: Schema = this.documents[0];
				return config?.immutable ? deepClone(found) : found;
			}

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return null;
			if (!config?.return) return;

			const position: number = found[0];
			const document: Schema = this.documents[position];

			return config?.immutable ? deepClone(document) : document;
		} catch (error) {
			throw new DatabaseError('Error searching document', error);
		}
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents selection criteria.
	 * @returns Found documents.
	 */
	public async findMany(query?: SearchQuery<Schema>, config?: Partial<MethodConfig> & { return: false }): Promise<undefined>;
	public async findMany(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema[]>;
	public async findMany(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema[] | undefined> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as MethodConfig;

			if (isUndefined(query) || isObjectEmpty(query)) {
				if (!config?.return) return;
				return config?.immutable ? deepClone(this.documents) : this.documents;
			}

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return [];
			if (!config?.return) return;

			const documents: Schema[] = found.map(position => this.documents[position]);
			return config?.immutable ? deepClone(documents) : documents;
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
	public async updateOne(query: SearchQuery<Schema>, update: UpdateQuery<Schema>, config?: Partial<UpdateMethodConfig> & { return: false }): Promise<undefined>;
	public async updateOne(query: SearchQuery<Schema>, update: UpdateQuery<Schema>, config?: Partial<UpdateMethodConfig>): Promise<Schema | null>;
	public async updateOne(query: SearchQuery<Schema>, update: UpdateQuery<Schema>, config?: Partial<UpdateMethodConfig>): Promise<Schema | null | undefined> {
		try {
			const { schemaValidator } = this.config;

			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object');
			if (!isObject(update) && !isFunction(update)) throw new TypeError('Update query must be an object or function');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as UpdateMethodConfig;

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return config?.return ? undefined : null;

			const position: number = found[0];
			const document: Schema = this.documents[position];
			const documentClone: Schema = deepClone(document);

			prepareObject(update);
			const updatedDocument: Schema = updateObject(update, documentClone) as Schema;
			if (schemaValidator) schemaValidator(updatedDocument);

			this.documents[position] = deepClone(updatedDocument);

			if (!config?.return) return undefined;
			if (config?.old) return document;
			return config?.immutable ? deepClone(documentClone) : this.documents[position]; // TODO: Fix
		} catch (error) {
			throw new DatabaseError('Error updating document', error);
		} finally {
			await this.save();
		}
	}

	/**
	 * Modifies all documents that match search query.
	 * @param query Documents selection criteria.
	 * @param update The modifications to apply.
	 * @returns Original documents that has been modified.
	 */
	public async updateMany(query: SearchQuery<Schema>, update: UpdateQuery<Schema>, config?: Partial<UpdateMethodConfig> & { return: false }): Promise<undefined>;
	public async updateMany(query: SearchQuery<Schema>, update: UpdateQuery<Schema>, config?: Partial<UpdateMethodConfig>): Promise<Schema[]>;
	public async updateMany(query: SearchQuery<Schema>, update: UpdateQuery<Schema>, config?: Partial<UpdateMethodConfig>): Promise<Schema[] | undefined> {
		try {
			const { schemaValidator } = this.config;
			const updated: Schema[] = [];

			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object');
			if (!isObject(update) && !isFunction(update)) throw new TypeError('Update query must be an object');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as UpdateMethodConfig;

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return config?.return ? [] : undefined;

			prepareObject(update);

			for (let i = 0; i < found.length; i++) {
				const position: number = found[i];
				const document: Schema = this.documents[position];
				const documentClone: Schema = deepClone(document);

				const updatedDocument: Schema = updateObject(update, documentClone) as Schema;
				if (schemaValidator) schemaValidator(updatedDocument); // TODO: Fix, doesnt use throw, or cancel old operations

				this.documents[position] = deepClone(updatedDocument);
				this.save();

				updated.push(document);
			}

			if (!config?.return) return undefined;
			return updated;
		} catch (error) {
			throw new DatabaseError('Error updating documents', error);
		} finally {
			await this.save();
		}
	}

	/**
	 * Delete one document.
	 * @param query Document selection criteria.
	 * @returns Deleted document.
	 */
	public async deleteOne(query?: SearchQuery<Schema>, config?: Partial<MethodConfig> & { return: false }): Promise<undefined>;
	public async deleteOne(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema | null>;
	public async deleteOne(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema | null | undefined> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as MethodConfig;

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return config?.return ? undefined : null;

			const position: number = found[0];
			const document: Schema = this.documents[position];

			this.documents.splice(position, 1);
			return config?.return ? undefined : document;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		} finally {
			await this.save();
		}
	}

	/**
	 * Delete many documents.
	 * @param query Document selection criteria.
	 * @returns Array of deleted documents.
	 */
	public async deleteMany(query?: SearchQuery<Schema>, config?: Partial<MethodConfig> & { return: false }): Promise<undefined>;
	public async deleteMany(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema[]>;
	public async deleteMany(query?: SearchQuery<Schema>, config?: Partial<MethodConfig>): Promise<Schema[] | undefined> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object');
			if (isObject(config)) config = { ...this.defaultConfig, ...config } as MethodConfig;

			const deleted: Schema[] = [];

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return [];

			try {
				for (let i = 0; i < found.length; i++) {
					const position: number = found[i];
					const document: Schema = this.documents[position];

					deleted.push(document);
					delete this.documents[position];
				}
			} catch (error) {
				this.documents = cleanArray(this.documents);
				this.save();
				throw error;
			}

			this.documents = cleanArray(this.documents);
			this.save();

			return deleted;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		} finally {
			await this.save();
		}
	}

	// TODO
	// public select(query?: SearchQuery<Schema>): Cursor<Schema> {
	// 	return new Cursor<Schema>(query, this.documents, this.config);
	// }

	/**
	 * Count found documents.
	 * @param query Documents selection criteria.
	 * @returns Documents count.
	 */
	public async count(query?: SearchQuery<Schema>): Promise<number> {
		try {
			if (!isUndefined(query) && !isObject(query) && !isFunction(query)) throw new TypeError('Search query must be an object');
			if (isUndefined(query) || isObjectEmpty(query)) return this.documents.length;

			const found: number[] = Search<Schema>(query, this.documents);
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
		} catch (error) {
			throw new DatabaseError('Error dropping database', error);
		} finally {
			await this.save();			
		}
	}

	/**
	 * Write documents to the database file. Called automatically after each insert, update or delete operation.
	 */
	public async save(): Promise<void> {
		if (this.config.onlyInMemory || isUndefined(this.config.filePath)) return;
		this.storage.write(this.documents);
	}
}

export default AloeDB;

const db = new AloeDB();

const x = await db.findOne({ sdfsf: 1 }, { immutable: true });

