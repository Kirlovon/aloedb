import matchValues from './match.ts';
import { isArray, isUndefined, isString, isNumber, isBoolean, isNull, isObject } from './types.ts';
import { DocumentValue, DocumentPrimitive, SearchFunction, SearchQueryValue } from './declarations.ts';
import { deepCompare } from './utils.ts';

export function equal(value: DocumentValue): SearchFunction {
	return (target: DocumentValue) => deepCompare(target, value);
}

export function notEqual(value: DocumentValue): SearchFunction {
	return (target: DocumentValue) => !deepCompare(target, value);
}

export function inside(values: DocumentPrimitive[]): SearchFunction {
	return (target: DocumentValue) => values.includes(target as any);
}

export function notInside(values: DocumentPrimitive[]): SearchFunction {
	return (target: DocumentValue) => !values.includes(target as any);
}

export function moreThan(value: number): SearchFunction {
	return (target: DocumentValue) => (target as number) > value;
}

export function moreThanOrEqual(value: number): SearchFunction {
	return (target: DocumentValue) => (target as number) >= value;
}

export function lessThan(value: number): SearchFunction {
	return (target: DocumentValue) => (target as number) < value;
}

export function lessThanOrEqual(value: number): SearchFunction {
	return (target: DocumentValue) => (target as number) <= value;
}

export function between(min: number, max: number): SearchFunction {
	return (target: DocumentValue) => (target as number) > min && (target as number) < max;
}

export function betweenOrEqual(min: number, max: number): SearchFunction {
	return (target: DocumentValue) => (target as number) >= min && (target as number) <= max;
}

export function exists(): SearchFunction {
	return (target: DocumentValue) => !isUndefined(target);
}

export function type(value: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'): SearchFunction {
	return (target: DocumentValue) => { 
		switch (value) {
			case 'string': return isString(target);
			case 'number': return isNumber(target);
			case 'boolean': return isBoolean(target);
			case 'null': return isNull(target);
			case 'array': return isArray(target);
			case 'object': return isObject(target);
			default: return false;
		}
	};
}

export function includes(value: DocumentPrimitive): SearchFunction {
	return (target: DocumentValue) => isArray(target) && target.includes(value as any);
}

export function length(value: number): SearchFunction {
	return (target: DocumentValue) => isArray(target) && target.length === value;
}

// TODO
// export function elementsMatch(...values: SearchQueryValue[]): SearchFunction {
// 	return (target: DocumentValue) => isArray(target) && target.every((value: any) => matchValues(value, target));
// }

export function not(value: SearchQueryValue): SearchFunction {
	return (target: DocumentValue) => matchValues(value, target) === false;
}

export function and(...values: SearchQueryValue[]): SearchFunction {
	return (target: DocumentValue) => values.every(value => matchValues(value, target));
}

export function or(...values: SearchQueryValue[]): SearchFunction {
	return (target: DocumentValue) => values.some(value => matchValues(value, target));
}

export function nor(...values: SearchQueryValue[]): SearchFunction {
	return (target: DocumentValue) => !values.some(value => matchValues(value, target));
}
