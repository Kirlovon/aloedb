import { isArray, isObject, isUndefined } from './types.ts';
import { UnknownObject, Document } from './declarations.ts';

/**
 * Remove all empty items from the array.
 * @param target Array to clean.
 * @returns Clean array.
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
export function deepCompare(targetA: any, targetB: any): boolean {
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
		const nextPart = parts[i+1];

		if (isArray(nested)) {
			if (isNaN(nextPart as any)) property[part] = {};
		} else {
			if (!isArray(nested) && !isObject(nested)) {
				property[part] = {};
			}
		}

		property = property[part];
	}

	const lastPart = parts[length];
	property[lastPart] = value;
}
