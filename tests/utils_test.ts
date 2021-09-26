import { assert, assertEquals, assertNotEquals } from 'https://deno.land/std@0.102.0/testing/asserts.ts';
import { green } from 'https://deno.land/std@0.102.0/fmt/colors.ts';

import {
	cleanArray,
	numbersList,
	isObjectEmpty,
	getObjectLength,
	getPathFilename,
	getPathDirname,
	deepClone,
	deepCompare,
	prepareArray,
	prepareObject,
	sortDocuments,
	isPrimitive,
	isString,
	isNumber,
	isBoolean,
	isUndefined,
	isNull,
	isFunction,
	isArray,
	isObject,
	isRegExp
} from '../lib/utils.ts';

Deno.test(`${green('[utils.ts]')} cleanArray`, () => {
	const array = [1, 2, 3, 4, , 6, undefined, null];
	delete array[5];

	assertEquals(cleanArray(array), [1, 2, 3, 4, undefined, null]);
});

Deno.test(`${green('[utils.ts]')} numbersList`, () => {
	assertEquals(numbersList(5), [0, 1, 2, 3, 4, 5]);
	assertEquals(numbersList(1), [0, 1]);
	assertEquals(numbersList(0), [0]);
	assertEquals(numbersList(-1), []);
});

Deno.test(`${green('[utils.ts]')} isObjectEmpty`, () => {
	assertEquals(isObjectEmpty({}), true);
	assertEquals(isObjectEmpty({ key: undefined }), false);
});

Deno.test(`${green('[utils.ts]')} getObjectLength`, () => {
	assertEquals(getObjectLength({}), 0);
	assertEquals(getObjectLength({ key: undefined }), 1);
	assertEquals(getObjectLength({ test1: 1, test2: 2, test3: 3 }), 3);
});

Deno.test(`${green('[utils.ts]')} getPathFilename`, () => {
	assertEquals(getPathFilename('foo.json'), 'foo.json');
	assertEquals(getPathFilename('./foo/bar.json'), 'bar.json');
	assertEquals(getPathFilename('foo/bar/baz.json'), 'baz.json');
	assertEquals(getPathFilename('/foo/bar.json'), 'bar.json');
	assertEquals(getPathFilename('//foo//bar.json'), 'bar.json');
	assertEquals(getPathFilename('\\foo\\bar.json'), 'bar.json');
	assertEquals(getPathFilename(''), '');
});

Deno.test(`${green('[utils.ts]')} getPathDirname`, () => {
	assertEquals(getPathDirname('foo.json'), '');
	assertEquals(getPathDirname('./foo/bar.json'), './foo');
	assertEquals(getPathDirname('foo/bar/baz.json'), 'foo/bar');
	assertEquals(getPathDirname('/foo/bar.json'), 'foo');
	assertEquals(getPathDirname('//foo//bar.json'), 'foo');
	assertEquals(getPathDirname('\\foo\\bar.json'), 'foo');
});

Deno.test(`${green('[utils.ts]')} deepClone (Primitives)`, () => {
	const number = 42;
	const string = 'foo';
	const boolean = true;
	const undefinedValue = undefined;
	const nullValue = null;

	const numberClone = deepClone(number);
	const stringClone = deepClone(string);
	const booleanClone = deepClone(boolean);
	const undefinedClone = deepClone(undefinedValue);
	const nullClone = deepClone(nullValue);

	assertEquals(number, numberClone);
	assertEquals(string, stringClone);
	assertEquals(boolean, booleanClone);
	assertEquals(undefinedValue, undefinedClone);
	assertEquals(nullValue, nullClone);
});

Deno.test(`${green('[utils.ts]')} deepClone (Objects & Arrays)`, () => {
	const array = [42, 'foo', true, null, undefined];
	const object = { a: 42, b: 'foo', c: true, d: null, e: undefined };

	const arrayClone = deepClone(array);
	const objectClone = deepClone(object);

	assertEquals(array, arrayClone);
	assertEquals(object, objectClone);
	assert(array !== arrayClone);
	assert(object !== objectClone);

	array[0] = 0;
	object.a = 0;

	assertNotEquals(array, arrayClone);
	assertNotEquals(object, objectClone);
});

Deno.test(`${green('[utils.ts]')} deepClone (Mixed)`, () => {
	const object: any = {
		a: 1,
		b: 'bar',
		c: true,
		d: undefined,
		e: null,
		f: { test: null, value: undefined, x: [1, 2, 3], z: { foo: 'bar' } },
		g: [1, true, 'baz', null, undefined, { test: 1 }, [1, 2, 3]],
	};

	const objectClone = deepClone(object);

	assertEquals(objectClone, object);
	assert(objectClone !== object);

	object.a = 0;
	assert(object.a !== objectClone.a);

	object.f.x[0] = 0;
	assert(object.f.x[0] !== objectClone.f.x[0]);

	object.g = 0;
	assert(object.g !== objectClone.g);
});

Deno.test(`${green('[utils.ts]')} deepCompare (Primitives)`, () => {
	const string = 'foo';
	const boolean = true;
	const number = 42;
	const nullValue = null;
	const undefinedValue = undefined;

	assertEquals(deepCompare(string, 'bar'), false);
	assertEquals(deepCompare(boolean, false), false);
	assertEquals(deepCompare(number, 0), false);
	assertEquals(deepCompare(nullValue, undefined), false);
	assertEquals(deepCompare(undefinedValue, null), false);

	assertEquals(deepCompare(string, 'foo'), true);
	assertEquals(deepCompare(boolean, true), true);
	assertEquals(deepCompare(number, 42), true);
	assertEquals(deepCompare(nullValue, null), true);
	assertEquals(deepCompare(undefinedValue, undefined), true);
});

