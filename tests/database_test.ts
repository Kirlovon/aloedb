import { assertEquals } from 'https://deno.land/std@0.199.0/assert/mod.ts';
import { Database } from '../mod.ts';

Deno.test('Initialization', async () => {
	const db = new Database();
	await db.open();
	db.close();
});

Deno.test('Collection', async () => {
	const db = new Database('users_test_1');
	const users = db.collection({ name: 'users' });

	const newUser = await users.insertOne({ name: 'bob' });
	const allUsers = await users.documents();

	assertEquals(allUsers, [newUser]);

	await users.drop();
	db.close();
});
