// Copyright 2020-2023 the AloeDB authors. All rights reserved. MIT license.

/**
 * Database initialization config.
 */
export interface DatabaseConfig {
	/** Path to the database file. If undefined, data will be stored only in-memory. _(Default: undefined)_ */
	path?: string;

	/** Save data in easy-to-read format. _(Default: true)_ */
	pretty: boolean;

	/** Automatically load the file synchronously when initializing the database. _(Default: true)_ */
	autoload: boolean;

	/**
	 * Automatically save data to the file after inserting, updating and deleting documents.
	 * If set to false with `path` specified, data will be read from the file, but new data will not be written.
	 */
	autosave: boolean;

	/** Automatically deeply clone all returned objects. _(Default: true)_ */
	immutable: boolean;

	/**
	 * Optimize writing using batching. If enabled, the data will be written many times faster in case of a large number of operations.
	 * Disable it if you want the methods to be considered executed only when the data writteing is finished. _(Default: true)_
	 */
	batching: boolean;

	sanitize: boolean;

	/**
	 * Prevent throwing an error when writing data.
	 * If enabled, the error text will be written to the console instead of throwing it.
	 */
	foolproof: boolean;

	/**
	 * Runtime documents validation function.
	 * If the document does not pass the validation, just throw the error.
	 * Works well with [Superstruct](https://github.com/ianstormtaylor/superstruct)!
	 */
	validator?: (document: any) => void;
}

/**
 * Options for database methods.
 */
export interface Options {
	/** Sorting documents by field value. */
	sort: SortQuery;

	/** Skipping N-th number of documents. */
	skip: number;

	/** Limit the maximum number of documents. */
	limit: number;

	/** Automatically deeply clone all returned objects. */
	immutable: boolean;
}

/** Checking the object for storage suitability. */
export type Acceptable<T extends Document> = {
	[K in keyof T]: T[K] & DocumentValue;
};

/** Any document-like object. */
export type Document = { [key: string]: DocumentValue };

/** Array of document values. */
export type DocumentArray = DocumentValue[];

/** Supported documents values. */
export type DocumentValue = DocumentPrimitive | Document | DocumentArray;

/** Supported primitives. */
export type DocumentPrimitive = string | number | boolean | null;

/** Documents selection criteria. */
export type Query<T extends Document = Document> = {
	[K in keyof T]?: QueryValue<T[K]>;
};

/** Possible search query values. */
export type QueryValue<T extends DocumentValue = DocumentValue> =
	| DocumentValue
	| ((value: Readonly<T>) => boolean)
	| RegExp
	| undefined;

/** Manual вocuments selection function. */
export type QueryFunction<T extends Document = Document> = (
	document: Readonly<T>,
) => boolean;

/** The modifications to apply. */
export type Update<T extends Document = Document> = {
	[K in keyof T]?: UpdateValue<T[K]>;
};

/** Possible update values. */
export type UpdateValue<T extends DocumentValue = DocumentValue> =
	| T
	| ((value: T, field: string, document: Document) => T)
	| undefined;

/** Manual modifications applying. */
export type UpdateFunction<T extends Document = Document> = (
	document: T,
) => T | null;

/** Documents sort query. */
export type SortQuery = { [key: string]: 'asc' | 'desc' | 1 | 0 };

/** Projection query. */
export type Projection<T extends Document> = Partial<
	{
		[K in keyof T]: boolean;
	}
>;
