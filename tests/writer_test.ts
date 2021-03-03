import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { ensureDir, emptyDir } from 'https://deno.land/std/fs/mod.ts';
import { delay } from 'https://deno.land/std/async/mod.ts';

import { blue } from 'https://deno.land/std/fmt/colors.ts';
import * as path from 'https://deno.land/std/path/mod.ts';

import { Writer } from '../lib/writer.ts';

// Prepare inviroment
const DIRNAME = path.dirname(path.fromFileUrl(import.meta.url));
const TEMP_PATH = DIRNAME + '/temp_writer';

await ensureDir(TEMP_PATH);
await emptyDir(TEMP_PATH)

Deno.test(`${blue('[writer.ts]')} Write (Basic)`, async () => {
	const writer = new Writer(TEMP_PATH + '/test_storage_1.json');

	await writer.write('[{"foo":"bar"}]');

	const content = await Deno.readTextFile(TEMP_PATH + '/test_storage_1.json');
	assertEquals(content, '[{"foo":"bar"}]');
});

Deno.test(`${blue('[writer.ts]')} Write (Internal logic validation)`, async () => {
	const writer = new Writer(TEMP_PATH + '/test_storage_2.json');

	writer.write('[{"foo":"old"}]');

	assertEquals((writer as any).next, null);
	assertEquals((writer as any).locked, true);

	writer.write('[{"foo":"new"}]');

	await delay(1);

	assertEquals((writer as any).next, '[{"foo":"new"}]');
	assertEquals((writer as any).locked, true);

	await delay(10);

	const content = await Deno.readTextFile(TEMP_PATH + '/test_storage_2.json');
	assertEquals(content, '[{"foo":"new"}]');
});

// Remove temp files
window.addEventListener('unload', async () => {
	await Deno.remove(TEMP_PATH, { recursive: true });
});
