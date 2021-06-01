import { assertEquals, assertThrows } from 'https://deno.land/std/testing/asserts.ts';
import { dirname, fromFileUrl } from 'https://deno.land/std/path/mod.ts';
import { copy, ensureDir, emptyDir } from 'https://deno.land/std/fs/mod.ts';
import { magenta } from 'https://deno.land/std/fmt/colors.ts';
import { delay } from 'https://deno.land/std/async/mod.ts';

import { Database } from '../lib/database.ts';

// Prepare enviroment
const DIRNAME = dirname(fromFileUrl(import.meta.url));
const TEMP_PATH = DIRNAME + '/temp_database_tests_enviroment';
const ENVIROMENT_PATH = DIRNAME + '/enviroment';

await ensureDir(TEMP_PATH);
await emptyDir(TEMP_PATH)
await copy(ENVIROMENT_PATH, TEMP_PATH, { overwrite: true });

Deno.test({
	name: `${magenta('[database.ts]')} Initialization`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		new Database();
		new Database({});
		new Database({
			path: undefined,
			pretty: false,
			autoload: true,
			autosave: false,
			immutable: false,
			validator: () => { },
		});
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} Pretty`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const pretty = new Database({ path: TEMP_PATH + '/pretty_test.json', pretty: true });
		const notPretty = new Database({ path: TEMP_PATH + '/not_pretty_test.json', pretty: false });

		pretty.documents = [{ field: 0 }];
		notPretty.documents = [{ field: 0 }];

		pretty.save();
		notPretty.save();

		await delay(100);

		const prettyContent = await Deno.readTextFile(TEMP_PATH + '/pretty_test.json');
		assertEquals(prettyContent.includes('\t'), true);

		const notPrettyContent = await Deno.readTextFile(TEMP_PATH + '/not_pretty_test.json');
		assertEquals(notPrettyContent.includes('\t'), false);
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} Return immutability`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const immutable = new Database({ immutable: true });

		const immutable_insertOne = await immutable.insertOne({ field: 0 });
		immutable_insertOne.field = 1;

		const immutable_insertMany = await immutable.insertMany([{ field: 0 }]);
		immutable_insertMany[0].field = 1;

		const immutable_findOne = await immutable.findOne({ field: 0 }) as any;
		immutable_findOne.field = 1;

		const immutable_findMany = await immutable.findMany({ field: 0 });
		immutable_findMany[0].field = 1;
		immutable_findMany[1].field = 1;

		const immutable_updateOne = await immutable.updateOne({ field: 0 }, { field: 0 }) as any;
		immutable_updateOne.field = 1;

		const immutable_updateMany = await immutable.updateMany({ field: () => true }, {});
		immutable_updateMany[0].field = 1;
		immutable_updateMany[1].field = 1;
		immutable_updateMany.splice(0, 1);

		// Check if something changed
		assertEquals(immutable.documents[0].field, 0);
		assertEquals(immutable.documents[1].field, 0);

		/////////////////////////////////////////////////

		const notImmutable = new Database({ immutable: false });

		const notImmutable_insertOne = await notImmutable.insertOne({ field: 0 });
		notImmutable_insertOne.field = 1;
		assertEquals(notImmutable.documents[0].field, 1);

		const notImmutable_insertMany = await notImmutable.insertMany([{ field: 0 }]);
		notImmutable_insertMany[0].field = 1;
		assertEquals(notImmutable.documents[1].field, 1);

		const notImmutable_findOne = await notImmutable.findOne({ field: 1 }) as any;
		notImmutable_findOne.field = 2;
		assertEquals(notImmutable.documents[0].field, 2);

		const notImmutable_findMany = await notImmutable.findMany({ field: 1 });
		notImmutable_findMany[0].field = 2;
		assertEquals(notImmutable.documents[0].field, 2);
		assertEquals(notImmutable.documents[1].field, 2);

		const notImmutable_updateOne = await notImmutable.updateOne({ field: 2 }, { field: 2 }) as any;
		notImmutable_updateOne.field = 3;
		assertEquals(notImmutable.documents[0].field, 3);

		const notImmutable_updateMany = await notImmutable.updateMany({ field: () => true }, {});
		notImmutable_updateMany[0].field = 4;
		notImmutable_updateMany[1].field = 4;
		assertEquals(notImmutable.documents[0].field, 4);
		assertEquals(notImmutable.documents[1].field, 4);

	}
});

