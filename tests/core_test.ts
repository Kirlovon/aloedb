import { assertEquals, assertThrows } from 'https://deno.land/std/testing/asserts.ts';
import { yellow } from 'https://deno.land/std/fmt/colors.ts';

import { searchDocuments, updateDocument, matchValues, parseDatabaseStorage } from '../lib/core.ts';

Deno.test(`${yellow('[core.ts]')} searchDocuments (Single document)`, () => {
	const documents: any = [{ object: { foo: 'bar' } }, { array: [1, 2, 3] }, { nothing: null }, { boolean: true }, { number: 42 }, { text: 'foo' }];

	const search1 = searchDocuments({ text: 'foo' }, documents);
	const search2 = searchDocuments({ number: 42 }, documents);
	const search3 = searchDocuments({ boolean: true }, documents);
	const search4 = searchDocuments({ nothing: null }, documents);
	const search5 = searchDocuments({ array: [1, 2, 3] }, documents);
	const search6 = searchDocuments({ object: { foo: 'bar' } }, documents);
	const search7 = searchDocuments({ text: /foo/ }, documents);
	const search8 = searchDocuments({ number: (value) => value === 42 }, documents);

	assertEquals(search1, [5]);
	assertEquals(search2, [4]);
	assertEquals(search3, [3]);
	assertEquals(search4, [2]);
	assertEquals(search5, [1]);
	assertEquals(search6, [0]);
	assertEquals(search7, [5]);
	assertEquals(search8, [4]);
});

Deno.test(`${yellow('[core.ts]')} searchDocuments (Multiple documents)`, () => {
	const documents: any = [
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3], object: { foo: 'bar' } },
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3] },
		{ text: 'foo', number: 42, boolean: true, nothing: null },
		{ text: 'foo', number: 42, boolean: true },
		{ text: 'foo', number: 42 },
		{ text: 'foo' },
	];

	const search1 = searchDocuments({ text: 'foo' }, documents);
	const search2 = searchDocuments({ text: 'foo', number: 42 }, documents);
	const search3 = searchDocuments({ text: 'foo', number: 42, boolean: true }, documents);
	const search4 = searchDocuments({ text: 'foo', number: 42, boolean: true, nothing: null }, documents);
	const search5 = searchDocuments({ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3] }, documents);
	const search6 = searchDocuments({ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3], object: { foo: 'bar' } }, documents);
	const search7 = searchDocuments({ text: /foo/, array: (value: any) => value?.[0] === 1 }, documents);
	const search8 = searchDocuments({ text: /foo/, object: (value: any) => value?.foo === 'bar' }, documents);

	assertEquals(search1, [0, 1, 2, 3, 4, 5]);
	assertEquals(search2, [0, 1, 2, 3, 4]);
	assertEquals(search3, [0, 1, 2, 3]);
	assertEquals(search4, [0, 1, 2]);
	assertEquals(search5, [0, 1]);
	assertEquals(search6, [0]);
	assertEquals(search7, [0, 1]);
	assertEquals(search8, [0]);
});

Deno.test(`${yellow('[core.ts]')} searchDocuments (No criteria)`, () => {
	const documents: any = [
		{ text: 'foo' },
		{ text: 'bar' },
		{ text: 'baz' },
	];
	const search = searchDocuments({}, documents);
	assertEquals(search, [0, 1, 2]);

});

Deno.test(`${yellow('[core.ts]')} searchDocuments (Search function)`, () => {
	const documents: any = [
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3], object: { foo: 'bar' } },
		{ text: 'foo', number: 42, boolean: true, nothing: null, array: [1, 2, 3] },
		{ text: 'foo', number: 42, boolean: true, nothing: null },
		{ text: 'foo', number: 42, boolean: true },
		{ text: 'foo', number: 42 },
		{ text: 'foo' },
	];

	const search1 = searchDocuments(() => true, documents);
	const search2 = searchDocuments(() => false, documents);
	const search3 = searchDocuments((value: any) => value?.nothing === null, documents);

	assertEquals(search1, [0, 1, 2, 3, 4, 5]);
	assertEquals(search2, []);
	assertEquals(search3, [0, 1, 2]);
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Basic)`, () => {
	const updated = updateDocument({ test: 1, test2: 'foo', test3: true, test4: null, test6: 123 }, { test: 42, test2: 'bar', test3: false, test4: 'notNull', test5: 'NewField', test6: undefined });
	assertEquals(updated, { test: 42, test2: 'bar', test3: false, test4: 'notNull', test5: 'NewField' });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Partly)`, () => {
	const updated = updateDocument(
		{ test: 42, test2: { value: 42 }, test3: ['foo', true, { value: 'bar' }] },
		{ test2: [1, 2, 3], test3: { foo: 'bar' } }
	);
	assertEquals(updated, { test: 42, test2: [1, 2, 3], test3: { foo: 'bar' } });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (No changes)`, () => {
	const updated = updateDocument(
		{ test: 42, test2: { value: 42 }, test3: ['foo', true, { value: 'bar' }] },
		{}
	);
	assertEquals(updated, { test: 42, test2: { value: 42 }, test3: ['foo', true, { value: 'bar' }] });
});

Deno.test(`${yellow('[core.ts]')} updateDocument (Update function)`, () => {
	const updated = updateDocument(
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
	const updated = updateDocument(
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

Deno.test(`${yellow('[core.ts]')} matchValues (Primitives)`, () => {
	assertEquals(matchValues('foo', 'foo'), true);
	assertEquals(matchValues(42, 42), true);
	assertEquals(matchValues(true, true), true);
	assertEquals(matchValues(null, null), true);
	assertEquals(matchValues(undefined, undefined as any), true);
});

Deno.test(`${yellow('[core.ts]')} matchValues (Advanced Valid)`, () => {
	assertEquals(
		matchValues(value => value === 'foo', 'foo'),
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
		matchValues(value => false, true),
		false
	);
	assertEquals(matchValues({ array: [1, 2, 3] }, { array: [1, 2, 3, 4] }), false);
	assertEquals(matchValues({ invalid: new Map() as any }, { invalid: {} }), false);
	assertEquals(matchValues({ array: [] }, { object: {} }), false);
	assertEquals(matchValues(new Map() as any, new Map() as any), false);
});




Deno.test(`${yellow('[core.ts]')} parseDatabaseStorage`, () => {
	const result = parseDatabaseStorage('[{"foo":"bar"}]');
	assertEquals(result, [{foo: 'bar'}]);
});

Deno.test(`${yellow('[core.ts]')} parseDatabaseStorage (Not an Array)`, () => {
	assertThrows(() => parseDatabaseStorage('true'), undefined, 'should be an array of objects')
});

Deno.test(`${yellow('[core.ts]')} parseDatabaseStorage (Invalid Array)`, () => {
	assertThrows(() => parseDatabaseStorage('[true]'), undefined, 'should contain only objects')
});
