import Search from './search.ts';
import Cursor from './cursor.ts';
import Storage from './storage.ts';
import DatabaseError from './error.ts';
import { prepareObject } from './prepare.ts';
import { deepClone, setNestedValue } from './utils.ts';
import { Document, DatabaseConfig, SearchQuery, DocumentValue } from './declarations.ts';
import { isUndefined, isString, isBoolean, isObject, isArray, isNull } from './types.ts';
import { type } from './operators.ts';

/**
 * Database
 */
class AloeDB<Schema extends Document> {
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
		cloneDocuments: true,
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

		const { filePath, pretty, safeWrite, cloneDocuments, onlyInMemory } = config;

		if (!isUndefined(filePath) && !isString(filePath)) throw new DatabaseError('Database initialization error', '"filePath" must be a string');
		if (!isUndefined(pretty) && !isBoolean(pretty)) throw new DatabaseError('Database initialization error', '"pretty" must be a boolean');
		if (!isUndefined(safeWrite) && !isBoolean(safeWrite)) throw new DatabaseError('Database initialization error', '"safeWrite" must be a boolean');
		if (!isUndefined(cloneDocuments) && !isBoolean(cloneDocuments)) throw new DatabaseError('Database initialization error', '"cloneDocuments" must be a boolean');
		if (!isUndefined(onlyInMemory) && !isBoolean(onlyInMemory)) throw new DatabaseError('Database initialization error', '"onlyInMemory" must be a boolean');
		if (isUndefined(filePath) && isUndefined(onlyInMemory)) config.onlyInMemory = true;
		if (isUndefined(filePath) && !onlyInMemory)
			throw new DatabaseError('Database initialization error', 'It is impossible to disable "onlyInMemory" mode if the "filePath" is not specified');

