import { assertEquals } from 'https://deno.land/std@0.102.0/testing/asserts.ts';
import { blue } from 'https://deno.land/std@0.102.0/fmt/colors.ts';

import {
	moreThan,
	moreThanOrEqual,
	lessThan,
	lessThanOrEqual,
	between,
	betweenOrEqual,
	exists,
	type,
	includes,
	length,
	someElementMatch,
	everyElementMatch,
	and,
	or,
	not
} from '../lib/helpers.ts';

Deno.test(`${blue('[helpers.ts]')} moreThan`, () => {
	const search = moreThan(5);
	assertEquals(search(6), true);
	assertEquals(search('foo'), false);
});

Deno.test(`${blue('[helpers.ts]')} moreThanOrEqual`, () => {
	const search = moreThanOrEqual(5);
	assertEquals(search(5), true);
	assertEquals(search(6), true);
	assertEquals(search('foo'), false);
});

Deno.test(`${blue('[helpers.ts]')} lessThan`, () => {
	const search = lessThan(5);
	assertEquals(search(4), true);
	assertEquals(search('foo'), false);
});

Deno.test(`${blue('[helpers.ts]')} lessThanOrEqual`, () => {
	const search = lessThanOrEqual(5);
	assertEquals(search(5), true);
	assertEquals(search(4), true);
	assertEquals(search('foo'), false);
});

Deno.test(`${blue('[helpers.ts]')} between`, () => {
	const search = between(5, 10);
	assertEquals(search(7), true);
	assertEquals(search(5), false);
	assertEquals(search('foo'), false);
});

Deno.test(`${blue('[helpers.ts]')} betweenOrEqual`, () => {
	const search = betweenOrEqual(5, 10);
	assertEquals(search(7), true);
	assertEquals(search(5), true);
	assertEquals(search('foo'), false);
});

Deno.test(`${blue('[helpers.ts]')} exists`, () => {
	const search = exists();
	assertEquals(search(1), true);
	assertEquals(search({}), true);
	assertEquals(search(undefined), false);
});

Deno.test(`${blue('[helpers.ts]')} type`, () => {
	const searchString = type('string');
	assertEquals(searchString('foo'), true);
	assertEquals(searchString(0), false);

	const searchNumber = type('number');
	assertEquals(searchNumber(1), true);
	assertEquals(searchNumber({}), false);

	const searchBoolean = type('boolean');
	assertEquals(searchBoolean(true), true);
	assertEquals(searchBoolean({}), false);

	const searchArray = type('array');
	assertEquals(searchArray([]), true);
	assertEquals(searchArray({}), false);

	const searchObject = type('object');
	assertEquals(searchObject({}), true);
	assertEquals(searchObject([]), false);

	const searchNull = type('null');
	assertEquals(searchNull(null), true);
	assertEquals(searchNull({}), false);

	const searchOther = type('hahah' as 'null');
	assertEquals(searchOther('test'), false);
});

Deno.test(`${blue('[helpers.ts]')} includes`, () => {
	const search = includes(5);
	assertEquals(search([1, 2, 5, 6]), true);
	assertEquals(search([5]), true);
	assertEquals(search({}), false);
	assertEquals(search([1, 2, 3]), false);
});

Deno.test(`${blue('[helpers.ts]')} length`, () => {
	const search = length(0);
	assertEquals(search([]), true);
	assertEquals(search([0]), false);
	assertEquals(search({}), false);
});

Deno.test(`${blue('[helpers.ts]')} someElementMatch`, () => {
	const search = someElementMatch('bar', /bar/g);
	assertEquals(search(['foo', 'bar', 'baz']), true);
	assertEquals(search(['foo', 'barbaz']), false);
});

Deno.test(`${blue('[helpers.ts]')} everyElementMatch`, () => {
	const search = everyElementMatch('bar', (value) => typeof value === 'string');
	assertEquals(search(['bar', 'bar', 'bar']), true);
	assertEquals(search(['bar', 'bar', { foo: 'bar'}]), false);
});

Deno.test(`${blue('[helpers.ts]')} and`, () => {
	const search = and('bar', (value) => typeof value === 'string');
	assertEquals(search('bar'), true);
	assertEquals(search('foobar'), false);
});

Deno.test(`${blue('[helpers.ts]')} or`, () => {
	const search = or('bar', 'foo');
	assertEquals(search('bar'), true);
	assertEquals(search('foo'), true);
	assertEquals(search('foobar'), false);
});

Deno.test(`${blue('[helpers.ts]')} not`, () => {
	const search = not('bar');
	assertEquals(search('foo'), true);
	assertEquals(search('bar'), false);
});
