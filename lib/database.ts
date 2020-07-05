import Cursor from './cursor.ts';
import Storage from './storage.ts';
import DatabaseError from './error.ts';
import { search } from './search.ts';
import { deepClone } from './utils.ts';
import { prepareObject } from './preparer.ts';
import { Document, DatabaseConfig, SearchQuery } from './declarations.ts';
import { isUndefined, isString, isBoolean, isObject, isArray } from './types.ts';

/**
 * Database
 */
class Database<Schema extends Document = Document> {
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
		instantWriting: false,
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

		// Validate custom config
		if (!isUndefined(filePath) && !isString(filePath)) throw new DatabaseError('Database initialization error', '"filePath" must be a string');
		if (!isUndefined(pretty) && !isBoolean(pretty)) throw new DatabaseError('Database initialization error', '"pretty" must be a boolean');
		if (!isUndefined(safeWrite) && !isBoolean(safeWrite)) throw new DatabaseError('Database initialization error', '"safeWrite" must be a boolean');
		if (!isUndefined(cloneDocuments) && !isBoolean(cloneDocuments)) throw new DatabaseError('Database initialization error', '"cloneDocuments" must be a boolean');
		if (!isUndefined(onlyInMemory) && !isBoolean(onlyInMemory)) throw new DatabaseError('Database initialization error', '"onlyInMemory" must be a boolean');
		if (isUndefined(filePath) && !onlyInMemory)
			throw new DatabaseError('Database initialization error', 'It is impossible to disable "onlyInMemory" mode if the "filePath" is not specified');

		// Merge default and custom config
		this.config = { ...this.config, ...config };

		// Initialize file storage
		this.storage = new Storage(this.config);

		// Read database file
		this.documents = this.storage.read();
	}

	/**
	 * Insert new document.
	 * @param document Document to insert
	 * @returns Inserted document
	 */
	public async insertOne(document: Schema): Promise<Schema>;
	public async insertOne(document: Document): Promise<Document> {
		const { cloneDocuments, schemaValidator } = this.config;

		if (!isObject(document)) throw new TypeError('Input must be an object');

		if (cloneDocuments) document = deepClone(document);

		// Prepare document for storage
		prepareObject(document);

		// User validation
		if (schemaValidator) {
			await schemaValidator(document);
		}

		this.documents.push(document);

		await this.save();

		return cloneDocuments ? deepClone(document) : document;
	}

	public async insertMany(documents: Schema[]): Promise<Schema[]>;
	public async insertMany(documents: Document[]): Promise<Document[]> {
		const { cloneDocuments, schemaValidator } = this.config;

		if (!isArray(documents)) throw new TypeError('Input must be an array');

		for (let i = 0; i < documents.length; i++) {
			const document = documents[i];
			
			if (!isObject(document)) throw new TypeError('Document must be an object');
		}


		return documents;
	}

	// public async findOne(query?: SearchQuery<Schema>, projection?: any): Promise<Schema | null>;
	// public async findOne(query?: SearchQuery<Document>): Promise<Document | null> {
	// 	const { cloneDocuments } = this.config;

	// 	// Search operation
	// 	const found: Document | null = await searchOne(query, this.documents);

	// 	return cloneDocuments ? deepClone(found) : found;
	// }

	// public async findMany<SearchSchema extends Schema>(query?: SearchQuery<SearchSchema>): Promise<Schema[]>;
	// public async findMany<SearchSchema extends Document>(query?: SearchQuery<SearchSchema>): Promise<Document[]> {
	// 	const { cloneDocuments } = this.config;

	// 	// Search operation
	// 	const found: Document[] = await searchMany(query, this.documents);

	// 	return cloneDocuments ? deepClone(found) : found;
	// }

	public async updateOne<SearchSchema extends Schema>(searchQuery: SearchQuery<SearchSchema>, updateQuery: any) {}
	public async updateMany<SearchSchema extends Document>(searchQuery: SearchQuery<SearchSchema>, updateQuery: any) {}

	public async deleteOne<SearchSchema extends Schema>(query?: SearchQuery<SearchSchema>) {}
	public async deleteMany<SearchSchema extends Document>(query?: SearchQuery<SearchSchema>) {}

	public select<SearchSchema extends Schema>(query: SearchQuery<SearchSchema>): Cursor<Schema>;
	public select<SearchSchema extends Document>(query: SearchQuery<SearchSchema>): Cursor<Document> {
		return new Cursor<SearchSchema>(query);
	}

	public async count<SearchSchema extends Schema>(query: SearchQuery<SearchSchema>): Promise<number>;
	public async count<SearchSchema extends Document>(query: SearchQuery<SearchSchema>): Promise<number> {
		const found = await search(query, this.documents);
		return found.length;
	}

	/**
	 * Drop database
	 */
	public async drop(): Promise<void> {
		this.documents = [];
		await this.save();
	}

	/**
	 * Save documents in database file.
	 */
	private async save(): Promise<void> {
		if (this.config.instantWriting) {
			await this.storage.write(this.documents);
		} else {
			this.storage.write(this.documents);
		}
	}
}

export default Database;
