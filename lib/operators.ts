import { deepCompare, matchValues } from './utils.ts';
import { isArray, isUndefined, isString, isNumber, isBoolean, isNull, isObject } from './types.ts';
import { DocumentValue, DocumentPrimitive, SearchFunction, SearchFieldFunction, SearchQueryValue } from './declarations.ts';

// TODO: Comments

/**
 * Compares document value and users specified value
 * @param value Value to check
 */
export function equal(value: DocumentValue): SearchFieldFunction {
	return target => deepCompare(target, value);
}

/**
 * Checks if value from document and from the user are not equals
 * @param value Value to check
 */
export function notEqual(value: DocumentValue): SearchFieldFunction {
	return target => !deepCompare(target, value);
}

/**
 * Checks if documents value inside the array of specified values
 * @param values Array of value to check 
 */
export function inside(values: DocumentPrimitive[]): SearchFieldFunction {
	return target => values.includes(target as any);
}

/**
 * Checks if value not inside the array of user-specified values
 * @param values Array of values to check  
 */
export function notInside(values: DocumentPrimitive[]): SearchFieldFunction {
	return target => !values.includes(target as any);
}

/**
 * Checks if user-specifief value larger than 
 * @param value Value to check ( Number )
 */
export function moreThan(value: number): SearchFieldFunction {
	return target => (target as number) > value;
}

export function moreThanOrEqual(value: number): SearchFieldFunction {
	return target => (target as number) >= value;
}

export function lessThan(value: number): SearchFieldFunction {
	return target => (target as number) < value;
}

export function lessThanOrEqual(value: number): SearchFieldFunction {
	return target => (target as number) <= value;
}

export function between(min: number, max: number): SearchFieldFunction {
	return target => (target as number) > min && (target as number) < max;
}

export function betweenOrEqual(min: number, max: number): SearchFieldFunction {
	return target => (target as number) >= min && (target as number) <= max;
}

export function exists(): SearchFieldFunction {
	return target => !isUndefined(target);
}

export function type(value: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'): SearchFieldFunction {
	return target => {
		switch (value) {
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

export function includes(value: DocumentPrimitive): SearchFieldFunction {
	return target => isArray(target) && target.includes(value as any);
}

export function length(value: number): SearchFieldFunction {
	return target => isArray(target) && target.length === value;
}

export function elementMatch(...values: SearchQueryValue[]): SearchFieldFunction {
	return target => isArray(target) && target.some((targetValue: DocumentValue) => values.every((value: SearchQueryValue) => matchValues(value, targetValue)));
}

export function not(value: SearchQueryValue): SearchFieldFunction {
	return target => matchValues(value, target as DocumentValue) === false;
}

export function and(...values: SearchQueryValue[]): SearchFieldFunction {
	return target => values.every(value => matchValues(value, target as DocumentValue));
}

export function or(...values: SearchQueryValue[]): SearchFieldFunction {
	return target => values.some(value => matchValues(value, target as DocumentValue));
}

export function nor(...values: SearchQueryValue[]): SearchFieldFunction {
	return target => !values.some(value => matchValues(value, target as DocumentValue));
}
