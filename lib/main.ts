import { Search } from './search.ts';
import { Cursor } from './cursor.ts';
import { Storage } from './storage.ts';
import { DatabaseError } from './error.ts';
import { isUndefined, isString, isBoolean, isObject, isArray, isFunction } from './types.ts';
import { deepClone, cleanArray, isObjectEmpty, updateDocument, prepareObject } from './utils.ts';
import { Document, Acceptable, DatabaseConfig, SearchQuery, UpdateQuery } from './declarations.ts';

/**
 * # AloeDB 🌿
 * Light, Embeddable, NoSQL database for Deno
 */
class AloeDB<Schema extends Acceptable<Schema> = Document> {
	/** In-Memory documents storage. */
	public documents: Schema[] = [];

	/** File storage manager. */
	private storage: Storage;

	/** Database configuration. */
	private config: DatabaseConfig = {
		filePath: undefined,
		pretty: true,
		safeWrite: true,
		onlyInMemory: true,
		schemaValidator: undefined,
	};

	/**
	 * Database initialization.
	 * @param config Database configuration.
	 */
	constructor(config?: Partial<DatabaseConfig> | string) {
		if (isUndefined(config)) config = { onlyInMemory: true };
		if (isString(config)) config = { filePath: config, onlyInMemory: false };
		if (!isObject(config)) throw new DatabaseError('Database initialization error', 'Config must be an object');

		let { filePath, pretty, safeWrite, onlyInMemory, schemaValidator } = config;

		if (!isUndefined(filePath) && !isString(filePath)) throw new DatabaseError('Database initialization error', '"filePath" must be a string');
		if (!isUndefined(pretty) && !isBoolean(pretty)) throw new DatabaseError('Database initialization error', '"pretty" must be a boolean');
		if (!isUndefined(safeWrite) && !isBoolean(safeWrite)) throw new DatabaseError('Database initialization error', '"safeWrite" must be a boolean');
		if (!isUndefined(onlyInMemory) && !isBoolean(onlyInMemory)) throw new DatabaseError('Database initialization error', '"onlyInMemory" must be a boolean');
		if (!isUndefined(schemaValidator) && !isFunction(schemaValidator)) throw new DatabaseError('Database initialization error', '"schemaValidator" must be a function');

		if (isUndefined(filePath) && isUndefined(onlyInMemory)) onlyInMemory = true;
		if (isString(filePath) && isUndefined(onlyInMemory)) onlyInMemory = false;
		if (isUndefined(filePath) && onlyInMemory === false)
			throw new DatabaseError('Database initialization error', 'It is impossible to disable "onlyInMemory" mode if the "filePath" is not specified');

		this.config.filePath = isUndefined(filePath) ? this.config.filePath : filePath;
		this.config.pretty = isUndefined(pretty) ? this.config.pretty : pretty;
		this.config.safeWrite = isUndefined(safeWrite) ? this.config.safeWrite : safeWrite;
		this.config.onlyInMemory = isUndefined(onlyInMemory) ? this.config.onlyInMemory : onlyInMemory;
		this.config.schemaValidator = isUndefined(schemaValidator) ? this.config.schemaValidator : schemaValidator;

		this.storage = new Storage(this.config);
		this.documents = this.storage.read() as Schema[];
	}

	/**
	 * Insert new document.
	 * @param document Document to insert.
	 * @returns Inserted document.
	 */
	public async insertOne(document: Schema): Promise<Schema> {
		try {
			const { schemaValidator } = this.config;
			if (!isObject(document)) throw new TypeError('Input must be an object');

			prepareObject(document);
			document = deepClone(document);
			if (schemaValidator) schemaValidator(document);

			this.documents.push(document);
			await this.save();

			return deepClone(document);
		} catch (error) {
			throw new DatabaseError('Error inserting document', error);
		}
	}

	/**
	 * Insert many documents at once.
	 * @param documents Array of documents to insert.
	 * @returns Array of inserted documents.
	 */
	public async insertMany(documents: Schema[]): Promise<Schema[]> {
		try {
			const { schemaValidator } = this.config;
			const inserted: Schema[] = [];

			if (!isArray(documents)) throw new TypeError('Input must be an array');

			for (let i = 0; i < documents.length; i++) {
				const document: Schema = deepClone(documents[i]);
				if (!isObject(document)) throw new TypeError('Values must be an objects');

				prepareObject(document);
				if (schemaValidator) schemaValidator(document);

				inserted.push(document);
			}

			this.documents = [...this.documents, ...inserted];
			await this.save();

			return deepClone(documents);
		} catch (error) {
			throw new DatabaseError('Error inserting documents', error);
		}
	}

