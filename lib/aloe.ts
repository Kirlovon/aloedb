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
	public documents: Document[] = [];

	/** File storage manager. */
	private storage: Storage;

	/** Database configuration. */
	private config: DatabaseConfig = {
		filePath: undefined,
		pretty: true,
		safeWrite: true,
		onlyInMemory: false,
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
		if (isUndefined(filePath) && !onlyInMemory)
			throw new DatabaseError('Database initialization error', 'It is impossible to disable "onlyInMemory" mode if the "filePath" is not specified');

		this.config = { ...this.config, ...config };
		this.storage = new Storage(this.config);
		this.documents = this.storage.read();
	}

	/**
	 * Insert new document.
	 * @param document Document to insert.
	 * @returns Inserted document.
	 */
	public async insertOne(document: Schema): Promise<Schema>;
	public async insertOne(document: Document): Promise<Document>;
	public async insertOne<T extends Document>(document: T): Promise<Document> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;
			if (!isObject(document)) throw new TypeError('Input must be an object');

			if (schemaValidator) await schemaValidator(document);
			if (cloneDocuments) document = deepClone(document);
			prepareObject(document);

			this.documents.push(document);
			await this.save();

			const result: Document = cloneDocuments ? deepClone(document) : document;
			return result;

		} catch (error) {
			throw new DatabaseError('Error inserting document', error);
		}
	}

	/**
	 * Insert many documents at once.
	 * @param documents Array of documents to insert.
	 * @returns Array of inserted documents.
	 */
	public async insertMany<T extends Document = Schema>(documents: T[]): Promise<T[]> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;
			if (!isArray(documents)) throw new TypeError('Input must be an array');

			for (let i = 0; i < documents.length; i++) {
				const document: Document = documents[i];
				if (!isObject(document)) throw new TypeError('Values must be an objects');
				
				if (schemaValidator) await schemaValidator(document);
				if (cloneDocuments) documents[i] = deepClone(documents[i]);
				prepareObject(document);
			}

			this.documents = [...this.documents, ...documents];
			await this.save();

			const result: Document[] = cloneDocuments ? deepClone(documents) : documents;
			return result as T[];
		} catch (error) {
			throw new DatabaseError('Error inserting documents', error);
		}
	}

	/**
	 * Find document by search query.
	 * @param query Document search query.
	 * @returns Found document.
	 */
	public async findOne<T extends Document = Schema>(query?: SearchQuery<T>): Promise<T | null> {
		const { cloneDocuments } = this.config;

		const found: Document[] = Search.documents(query, this.documents);
		if (found.length === 0) return null;

		const result: Document = cloneDocuments ? deepClone(found[0]) : found[0];
		return result as T;
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents search query.
	 * @returns Found documents.
	 */
	public async findMany<T extends Document = Schema>(query?: SearchQuery<T>): Promise<T[]> {
		const { cloneDocuments } = this.config;

		const found: Document[] = Search.documents(query, this.documents);
		const result: Document[] = cloneDocuments ? deepClone(found) : found;

		return result as T[];
	}

	/**
	 * Count found documents.
	 * @param query Documents search query.
	 * @returns Documents count.
	 */
	public async count<T extends Document = Schema>(query?: SearchQuery<T>): Promise<number> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Query must be an object');

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
	public async updateOne<T extends Schema>(searchQuery: SearchQuery<T>, updateQuery: Document) {
		try {
			const { cloneDocuments } = this.config;

			const found: Document[] = Search.documents(searchQuery, this.documents);
			if (found.length === 0) return;

			const document: Document = found[0];
			for(const key in updateQuery) {
				const queryValue: DocumentValue = updateQuery[key];
				setNestedValue(key, queryValue, document);
			}

			await this.save()
			
			const result: Document = cloneDocuments ? deepClone(document) : document;
			return result;
		} catch (error) {
			throw new DatabaseError('Error updating document', error);
		}
	}

	public async updateMany<T extends Document = Schema>(searchQuery: SearchQuery<T>, updateQuery: Document) {
		try {
			const { cloneDocuments } = this.config;

			const found: Document[] = Search.documents(searchQuery, this.documents);
			if (found.length === 0) return;

			for (let i = 0; i < found.length; i++) {
				const document: Document = found[i];

				for(const key in updateQuery) {
					const queryValue = updateQuery[key];
					setNestedValue(key, queryValue, document);
				}
			}

			await this.save();

			const result: Document[] = cloneDocuments ? deepClone(found) : found;
			return result;
		} catch (error) {
			throw new DatabaseError('Error updating documents', error);
		}
	}

	public async deleteOne<SearchSchema extends Schema>(query?: SearchQuery<SearchSchema>) {
		try {
			const { cloneDocuments } = this.config;

			const found: number[] = Search.indexes(query, this.documents);
			if (found.length === 0) return;

			const index: number = found[0];
			const document: Document = this.documents[index];
			this.documents.splice(index, 1);
			await this.save();

			return document;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	public async deleteMany<SearchSchema extends Document>(query?: SearchQuery<SearchSchema>) {
		try {
			const found: number[] = Search.indexes(query, this.documents);
			if (found.length === 0) return;
			
			const deleted: Document[] = [];
			for (let i = 0; i < found.length; i++) {
				const index: number = found[i];

				deleted.push(this.documents[index]);
				delete this.documents[index];		
			}

			this.documents = this.documents.filter((document) => !isUndefined(document));
			await this.save();

			return deleted;
		} catch (error) {
			throw new DatabaseError('Error deleting documents', error);
		}
	}

	public select<T extends Schema>(query: SearchQuery<T>): Cursor<Schema>;
	public select<T extends Document>(query: SearchQuery<T>): Cursor<Document> {
		return new Cursor(query, this.documents, this.config);
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

// TODO: Fix onlyInMemory
const db = new AloeDB({ cloneDocuments: false, onlyInMemory: true });

console.time('insert');
for (let i = 0; i < 100000; i++) {
	await db.insertOne({ value: i });
}
console.timeEnd('insert');

console.time('find');
const x = await db.findMany({ value: type('number') });
console.timeEnd('find');

console.time('update');
const y = await db.updateMany({ value: type('number') }, { value: 'x' });
console.timeEnd('update');

console.time('delete');
const z = await db.deleteMany({ value: 'x' });
console.timeEnd('delete');

console.log(db.documents.length)