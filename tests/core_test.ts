import { assertEquals, assertThrows } from 'https://deno.land/std@0.102.0/testing/asserts.ts';
import { yellow } from 'https://deno.land/std@0.102.0/fmt/colors.ts';

import {
	findOneDocument,
	findMultipleDocuments,
	updateDocument,
	matchValues,
	parseDatabaseStorage
} from '../lib/core.ts';

Deno.test(`${yellow('[core.ts]')} findOneDocument (Single document)`, () => {
	const documents: any = [{ object: { foo: 'bar' } }, { array: [1, 2, 3] }, { nothing: null }, { boolean: true }, { number: 42 }, { text: 'foo' }];

	const search1 = findOneDocument<any>({ text: 'foo' }, documents);
	const search2 = findOneDocument<any>({ number: 42 }, documents);
	const search3 = findOneDocument<any>({ boolean: true }, documents);
	const search4 = findOneDocument<any>({ nothing: null }, documents);
	const search5 = findOneDocument<any>({ array: [1, 2, 3] }, documents);
	const search6 = findOneDocument<any>({ object: { foo: 'bar' } }, documents);
	const search7 = findOneDocument<any>({ text: /foo/ }, documents);
	const search8 = findOneDocument<any>({ number: (value: any) => value === 42 }, documents);

	assertEquals(search1, 5);
	assertEquals(search2, 4);
	assertEquals(search3, 3);
	assertEquals(search4, 2);
	assertEquals(search5, 1);
	assertEquals(search6, 0);
	assertEquals(search7, 5);
	assertEquals(search8, 4);
});

Deno.test(`${yellow('[core.ts]')} findOneDocument (No criteria)`, () => {
	const documents: any = [
		{ text: 'foo' },
		{ text: 'bar' },
		{ text: 'baz' },
	];

	const search1 = findOneDocument<any>({}, documents);
	const search2 = findOneDocument<any>(undefined, documents);
	const search3 = findOneDocument<any>({}, []);
	const search4 = findOneDocument<any>(undefined, []);

	assertEquals(search1, 0);
	assertEquals(search2, 0);
	assertEquals(search3, null);
	assertEquals(search4, null);
});

Deno.test(`${yellow('[core.ts]')} findOneDocument (Search function)`, () => {
	const documents: any = [
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3], object: { foo: 'bar' } },
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3] },
		{ text: 'foo', number: 42, boolean: true, nothing: 0 },
	];

	const search1 = findOneDocument<any>(() => true, documents);
	const search2 = findOneDocument<any>(() => false, documents);
	const search3 = findOneDocument<any>((value: any) => value?.nothing === 0, documents);

	assertEquals(search1, 0);
	assertEquals(search2, null);
	assertEquals(search3, 2);
});

Deno.test(`${yellow('[core.ts]')} findMultipleDocuments (Single document)`, () => {
	const documents: any = [{ object: { foo: 'bar' } }, { array: [1, 2, 3] }, { nothing: null }, { boolean: true }, { number: 42 }, { text: 'foo' }];

	const search1 = findMultipleDocuments<any>({ text: 'foo' }, documents);
	const search2 = findMultipleDocuments<any>({ number: 42 }, documents);
	const search3 = findMultipleDocuments<any>({ boolean: true }, documents);
	const search4 = findMultipleDocuments<any>({ nothing: null }, documents);
	const search5 = findMultipleDocuments<any>({ array: [1, 2, 3] }, documents);
	const search6 = findMultipleDocuments<any>({ object: { foo: 'bar' } }, documents);
	const search7 = findMultipleDocuments<any>({ text: /foo/ }, documents);
	const search8 = findMultipleDocuments<any>({ number: (value: any) => value === 42 }, documents);

	assertEquals(search1, [5]);
	assertEquals(search2, [4]);
	assertEquals(search3, [3]);
	assertEquals(search4, [2]);
	assertEquals(search5, [1]);
	assertEquals(search6, [0]);
	assertEquals(search7, [5]);
	assertEquals(search8, [4]);
});