		this.config = { ...this.config, ...config };
		this.storage = new Storage(this.config);
		this.documents = this.storage.read() as Schema[];
	}

	/**
	 * Insert new document.
	 * @param document Document to insert.
	 * @returns Inserted document.
	 */
	public async insertOne<T extends Schema>(document: T): Promise<T>;
	public async insertOne(document: Schema): Promise<Schema> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;
			if (!isObject(document)) throw new TypeError('Input must be an object');

			prepareObject(document);
			if (cloneDocuments) document = deepClone(document);
			if (schemaValidator) await schemaValidator(document);

			this.documents.push(document);
			await this.save();

			const result: Document = cloneDocuments ? deepClone(document) : document;
			return result as Schema;
		} catch (error) {
			throw new DatabaseError('Error inserting document', error);
		}
	}

	/**
	 * Insert many documents at once.
	 * @param documents Array of documents to insert.
	 * @returns Array of inserted documents.
	 */
	public async insertMany<T extends Schema>(documents: T[]): Promise<T[]>;
	public async insertMany(documents: Schema[]): Promise<Schema[]> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;
			if (!isArray(documents)) throw new TypeError('Input must be an array');

			for (let i = 0; i < documents.length; i++) {
				const document: Document = documents[i];
				if (!isObject(document)) throw new TypeError('Values must be an objects');

				prepareObject(document);
				if (cloneDocuments) documents[i] = deepClone(documents[i]);
				if (schemaValidator) await schemaValidator(document);
			}

			this.documents = [...this.documents, ...documents];
			await this.save();

			const result: Document[] = cloneDocuments ? deepClone(documents) : documents;
			return result as Schema[];
		} catch (error) {
			throw new DatabaseError('Error inserting documents', error);
		}
	}

	/**
	 * Find document by search query.
	 * @param query Document search query.
	 * @returns Found document.
	 */
	public async findOne<T extends Schema>(query?: SearchQuery<T>): Promise<T | null>;
	public async findOne(query?: SearchQuery<Schema>): Promise<Schema | null> {
		const { cloneDocuments } = this.config;

		if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');

		const found: Document[] = Search.documents(query, this.documents);
		if (found.length === 0) return null;

		const result: Document = cloneDocuments ? deepClone(found[0]) : found[0];
		return result as Schema;
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents search query.
	 * @returns Found documents.
	 */
	public async findMany<T extends Schema>(query?: SearchQuery<T>): Promise<T[]>;
	public async findMany(query?: SearchQuery<Schema>): Promise<Schema[]> {
		const { cloneDocuments } = this.config;

		if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');

		const found: Document[] = Search.documents(query, this.documents);
		const result: Document[] = cloneDocuments ? deepClone(found) : found;

		return result as Schema[];
	}

	/**
	 * Count found documents.
	 * @param query Documents search query.
	 * @returns Documents count.
	 */
	public async count<T extends Schema>(query?: SearchQuery<T>): Promise<number>;
	public async count(query?: SearchQuery<Schema>): Promise<number> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');

			const found: number[] = Search.indexes(query, this.documents);

			return found.length as number;
		} catch (error) {
			throw new DatabaseError('Error counting documents', error);
		}
	}

	/**
	 *
	 * @param searchQuery
	 * @param updateQuery
	 */
	public async updateOne<T extends Schema>(searchQuery: SearchQuery<T>, updateQuery: Document): Promise<T | null>;
	public async updateOne(searchQuery: SearchQuery<Schema>, updateQuery: Document): Promise<Schema | null> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;

			if (!isUndefined(searchQuery) && !isObject(searchQuery)) throw new TypeError('Search query must be an object');
			if (!isObject(updateQuery)) throw new TypeError('Update query must be an object');

			const found: number[] = Search.indexes(searchQuery, this.documents);
			if (found.length === 0) return null;

			const index: number = found[0];
			const document: Schema = deepClone(this.documents[index]);
			if (cloneDocuments) updateQuery = deepClone(updateQuery);

			for (const key in updateQuery) {
				const queryValue: DocumentValue = updateQuery[key];
				setNestedValue(key, queryValue, document);
			}

			prepareObject(document);
			if (schemaValidator) await schemaValidator(document);

			this.documents[index] = document;
			await this.save();

			const result: Schema = cloneDocuments ? deepClone(document) : document;
			return result;
		} catch (error) {
			throw new DatabaseError('Error updating document', error);
		}
	}

	public async updateMany<T extends Schema>(searchQuery: SearchQuery<T>, updateQuery: Document): Promise<Schema[]>;
	public async updateMany(searchQuery: SearchQuery<Schema>, updateQuery: Document): Promise<Schema[]> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;

			if (!isUndefined(searchQuery) && !isObject(searchQuery)) throw new TypeError('Search query must be an object');
			if (!isObject(updateQuery)) throw new TypeError('Update query must be an object');

			const found: number[] = Search.indexes(searchQuery, this.documents);
			if (found.length === 0) return [];

			const updated: Schema[] = [];
			if (cloneDocuments) updateQuery = deepClone(updateQuery);

			for (let i = 0; i < found.length; i++) {
				const index: number = found[i];
				const document: Schema = deepClone(this.documents[index]);

				for (const key in updateQuery) {
					const queryValue: DocumentValue = updateQuery[key];
					setNestedValue(key, queryValue, document);
				}

				prepareObject(document);
				if (schemaValidator) await schemaValidator(document);	
				
				this.documents[index] = document;
				updated.push(document);
			}
			
			await this.save();

			const result: Schema[] = cloneDocuments ? deepClone(updated) : updated;
			return result;

		} catch (error) {
			throw new DatabaseError('Error updating documents', error);
		}
	}

	public async deleteOne<T extends Schema>(query?: SearchQuery<T>): Promise<Schema | null>;
	public async deleteOne(query?: SearchQuery<Schema>): Promise<Schema | null> {
		try {
			const { cloneDocuments } = this.config;

			const found: number[] = Search.indexes(query, this.documents);
			if (found.length === 0) return null;

			const index: number = found[0];
			const document: Schema = this.documents[index];

			this.documents.splice(index, 1);
			await this.save();

			return document;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	public async deleteMany<T extends Schema>(query?: SearchQuery<T>): Promise<T[]>;
	public async deleteMany(query?: SearchQuery<Schema>): Promise<Schema[]> {
		try {
			const found: number[] = Search.indexes(query, this.documents);
			if (found.length === 0) return [];

			const deleted: Schema[] = [];
			for (let i = 0; i < found.length; i++) {
				const index: number = found[i];
				deleted.push(this.documents[index]);
				delete this.documents[index];
			}

			this.documents = this.documents.filter(document => !isUndefined(document));
			await this.save();

			return deleted;
			
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	public select<T extends Schema>(query: SearchQuery<T>): Cursor<T>;
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

interface Test extends Document {
	value?: number | string;
}

const db = new AloeDB();


console.time('insert');
for (let i = 0; i < 100000; i++) {
	await db.insertOne({ });
}
console.timeEnd('insert');

console.time('find');
const x = await db.findMany({ });
console.timeEnd('find');
console.log('find', x.length);

console.time('update');
const y = await db.updateMany({ }, { value: 'y' });
console.timeEnd('update');
console.log('update', y.length);

console.time('delete');
const z = await db.deleteMany({ value: 'x' });
console.timeEnd('delete');
console.log('delete', z.length);

console.log('documents', db.documents.length);
