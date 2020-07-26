import DatabaseError from './error.ts';
import { Acceptable, UnknownObject, DocumentValue, SearchQueryValue, UpdateQuery } from './declarations.ts';
import { isFunction, isArray, isObject, isString, isNumber, isRegExp, isBoolean, isNull, isUndefined } from './types.ts';

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
 * Get number of keys in object.
 * @param target An object for key counting.
 * @returns Number of keys.
 */
export function getObjectLength(target: UnknownObject): number {
	let length = 0;
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
 * Get nested value from object using dot notation.
 * @param query Path to the value.
 * @param object Object to get value from.
 * @return Found value.
 */
export function getNestedValue(query: string, object: UnknownObject): any {
	if (!query.includes('.')) return object[query];

	const parts = query.split('.');
	const length = parts.length;
	let property = object;

	for (let i = 0; i < length; i++) {
		const part = parts[i];
		const nested = property[part];

		if (isArray(nested) || isObject(nested)) {
			property = nested;
		} else {
			return i === length - 1 ? nested : undefined;
		}
	}

	return property;
}

/**
 * Set property of nested object .
 * @param query Path to the value.
 * @param value Value to set.
 * @param object Object to set value in.
 */
export function setNestedValue(query: string, value: any, object: UnknownObject): void {
	if (!query.includes('.')) {
		object[query] = value;
		return;
	}

	const parts = query.split('.');
	const length = parts.length - 1;
	let property = object;

	for (let i = 0; i < length; i++) {
		const part = parts[i];
		const nested = property[part];
		const nextPart = parts[i + 1] as any;

		if (isArray(nested)) {
			if (!isUndefined(nextPart) && isNaN(nextPart)) property[part] = {};
		} else {
			if (!isObject(nested)) property[part] = {};
		}

		property = property[part];
	}

	const lastPart = parts[length];
	property[lastPart] = value;
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
 * Update document.
 * @param query Update query.
 * @param document Document to update.
 */
export function updateDocument<T extends Acceptable<T>>(query: UpdateQuery<T>, document: T): void {
	if (isFunction(query)) return query(document);

	for (const key in query) {
		const queryValue: DocumentValue = deepClone(query[key]);
		setNestedValue(key, queryValue, document);
	}
}

/**
 * Prepare object for database storage.
 * @param target Object to prepare.
 */
export function prepareObject(target: UnknownObject): void {
	for (const key in target) {
		const value = target[key];

		if (key.includes('.')) {
			throw new DatabaseError('Fields in documents cannot contain a "." character');
		}

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
