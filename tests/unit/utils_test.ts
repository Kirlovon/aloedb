import { assert, assertEquals, assertNotEquals, assertThrows } from 'https://deno.land/std/testing/asserts.ts';
import { green } from 'https://deno.land/std/fmt/colors.ts';

import {
	cleanArray,
	isObjectEmpty,
	getObjectLength,
	deepClone,
	deepCompare,
	prepareArray,
	prepareObject,
	updateObject,
	matchValues,
} from '../../lib/utils.ts';

Deno.test(`${green('[utils.ts]')} cleanArray`, () => {
	const array = [1, 2, 3, 4, , 6, undefined, null];
	delete array[5];

	assertEquals(cleanArray(array), [1, 2, 3, 4, undefined, null]);
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
	const a: any = [1, 'text', true, undefined, null, { test: null, test2: undefined, test3: [1, 2, 3] }, [null, undefined, { test: undefined }]];

	const b: any = [1, 'text', true, undefined, null, [null, undefined, { test: new Date() }]];

	prepareArray(a);
	assertEquals(a, [1, 'text', true, null, null, { test: null, test3: [1, 2, 3] }, [null, null, {}]]);

	assertThrows(() => prepareArray(b));
});

Deno.test(`${green('[utils.ts]')} prepareObject`, () => {
	const a: any = {
		a: 1,
		b: 'text',
		c: true,
		d: undefined,
		e: null,
		f: { value: undefined },
		g: [1, 2, undefined],
	};

	const b: any = {
		a: undefined,
		'f.test': { value: undefined },
	};

	const c: any = {
		a: 1,
		b: new Date(),
	};

	prepareObject(a);
	assertEquals(a, {
		a: 1,
		b: 'text',
		c: true,
		e: null,
		f: {},
		g: [1, 2, null],
	});

	assertThrows(() => prepareObject(b));
	assertThrows(() => prepareObject(c));
});

Deno.test(`${green('[utils.ts]')} matchValues`, () => {
	assertEquals(matchValues('test', 'test'), true);
	assertEquals(matchValues(88, 88), true);
	assertEquals(matchValues(true, true), true);
	assertEquals(matchValues(null, null), true);
	assertEquals(matchValues(undefined, undefined), true);
	assertEquals(
		matchValues(value => value === 'test', 'test'),
		true
	);
	assertEquals(matchValues(/test/, 'test123'), true);
	assertEquals(matchValues([1, 2, 3], [1, 2, 3]), true);
	assertEquals(matchValues({ value: true }, { value: true }), true);

	assertEquals(matchValues('test', 10), false);
	assertEquals(matchValues(/test/, true), false);
	assertEquals(
		matchValues(value => false, true),
		false
	);
	assertEquals(matchValues({ test: [1, 2, 3] }, { test: [1, 2, 3, 4] }), false);
	assertEquals(matchValues({ test: new Map() as any }, { test: [] }), false);
});

Deno.test(`${green('[utils.ts]')} updateObject`, () => {
	const object: any = { test: '123' };

	updateObject({ value: true }, object);
	assertEquals(object, { test: '123', value: true });

	updateObject({ value: { test: [] } }, object);
	assertEquals(object, { test: '123', value: { test: [] } });

	updateObject({ value: { test: [true] } }, object);
	assertEquals(object, { test: '123', value: { test: [true] } });

	updateObject({ value: undefined }, object);
	assertEquals(object, { test: '123', value: undefined });

	updateObject(document => {
		document.value = 3;
		return document;
	}, object);
	assertEquals(object, { test: '123', value: 3 });

	updateObject({ value: x => { return [1, 2, 3, x ]} }, object);
	assertEquals(object, { test: '123', value: 3 });
});
