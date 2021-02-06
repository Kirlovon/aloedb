import { PlainObject } from './types.ts';

/**
 * Remove all empty items from the array.
 * @param target Array to clean.
 * @returns Cleaned array.
 */
export function cleanArray<T extends unknown[]>(target: T): T {
	return target.filter(() => true) as T;
}

/**
 * Generate array of numbers from 0 to Nth.
 * @param number Nth value.
 * @returns Generated array.
 */
export function numbersList(number: number): number[] {
	const array: number[] = [];
	for (let i = 0; i <= number; i++) array.push(i);
	return array;
}

/**
 * Checks if the object is empty.
 * @param target Object to check.
 * @returns Is object empty or not.
 */
export function isObjectEmpty(target: PlainObject): boolean {
	for (let key in target) return false;
	return true;
}

/**
 * Get number of keys in object.
 * @param target An object for key counting.
 * @returns Number of keys.
 */
export function getObjectLength(target: PlainObject): number {
	let length: number = 0;
	for (let key in target) length++;
	return length;
}

/**
 * Get filename from the path.
 * @param path Path to the file.
 * @returns Filename from the path.
 */
export function getPathFilename(path: string): string {
	const parsed: string[] = path.split(/[\\\/]/);
	const filename: string | undefined = parsed.pop();

	return filename ? filename : '';
}

/**
 * Get dirname from the path.
 * @param path Path to the file.
 * @returns Dirname from the path.
 */
export function getPathDirname(path: string): string {
	let parsed: string[] = path.split(/[\\\/]/);
	parsed = parsed.map(value => value.trim());
	parsed = parsed.filter(value => value !== '');
	parsed.pop();

	const dirname: string = parsed.join('/');
	return dirname;
}

/**
 * Deep clone for objects and arrays. Can also be used for primitives.
 * @param target Target to clone.
 * @return Clone of the target.
 */
export function deepClone<T>(target: T): T {
	if (isNull(target)) return target;

	if (isArray(target)) {
		const clone: any = [];
		for (let i = 0; i < target.length; i++) clone[i] = deepClone(target[i]);
		return clone as T;
	}

	if (isObject(target)) {
		const clone: any = {};
		for (const key in target) clone[key] = deepClone(target[key]);
		return clone as T;
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
	if (isNull(targetA)) return isNull(targetB);
	if (isNull(targetB)) return isNull(targetA);

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
 * Prepare object for database storage.
 * @param target Object to prepare.
 */
export function prepareObject(target: PlainObject): void {
	for (const key in target) {
		const value: unknown = target[key];

		if (isString(value) || isNumber(value) || isBoolean(value) || isNull(value)) {
			continue;
		}

		if (isArray(value)) {
			prepareArray(value);
			continue;
		}

		if (isObject(value)) {
			prepareObject(value);
			continue;
		}

		delete target[key];
	}
}

/**
 * Prepare array for database storage.
 * @param target Array to prepare.
 */
export function prepareArray(target: unknown[]): void {
	for (let i = 0; i < target.length; i++) {
		const value: unknown = target[i];

		if (isString(value) || isNumber(value) || isBoolean(value) || isNull(value)) {
			continue;
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
			target[i] = null;
			continue;
		}

		target[i] = null;
	}
}

/**
 * Checks whether the value is a string.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isString(target: unknown): target is string {
	return typeof target === 'string';
}

/**
 * Checks whether the value is a number.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isNumber(target: unknown): target is number {
	return typeof target === 'number' && !Number.isNaN(target);
}

/**
 * Checks whether the value is a boolean.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isBoolean(target: unknown): target is boolean {
	return typeof target === 'boolean';
}

/**
 * Checks whether the value is undefined.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isUndefined(target: unknown): target is undefined {
	return typeof target === 'undefined';
}

/**
 * Checks whether the value is a null.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isNull(target: unknown): target is null {
	return target === null;
}

/**
 * Checks whether the value is a function.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isFunction(target: unknown): target is (...args: any) => any {
	return typeof target === 'function';
}

/**
 * Checks whether the value is an array.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isArray(target: unknown): target is any[] {
	return Object.prototype.toString.call(target) === '[object Array]';
}

/**
 * Checks whether the value is a object.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isObject(target: unknown): target is PlainObject {
	return Object.prototype.toString.call(target) === '[object Object]';
}

/**
 * Checks whether the value is a regular expression.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isRegExp(target: unknown): target is RegExp {
	return target instanceof RegExp;
}

/**
 * Checks whether the value is an error.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isError(target: unknown): target is Error {
	return target instanceof Error;
}
