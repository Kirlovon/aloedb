import { assert, assertEquals, assertNotEquals } from 'https://deno.land/std/testing/asserts.ts';
import { green } from 'https://deno.land/std/fmt/colors.ts';

import { 
    cleanArray,
    isObjectEmpty,
    getObjectLength,
    deepClone,
    deepCompare,
    getNestedValue,
    setNestedValue
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

Deno.test(`${green('[utils.ts]')} deepClone ( Mixed )`, () => {
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
        e: undefined
    }

    assertEquals(deepCompare(a, a), true);
    assertEquals(deepCompare(b, b), true);

    assertEquals(deepCompare(a, [1, 'test', true, null]), false);
    assertEquals(deepCompare(b, {
        a: 1,
        b: 'test',
        c: true,
        d: null
    }), false);
});

Deno.test(`${green('[utils.ts]')} getNestedValue`, () => {
    const object: any = {
        a: 1,
        b: 'text',
        c: true,
        d: undefined,
        e: null,
        f: { test: null, value: undefined, x: [1, 2, 3], z: { test: 'text' }},
        g: [1, true, 'text', null, undefined, { test: 1 }, [1, 2, 3]],
    }

    const a = getNestedValue('d', object);
    const b = getNestedValue('f.test', object);
    const c = getNestedValue('f.z.test', object);
    const d = getNestedValue('g.0', object);
    const e = getNestedValue('g.6.2', object);

    const f = getNestedValue('x', object);
    const g = getNestedValue('f.0', object);
    const h = getNestedValue('g.6.99', object);

    assertEquals(a, undefined);
    assertEquals(b, null);
    assertEquals(c, 'text');
    assertEquals(d, 1);
    assertEquals(e, 3);

    assertEquals(f, undefined);
    assertEquals(g, undefined);
    assertEquals(h, undefined);
});

Deno.test(`${green('[utils.ts]')} setNestedValue`, () => {
    const object: any = {
        a: 1,
        b: 'text',
        c: true,
        d: undefined,
        e: null,
        f: { test: null, value: undefined, x: [1, 2, 3], z: { test: 'text' }},
        g: [1, true, 'text', null, undefined, { test: 1 }, [1, 2, 3]],
        hh: [1, 2, 3]
    }

    setNestedValue('d', 300, object);
    setNestedValue('f.test', true, object);
    setNestedValue('f.z.test', 'other', object);
    setNestedValue('g.0', 666, object);
    setNestedValue('g.6.2', { test: true }, object);

    assertEquals(object.d, 300);
    assertEquals(object.f.test, true);
    assertEquals(object.f.z.test, 'other');
    assertEquals(object.g[0], 666);
    assertEquals(object.g[6][2], { test: true });

    setNestedValue('d.test.0.0', 0, object);
    setNestedValue('a.b.c', { test: false }, object);
    setNestedValue('x.y.0', [1, 2, 3], object);
    setNestedValue('g.z.0.2', { x: [0, 0, 0] }, object);
    setNestedValue('g.0.0.2', 'test', object);
    setNestedValue('hh.10.z', [1, 2, 3], object);

    assertEquals(object.d.test[0][0], 0);
    assertEquals(object.a.b.c, { test: false });
    assertEquals(object.x.y[0], [1, 2, 3]);
    assertEquals(object.g.z[0][2], { x: [0, 0, 0] });
    assertEquals(object.g[0][0][2], 'test');
});