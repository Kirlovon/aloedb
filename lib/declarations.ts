/**
 * Database initialization config
 */
export interface DatabaseConfig {
	/**
	 * Path to the database file.
	 */
	filePath?: string;

	/**
	 * Save data in easy-to-read format.
	 */
	pretty: boolean;

	/**
	 * Write data to the file without risk of loss.
	 * Instead of simply writing data to a file, the data will be written to a temporary file, which will then be renamed the main file.
	 */
	safeWrite: boolean;

	/**
	 * Do not write data to the database file.
	 * If "filePath" specified, data will be read from the file, but new data will not be written.
	 */
	onlyInMemory: boolean;

	/**
	 * Automatically clone all documents inserted or returned by the database.
	 * This slows down operations with the database a bit, but allows you to modify the returned documents.
	 */
	cloneDocuments: boolean;

	/**
	 * Resolve async operations only when the data writting finished.
	 * If enabled, there may be performance issues at high loads.
	 */
	instantWriting: boolean;

	/**
	 * Manual document validation function.
	 * If the document does not pass the validation, just throw the error.
	 * Works well with [Superstruct](https://github.com/ianstormtaylor/superstruct)!
	 */
	schemaValidator?: SchemaValidator;

	// TODO
	// documentModifier: (document: Document) => void | Promise<void>;
}

/**
 * Database file structure.
 */
export interface DatabaseFile {
	/** Timestamp of the last data writing. */
	timestamp: number;

	/** Stored documents. */
	documents: Document[];
}

/**
 * Document-like object.
 */
export interface Document {
	[key: string]: DocumentValue;
}

/**
 * Any object without specified structure.
 */
export interface UnknownObject {
	[key: string]: any;
}

/**
 * Manual schema validation.
 */
export type SchemaValidator = (document: Document) => void | Promise<void>;

/**
 * Search query.
 */
export type SearchQuery<T extends Document> = Partial<{ [K in keyof T]: T[K] | SearchFunction | RegExp }>;

/**
 * Search query value.
 */
export type SearchQueryValue = DocumentValue | SearchFunction | RegExp;

/**
 * Search function for search queries.
 */
export type SearchFunction = (value: DocumentValue) => boolean;

/**
 * Sorting function.
 */
export type SortFunction = (a: DocumentValue, b: DocumentValue) => number;

/**
 * Supported primitives.
 */
export type DocumentPrimitive = string | number | boolean | null;

/**
 * Cursor methods.
 */
export type CursorMethods =
	| { type: 'limit'; number: number }
	| { type: 'skip'; number: number }
	| { type: 'sort'; query: number }
	| { type: 'filter'; query: number }
	| { type: 'reverse' };

/**
 * Supported documents values.
 */
export type DocumentValue = DocumentPrimitive | DocumentPrimitive[] | Document | Document[] | undefined;
