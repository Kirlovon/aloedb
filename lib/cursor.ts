import Search from './search.ts';
import { SearchQuery, Document, CursorMethods, DatabaseConfig } from './declarations.ts';

// TODO
class Cursor<Schema extends Document = Document> {
	
	/** Main search query. */
	private query: SearchQuery = {};
	
	/** Valid documents */
	private documents: Document[] = [];

	/** Methods to execute. */
	private methods: CursorMethods[] = [];

	/** Database configuration. */
	private config: DatabaseConfig;

	constructor(query: SearchQuery, documents: Document[], config: DatabaseConfig) {
		this.query = query;
		this.config = config;
		this.documents = [...documents];
	}

	public async getOne(): Promise<Document | null> {
		await this.execute();
		return this.documents.length > 0 ? this.documents[0] : null;
	}

	public async getMany(): Promise<Document[]> {
		await this.execute();
		return this.documents;
	}

	public async count(): Promise<number> {
		await this.execute();
		return this.documents.length;
	}

	public limit(number: number): this {
		this.methods.push({ type: 'limit', number });
		return this;
	}

	public skip(number: number): this {
		this.methods.push({ type: 'skip', number });
		return this;
	}

	public reverse(): this {
		return this;
	}

	public sort(query: any): this {
		return this;
	}

	public filter(query: any): this {
		return this;
	}

	private async execute(): Promise<void> {
		const { query, methods } = this;

		// Search
		const found = Search.documents(query, this.documents);


		// If nothing found
		if (this.documents.length === 0) return;
	}
}

export default Cursor;
