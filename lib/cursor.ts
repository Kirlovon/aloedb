import Search from './search.ts';
import { SearchQuery, Document, CursorMethod, DatabaseConfig } from './declarations.ts';

// TODO
class Cursor<Schema extends Document = Document> {
	
	/** Main search query. */
	private query: SearchQuery = {};

	/** Database configuration. */
	private config: DatabaseConfig;

	/** Documents storage. */
	private documents: Document[] = [];

	/** Methods to execute. */
	private methods: CursorMethod[] = [];

	constructor(query: SearchQuery, documents: Document[], config: DatabaseConfig) {
		this.query = query;
		this.config = config;
		this.documents = [...documents];
	}

	public async getOne(): Promise<Document | null> {
		const found = await this.execute();
		return found.length > 0 ? found[0] : null;
	}

	public async getMany(): Promise<Document[]> {
		const found = await this.execute();
		return found;
	}

	public async count(): Promise<number> {
		const found = await this.execute();
		return found.length;
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
		this.methods.push({ type: 'reverse' });
		return this;
	}

	public sort(query: any): this {
		this.methods.push({ type: 'sort', query });
		return this;
	}

	public filter(query: any): this {
		this.methods.push({ type: 'filter', query });
		return this;
	}

	private async execute(): Promise<Document[]> {
		const { query, methods, documents } = this;

		let found: Document[] = Search.documents(query, documents);

		for (let i = 0; i < methods.length; i++) {
			const method: CursorMethod = methods[i];
			const type = method.type;

			if (type === 'reverse') {
				found.reverse();
			} else if (type === 'limit') {
				// found.slice(method.number)
			}
			
		}

		return found;
	}
}

export default Cursor;