Deno.test(`${yellow('[core.ts]')} findMultipleDocuments (Multiple documents)`, () => {
	const documents: any = [
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3], object: { foo: 'bar' } },
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3] },
		{ text: 'foo', number: 42, boolean: true, nothing: null },
		{ text: 'foo', number: 42, boolean: true },
		{ text: 'foo', number: 42 },
		{ text: 'foo' },
	];

	const search1 = findMultipleDocuments<any>({ text: 'foo' }, documents);
	const search2 = findMultipleDocuments<any>({ text: 'foo', number: 42 }, documents);
	const search3 = findMultipleDocuments<any>({ text: 'foo', number: 42, boolean: true }, documents);
	const search4 = findMultipleDocuments<any>({ text: 'foo', number: 42, boolean: true, nothing: null }, documents);
	const search5 = findMultipleDocuments<any>({ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3] }, documents);
	const search6 = findMultipleDocuments<any>({ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3], object: { foo: 'bar' } }, documents);
	const search7 = findMultipleDocuments<any>({ text: /foo/, array: (value: any) => value?.[0] === 1 }, documents);
	const search8 = findMultipleDocuments<any>({ text: /foo/, object: (value: any) => value?.foo === 'bar' }, documents);

	assertEquals(search1, [0, 1, 2, 3, 4, 5]);
	assertEquals(search2, [0, 1, 2, 3, 4]);
	assertEquals(search3, [0, 1, 2, 3]);
	assertEquals(search4, [0, 1, 2]);
	assertEquals(search5, [0, 1]);
	assertEquals(search6, [0]);
	assertEquals(search7, [0, 1]);
	assertEquals(search8, [0]);
});

Deno.test(`${yellow('[core.ts]')} findMultipleDocuments (No criteria)`, () => {
	const documents: any = [
		{ text: 'foo' },
		{ text: 'bar' },
		{ text: 'baz' },
	];

	const search1 = findMultipleDocuments<any>({}, documents);
	const search2 = findMultipleDocuments<any>(undefined, documents);
	const search3 = findMultipleDocuments<any>({}, []);
	const search4 = findMultipleDocuments<any>(undefined, []);

	assertEquals(search1, [0, 1, 2]);
	assertEquals(search2, [0, 1, 2]);
	assertEquals(search3, []);
	assertEquals(search4, []);
});

