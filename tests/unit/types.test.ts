import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

import { 
    isString, 
    isNumber, 
    isBoolean, 
    isUndefined,
    isNull,
    isFunction,
    isArray,
    isObject,
    isRegExp,
    isDate,
    isError
} from '../../lib/types.ts';

Deno.test('[types.ts] isString', () => {
    assertEquals(isString('test'), true);
    assertEquals(isString(123), false);
    assertEquals(isString({}), false);
});

Deno.test('[types.ts] isNumber', () => {
    assertEquals(isNumber(999), true);
    assertEquals(isNumber(NaN), false);
    assertEquals(isNumber({}), false);
});

Deno.test('[types.ts] isBoolean', () => {
    assertEquals(isBoolean(false), true);
    assertEquals(isBoolean(0), false);
    assertEquals(isBoolean({}), false);
});

Deno.test('[types.ts] isUndefined', () => {
    assertEquals(isUndefined(undefined), true);
    assertEquals(isUndefined(null), false);
    assertEquals(isUndefined({}), false);
});

Deno.test('[types.ts] isNull', () => {
    assertEquals(isNull(null), true);
    assertEquals(isNull(undefined), false);
    assertEquals(isNull({}), false);
});

Deno.test('[types.ts] isFunction', () => {
    assertEquals(isFunction(() => {}), true);
    assertEquals(isFunction(0), false);
    assertEquals(isFunction({}), false);
});

Deno.test('[types.ts] isArray', () => {
    assertEquals(isArray([]), true);
    assertEquals(isArray(1), false);
    assertEquals(isArray({}), false);
});

Deno.test('[types.ts] isObject', () => {
    assertEquals(isObject({}), true);
    assertEquals(isObject(new Date()), false);
    assertEquals(isObject([]), false);
});

Deno.test('[types.ts] isRegExp', () => {
    assertEquals(isRegExp(/test/), true);
    assertEquals(isRegExp(new Date()), false);
    assertEquals(isRegExp({}), false);
});

Deno.test('[types.ts] isDate', () => {
    assertEquals(isDate(new Date()), true);
    assertEquals(isDate(345345), false);
    assertEquals(isDate({}), false);
});

Deno.test('[types.ts] isError', () => {
    assertEquals(isError(new TypeError('test')), true);
    assertEquals(isError(new Error('test')), true);
    assertEquals(isError(345345), false);
    assertEquals(isError({}), false);
});
