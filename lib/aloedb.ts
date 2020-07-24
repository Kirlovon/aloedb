import Search from './search.ts';
import Cursor from './cursor.ts';
import Storage from './storage.ts';
import DatabaseError from './error.ts';
import { prepareObject } from './prepare.ts';
import { deepClone, setNestedValue, cleanArray, isObjectEmpty } from './utils.ts';
import { isUndefined, isString, isBoolean, isObject, isArray, isFunction } from './types.ts';
import { Document, Acceptable, DatabaseConfig, SearchQuery, UpdateQuery } from './declarations.ts';

/**
 * Database
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
		if (!isUndefined(filePath) && isUndefined(onlyInMemory)) config.onlyInMemory = false;
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
	public async insertOne(document: Schema): Promise<Schema> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;
			if (!isObject(document)) throw new TypeError('Input must be an object');

			prepareObject(document);
			if (cloneDocuments) document = deepClone(document);
			if (schemaValidator) await schemaValidator(document);

			this.documents.push(document);
			await this.save();

			const result: Schema = cloneDocuments ? deepClone(document) : document;
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
	public async insertMany(documents: Schema[]): Promise<Schema[]> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;
			if (!isArray(documents)) throw new TypeError('Input must be an array');

			for (let i = 0; i < documents.length; i++) {
				const document: Schema = documents[i];
				if (!isObject(document)) throw new TypeError('Values must be an objects');

				prepareObject(document);
				if (cloneDocuments) documents[i] = deepClone(documents[i]);
				if (schemaValidator) await schemaValidator(document);
			}

			this.documents = [...this.documents, ...documents];
			await this.save();

			const result: Schema[] = cloneDocuments ? deepClone(documents) : documents;
			return result;
		} catch (error) {
			throw new DatabaseError('Error inserting documents', error);
		}
	}

	/**
	 * Find document by search query.
	 * @param query Document search query.
	 * @returns Found document.
	 */
	public async findOne(query?: SearchQuery<Schema>): Promise<Schema | null> {
		const { cloneDocuments } = this.config;

		if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');
		if (isUndefined(query) || isObjectEmpty(query)) return cloneDocuments ? deepClone(this.documents[0]) : this.documents[0];

		const found: number[] = Search<Schema>(query, this.documents);
		if (found.length === 0) return null;

		const position: number = found[0];
		const document: Schema = this.documents[position];

		const result: Schema = cloneDocuments ? deepClone(document) : document;
		return result;
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents search query.
	 * @returns Found documents.
	 */
	public async findMany(query?: SearchQuery<Schema>): Promise<Schema[]> {
		const { cloneDocuments } = this.config;

		if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');

		const found: number[] = Search<Schema>(query, this.documents);
		if (found.length === 0) return [];

		const documents: Schema[] = found.map(position => this.documents[position]);
		const result: Schema[] = cloneDocuments ? deepClone(documents) : documents;
		return result;
	}

	/**
	 * Count found documents.
	 * @param query Documents search query.
	 * @returns Documents count.
	 */
	public async count(query?: SearchQuery<Schema>): Promise<number> {
		try {
			if (!isUndefined(query) && !isObject(query)) throw new TypeError('Search query must be an object');

			const found: number[] = Search<Schema>(query, this.documents);

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
	public async updateOne(searchQuery: SearchQuery<Schema>, updateQuery: UpdateQuery<Schema>): Promise<Schema | null> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;

			if (!isUndefined(searchQuery) && !isObject(searchQuery)) throw new TypeError('Search query must be an object');
			if (!isObject(updateQuery) && !isFunction(updateQuery)) throw new TypeError('Update query must be an object or function');

			const found: number[] = Search<Schema>(searchQuery, this.documents);
			if (found.length === 0) return null;

			const index = found[0];
			const document = deepClone(this.documents[index]);

			if (isFunction(updateQuery)) {
				updateQuery(document)
			} else {
				for (const key in updateQuery) {
					const queryValue = cloneDocuments ? deepClone(updateQuery[key]) : updateQuery[key];
					setNestedValue(key, queryValue, document);
				}
			}

			prepareObject(document);
			if (schemaValidator) await schemaValidator(document);

			this.documents[index] = document;
			await this.save();

			const result = cloneDocuments ? deepClone(document) : document;
			return result;
		} catch (error) {
			throw new DatabaseError('Error updating document', error);
		}
	}

	public async updateMany(searchQuery: SearchQuery<Schema>, updateQuery: UpdateQuery<Schema>): Promise<Schema[]> {
		try {
			const { cloneDocuments, schemaValidator } = this.config;

			if (!isUndefined(searchQuery) && !isObject(searchQuery)) throw new TypeError('Search query must be an object');
			if (!isObject(updateQuery) && !isFunction(updateQuery)) throw new TypeError('Update query must be an object');

			const found: number[] = Search<Schema>(searchQuery, this.documents);
			if (found.length === 0) return [];
			const updated: Schema[] = [];
			
			if (isFunction(updateQuery)) {
				for (let i = 0; i < found.length; i++) {
					const index: number = found[i];
					const document: Schema = deepClone(this.documents[index]);

					updateQuery(document);
					prepareObject(document);
					if (schemaValidator) await schemaValidator(document);	
					
					this.documents[index] = document;
					updated.push(document);
								
					await this.save();
				}
			} else {
				for (let i = 0; i < found.length; i++) {
					const index: number = found[i];
					const document: Schema = deepClone(this.documents[index]);
					
					for (const key in updateQuery) {
						const queryValue = cloneDocuments ? deepClone(updateQuery[key]) : updateQuery[key];
						setNestedValue(key, queryValue, document);
					}

					prepareObject(document);
					if (schemaValidator) await schemaValidator(document);	
					
					this.documents[index] = document;
					updated.push(document);

					await this.save();
				}
			}

			// for (let i = 0; i < found.length; i++) {
			// 	const index: number = found[i];
			// 	const document: Schema = deepClone(this.documents[index]);

			// 	if (isFunction(updateQuery)) {
			// 		updateQuery(document);
			// 	} else {
			// 		for (const key in updateQuery) {
			// 			const queryValue = cloneDocuments ? deepClone(updateQuery[key]) : updateQuery[key];
			// 			setNestedValue(key, queryValue, document);
			// 		}
			// 	}

			// 	prepareObject(document);
			// 	if (schemaValidator) await schemaValidator(document);	
				
			// 	this.documents[index] = document;
			// 	updated.push(document);
			// }
			
			await this.save();

			const result: Schema[] = cloneDocuments ? deepClone(updated) : updated;
			return result;

		} catch (error) {
			throw new DatabaseError('Error updating documents', error);
		}
	}

	public async deleteOne(query?: SearchQuery<Schema>): Promise<Schema | null> {
		try {
			const { cloneDocuments } = this.config;

			const found: number[] = Search<Schema>(query, this.documents);
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

	public async deleteMany(query?: SearchQuery<Schema>): Promise<Schema[]> {
		try {
			const found: number[] = Search<Schema>(query, this.documents);
			if (found.length === 0) return [];
			const deleted: Schema[] = [];

			for (let i = 0; i < found.length; i++) {
				const index: number = found[i];
				deleted.push(this.documents[index]);
				delete this.documents[index];
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
