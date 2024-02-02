// Copyright 2020-2023 the AloeDB authors. All rights reserved. MIT license.

import { Document, DocumentPrimitive, SortQuery } from './types.ts';

/** Any object without specified structure. */
interface PlainObject {
	[key: string]: unknown;
}

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
	const array = [];
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
	let length = 0;
	for (let key in target) length++;
	return length;
}

/**
 * Get filename from the path.
 * @param path Path to the file.
 * @returns Filename from the path.
 */
export function getPathFilename(path: string): string {
	const parsed = path.replace(/(\\+)|(\/+)/g, '/').split('/');
	const filename = parsed.pop();

	return filename ? filename.trim() : '';
}

/**
 * Get dirname from the path.
 * @param path Path to the file.
 * @returns Dirname from the path.
 */
export function getPathDirname(path: string): string {
	const parsed = path.replace(/(\\+)|(\/+)/g, '/').split('/');
	const dirname = parsed
		.map((value) => value.trim())
		.slice(0, -1)
		.join('/');

	return dirname ? dirname : '';
}

/**
 * Deep clone for objects and arrays. Can also be used for primitives.
 * @param target Target to clone.
 * @return Clone of the target.
 */
export function deepClone<T>(target: T): T {
	if (isPrimitive(target)) return target;

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
 * Prepare object for JSON storage. Simmilar to `JSON.parse(JSON.stringify(target))`, but does not create a deep copy.
 * @param target Object to sanitize.
 */
export function sanitizeObject(target: PlainObject): void {
	for (const key in target) {
		const value: unknown = target[key];

		if (isPrimitive(value)) {
			continue;
		}

		if (isArray(value)) {
			sanitizeArray(value);
			continue;
		}

		if (isObject(value)) {
			sanitizeObject(value);
			continue;
		}

		delete target[key];
	}
}

/**
 * Prepare array for JSON storage. Simmilar to `JSON.parse(JSON.stringify(target))`, but does not create a deep copy.
 * @param target Array to sanitize.
 */
export function sanitizeArray(target: unknown[]): void {
	for (let i = 0; i < target.length; i++) {
		const value: unknown = target[i];

		if (isPrimitive(value)) {
			continue;
		}

		if (isArray(value)) {
			sanitizeArray(value);
			continue;
		}

		if (isObject(value)) {
			sanitizeObject(value);
			continue;
		}

		target[i] = null;
	}
}

/**
 * Sorting an array of documents by multiple fields.
 * @param array Documents array to sort.
 * @param query Sorting query.
 * @returns Sorted array.
 */
export function sortDocuments<T extends Document>(
	array: T[],
	query: SortQuery,
): T[] {
	const fields = Object.keys(query);

	array.sort((a, b) => {
		let index = 0;
		let result = 0;

		while (result === 0 && index < fields.length) {
			const field = fields[index] as keyof T;
			const order = query[field as string] === 'desc' ? -1 : 1;

			if (a[field] < b[field]) result = -1 * order;
			if (a[field] > b[field]) result = 1 * order;

			index++;
		}

		return result;
	});

	return array;
}

/**
 * Checks whether the value is a primitive.
 * @param target Target to check.
 * @returns Result of checking.
 */
export function isPrimitive(target: unknown): target is DocumentPrimitive {
	const type = typeof target;
	return (
		type === 'string' ||
		type === 'number' ||
		type === 'boolean' ||
		target === null
	);
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
