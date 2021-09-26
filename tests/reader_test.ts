import { assertEquals, assertThrows, assertThrowsAsync } from 'https://deno.land/std@0.102.0/testing/asserts.ts';
import { copy, ensureDir, emptyDir, exists, existsSync } from 'https://deno.land/std@0.102.0/fs/mod.ts';
import { dirname, fromFileUrl } from 'https://deno.land/std@0.102.0/path/mod.ts';
import { cyan } from 'https://deno.land/std@0.102.0/fmt/colors.ts';

import { Reader } from '../lib/reader.ts';

// Prepare inviroment
const DIRNAME = dirname(fromFileUrl(import.meta.url));
const TEMP_PATH = DIRNAME + '/temp_reader_tests_enviroment';
const ENVIROMENT_PATH = DIRNAME + '/enviroment';

await ensureDir(TEMP_PATH);
await emptyDir(TEMP_PATH)
await copy(ENVIROMENT_PATH, TEMP_PATH, { overwrite: true });

Deno.test({
	name: `${cyan('[reader.ts]')} Read Sync (Basic)`,
	sanitizeResources: false,
	sanitizeOps: false,

	fn() {
		const content = Reader.readSync(TEMP_PATH + '/test_storage.json');
		const originalContent = Deno.readTextFileSync(TEMP_PATH + '/test_storage.json');

		assertEquals(content, originalContent);
	}
});

Deno.test({
	name: `${cyan('[reader.ts]')} Read Sync (Path doesn't exists)`,
	sanitizeResources: false,
	sanitizeOps: false,

	fn() {
		const content = Reader.readSync(TEMP_PATH + '/created/storage_sync.json');
		assertEquals(content, '[]');

		const fileExists = existsSync(TEMP_PATH + '/created/storage_sync.json');
		assertEquals(fileExists, true);

		const fileContent = Deno.readTextFileSync(TEMP_PATH + '/created/storage_sync.json');
		assertEquals(fileContent, '[]');
	}
});

Deno.test({
	name: `${cyan('[reader.ts]')} Read Sync (Invalid path)`,
	sanitizeResources: false,
	sanitizeOps: false,

	fn() {
		assertThrows(() => Reader.readSync(TEMP_PATH), Deno.errors.PermissionDenied); // Its directory, not a file
	}
});

Deno.test({
	name: `${cyan('[reader.ts]')} Read (Basic)`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const content = await Reader.read(TEMP_PATH + '/test_storage.json');
		const originalContent = await Deno.readTextFile(TEMP_PATH + '/test_storage.json');

		assertEquals(content, originalContent);
	}
});

Deno.test({
	name: `${cyan('[reader.ts]')} Read (Path doesn't exists)`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const content = await Reader.read(TEMP_PATH + '/created/storage_async.json');
		assertEquals(content, '[]');

		const fileExists = await exists(TEMP_PATH + '/created/storage_async.json');
		assertEquals(fileExists, true);

		const fileContent = await Deno.readTextFile(TEMP_PATH + '/created/storage_async.json');
		assertEquals(fileContent, '[]');
	}
});

Deno.test({
	name: `${cyan('[reader.ts]')} Read (Invalid path)`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		await assertThrowsAsync(async () => await Reader.read(TEMP_PATH), Deno.errors.PermissionDenied); // Its directory, not a file
	}
});

// Remove temp files
window.addEventListener('unload', () => {
	Deno.removeSync(TEMP_PATH, { recursive: true });
});
