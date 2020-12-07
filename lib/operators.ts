import { matchValues } from './core.ts';
import { DocumentValue, DocumentPrimitive, QueryValue } from './types.ts';
import { isArray, isUndefined, isString, isNumber, isBoolean, isNull, isObject } from './utils.ts';

/**
 * Selects documents where the value of a field more than specified number.
 * @param value
 * @example
 * ```typescript
 * db.documents; // [{ value: 5 }]
 * db.findOne({ value: moreThan(6) }); // null 
 * db.findOne({ value: moreThan(3) }); // { value: 5 } 
 * ```
 */
export function moreThan(value: number) {
	return (target: DocumentValue) => isNumber(target) && target > value;
}

/**
 * Selects documents where the value of a field more than or equal to the specified number.
 * @param value 
 */
export function moreThanOrEqual(value: number) {
	return (target: DocumentValue) => isNumber(target) && target >= value;
}

/**
 * Selects documents where the value of a field less than specified number.
 * @param value 
 */
export function lessThan(value: number) {
	return (target: DocumentValue) => isNumber(target) && target < value;
}

/**
 * Selects documents where the value of a field less than or equal to the specified number.
 * @param value 
 */
export function lessThanOrEqual(value: number) {
	return (target: DocumentValue) => isNumber(target) && target <= value;
}

/**
 * Matches if number is between specified range values.
 * @param min Range start.
 * @param max Range end.
 */
export function between(min: number, max: number) {
	return (target: DocumentValue) => isNumber(target) && target > min && target < max;
}

/**
 * Matches if number is between or equal to the specified range values.
 * @param min Range start.
 * @param max Range end.
 */
export function betweenOrEqual(min: number, max: number) {
	return (target: DocumentValue) => isNumber(target) && target >= min && target <= max;
}

/**
 * Matches if field exists.
 */
export function exists() {
	return (target: DocumentValue) => !isUndefined(target);
}

/**
 * Matches if value type equal to specified type.
 * @param type Type of the value.
 */
export function type(type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object') {
	return (target: DocumentValue) => {
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
 * @param value 
 */
export function includes(value: DocumentPrimitive) {
	return (target: DocumentValue) => isArray(target) && target.includes(value);
}

/**
 * Matches if array length equal to specified length.
 * @param length Length of the array. 
 */
export function length(length: number) {
	return (target: DocumentValue) => isArray(target) && target.length === length;
}

/**
 * 
 * @param values 
 */
export function someElementMatch(...values: QueryValue[]) {
	return (target: DocumentValue) => isArray(target) && target.some(targetValue => values.every(value => matchValues(value, targetValue)));
}

/**
 * 
 * @param values 
 */
export function everyElementMatch(...values: QueryValue[]) {
	return (target: DocumentValue) => isArray(target) && target.every(targetValue => values.every(value => matchValues(value, targetValue)));
}

/**
 * Logical AND operator. Selects documents where the value of a field equals to all specified values.
 * @param values Query values.
 */
export function and(...values: QueryValue[]) {
	return (target: DocumentValue) => values.every(value => matchValues(value, target));
}

/**
 * Logical OR operator. Selects documents where the value of a field equals at least one specified value.
 * @param values Query values.
 */
export function or(...values: QueryValue[]) {
	return (target: DocumentValue) => values.some(value => matchValues(value, target));
}

/**
 * Logical NOT operator. Selects documents where the value of a field not equal to specified value.
 * @param value Query value.
 */
export function not(value: QueryValue) {
	return (target: DocumentValue) => matchValues(value, target) === false;
}