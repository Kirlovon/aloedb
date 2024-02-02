import type { Database } from './database.ts';
import { Query } from './query.ts';
import { Cursor } from './cursor.ts';
import { createIndexesSet, ensureId, isObjectLiteral } from './utils.ts';
import { CollectionConfig, Document, DocumentWithoutId, SearchQuery, UpdateQuery, ValidSchema } from './types.ts';

import { Insert } from './core/insert.ts';
import { Update } from './core/update.ts';
import { Delete } from './core/delete.ts';

export class Collection<Schema extends ValidSchema<Schema>> {
	protected db: Database;
	protected name: string;
	protected indexedKeys: Set<string> = new Set();
	protected validator?: (document: unknown) => void;

	/**
	 * Initiate database collection.
	 * @param db Database instance
	 * @param name Collection name
	 * @param config Collection configuration
	 */
	constructor(db: Database, config: CollectionConfig<Schema>) {
		if (typeof config?.name !== 'string') throw new TypeError('Collection name must be a string');
		config.name = config.name.trim();

		if (config.name.startsWith('_')) throw new Error('Collection names cannot start with "_"');
		if (config.name === '') throw new Error('Collection name cant be empty');

		this.db = db;
		this.name = config.name;

		if (Array.isArray(config.indexes)) this.indexedKeys = createIndexesSet(config.indexes);
		if (typeof config?.validator === 'function') this.validator = config.validator;

	}

	/**
	 * Get arrays with all documents in the collection.
	 */
	public async documents(): Promise<Schema[]> {
		const kv = await this.db.getKv();
		const docs: Schema[] = [];

		const iterator = kv.list({ prefix: [this.name, '_id'] }, { batchSize: 500 });
		for await (const entity of iterator) docs.push(entity.value as Schema);

		return docs;
	}

	/**
	 * Select documents by search query.
	 * @param query Documents selection criteria.
	 * @returns Cursor instance.
	 */
	public select(query?: SearchQuery<Schema>): Cursor<Schema> {
		return this.getCursor(query);
	}

	/**
	 * Insert a document.
	 * @param document Document to insert.
	 * @param options Additional configurations.
	 * @returns Inserted document.
	 */
	public async insertOne(document: DocumentWithoutId<Schema>): Promise<Schema> {
		const kv = await this.db.getKv();
		if (!isObjectLiteral(document)) throw new TypeError('Document must be a plain object');

		// Set ID
		const documentWithId = ensureId(document as ValidSchema<Schema>);

		// Run validation
		if (this.validator) this.validator(documentWithId);

		// Insert
		const inserted = await Insert({
			kv,
			document: documentWithId,
			indexedKeys: this.indexedKeys,
			collectionName: this.name,
		});

		return inserted.value as Schema;
	}

	/**
	 * Inserts multiple documents.
	 * @param documents Array of documents to insert.
	 * @param options Additional configurations.
	 * @returns Array of inserted documents.
	 */
	public async insertMany(documents: DocumentWithoutId<Schema>[]) {
		const kv = await this.db.getKv();
		const insertedDocuments: Document[] = [];

		try {
			for (let i = 0; i < documents.length; i++) {
				const document = documents[i];
				if (!isObjectLiteral(document)) throw new TypeError('All documents must be a plain objects');

				// Set ID
				const documentWithId = ensureId(document as ValidSchema<Schema>);

				// Run validation
				if (this.validator) this.validator(documentWithId);

				// Insert
				await Insert({
					kv,
					document: documentWithId,
					indexedKeys: this.indexedKeys,
					collectionName: this.name,
				});

				insertedDocuments.push(documentWithId);
			}
		} catch (error) {
			for (let i = 0; i < insertedDocuments.length; i++) {
				// Delete inserted entities
			}

			throw error;
		}

		return insertedDocuments as Schema[];
	}

