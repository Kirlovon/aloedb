// deno-lint-ignore-file ban-types

/** Document base structure. */
export interface Base {
	_id: string;
}

/** Base document type. */
export type Document = {
	_id: string;
	[key: string]: DocumentValue;
};

/** Checking the object for storage suitability. */
export type ValidSchema<T extends Document> =
	& {
		[K in keyof T]: T[K] & DocumentValue;
	}
	& { _id: string };

/** Database initialization config. */
export interface DatabaseConfig {
	kv?: Deno.Kv;
	path?: string;
}

/** Collection initialization config. */
export interface CollectionConfig<T extends Document = Document> {
	name: string;
	validator?: (document: unknown) => void;
	indexes?: CollectionConfigIndexes<T>;
}

// TODO: Rename generics from T to TDocument, TValue etc.

/** Indexes configuration. */
export type CollectionConfigIndexes<T extends Document = Document> = (Exclude<keyof T, '_id'> & string)[];

/** Array of document values. */
export type DocumentArray = DocumentValue[];

/** Array of document values. */
export type DocumentObject = { [key: string]: DocumentValue };

/** Supported documents values. */
export type DocumentValue = DocumentPrimitive | DocumentObject | DocumentArray;

/** Supported primitives. */
export type DocumentPrimitive =
	| string
	| number
	| boolean
	| null
	| undefined
	| bigint
	| Uint8Array
	| Map<any, DocumentValue>
	| Set<DocumentValue>
	| Date
	| RegExp;

export type SearchQuery<T extends Document = Document> =
	| SearchQueryObject<T>
	| SearchQueryFunction<T>
	| undefined;

export type SearchQueryObject<T extends Document = Document> = {
	[K in keyof T]?: SearchQueryValue<T[K]>;
};

export type SearchQueryValue<T extends DocumentValue = DocumentValue> = T | ((value: T) => boolean) | RegExp | undefined;

/** Manual documents selection function */
export type SearchQueryFunction<T> = (document: T) => boolean;

export type UpdateQuery<T extends Document = Document> =
	| UpdateQueryObject<T>
	| UpdateQueryFunction<T>;

export type UpdateQueryObject<T extends Document = Document> = {
	[K in Exclude<keyof T, '_id'>]?: UpdateQueryValue<T[K]>;
};

export type UpdateQueryValue<T extends DocumentValue = DocumentValue> = T | ((value: T) => T);

export type UpdateQueryFunction<T extends Document> = (document: T) => T;

/**
 * Documents sort query.
 */
export type SortQuery<T extends Document> = { [K in keyof T]?: 'asc' | 'desc' | 1 | -1 };

/**
 * Pick key and make it optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Simplify type to improve type hints shown in editors.
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type DocumentWithoutId<T extends Document> = Simplify<PartialBy<T, '_id'>>;
