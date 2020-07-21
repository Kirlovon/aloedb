import DatabaseError from './error.ts';
import { UnknownObject } from './declarations.ts';
import { isArray, isObject, isUndefined, isString, isBoolean, isNumber, isNull } from './types.ts';

/**
 * Prepare object for database storage.
 * @param target Object to prepare.
 */
export function prepareObject(target: UnknownObject): void {
	for (const key in target) {
		const value = target[key];

		if (key.includes('.')) throw new DatabaseError('Fields in documents cannot contain a "." character');

		if (isArray(value)) {
			prepareArray(value);
			continue;
		}

		if (isObject(value)) {
			prepareObject(value);
			continue;
		}

		if (isUndefined(value)) {
			delete target[key];
			continue;
		}

		if (!isString(value) && !isNumber(value) && !isBoolean(value) && !isNull(value)) {
			throw new TypeError('Document can only contain Strings, Numbers, Booleans, Nulls, Arrays and Objects');
		}
	}
}

/**
 * Prepare array for database storage.
 * @param target Array to prepare. 
 */
export function prepareArray(target: any[]): void {
	for (let i = 0; i < target.length; i++) {
		const value = target[i];

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

		if (!isString(value) && !isNumber(value) && !isBoolean(value) && !isNull(value)) {
			throw new TypeError('Document can only contain Strings, Numbers, Booleans, Nulls, Arrays and Objects');
		}
	}
}
