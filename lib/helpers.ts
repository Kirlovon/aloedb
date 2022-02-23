// Copyright 2020-2021 the AloeDB authors. All rights reserved. MIT license.

import { matchValues } from './core.ts';
import { DocumentValue, DocumentPrimitive, QueryValue } from './types.ts';
import { isArray, isUndefined, isString, isNumber, isBoolean, isNull, isObject } from './utils.ts';

/**
 * Selects documents where the value of a field more than specified number.
 * @param value Comparison number.
 */
export function moreThan(value: number) {
	return (target: Readonly<DocumentValue>) => isNumber(target) && target > value;
}

/**
 * Selects documents where the value of a field more than or equal to the specified number.
 * @param value Comparison number.
 */
export function moreThanOrEqual(value: number) {
	return (target: Readonly<DocumentValue>) => isNumber(target) && target >= value;
}

/**
 * Selects documents where the value of a field less than specified number.
 * @param value Comparison number.
 */
export function lessThan(value: number) {
	return (target: Readonly<DocumentValue>) => isNumber(target) && target < value;
}

/**
 * Selects documents where the value of a field less than or equal to the specified number.
 * @param value Comparison number.
 */
export function lessThanOrEqual(value: number) {
	return (target: Readonly<DocumentValue>) => isNumber(target) && target <= value;
}

/**
 * Matches if number is between specified range values.
 * @param min Range start.
 * @param max Range end.
 */
export function between(min: number, max: number) {
	return (target: Readonly<DocumentValue>) => isNumber(target) && target > min && target < max;
}

/**
 * Matches if number is between or equal to the specified range values.
 * @param min Range start.
 * @param max Range end.
 */
export function betweenOrEqual(min: number, max: number) {
	return (target: Readonly<DocumentValue>) => isNumber(target) && target >= min && target <= max;
}

/**
 * Matches if field exists.
 */
export function exists() {
	return (target?: Readonly<DocumentValue>) => !isUndefined(target);
}

/**
 * Matches if value type equal to specified type.
 * @param type Type of the value.
 */
export function type(type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object') {
	return (target: Readonly<DocumentValue>) => {
		switch (type) {
			case 'string':
				return isString(target);
			case 'number':
				return isNumber(target);
			case 'boolean':
				return isBoolean(target);
			case 'null':
				return isNull(target);
			case 'array':
				return isArray(target);
			case 'object':
				return isObject(target);
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
	return (target: Readonly<DocumentValue>) => isArray(target) && target.includes(value);
}

/**
 * Matches if array length equal to specified length.
 * @param length Length of the array.
 */
export function length(length: number) {
	return (target: Readonly<DocumentValue>) => isArray(target) && target.length === length;
}

/**
 * Matches if at least one value in the array matches the given queries.
 * @param queries Query values.
 */
export function someElementMatch(...queries: QueryValue[]) {
	return (target: Readonly<DocumentValue>) => isArray(target) && target.some(targetValue => queries.every(query => matchValues(query, targetValue)));
}

/**
 * Matches if all the values in the array match in the given queries.
 * @param queries Query values.
 */
export function everyElementMatch(...queries: QueryValue[]) {
	return (target: Readonly<DocumentValue>) => isArray(target) && target.every(targetValue => queries.every(query => matchValues(query, targetValue)));
}

/**
 * Logical AND operator. Selects documents where the value of a field equals to all specified values.
 * @param queries Query values.
 */
export function and(...queries: QueryValue[]) {
	return (target: Readonly<DocumentValue>) => queries.every(query => matchValues(query, target as DocumentValue));
}

/**
 * Logical OR operator. Selects documents where the value of a field equals at least one specified value.
 * @param queries Query values.
 */
export function or(...queries: QueryValue[]) {
	return (target: Readonly<DocumentValue>) => queries.some(query => matchValues(query, target as DocumentValue));
}

/**
 * Logical NOT operator. Selects documents where the value of a field not equal to specified value.
 * @param query Query value.
 */
export function not(query: QueryValue) {
	return (target: Readonly<DocumentValue>) => matchValues(query, target as DocumentValue) === false;
}
