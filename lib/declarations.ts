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
	 * Manual document validation function.
	 * If the document does not pass the validation, just throw the error.
	 * Works well with [Superstruct](https://github.com/ianstormtaylor/superstruct)!
	 */
	schemaValidator?: SchemaValidator;
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
 * Any document-like object.
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
 *
 */
export type Acceptable<T> = { [K in keyof T]: T[K] & DocumentValue };

/**
 * Search query.
 */
export type SearchQuery<T> = { [K in keyof T]?: T[K] | SearchFunction | RegExp } & { [key: string]: DocumentValue | SearchFunction | RegExp };

/**
 * Update query.
 */
export type UpdateQuery<T> = ({ [K in keyof T]?: T[K] & DocumentValue } & { [key: string]: DocumentValue }) | ((document: T) => void);

/**
 * Sorting function.
 */
export type SortFunction = (a: Readonly<DocumentValue>, b: Readonly<DocumentValue>) => number;

/**
 * Search function for search queries.
 */
export type SearchFunction = (DocumentValue: DocumentValue) => boolean;

/**
 * Manual schema validation.
 */
export type SchemaValidator = (document: Readonly<Document>) => void;

/**
 * Supported primitives.
 */
export type DocumentPrimitive = string | number | boolean | null;

/**
 * Supported documents DocumentValues.
 */
export type DocumentValue = DocumentPrimitive | DocumentPrimitive[] | Document | Document[] | undefined;

/**
 * Search query value.
 */
export type SearchQueryValue = DocumentValue | SearchFunction | RegExp | undefined;

/**
 * Cursor methods.
 */
export type CursorMethod =
	| { type: 'limit'; number: number }
	| { type: 'skip'; number: number }
	| { type: 'sort'; query: number }
	| { type: 'filter'; query: number }
	| { type: 'reverse' };