Deno.test({
	name: `${magenta('[database.ts]')} Storage Immutability`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database({ immutable: false }); // Insert should always be immutable, without any exceptions

		const oneDocument: any = { field: [1, 2, { foo: ['bar'] }] };
		await db.insertOne(oneDocument);
		oneDocument.field[2].foo[0] = 'baz';

		const multipleDocuments: any = [{ field: [0] }, { field: [1] }];
		await db.insertMany(multipleDocuments);
		multipleDocuments[0].field[0] = 999;
		multipleDocuments[1].field[0] = 999;
		multipleDocuments.push({ field: [999] });

		const oneUpdate = [0];
		await db.updateOne({ field: [0] }, { field: oneUpdate }) as any;
		oneUpdate[0] = 999;

		const multipleUpdate = [1];
		await db.updateMany({ field: [1] }, { field: multipleUpdate }) as any;
		multipleUpdate[0] = 999;
		multipleUpdate.push(999);

		assertEquals(db.documents, [
			{ field: [1, 2, { foo: ['bar'] }] },
			{ field: [0] },
			{ field: [1] }
		]);
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} insertOne`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database({ path: TEMP_PATH + '/insertOne_test.json', pretty: false, optimize: false });

		const inserted = await db.insertOne({ foo: 'bar' });
		assertEquals(db.documents, [{ foo: 'bar' }]);
		assertEquals(inserted, { foo: 'bar' });

		const content = await Deno.readTextFile(TEMP_PATH + '/insertOne_test.json');
		assertEquals(content, '[{"foo":"bar"}]');
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} insertOne (Empty)`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database({ path: TEMP_PATH + '/insertOne_empty_test.json', pretty: false, optimize: false });

		const inserted = await db.insertOne({});
		assertEquals(db.documents, []);
		assertEquals(inserted, {});

		const content = await Deno.readTextFile(TEMP_PATH + '/insertOne_empty_test.json');
		assertEquals(content, '[]');
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} insertMany`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database({ path: TEMP_PATH + '/insertMany_test.json', pretty: false, optimize: false });

		const inserted = await db.insertMany([{ foo: 'bar' }, { bar: 'foo' }, {}, ]);
		assertEquals(db.documents, [{ foo: 'bar' }, { bar: 'foo' }]);
		assertEquals(inserted, [{ foo: 'bar' }, { bar: 'foo' }]);

		const content = await Deno.readTextFile(TEMP_PATH + '/insertMany_test.json');
		assertEquals(content, '[{"foo":"bar"},{"bar":"foo"}]');
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} insertMany (Empty)`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database({ path: TEMP_PATH + '/insertMany_empty_test.json', pretty: false, optimize: false });

		const inserted = await db.insertMany([{}, {}, ]);
		assertEquals(db.documents, []);
		assertEquals(inserted, {});

		const content = await Deno.readTextFile(TEMP_PATH + '/insertMany_empty_test.json');
		assertEquals(content, '[]');
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} findOne`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database({ path: TEMP_PATH + '/findOne_test.json', pretty: false, optimize: false });

		const initialData = [
			{ id: 1, text: 'one', boolean: true, empty: null, array: [1], object: {} },
			{ id: 2, text: 'two', boolean: true, empty: null, array: [2], object: {} },
			{ id: 3, text: 'three', boolean: true, empty: null, array: [3], object: {} },
		];

		await db.insertMany(initialData);

		const found1 = await db.findOne({ id: 1 });
		const found2 = await db.findOne({ id: 2, notDefined: undefined, object: {} });
		const found3 = await db.findOne({ id: 3, text: /three/, boolean: (value) => value === true, empty: null, array: [3], object: {} });
		const found4 = await db.findOne((value) => value.id === 1);
		const found5 = await db.findOne({});
		const notFound1 = await db.findOne({ object: [] });
		const notFound2 = await db.findOne((value) => value.id === 4);

		assertEquals(found1, { id: 1, text: 'one', boolean: true, empty: null, array: [1], object: {} });
		assertEquals(found2, { id: 2, text: 'two', boolean: true, empty: null, array: [2], object: {} });
		assertEquals(found3, { id: 3, text: 'three', boolean: true, empty: null, array: [3], object: {} });
		assertEquals(found4, { id: 1, text: 'one', boolean: true, empty: null, array: [1], object: {} });
		assertEquals(found5, { id: 1, text: 'one', boolean: true, empty: null, array: [1], object: {} });
		assertEquals(notFound1, null);
		assertEquals(notFound2, null);

		(found1 as any).id = 999;
		(found2 as any).id = 999;
		(found3 as any).id = 999;
		(found4 as any).array.push(999);
		(found5 as any).array.push(999);

		assertEquals(db.documents, initialData);
	}
});

Deno.test({
	name: `${magenta('[database.ts]')} findMany`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const db = new Database({ path: TEMP_PATH + '/findMany_test.json', pretty: false, optimize: false });

		const initialData = [
			{ id: 1, text: 'one', boolean: true, empty: null, array: [1], object: {} },
			{ id: 2, text: 'two', boolean: true, empty: null, array: [2], object: {} },
			{ id: 3, text: 'three', boolean: true, empty: null, array: [3], object: {} },
		];

		await db.insertMany(initialData);

		const found1 = await db.findMany({ id: 1 });
		const found2 = await db.findMany({ id: 2, notDefined: undefined, object: {} });
		const found3 = await db.findMany({ boolean: (value) => value === true, object: {} });
		const found4 = await db.findMany((value) => value.id === 1);
		const found5 = await db.findMany({});
		const notFound1 = await db.findMany({ object: [] });
		const notFound2 = await db.findMany((value) => value.id === 4);

		assertEquals(found1, [{ id: 1, text: 'one', boolean: true, empty: null, array: [1], object: {} }]);
		assertEquals(found2, [{ id: 2, text: 'two', boolean: true, empty: null, array: [2], object: {} }]);
		assertEquals(found3, initialData);
		assertEquals(found4, [{ id: 1, text: 'one', boolean: true, empty: null, array: [1], object: {} }]);
		assertEquals(found5, initialData);
		assertEquals(notFound1, []);
		assertEquals(notFound2, []);

		(found1[0] as any).id = 999;
		(found2[0] as any).id = 999;
		(found3[0] as any).id = 999;
		(found4[0] as any).array.push(999);
		(found5[0] as any).array.push(999);

		assertEquals(db.documents, initialData);
	}
});

// TODO: Finish testing

// Remove temp files
window.addEventListener('unload', () => {
	Deno.removeSync(TEMP_PATH, { recursive: true });
});
