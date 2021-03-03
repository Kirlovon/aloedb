import { assertEquals, assertThrows, assertThrowsAsync } from 'https://deno.land/std/testing/asserts.ts';
import { copy, ensureDir, emptyDir, exists, existsSync } from 'https://deno.land/std/fs/mod.ts';

import { cyan } from 'https://deno.land/std/fmt/colors.ts';
import * as path from 'https://deno.land/std/path/mod.ts';

import { Reader } from '../lib/reader.ts';

// Prepare inviroment
const DIRNAME = path.dirname(path.fromFileUrl(import.meta.url));
const TEMP_PATH = DIRNAME + '/temp_reader';
const ENVIROMENT_PATH = DIRNAME + '/enviroments/reader';

await ensureDir(TEMP_PATH);
await emptyDir(TEMP_PATH)
await copy(ENVIROMENT_PATH, TEMP_PATH, { overwrite: true });

Deno.test(`${cyan('[reader.ts]')} Read Sync (Basic)`, () => {
	const content = Reader.readSync(TEMP_PATH + '/test_storage.json');
	const originalContent = Deno.readTextFileSync(TEMP_PATH + '/test_storage.json');

	assertEquals(content, originalContent);
});

Deno.test(`${cyan('[reader.ts]')} Read Sync (Path doesn't exists)`, () => {
	const content = Reader.readSync(TEMP_PATH + '/created/storage_sync.json');
	assertEquals(content, '[]');

	const fileExists = existsSync(TEMP_PATH + '/created/storage_sync.json');
	assertEquals(fileExists, true);

	const fileContent = Deno.readTextFileSync(TEMP_PATH + '/created/storage_sync.json');
	assertEquals(fileContent, '[]');
});

Deno.test(`${cyan('[reader.ts]')} Read Sync (Invalid path)`, () => {
	assertThrows(() => Reader.readSync(TEMP_PATH)); // Its directory, not a file
});


Deno.test(`${cyan('[reader.ts]')} Read (Basic)`, async () => {
	const content = await Reader.read(TEMP_PATH + '/test_storage.json');
	const originalContent = await Deno.readTextFile(TEMP_PATH + '/test_storage.json');

	assertEquals(content, originalContent);
});

Deno.test(`${cyan('[reader.ts]')} Read (Path doesn't exists)`, async () => {
	const content = await Reader.read(TEMP_PATH + '/created/storage_async.json');
	assertEquals(content, '[]');

	const fileExists = await exists(TEMP_PATH + '/created/storage_async.json');
	assertEquals(fileExists, true);

	const fileContent = await Deno.readTextFile(TEMP_PATH + '/created/storage_async.json');
	assertEquals(fileContent, '[]');
});

Deno.test(`${cyan('[reader.ts]')} Read (Invalid path)`, async () => {
	await assertThrowsAsync(async () => await Reader.read(TEMP_PATH)); // Its directory, not a file
});

// Remove temp files
window.addEventListener('unload', async () => {
	await Deno.remove(TEMP_PATH, { recursive: true });
});
