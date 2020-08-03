import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { green } from 'https://deno.land/std/fmt/colors.ts';

import { isString, isNumber, isBoolean, isUndefined, isNull, isFunction, isArray, isObject, isRegExp, isDate, isError } from '../../lib/types.ts';

Deno.test(`${green('[utils.ts]')} isString`, () => {
	assertEquals(isString('test'), true);
	assertEquals(isString(123), false);
	assertEquals(isString({}), false);
});

Deno.test(`${green('[utils.ts]')} isNumber`, () => {
	assertEquals(isNumber(999), true);
	assertEquals(isNumber(NaN), false);
	assertEquals(isNumber({}), false);
});

Deno.test(`${green('[utils.ts]')} isBoolean`, () => {
	assertEquals(isBoolean(false), true);
	assertEquals(isBoolean(0), false);
	assertEquals(isBoolean({}), false);
});

Deno.test(`${green('[utils.ts]')} isUndefined`, () => {
	assertEquals(isUndefined(undefined), true);
	assertEquals(isUndefined(null), false);
	assertEquals(isUndefined({}), false);
});

Deno.test(`${green('[utils.ts]')} isNull`, () => {
	assertEquals(isNull(null), true);
	assertEquals(isNull(undefined), false);
	assertEquals(isNull({}), false);
});

Deno.test(`${green('[utils.ts]')} isFunction`, () => {
	assertEquals(
		isFunction(() => {}),
		true
	);
	assertEquals(isFunction(0), false);
	assertEquals(isFunction({}), false);
});

Deno.test(`${green('[utils.ts]')} isArray`, () => {
	assertEquals(isArray([]), true);
	assertEquals(isArray(1), false);
	assertEquals(isArray({}), false);
});

Deno.test(`${green('[utils.ts]')} isObject`, () => {
	assertEquals(isObject({}), true);
	assertEquals(isObject(new Date()), false);
	assertEquals(isObject([]), false);
});

Deno.test(`${green('[utils.ts]')} isRegExp`, () => {
	assertEquals(isRegExp(/test/), true);
	assertEquals(isRegExp(new Date()), false);
	assertEquals(isRegExp({}), false);
});

Deno.test(`${green('[utils.ts]')} isDate`, () => {
	assertEquals(isDate(new Date()), true);
	assertEquals(isDate(345345), false);
	assertEquals(isDate({}), false);
});

Deno.test(`${green('[utils.ts]')} isError`, () => {
	assertEquals(isError(new TypeError('test')), true);
	assertEquals(isError(new Error('test')), true);
	assertEquals(isError(345345), false);
	assertEquals(isError({}), false);
});
