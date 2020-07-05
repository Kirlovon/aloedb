import { SearchQuery, Document, CursorMethods } from './declarations.ts';

class Cursor<Schema extends Document> {
	/** Found documents */
	private found: Schema[] = [];

	/** Main search query. */
	private query: SearchQuery<Schema> = {};

	/** Methods to execute. */
	private methods: CursorMethods[] = [];

	constructor(query: SearchQuery<Schema>) {}

	public async getOne(): Promise<Schema | null> {
		await this.execute();
		return this.found.length > 0 ? this.found[0] : null;
	}

	public async getMany(): Promise<Schema[]> {
		await this.execute();
		return this.found;
	}

	public async map(): Promise<any> {
		await this.execute();
		return this.found;
	}

	public async count(): Promise<number> {
		await this.execute();
		return this.found.length;
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
		for (const key in query) {
			this.found = [];
		}

		// If nothing found
		if (this.found.length === 0) return;
	}
}

export default Cursor;
