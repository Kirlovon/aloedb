// Copyright 2020-2023 the AloeDB authors. All rights reserved. MIT license.

import { Cursor, CursorMethod } from './cursor.ts';

import { Document, DocumentValue, Options, Projection, Query, QueryFunction, QueryValue, Update, UpdateFunction } from './types.ts';

import { cleanArray, deepClone, deepCompare, isArray, isFunction, isObject, isObjectEmpty, isPrimitive, isRegExp, isString, isUndefined, numbersList } from './utils.ts';

/**
 * Find one document.
 * @param query Document selection criteria.
 * @param documents Array of documents to search.
 * @returns Found document index.
 */
export function findOneDocument<T extends Document>(
	query: Query<T> | QueryFunction<T> | undefined,
	documents: T[],
): number | null {
	if (isFunction(query)) {
		for (let i = 0; i < documents.length; i++) {
			const document = documents[i];
			const isMatched = query(document);
			if (isMatched) return i;
		}

		return null;
	}

	if (isUndefined(query) || isObjectEmpty(query)) {
		return documents.length > 0 ? 0 : null;
	}

	for (let i = 0; i < documents.length; i++) {
		const document = documents[i];
		let suitable = true;

		for (const key in query) {
			const documentValue = document[key];
			const queryValue = query[key];
			const isMatched = matchValues(
				queryValue as QueryValue,
				documentValue,
			);
			if (isMatched) continue;

			suitable = false;
			break;
		}

		if (suitable) return i;
	}

	return null;
}

/**
 * Find multiple documents.
 * @param query Documents selection criteria.
 * @param documents Array of documents to search.
 * @returns Found documents indexes.
 */
export function findMultipleDocuments<T extends Document>(
	query: Query<T> | QueryFunction<T> | undefined,
	documents: T[],
): number[] {
	let found = [];
	let firstSearch = true;

	if (isFunction(query)) {
		for (let i = 0; i < documents.length; i++) {
			const document = documents[i];
			const isMatched = query(document);
			if (isMatched) found.push(i);
		}

		return found;
	}

	if (isUndefined(query) || isObjectEmpty(query)) {
		return numbersList(documents.length - 1);
	}

	for (const key in query) {
		const queryValue = query[key];

		if (firstSearch) {
			firstSearch = false;

			for (let i = 0; i < documents.length; i++) {
				const document = documents[i];
				const documentValue = document[key];
				const isMatched = matchValues(
					queryValue as QueryValue,
					documentValue,
				);
				if (isMatched) found.push(i);
			}

			if (found.length === 0) return [];
			continue;
		}

		for (let i = 0; i < found.length; i++) {
			if (isUndefined(found[i])) continue;
			const position = found[i];
			const document = documents[position];
			const documentValue = document[key];
			const isMatched = matchValues(
				queryValue as QueryValue,
				documentValue,
			);
			if (isMatched) continue;
			delete found[i];
		}
	}

	return cleanArray(found);
}

/**
 * Create new document with applied modifications.
 * @param document Document to update.
 * @param update The modifications to apply.
 * @returns New document with applied updates or null if document should be deleted.
 */
export function updateDocument<T extends Document>(
	document: T,
	update: Update<T> | UpdateFunction<T>,
): T {
	let newDocument: T | null = deepClone(document);

	if (isFunction(update)) {
		newDocument = update(newDocument);
		if (!newDocument) return {} as T;
		if (!isObject(newDocument)) {
			throw new TypeError('Document must be an object');
		}
	} else {
		for (const key in update) {
			const value = update[key];

			newDocument[key] = isFunction(value) ? value(newDocument[key], key, newDocument) : (value as T[Extract<keyof T, string>]);
		}
	}

	return deepClone(newDocument);
}

/**
 * Compares the value from the query and from the document.
 * @param queryValue Value from query.
 * @param documentValue Value from document.
 * @returns Are the values equal.
 */
export function matchValues(
	queryValue: QueryValue,
	documentValue: DocumentValue,
): boolean {
	if (isFunction(queryValue)) return queryValue(documentValue) ? true : false;

	if (isRegExp(queryValue)) return isString(documentValue) && queryValue.test(documentValue);

	if (isArray(queryValue) || isObject(queryValue)) return deepCompare(queryValue, documentValue);

	if (isUndefined(queryValue)) return isUndefined(documentValue);

	return queryValue === documentValue;
}

/**
 * Execute database options.
 * @param documents Documents to process.
 * @param options Options to execute.
 * @returns Document with applied options.
 */
export function executeOptions<T extends Document>(
	documents: T[],
	options: Options,
): Partial<T[]> {
	for (const key in options) {
		if (key === 'sort' || key === 'limit' || key === 'skip') {
			const method = {
				type: key,
				parameter: options[key],
			} as CursorMethod;
			documents = Cursor.executeMethod(documents, method);
		}
	}

	return documents;
}

/**
 * Determine which document fields are returned.
 * @param document Document to project.
 * @param projection Projection query.
 * @returns Document with applied projection query.
 */
export function executeProjection<T extends Document>(
	document: T,
	projection: Projection<T>,
): Partial<T> {
	const projected: Partial<T> = {};

	for (const key in projection) {
		if (projection[key]) projected[key] = document[key];
	}

	return projected;
}

/**
 * Deserialize database storage file.
 * @param content Content of the file.
 * @returns Array of documents.
 */
export function deserializeStorage(content: string): Document[] {
	const trimmed = content.trim();
	if (trimmed === '') return [];

	const documents = JSON.parse(trimmed);
	if (!isArray(documents)) {
		throw new TypeError('Database storage should be an array of objects');
	}

	for (let i = 0; i < documents.length; i++) {
		const document = documents[i];
		if (!isObject(document)) {
			throw new TypeError('Database storage should contain only objects');
		}
		if (isObjectEmpty(document)) delete documents[i];
	}

	return cleanArray(documents);
}
