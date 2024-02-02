// Copyright 2020-2023 the AloeDB authors. All rights reserved. MIT license.

import { Query } from './query.ts';
import { isObjectLiteral } from './utils.ts';
import { DocumentPrimitive, DocumentValue, SearchQueryValue } from './types.ts';

/**
 * Selects documents where the value of a field more than specified number.
 * @param value Comparison number.
 */
export function moreThan(value: number) {
	return (target: DocumentValue) => typeof target === 'number' && target > value;
}

/**
 * Selects documents where the value of a field more than or equal to the specified number.
 * @param value Comparison number.
 */
export function moreThanOrEqual(value: number) {
	return (target: DocumentValue) => typeof target === 'number' && target >= value;
}

/**
 * Selects documents where the value of a field less than specified number.
 * @param value Comparison number.
 */
export function lessThan(value: number) {
	return (target: DocumentValue) => typeof target === 'number' && target < value;
}

/**
 * Selects documents where the value of a field less than or equal to the specified number.
 * @param value Comparison number.
 */
export function lessThanOrEqual(value: number) {
	return (target: DocumentValue) => typeof target === 'number' && target <= value;
}

/**
 * Matches if number is between specified range values.
 * @param min Range start.
 * @param max Range end.
 */
export function between(min: number, max: number) {
	return (target: DocumentValue) => typeof target === 'number' && target > min && target < max;
}

/**
 * Matches if number is between or equal to the specified range values.
 * @param min Range start.
 * @param max Range end.
 */
export function betweenOrEqual(min: number, max: number) {
	return (target: DocumentValue) => typeof target === 'number' && target >= min && target <= max;
}

/**
 * Matches if field exists.
 */
export function exists() {
	return (target?: DocumentValue) => typeof target !== 'undefined';
}

/**
 * Matches if value type equal to specified type.
 * @param type Type of the value.
 */
export function type(
	type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'undefined' | 'bigint' | 'Uint8Array' | 'Map' | 'Set' | 'Date' | 'RegExp',
) {
	return (target: DocumentValue) => {
		switch (type) {
			case 'string':
				return typeof target === 'string';
			case 'number':
				return typeof target === 'number';
			case 'boolean':
				return typeof target === 'boolean';
			case 'null':
				return target === 'null';
			case 'undefined':
				return target === 'undefined';
			case 'bigint':
				return target === 'bigint';
			case 'array':
				return Array.isArray(target);
			case 'object':
				return isObjectLiteral(target);
			case 'Uint8Array':
				return target instanceof Uint8Array;
			case 'Map':
				return target instanceof Map;
			case 'Set':
				return target instanceof Set;
			case 'Date':
				return target instanceof Date;
			case 'RegExp':
				return target instanceof RegExp;
			default:
				return false;
		}
	};
}

/**
 * Matches if array includes specified value.
 * @param value Primitive value to search in array.
 */
export function includes(value: DocumentPrimitive) {
	return (target: DocumentValue) => Array.isArray(target) && target.includes(value);
}

/**
 * Matches if array length equal to specified length.
 * @param length Length of the array.
 */
export function length(length: number) {
	return (target: DocumentValue) => Array.isArray(target) && target.length === length;
}

/**
 * Matches if at least one value in the array matches the given queries.
 * @param queries Query values.
 */
export function someElementMatch(...queries: SearchQueryValue[]) {
	return (target: DocumentValue[]) =>
		Array.isArray(target) &&
		target.some((targetValue) => queries.every((query) => Query.matchValue(query, targetValue)));
}

/**
 * Matches if all the values in the array match in the given queries.
 * @param queries Query values.
 */
export function everyElementMatch(...queries: SearchQueryValue[]) {
	return (target: DocumentValue[]) =>
		Array.isArray(target) &&
		target.every((targetValue) => queries.every((query) => Query.matchValue(query, targetValue)));
}

/**
 * Logical AND operator. Selects documents where the value of a field equals to all specified values.
 * @param queries Query values.
 */
export function and(...queries: SearchQueryValue[]) {
	return (target: DocumentValue) => queries.every((query) => Query.matchValue(query, target));
}

/**
 * Logical OR operator. Selects documents where the value of a field equals at least one specified value.
 * @param queries Query values.
 */
export function or(...queries: SearchQueryValue[]) {
	return (target: DocumentValue) => queries.some((query) => Query.matchValue(query, target));
}

/**
 * Logical NOT operator. Selects documents where the value of a field not equal to specified value.
 * @param query Query value.
 */
export function not(query: SearchQueryValue) {
	return (target: DocumentValue) => !Query.matchValue(query, target);
}
