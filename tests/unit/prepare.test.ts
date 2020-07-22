import { assertEquals, assertThrows } from 'https://deno.land/std/testing/asserts.ts';
import { green } from 'https://deno.land/std/fmt/colors.ts';

import { 
    prepareArray,
    prepareObject
} from '../../lib/prepare.ts';
import { deepCompare } from '../../lib/utils.ts';

Deno.test(`${green('[prepare.ts]')} prepareArray`, () => {
    const a: any = [
        1,
        'text',
        true,
        undefined,
        null,
        { test: null, test2: undefined, test3: [1, 2, 3] },
        [ null, undefined, { test: undefined } ]
    ]

    const b: any = [
        1,
        'text',
        true,
        undefined,
        null,
        [ null, undefined, { test: new Date() } ]
    ]

    prepareArray(a);
    assertEquals(a, [
        1,
        'text',
        true,
        null,
        null,
        { test: null, test3: [1, 2, 3] },
        [ null, null, { } ]
    ]);

    assertThrows(() => prepareArray(b));
});

Deno.test(`${green('[prepare.ts]')} prepareObject`, () => {
    const a: any = {
        a: 1,
        b: 'text',
        c: true,
        d: undefined,
        e: null,
        f: { value: undefined },
        g: [1, 2, undefined]
    }
    
    const b: any = {
        'a': undefined,
        'f.test': { value: undefined },
    }

    const c: any = {
        a: 1,
        b: new Date(),
    }

    prepareObject(a);
    assertEquals(a, {
        a: 1,
        b: 'text',
        c: true,
        e: null,
        f: {},
        g: [1, 2, null]
    });

    assertThrows(() => prepareObject(b));
    assertThrows(() => prepareObject(c));
});