import matchValues from './match.ts';
import { isArray, isUndefined } from './types.ts';
import { DocumentValue, DocumentPrimitive, SearchFunction, SearchQueryValue } from './declarations.ts';

export function equal(value: DocumentValue): SearchFunction {
	return (target: DocumentValue) => target === value;
}

export function notEqual(value: DocumentValue): SearchFunction {
	return (target: DocumentValue) => target !== value;
}

export function inside(value: DocumentPrimitive[]): SearchFunction {
	return (target: DocumentValue) => value.includes(target as any);
}

export function notInside(value: DocumentPrimitive[]): SearchFunction {
	return (target: DocumentValue) => !value.includes(target as any);
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
	return (target: DocumentValue) => target as number > min && target as number < max;
}

export function exists(): SearchFunction {
	return (target: DocumentValue) => !isUndefined(target);
}

export function includes(value: DocumentPrimitive): SearchFunction {
	return (target: DocumentValue) => isArray(target) && target.includes(value as any);
}

export function length(value: number): SearchFunction {
	return (target: DocumentValue) => isArray(target) && target.length === value;
}

// export function type(value: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'): SearchFunction {
// 	return (target: DocumentValue) => isArray(target) && target.includes(value as any);
// }

export function not(value: SearchQueryValue): SearchFunction {
	return (target: DocumentValue) => (matchValues(value, target)) === false;
}

export function and(...values: SearchQueryValue[]): SearchFunction {
	return (target: DocumentValue) => values.every((value) => matchValues(value, target));
}

export function or(...values: SearchQueryValue[]): SearchFunction {
	return (target: DocumentValue) => values.some((value) => matchValues(value, target));
}
