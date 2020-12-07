import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { yellow } from 'https://deno.land/std/fmt/colors.ts';

import { matchValues } from '../lib/core.ts';

Deno.test(`${yellow('[core.ts]')} matchValues`, () => {
	assertEquals(matchValues('test', 'test'), true);
	assertEquals(matchValues(88, 88), true);
	assertEquals(matchValues(true, true), true);
	assertEquals(matchValues(null, null), true);
	assertEquals(matchValues(undefined, undefined as any), true);
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