	/**
	 * Find document by search query.
	 * @param query Document selection criteria.
	 * @returns Found document.
	 */
	public async findOne(query: SearchQuery<Schema>) {
		return await this.getCursor(query).getOne();
	}

	/**
	 * Find multiple documents by search query.
	 * @param query Documents selection criteria.
	 * @returns Found documents.
	 */
	public async findMany(query: SearchQuery<Schema>) {
		return await this.getCursor(query).getMany();
	}

	/**
	 * Modifies an existing document that match search query.
	 * @param query Document selection criteria.
	 * @param update The modifications to apply.
	 * @returns Found document with applied modifications.
	 */
	public async updateOne(query: SearchQuery<Schema>, update: UpdateQuery<Schema>) {
		const kv = await this.db.getKv();

		// Update
		const updatedDocuments = await Update({
			kv,
			update: update as UpdateQuery,
			query: new Query(query as SearchQuery),
			indexedKeys: this.indexedKeys,
			collectionName: this.name,
			multiple: false,
		});

		if (updatedDocuments.length === 0) return null;
		return updatedDocuments[0] as Schema;
	}

	/**
	 * Modifies all documents that match search query.
	 * @param query Documents selection criteria.
	 * @param update The modifications to apply.
	 * @returns Found documents with applied modifications.
	 */
	public async updateMany(query: SearchQuery<Schema>, update: UpdateQuery<Schema>) {
	}

	/**
	 * Deletes first found document that matches the search query.
	 * @param query Document selection criteria.
	 * @returns Deleted document.
	 */
	public async deleteOne(query: SearchQuery<Schema>) {
		const kv = await this.db.getKv();

		// Update
		const deletedEntities = await Delete({
			kv,
			indexedKeys: this.indexedKeys,
			collectionName: this.name,
			query: new Query(query as SearchQuery),
			multiple: false,
		});

		if (deletedEntities.length === 0) return null;
		return deletedEntities[0].value as Schema;
	}

	/**
	 * Deletes all documents that matches the search query.
	 * @param query Document selection criteria.
	 * @param options Additional configurations.
	 * @returns Array of deleted documents.
	 */
	public async deleteMany(query: SearchQuery<Schema>) {
		const kv = await this.db.getKv();

		// Delete
		const deletedEntities = await Delete({
			kv,
			indexedKeys: this.indexedKeys,
			collectionName: this.name,
			query: new Query(query as SearchQuery),
			multiple: true,
		});

		const deletedDocuments = deletedEntities.map((entity) => entity.value);
		return deletedDocuments as Schema[];
	}

	/**
	 * Count documents that match the query.
	 * @param query Documents selection criteria.
	 * @returns Documents count.
	 */
	public async count(query: SearchQuery<Schema>) {
		return await this.getCursor(query).count();
	}

	/**
	 * Delete all documents in the collection.
	 * @param raw If true, instead of deleting each document individually, all entities in the collection will be deleted.
	 */
	public async drop(raw = false) {
		const kv = await this.db.getKv();

		// Raw data clean-up
		if (raw) {
			const iterator = kv.list({ prefix: [this.name] }, { batchSize: 500 });
			for await (const entity of iterator) await kv.delete(entity.key);
			return;
		}

		const iterator = kv.list({ prefix: [this.name, '_id'] }, { batchSize: 500 });
		for await (const entity of iterator) {
			await Delete({
				kv,
				indexedKeys: this.indexedKeys,
				collectionName: this.name,
				query: new Query({ _id: (entity.value as Document)._id }),
				multiple: false,
			});
		}
	}

	// TODO
	public async reIndex() {

	}

	/**
	 * Get cursor
	 * @param query Cursor query
	 * @returns Cursor instance
	 */
	private getCursor(query: SearchQuery<Schema>) {
		return new Cursor<Schema>({
			db: this.db,
			query: new Query(query as SearchQuery),
			indexedKeys: this.indexedKeys,
			collectionName: this.name,
		});
	}
}
