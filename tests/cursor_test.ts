import { assertEquals } from 'https://deno.land/std@0.102.0/testing/asserts.ts';
import { gray } from 'https://deno.land/std@0.102.0/fmt/colors.ts';

import { Database } from '../lib/database.ts';
import { Cursor } from '../lib/cursor.ts';

Deno.test({
	name: `${gray('[cursor.ts]')} getOne`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database();
		await db.insertOne({ test: 1 });
		await db.insertOne({ test: 2 });
		await db.insertOne({ test: '3' });
		const cursor = new Cursor(db, { test: (value: any) => typeof value === 'number' });

		const result = await cursor.getOne();
		assertEquals(result, { test: 1 });
	}
});

Deno.test({
	name: `${gray('[cursor.ts]')} getMany`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database();
		await db.insertOne({ test: 1 });
		await db.insertOne({ test: 2 });
		await db.insertOne({ test: '3' });
		const cursor = new Cursor(db, { test: (value: any) => typeof value === 'number' });

		const result = await cursor.getMany();
		assertEquals(result, [{ test: 1 }, { test: 2 }]);
	}
});

Deno.test({
	name: `${gray('[cursor.ts]')} count`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database();
		await db.insertOne({ test: 1 });
		await db.insertOne({ test: 2 });
		await db.insertOne({ test: '3' });
		const cursor = new Cursor(db, { test: (value: any) => typeof value === 'number' });

		const result = await cursor.count();
		assertEquals(result, 2);
	}
});

Deno.test({
	name: `${gray('[cursor.ts]')} skip`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database();
		await db.insertOne({ test: 1 });
		await db.insertOne({ test: 2 });
		await db.insertOne({ test: '3' });
		const cursor = new Cursor(db, { test: (value: any) => typeof value === 'number' });

		const result = await cursor.skip(1).getOne();
		assertEquals(result, { test: 2 });
	}
});

Deno.test({
	name: `${gray('[cursor.ts]')} limit`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database();
		await db.insertOne({ test: 1 });
		await db.insertOne({ test: 2 });
		await db.insertOne({ test: '3' });
		const cursor = new Cursor(db, {});

		const result = await cursor.limit(2).getMany();
		assertEquals(result, [{ test: 1 }, { test: 2 }]);
	}
});

Deno.test({
	name: `${gray('[cursor.ts]')} sort (String query)`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database();
		await db.insertOne({ test: 3 });
		await db.insertOne({ test: 1 });
		await db.insertOne({ test: 2 });
		const cursor = new Cursor(db, {});

		const result = await cursor.sort('test').getMany();
		assertEquals(result, [{ test: 1 }, { test: 2 }, { test: 3 }]);
	}
});

Deno.test({
	name: `${gray('[cursor.ts]')} sort (Sort query)`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database();
		await db.insertOne({ test: 1 });
		await db.insertOne({ test: 2 });
		await db.insertOne({ test: 3 });
		const cursor = new Cursor(db, {});

		const result = await cursor.sort({ test: 'desc' }).getMany();
		assertEquals(result, [{ test: 3 }, { test: 2 }, { test: 1 }]);
	}
});
