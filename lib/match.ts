import { deepCompare } from './utils.ts';
import { Document, DocumentValue, SearchQueryValue } from './declarations.ts';
import { isString, isNumber, isBoolean, isNull, isArray, isObject, isFunction, isRegExp } from './types.ts';

/**
 * Compares the value from the query and from the document.
 * @param queryValue Value from query.
 * @param documentValue Value from document.
 * @returns Are the values equal.
 */
function matchValues(queryValue: SearchQueryValue, documentValue: DocumentValue): boolean {
	if (isString(queryValue) || isNumber(queryValue) || isBoolean(queryValue) || isNull(queryValue)) {
		return queryValue === documentValue;
	}

	if (isFunction(queryValue)) {
		return queryValue(documentValue) ? true : false;
	}

	if (isRegExp(queryValue)) {
		return isString(documentValue) && queryValue.test(documentValue);
	}

	if (isArray(queryValue) || isObject(queryValue)) {
		return deepCompare(queryValue, documentValue);
	}

	return false;
}

export default matchValues;
