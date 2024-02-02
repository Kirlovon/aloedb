import { Document } from './types.ts';
import { Collection } from './collection.ts';
import { CollectionConfig, DatabaseConfig, ValidSchema } from './types.ts';

export class Database {
	/**
	 * Deno.KV storage
	 */
	protected kv?: Deno.Kv;

	/**
	 * Cached collections
	 */
	protected collections: Map<string, Collection<any>> = new Map();

	/**
	 * Database config
	 */
	protected readonly config: DatabaseConfig = {
		kv: undefined,
		path: undefined,
	};

	/**
	 * Create database instance to store documents.
	 * @param config Database configuration or path to the database file.
	 */
	constructor(path?: string);
	constructor(config?: Partial<DatabaseConfig>);
	constructor(config?: Partial<DatabaseConfig> | string) {
		if (typeof config === 'string') this.config = { ...this.config, path: config };
		if (typeof config === 'object') this.config = { ...this.config, ...config };
		if (this.config.kv) this.kv = this.config.kv;
	}

	/**
	 * Open database
	 */
	public async open() {
		if (this.kv) return;
		this.kv = await Deno.openKv(this.config.path);
	}

	/**
	 * Initiate database collection
	 * @param config Collection configuration.
	 */
	public collection<Schema extends ValidSchema<Schema> = Document>(config: CollectionConfig<Schema> | string): Collection<Schema> {
		if (typeof config === 'string') config = { name: config };

		// Return collection from cache
		if (this.collections.has(config.name)) {
			return this.collections.get(config.name) as Collection<Schema>;
		}

		const collection = new Collection(this, config);
		this.collections.set(config.name, collection);

		return collection as Collection<Schema>;
	}

	/**
	 * Export database content.
	 */
	public async dump() {
		const kv = await this.getKv();
		const iterator = kv.list({ prefix: [] });

		const data: Record<string, Document[]> = {};

		for await (const entity of iterator) {
			const collectionName = entity.key[0];
			const indexedKey = entity.key[1];

			// Skip indices and invalid entity keys
			if (typeof collectionName !== 'string' || typeof indexedKey !== 'string') continue;
			if (indexedKey !== '_id') continue;

			if (!data[collectionName]) data[collectionName] = [];
			data[collectionName].push(entity.value as Document);
		}

		return data;
	}

	/**
	 * Delete all database content.
	 * @param raw If true, instead of deleting each document individually, all entities in the KV store will be deleted.
	 */
	public async drop(raw = false) {
		const kv = await this.getKv();
		const iterator = kv.list({ prefix: [] }, { batchSize: 500 });

		// Drop raw data
		if (raw) {
			for await (const entity of iterator) await kv.delete(entity.key);
			return;
		}

		for await (const entity of iterator) {
			const collectionName = entity.key[0] as string;
			const documentId = (entity.value as Document)._id;
			await this.collection(collectionName).deleteOne({ _id: documentId });
		}
	}

	/**
	 * Close database.
	 */
	public close() {
		if (this.kv) this.kv.close();
		this.kv = undefined;
	}

	/**
	 * Get Deno.Kv instance. If database is not opened, new Kv instance will be created.
	 */
	public async getKv() {
		if (!this.kv) await this.open();
		return this.kv as Deno.Kv;
	}
}
