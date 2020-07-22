import { UnknownObject } from './declarations.ts';

/**
 * Checks whether the value is a string
 * @param target Target to check
 * @returns Result of checking
 */
export function isString(target: any): target is string {
	return typeof target === 'string';
}

/**
 * Checks whether the value is a number
 * @param target Target to check
 * @returns Result of checking
 */
export function isNumber(target: any): target is number {
	return typeof target === 'number' && !Number.isNaN(target);
}

/**
 * Checks whether the value is a boolean
 * @param target Target to check
 * @returns Result of checking
 */
export function isBoolean(target: any): target is boolean {
	return typeof target === 'boolean';
}

/**
 * Checks whether the value is undefined
 * @param target Target to check
 * @returns Result of checking
 */
export function isUndefined(target: any): target is undefined {
	return typeof target === 'undefined';
}

/**
 * Checks whether the value is a null
 * @param target Target to check
 * @returns Result of checking
 */
export function isNull(target: any): target is null {
	return target === null;
}

/**
 * Checks whether the value is a function
 * @param target Target to check
 * @returns Result of checking
 */
export function isFunction(target: any): target is (...args: any[]) => any {
	return typeof target === 'function';
}

/**
 * Checks whether the value is an array
 * @param target Target to check
 * @returns Result of checking
 */
export function isArray(target: any): target is any[] {
	return target instanceof Array;
}

/**
 * Checks whether the value is a object
 * @param target Target to check
 * @returns Result of checking
 */
export function isObject(target: any): target is UnknownObject {
	return target !== null && typeof target === 'object' && target.constructor === Object;
}

/**
 * Checks whether the value is a regular expression
 * @param target Target to check
 * @returns Result of checking
 */
export function isRegExp(target: any): target is RegExp {
	return target instanceof RegExp;
}

/**
 * Checks whether the value is a date
 * @param target Target to check
 * @returns Result of checking
 */
export function isDate(target: any): target is Date {
	return target instanceof Date;
}

/**
 * Checks whether the value is an error
 * @param target Target to check
 * @returns Result of checking
 */
export function isError(target: any): target is Error {
	return target instanceof Error;
}
