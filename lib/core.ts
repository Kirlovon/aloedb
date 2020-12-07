import { Document, DocumentValue, Query, QueryFunction, QueryValue, Update, UpdateFunction, UpdateValue } from './types.ts';

import {
	cleanArray,
	deepClone,
	deepCompare,
	isArray,
	isBoolean,
	isFunction,
	isNull,
	isNumber,
	isObject,
	isObjectEmpty,
	isRegExp,
	isString,
	isUndefined,
	numbersList,
	prepareObject,
} from './utils.ts';

/**
 * Find documents positions.
 * @param query Documents selection criteria.
 * @param documents Array of documents to search.
 * @returns Found positions.
 */
export function searchDocuments<Schema extends Document>(query: Query<Schema> | QueryFunction<Schema> | undefined, documents: Schema[]): number[] {
	let found: number[] = [];
	let firstSearch: boolean = true;

	if (isFunction(query)) {
		for (let i = 0; i < documents.length; i++) {
			const document: Schema = documents[i];
			const isMatched: boolean = query(document);
			if (isMatched) found.push(i);
		}

		return found;
	}

	if (documents.length === 0) return [];
	if (isUndefined(query) || isObjectEmpty(query)) return numbersList(documents.length);

	for (const key in query) {
		const queryValue: QueryValue = query[key] as QueryValue;

		if (firstSearch) {
			firstSearch = false;

			for (let i = 0; i < documents.length; i++) {
				const document: Schema = documents[i];
				const documentValue: DocumentValue = document[key];
				const isMatched: boolean = matchValues(queryValue, documentValue);
				if (isMatched) found.push(i);
			}

			if (found.length === 0) return [];
			continue;
		}

		for (let i = 0; i < found.length; i++) {
			if (isUndefined(found[i])) continue;
			const position: number = found[i];
			const document: Schema = documents[position];
			const documentValue: DocumentValue = document[key];
			const isMatched: boolean = matchValues(queryValue, documentValue);
			if (isMatched) continue;
			delete found[i];
		}
	}

	return cleanArray(found);
}

/**
 * Create new document applying modifications to specified document.
 * @param document Document to update.
 * @param update The modifications to apply.
 * @returns New document with applyed updates.
 */
export function updateDocument<Schema extends Document>(document: Schema, update: Update<Schema> | UpdateFunction<Schema>): Schema {
	const documentClone: Schema = deepClone(document);

	if (isFunction(update)) {
		const newDocument: Schema = update(documentClone);
		if (!isObject(newDocument)) throw new TypeError('Document must be an object');

		prepareObject(newDocument);
		return newDocument;
	}

	for (const key in update) {
		const value: UpdateValue = update[key] as UpdateValue;
		const result: DocumentValue = isFunction(value) ? value(documentClone[key]) : (value as DocumentValue);

		documentClone[key] = result as Schema[Extract<keyof Schema, string>];
	}

	prepareObject(documentClone);
	return documentClone;
}

/**
 * Compares the value from the query and from the document.
 * @param queryValue Value from query.
 * @param documentValue Value from document.
 * @returns Are the values equal.
 */
export function matchValues(queryValue: QueryValue, documentValue: DocumentValue): boolean {
	if (isString(queryValue) || isNumber(queryValue) || isBoolean(queryValue) || isNull(queryValue)) {
		return queryValue === documentValue;
	}

	if (isFunction(queryValue)) {
		return queryValue(documentValue) ? true : false;
	}

	if (isRegExp(queryValue)) {
		return isString(documentValue) && queryValue.test(documentValue);
	}

	if (isArray(queryValue) || isObject(queryValue)) {
		return deepCompare(queryValue, documentValue);
	}

	if (isUndefined(queryValue)) {
		return isUndefined(documentValue);
	}

	return false;
}
