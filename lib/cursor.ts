import { Search } from './search.ts';
import { Document, SearchQuery, CursorMethods, DatabaseConfig, Acceptable } from './declarations.ts';

// TODO: Finish
export class Cursor<Schema extends Acceptable<Schema> = Document> {

	/** Methods to execute. */
	private methods: CursorMethods[] = []; // TODO: Rename to stack

	/** Documents storage. */
	private readonly documents: Schema[] = [];

	/** Main search query. */
	private readonly query: SearchQuery<Schema>;

	/** Database configuration. */
	private readonly config: DatabaseConfig;

	constructor(query: SearchQuery<Schema>, documents: Schema[], config: DatabaseConfig) {
		this.query = query;
		this.config = config;
		this.documents = documents;
	}

	public async getOne(): Promise<Schema | null> {
		const found: number[] = this.execute();
		if (found.length === 0) return null;

		const position: number = found[0];
		const document: Schema = this.documents[position];

		return document;
	}

	public async getMany(): Promise<Schema[]> {
		const found: number[] = this.execute();
		if (found.length === 0) return [];

		const documents: Schema[] = found.map(position => this.documents[position]);
		return documents;
	}

	public async count(): Promise<number> {
		const found: number[] = this.execute();
		return found.length;
	}

	public limit(number: number): this {
		this.methods.push({ type: 'limit', query: number });
		return this;
	}

	public skip(number: number): this {
		this.methods.push({ type: 'skip', query: number });
		return this;
	}

	public reverse(): this {
		this.methods.push({ type: 'reverse' });
		return this;
	}

	private reverse_execute(): void {

	}

	public sort(query: any): this {
		this.methods.push({ type: 'sort', query });
		return this;
	}

	public filter(query: any): this {
		this.methods.push({ type: 'filter', query });
		return this;
	}

	private filter_execute(): void {
		
	}

	private execute(): number[] {
		const { query, methods, documents } = this;

		let found: number[] = Search<Schema>(query, documents);

		for (let i = 0; i < methods.length; i++) {
			const method: CursorMethods = methods[i];
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
