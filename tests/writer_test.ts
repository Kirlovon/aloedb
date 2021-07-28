import { assertEquals } from 'https://deno.land/std@0.102.0/testing/asserts.ts';
import { ensureDir, emptyDir } from 'https://deno.land/std@0.102.0/fs/mod.ts';
import { delay } from 'https://deno.land/std@0.102.0/async/mod.ts';

import { red } from 'https://deno.land/std@0.102.0/fmt/colors.ts';
import { dirname, fromFileUrl } from 'https://deno.land/std@0.102.0/path/mod.ts';

import { Writer } from '../lib/writer.ts';

// Prepare enviroment
const DIRNAME = dirname(fromFileUrl(import.meta.url));
const TEMP_PATH = DIRNAME + '/temp_writer_tests_enviroment';

await ensureDir(TEMP_PATH);
await emptyDir(TEMP_PATH);

Deno.test({
	name: `${red('[writer.ts]')} Write`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const writer = new Writer(TEMP_PATH + '/test_storage_1.json');

		await writer.write([{ foo: 'bar' }], false);

		const content = await Deno.readTextFile(TEMP_PATH + '/test_storage_1.json');
		assertEquals(content, '[{"foo":"bar"}]');
	}
});

Deno.test({
	name: `${red('[writer.ts]')} Batch write`,
	sanitizeResources: false,
	sanitizeOps: false,

	async fn() {
		const writer = new Writer(TEMP_PATH + '/test_storage_2.json');

		writer.batchWrite([{ foo: 'old' }], false);
		writer.batchWrite([{ foo: 'new' }], false);

		await delay(100);

		const content = await Deno.readTextFile(TEMP_PATH + '/test_storage_2.json');
		assertEquals(content, '[{"foo":"new"}]');
	}
});

// Remove temp files
window.addEventListener('unload', () => {
	Deno.removeSync(TEMP_PATH, { recursive: true });
});