Deno.test(`${green('[utils.ts]')} deepCompare (Objects & Arrays)`, () => {
	const array = [1, 'test', true, null, undefined];
	const object = { a: 1, b: 'test', c: true, d: null, e: undefined };

	assertEquals(deepCompare(array, array), true);
	assertEquals(deepCompare(object, object), true);

	assertEquals(deepCompare(array, [1, 'test', true, null]), false);
	assertEquals(deepCompare(object, { a: 1, b: 'test', c: true, d: null }), false);
});

Deno.test(`${green('[utils.ts]')} prepareArray`, () => {
	const array = [
		1,
		'bar',
		true,
		undefined,
		null,
		new Date(),
		{ test: null, test2: undefined, test3: [1, 2, 3], test4: new Map() },
		[null, undefined, { test: new Map(), test2: undefined }],
	];

	prepareArray(array);
	assertEquals(array, [1, 'bar', true, null, null, null, { test: null, test3: [1, 2, 3] }, [null, null, {}]]);
});

Deno.test(`${green('[utils.ts]')} prepareObject`, () => {
	const object: any = {
		a: 1,
		b: 'foo',
		c: true,
		d: undefined,
		e: null,
		f: { value: undefined, value2: new Map() },
		g: [1, 2, undefined, new Date()],
	};

	prepareObject(object);
	assertEquals(object, {
		a: 1,
		b: 'foo',
		c: true,
		e: null,
		f: {},
		g: [1, 2, null, null],
	});
});

Deno.test(`${green('[utils.ts]')} sortDocuments`, () => {
	const testArray: any[] = [
		{ foo: 'hello', bar: 'a' },
		{ foo: 2, bar: 'e' },
		{ foo: 6, bar: 'f' },
		{ foo: 0, bar: 'a' },
		{ foo: 2, bar: 'e', optional: null },
		{ foo: 3, bar: 'c' },
		{ foo: 1, bar: 'a' },
		{ foo: 4, bar: 'g' },
		{ foo: 2, bar: 'b' },
		{ foo: 4, bar: 'd' },
		{ foo: 2, bar: 'e', optional: 1 },
	]

	sortDocuments(testArray, { bar: 'asc', foo: 'desc', optional: 'asc', other: 'asc' });

	assertEquals(testArray, [
		{ foo: 'hello', bar: 'a' },
		{ foo: 1, bar: 'a' },
		{ foo: 0, bar: 'a' },
		{ foo: 2, bar: 'b' },
		{ foo: 3, bar: 'c' },
		{ foo: 4, bar: 'd' },
		{ foo: 2, bar: 'e' },
		{ foo: 2, bar: 'e', optional: null },
		{ foo: 2, bar: 'e', optional: 1 },
		{ foo: 6, bar: 'f' },
		{ foo: 4, bar: 'g' },
	]);
});

Deno.test(`${green('[utils.ts]')} sortDocuments (No Documents)`, () => {
	const result = sortDocuments([], { bar: 'asc', foo: 'desc', optional: 'asc', other: 'asc' });
	assertEquals(result, []);
});

Deno.test(`${green('[utils.ts]')} sortDocuments (No Query)`, () => {
	const testArray: any[] = [
		{ foo: 'hello', bar: 'a' },
		{ foo: 2, bar: 'e' },
	];

	const result = sortDocuments(testArray, {});
	assertEquals(result, [
		{ foo: 'hello', bar: 'a' },
		{ foo: 2, bar: 'e' },
	]);
});


Deno.test(`${green('[utils.ts]')} isPrimitive`, () => {
	assertEquals(isPrimitive('foo'), true);
	assertEquals(isPrimitive(42), true);
	assertEquals(isPrimitive(false), true);
	assertEquals(isPrimitive(null), true);
	assertEquals(isPrimitive({}), false);
	assertEquals(isPrimitive([]), false);
	assertEquals(isPrimitive(undefined), false);
	assertEquals(isPrimitive(/foo/), false);
});

Deno.test(`${green('[utils.ts]')} isString`, () => {
	assertEquals(isString('foo'), true);
	assertEquals(isString(42), false);
	assertEquals(isString({}), false);
});

Deno.test(`${green('[utils.ts]')} isNumber`, () => {
	assertEquals(isNumber(42), true);
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
	assertEquals(isFunction(() => { }), true);
	assertEquals(isFunction(0), false);
	assertEquals(isFunction({}), false);
});

Deno.test(`${green('[utils.ts]')} isArray`, () => {
	assertEquals(isArray([]), true);
	assertEquals(isArray(42), false);
	assertEquals(isArray({}), false);
});

Deno.test(`${green('[utils.ts]')} isObject`, () => {
	assertEquals(isObject({}), true);
	assertEquals(isObject(new Date()), false);
	assertEquals(isObject([]), false);
});

Deno.test(`${green('[utils.ts]')} isRegExp`, () => {
	assertEquals(isRegExp(/foo/), true);
	assertEquals(isRegExp(new Date()), false);
	assertEquals(isRegExp({}), false);
});
