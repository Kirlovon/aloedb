import { assert, assertEquals, assertNotEquals } from 'https://deno.land/std/testing/asserts.ts';
import { green } from 'https://deno.land/std/fmt/colors.ts';

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
	isString, 
	isNumber, 
	isBoolean, 
	isUndefined, 
	isNull, 
	isFunction, 
	isArray, 
	isObject, 
	isRegExp, 
	isError,
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
	assertEquals(getPathFilename('file.json'), 'file.json');
	assertEquals(getPathFilename('./test/file.json'), 'file.json');
	assertEquals(getPathFilename('other/test/file.json'), 'file.json');
	assertEquals(getPathFilename('/file/file.json'), 'file.json');
	assertEquals(getPathFilename('//file//file.json'), 'file.json');
	assertEquals(getPathFilename('\\file\\file.json'), 'file.json');
});

Deno.test(`${green('[utils.ts]')} getPathDirname`, () => {
	assertEquals(getPathDirname('file.json'), '');
	assertEquals(getPathDirname('./test/file.json'), './test');
	assertEquals(getPathDirname('other/test/file.json'), 'other/test');
	assertEquals(getPathDirname('/file/file.json'), 'file');
	assertEquals(getPathDirname('//file//file.json'), 'file');
	assertEquals(getPathDirname('\\file\\file.json'), 'file');
});


Deno.test(`${green('[utils.ts]')} deepClone ( Primitives )`, () => {
	const a = 1;
	const b = 'test';
	const c = true;
	const d = undefined;
	const e = null;

	const aClone = deepClone(a);
	const bClone = deepClone(b);
	const cClone = deepClone(c);
	const dClone = deepClone(d);
	const eClone = deepClone(e);

	assertEquals(a, aClone);
	assertEquals(b, bClone);
	assertEquals(c, cClone);
	assertEquals(d, dClone);
	assertEquals(e, eClone);
});

Deno.test(`${green('[utils.ts]')} deepClone ( Objects & Arrays )`, () => {
	const a = [1, 'test', true, null, undefined];
	const b = {
		a: 1,
		b: 'test',
		c: true,
		d: null,
		e: undefined,
	};

	const aClone = deepClone(a);
	const bClone = deepClone(b);

	assertEquals(a, aClone);
	assertEquals(b, bClone);
	assert(a !== aClone);
	assert(b !== bClone);

	a[0] = 0;
	b.a = 0;

	assertNotEquals(a, aClone);
	assertNotEquals(b, bClone);
});

Deno.test(`${green('[utils.ts]')} deepClone ( Mixed )`, () => {
	const object: any = {
		a: 1,
		b: 'text',
		c: true,
		d: undefined,
		e: null,
		f: { test: null, value: undefined, x: [1, 2, 3], z: { test: 'text' } },
		g: [1, true, 'text', null, undefined, { test: 1 }, [1, 2, 3]],
	};

	const clone = deepClone(object);

	assertEquals(clone, object);
	assert(clone !== object);

	object.a = 0;
	assert(object.a !== clone.a);

	object.f.x[0] = 0;
	assert(object.f.x[0] !== clone.f.x[0]);

	object.g = 0;
	assert(object.g !== clone.g);
});

Deno.test(`${green('[utils.ts]')} deepCompare ( Primitives )`, () => {
	const a = 'test';
	const b = true;
	const c = 1;
	const d = null;
	const e = undefined;

	assertEquals(deepCompare(a, 'test2'), false);
	assertEquals(deepCompare(b, false), false);
	assertEquals(deepCompare(c, 0), false);
	assertEquals(deepCompare(d, undefined), false);
	assertEquals(deepCompare(e, null), false);

	assertEquals(deepCompare(a, 'test'), true);
	assertEquals(deepCompare(b, true), true);
	assertEquals(deepCompare(c, 1), true);
	assertEquals(deepCompare(d, null), true);
	assertEquals(deepCompare(e, undefined), true);
});

Deno.test(`${green('[utils.ts]')} deepCompare ( Objects & Arrays )`, () => {
	const a = [1, 'test', true, null, undefined];
	const b = {
		a: 1,
		b: 'test',
		c: true,
		d: null,
		e: undefined,
	};

	assertEquals(deepCompare(a, a), true);
	assertEquals(deepCompare(b, b), true);

	assertEquals(deepCompare(a, [1, 'test', true, null]), false);
	assertEquals(
		deepCompare(b, {
			a: 1,
			b: 'test',
			c: true,
			d: null,
		}),
		false
	);
});

Deno.test(`${green('[utils.ts]')} prepareArray`, () => {
	const test: any = [1, 'text', true, undefined, null, new Date(), { test: null, test2: undefined, test3: [1, 2, 3], test4: new Map() }, [null, undefined, { test: new Map(), test2: undefined }]];

	prepareArray(test);
	assertEquals(test, [1, 'text', true, null, null, null, { test: null, test3: [1, 2, 3] }, [null, null, {}]]);
});

Deno.test(`${green('[utils.ts]')} prepareObject`, () => {
	const test: any = {
		a: 1,
		b: 'text',
		c: true,
		d: undefined,
		e: null,
		f: { value: undefined, value2: new Map() },
		g: [1, 2, undefined, new Date()],
	};

	prepareObject(test);
	assertEquals(test, {
		a: 1,
		b: 'text',
		c: true,
		e: null,
		f: {},
		g: [1, 2, null, null],
	});

});

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

Deno.test(`${green('[utils.ts]')} isError`, () => {
	assertEquals(isError(new TypeError('test')), true);
	assertEquals(isError(new Error('test')), true);
	assertEquals(isError(345345), false);
	assertEquals(isError({}), false);
});