Deno.test(`${yellow('[core.ts]')} findMultipleDocuments (Search function)`, () => {
	const documents: any = [
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3], object: { foo: 'bar' } },
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3] },
		{ text: 'foo', number: 42, boolean: true, nothing: null },
		{ text: 'foo', number: 42, boolean: true },
		{ text: 'foo', number: 42 },
		{ text: 'foo' },
	];

	const search1 = findMultipleDocuments<any>(() => true, documents);
	const search2 = findMultipleDocuments<any>(() => false, documents);
	const search3 = findMultipleDocuments<any>((value: any) => value?.nothing === null, documents);

	assertEquals(search1, [0, 1, 2, 3, 4, 5]);
	assertEquals(search2, []);
	assertEquals(search3, [0, 1, 2]);
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Basic)`, () => {
	const updated = updateDocument<any>({ test: 1, test2: 'foo', test3: true, test4: null, test6: 123 }, { test: 42, test2: 'bar', test3: false, test4: 'notNull', test5: 'NewField', test6: undefined });
	assertEquals(updated, { test: 42, test2: 'bar', test3: false, test4: 'notNull', test5: 'NewField' });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Partly)`, () => {
	const updated = updateDocument<any>(
		{ test: 42, test2: { value: 42 }, test3: ['foo', true, { value: 'bar' }] },
		{ test2: [1, 2, 3], test3: { foo: 'bar' } }
	);
	assertEquals(updated, { test: 42, test2: [1, 2, 3], test3: { foo: 'bar' } });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (No changes)`, () => {
	const updated = updateDocument<any>(
		{ test: 42, test2: { value: 42 }, test3: ['foo', true, { value: 'bar' }] },
		{}
	);
	assertEquals(updated, { test: 42, test2: { value: 42 }, test3: ['foo', true, { value: 'bar' }] });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Update function)`, () => {
	const updated = updateDocument<any>(
		{ test: 'foo', test2: { value: 42 }, test3: [1, 2, 3] },
		(document: any) => {
			document.test += 'bar';
			document.test2!.value = 0;
			document.test3!.push(4);
			return document;
		}
	);

	assertEquals(updated, { test: 'foobar', test2: { value: 0 }, test3: [1, 2, 3, 4] });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Update field function)`, () => {
	const updated = updateDocument<any>(
		{ test: 'foo', test2: { value: 42 }, test3: [1, 2, 3] },
		{
			test: (value: any) => value + 'bar',
			test2: (value: any) => {
				value.value = 0;
				return value;
			},
			test3: (value: any) => {
				value.push(4);
				return value;
			},
		}
	);

	assertEquals(updated, { test: 'foobar', test2: { value: 0 }, test3: [1, 2, 3, 4] });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Empty object)`, () => {
	const updated = updateDocument<any>(
		{ test: true },
		{ test: undefined }
	);
	assertEquals(updated, {});
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Deletion)`, () => {
	const updated = updateDocument<any>(
		{ test: true },
		() => null
	);
	assertEquals(updated, {});
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Immutability)`, () => {
	const array: any = [1, 2, 3, { field: 'value' }];
	const document = { test: [0], foo: 'bar' };

	const updated = updateDocument<any>(
		document,
		{ test: array }
	);

	array[0] = 999;
	array[3].field = 'changed';
	document.test[0] = 999;
	document.foo = 'baz';

	assertEquals(updated, { test: [1, 2, 3, { field: 'value' }], foo: 'bar' });
});

Deno.test(`${yellow('[core.ts]')} matchValues (Primitives)`, () => {
	assertEquals(matchValues('foo', 'foo'), true);
	assertEquals(matchValues(42, 42), true);
	assertEquals(matchValues(true, true), true);
	assertEquals(matchValues(null, null), true);
	assertEquals(matchValues(undefined, undefined as any), true);
});

Deno.test(`${yellow('[core.ts]')} matchValues (Advanced Valid)`, () => {
	assertEquals(
		matchValues((value: any) => value === 'foo', 'foo'),
		true
	);
	assertEquals(matchValues(/foo/, 'fooBar'), true);
	assertEquals(matchValues([1, 2, 3], [1, 2, 3]), true);
	assertEquals(matchValues({ boolean: true }, { boolean: true }), true);
});

Deno.test(`${yellow('[core.ts]')} matchValues (Advanced Invalid)`, () => {
	assertEquals(matchValues('foo', 10), false);
	assertEquals(matchValues(/bar/, true), false);
	assertEquals(
		matchValues((value: any) => false, true),
		false
	);
	assertEquals(matchValues({ array: [1, 2, 3] }, { array: [1, 2, 3, 4] }), false);
	assertEquals(matchValues({ invalid: new Map() as any }, { invalid: {} }), false);
	assertEquals(matchValues({ array: [] }, { object: {} }), false);
	assertEquals(matchValues(new Map() as any, new Map() as any), false);
});


Deno.test(`${yellow('[core.ts]')} parseDatabaseStorage`, () => {
	const result = parseDatabaseStorage('[{"foo":"bar"}, {}]');
	assertEquals(result, [{foo: 'bar'}]);
});

Deno.test(`${yellow('[core.ts]')} parseDatabaseStorage (Empty file)`, () => {
	const result = parseDatabaseStorage('');
	assertEquals(result, []);
});

Deno.test(`${yellow('[core.ts]')} parseDatabaseStorage (Not an Array)`, () => {
	assertThrows(() => parseDatabaseStorage('true'), undefined, 'should be an array of objects')
});

Deno.test(`${yellow('[core.ts]')} parseDatabaseStorage (Invalid Array)`, () => {
	assertThrows(() => parseDatabaseStorage('[true]'), undefined, 'should contain only objects')
});
