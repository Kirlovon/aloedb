import { isFunction, isArray, isObject, isString, isNumber, isRegExp, isBoolean, isNull, isUndefined } from './types.ts';
import { Acceptable, Document, UnknownObject, DocumentValue, SearchQueryValue, UpdateQuery, UpdateQueryValue } from './declarations.ts';

/**
 * Remove all empty items from the array.
 * @param target Array to clean.
 * @returns Cleaned array.
 */
export function cleanArray<T extends any[]>(target: T): T {
	return target.filter(() => true) as T;
}

/**
 * Checks if the object is empty.
 * @param target Object to check.
 * @returns Is object empty or not.
 */
export function isObjectEmpty(target: UnknownObject): boolean {
	for (let key in target) return false;
	return true;
}

/**
 * Generate array of numbers from 0 to Nth.
 * @param number Nth value.
 * @returns Generated array.
 */
export function numbersList(number: number): number[] {
	const array: number[] = [];
	for (let i = -1; i < number; i++) array.push(i);
	return array;
}

/**
 * Get number of keys in object.
 * @param target An object for key counting.
 * @returns Number of keys.
 */
export function getObjectLength(target: UnknownObject): number {
	let length: number = 0;
	for (let key in target) length++;
	return length;
}

/**
 * Deep clone for objects and arrays.
 * @param target Target to clone.
 * @return Clone of the target.
 */
export function deepClone<T>(target: T): T {
	if (target === null) return target;

	if (isArray(target)) {
		const clone: any = [];

		for (let i = 0; i < target.length; i++) {
			clone[i] = deepClone(target[i]);
		}

		return clone;
	}

	if (isObject(target)) {
		const clone: any = {};

		for (const key in target) {
			clone[key] = deepClone(target[key]);
		}

		return clone;
	}

	return target;
}

/**
 * Deep targets comparison.
 * @param targetA First target for comparison.
 * @param targetB Second target for comparison.
 * @returns Targets equal or not.
 */
export function deepCompare(targetA: unknown, targetB: unknown): boolean {
	if (targetA === null) return targetB === null;

	if (isArray(targetA) && isArray(targetB)) {
		if (targetA.length !== targetB.length) return false;

		for (let i = 0; i < targetA.length; i++) {
			if (!deepCompare(targetA[i], targetB[i])) return false;
		}

		return true;
	}

	if (isObject(targetA) && isObject(targetB)) {
		if (getObjectLength(targetA) !== getObjectLength(targetB)) return false;

		for (const key in targetA) {
			if (!deepCompare(targetA[key], targetB[key])) return false;
		}

		return true;
	}

	return targetA === targetB;
}

/**
 * Compares the value from the query and from the document.
 * @param queryValue Value from query.
 * @param documentValue Value from document.
 * @returns Are the values equal.
 */
export function matchValues(queryValue: SearchQueryValue, documentValue: DocumentValue): boolean {
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

/**
 * Update object.
 * @param query Update query.
 * @param document Document to update.
 */
export function updateObject(query: UnknownObject, document: Document): Document {
	if (isFunction(query)) return query(document);

	for (const key in query) {
		const value: UpdateQueryValue = query[key] as UpdateQueryValue;
		document[key] = isFunction(value) ? value(document[key]) : value as DocumentValue;
	}

	return document;
}

/**
 * Prepare object for database storage.
 * @param target Object to prepare.
 */
export function prepareObject(target: UnknownObject): void {
	for (const key in target) {
		const value = target[key];

		if (isArray(value)) {
			prepareArray(value);
			continue;
		}

		if (isObject(value)) {
			prepareObject(value);
			continue;
		}

		if (isUndefined(value)) {
			delete target[key];
			continue;
		}

		if (!isString(value) && !isNumber(value) && !isBoolean(value) && !isNull(value)) {
			throw new TypeError('Document can only contain Strings, Numbers, Booleans, Nulls, Arrays and Objects');
		}
	}
}

/**
 * Prepare array for database storage.
 * @param target Array to prepare.
 */
export function prepareArray(target: any[]): void {
	for (let i = 0; i < target.length; i++) {
		const value = target[i];

		if (isArray(value)) {
			prepareArray(value);
			continue;
		}

		if (isObject(value)) {
			prepareObject(value);
			continue;
		}

		if (isUndefined(value)) {
			target[i] = null;
			continue;
		}

		if (!isString(value) && !isNumber(value) && !isBoolean(value) && !isNull(value)) {
			throw new TypeError('Document can only contain Strings, Numbers, Booleans, Nulls, Arrays and Objects');
		}
	}
}
