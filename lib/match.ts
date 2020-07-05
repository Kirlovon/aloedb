import { deepCompare } from './utils.ts';
import { DocumentValue, SearchQueryValue } from './declarations.ts';
import { isString, isNumber, isBoolean, isNull, isArray, isObject, isFunction, isRegExp } from './types.ts';

/**
 * Compares the value from the query and from the document.
 * @param queryValue Value from query.
 * @param documentValue Value from document.
 * @returns Are the values equal.
 */
function matchValues(queryValue: SearchQueryValue, documentValue: DocumentValue): boolean {
	// Primitive
	if (isString(queryValue) || isNumber(queryValue) || isBoolean(queryValue) || isNull(queryValue)) {
		return queryValue === documentValue;
	}

	// Custome search function
	if (isFunction(queryValue)) {
		return queryValue(documentValue) ? true : false;
	}

	// Regular expression
	if (isRegExp(queryValue)) {
		return isString(documentValue) && queryValue.test(documentValue);
	}

	// Array or Object
	if (isArray(queryValue) || isObject(queryValue)) {
		return deepCompare(queryValue, documentValue);
	}

	// Not supported value
	return false;
}

export default matchValues;
