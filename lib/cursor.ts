import { Search } from './search.ts';
import { SearchQuery, CursorMethod, DatabaseConfig, Acceptable } from './declarations.ts';

// TODO
export class Cursor<Schema extends Acceptable<Schema>> {
	/** Main search query. */
	private query: SearchQuery<Schema>;

	/** Database configuration. */
	private config: DatabaseConfig;

	/** Documents storage. */
	private documents: Schema[] = [];

	/** Methods to execute. */
	private methods: CursorMethod[] = [];

	constructor(query: SearchQuery<Schema>, documents: Schema[], config: DatabaseConfig) {
		this.query = query;
		this.config = config;
		this.documents = [...documents];
	}

	public async getOne(): Promise<Schema | null> {
		const found = await this.execute();
		return found.length > 0 ? found[0] : null;
	}

	public async getMany(): Promise<Schema[]> {
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

	private async execute(): Promise<Schema[]> {
		const { query, methods, documents } = this;

		let found: any[] = Search<Schema>(query, documents);

		for (let i = 0; i < methods.length; i++) {
			const method: CursorMethod = methods[i];
			const type: string = method.type;

			if (type === 'reverse') {
				found.reverse();
			} else if (type === 'limit') {
				// found.slice(method.number)
			}
		}

		return found;
	}
}
