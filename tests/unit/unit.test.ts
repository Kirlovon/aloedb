import { assert, assertEquals, assertNotEquals } from 'https://deno.land/std/testing/asserts.ts';

import { 
    isObjectEmpty,
    getObjectLength,
    deepClone,
    deepCompare,
    getNestedValue,
    setNestedValue
} from '../../lib/utils.ts';

Deno.test('[utils.ts] isObjectEmpty', () => {
    assertEquals(isObjectEmpty({}), true);
    assertEquals(isObjectEmpty({ key: undefined }), false);
});

Deno.test('[utils.ts] getObjectLength', () => {
    assertEquals(getObjectLength({}), 0);
    assertEquals(getObjectLength({ key: undefined }), 1);
    assertEquals(getObjectLength({ test1: 1, test2: 2, test3: 3 }), 3);
});

Deno.test('[utils.ts] deepClone ( Primitives )', () => {
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

Deno.test('[utils.ts] deepClone ( Objects & Arrays )', () => {
    const a = [1, 'test', true, null, undefined];
    const b = {
        a: 1,
        b: 'test',
        c: true,
        d: null,
        e: undefined
    }

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

Deno.test('[utils.ts] deepClone ( Mixed )', () => {
    const object: any = {
        a: 1,
        b: 'text',
        c: true,
        d: undefined,
        e: null,
        f: { test: null, value: undefined, x: [1, 2, 3], z: { test: 'text' }},
        g: [1, true, 'text', null, undefined, { test: 1 }, [1, 2, 3]],
    }

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