	/**
	 * Find document by search query.
	 * @param query Document search query.
	 * @returns Found document.
	 */
	public async findOne(query?: SearchQuery<Schema>): Promise<Readonly<Schema> | null> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');
			if ((isUndefined(query) || isObjectEmpty(query)) && this.documents.length > 0) return deepClone(this.documents[0]);

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return null;

			const position: number = found[0];
			const document: Schema = this.documents[position];

			return document;
		} catch (error) {
			throw new DatabaseError('Error searching document', error);
		}
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents search query.
	 * @returns Found documents.
	 */
	public async findMany(query?: SearchQuery<Schema>): Promise<Schema[]> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');
			if (isUndefined(query) || isObjectEmpty(query)) return deepClone(this.documents);

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return [];

			const documents: Schema[] = found.map(position => this.documents[position]);
			return deepClone(documents);
		} catch (error) {
			throw new DatabaseError('Error searching document', error);
		}
	}

	/**
	 * Count found documents.
	 * @param query Documents search query.
	 * @returns Documents count.
	 */
	public async count(query?: SearchQuery<Schema>): Promise<number> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');
			if (isUndefined(query) || isObjectEmpty(query)) return this.documents.length;

			const found: number[] = Search<Schema>(query, this.documents);
			return found.length;
		} catch (error) {
			throw new DatabaseError('Error counting documents', error);
		}
	}


	/**
	 * Find and update document.
	 * @param query Documents search query.
	 * @param update Update query.
	 * @returns Updated document.
	 */
	public async updateOne(query: SearchQuery<Schema>, update: UpdateQuery<Schema>): Promise<Schema | null> {
		try {
			const { schemaValidator } = this.config;

			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');
			if (!isObject(update) && !isFunction(update)) throw new TypeError('Update query must be an object or function');

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return null;

			const position: number = found[0];
			const document: Schema = this.documents[position];

			updateDocument(deepClone(update), document);
			prepareObject(document);
			if (schemaValidator) schemaValidator(document);

			this.documents[position] = document;
			await this.save();

			return deepClone(document);
		} catch (error) {
			throw new DatabaseError('Error updating document', error);
		}
	}

	public async updateMany(query: SearchQuery<Schema>, update: UpdateQuery<Schema>): Promise<Schema[]> {
		try {
			const { schemaValidator } = this.config;
			const updated: Schema[] = [];

			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');
			if (!isObject(update) && !isFunction(update)) throw new TypeError('Update query must be an object');

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return [];

			for (let i = 0; i < found.length; i++) {
				const position: number = found[i];
				const document: Schema = deepClone(this.documents[position]);

				updateDocument(update, document);
				prepareObject(document);
				if (schemaValidator) schemaValidator(document);

				this.documents[position] = document;
				updated.push(document);
				await this.save();
			}

			return deepClone(updated);
		} catch (error) {
			throw new DatabaseError('Error updating documents', error);
		}
	}

	public async deleteOne(query?: SearchQuery<Schema>): Promise<Schema | null> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return null;

			const position: number = found[0];
			const document: Schema = this.documents[position];

			this.documents.splice(position, 1);
			await this.save();

			return document;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	public async deleteMany(query?: SearchQuery<Schema>): Promise<Schema[]> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');
			const deleted: Schema[] = [];

			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return [];

			for (let i = 0; i < found.length; i++) {
				const position: number = found[i];
				const document: Schema = this.documents[position];

				deleted.push(document);
				delete this.documents[position];
			}

			this.documents = cleanArray(this.documents);
			await this.save();

			return deleted;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	public select(query: SearchQuery<Schema>): Cursor<Schema> {
		return new Cursor<Schema>(query, this.documents, this.config);
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
	 * Save documents in database file.
	 */
	private async save(): Promise<void> {
		if (this.config.onlyInMemory) return;
		this.storage.write(this.documents);
	}
}

export default AloeDB;
