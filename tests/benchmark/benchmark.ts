import { Database } from '../../mod.ts';
import { RunBenchmark } from './utils.ts';

// Path to the temp file
const TEMP_FILE: string = './temp_benchmark_db.json';

// Initialization
const db = new Database({ path: TEMP_FILE, autosave: true, immutable: true, pretty: false, optimize: true  });

// Running insertion operations
await RunBenchmark('Insertion', 1000, async (iteration) => {
	await db.insertOne({ foo: 'bar' + iteration });
});

// Running searching operations
await RunBenchmark('Searching', 1000, async (iteration) => {
	await db.findOne({ foo: 'bar' + iteration });
});

// Running updating operations
await RunBenchmark('Updating', 1000, async (iteration) => {
	await db.updateOne({ foo: 'bar' + iteration }, { foo: 'bar' + iteration });
});

// Running deleting operations
await RunBenchmark('Deleting', 1000, async (iteration) => {
	await db.deleteMany({ foo: 'bar' + iteration });
});

// Remove temp file
setTimeout(() => {
	Deno.removeSync(TEMP_FILE);
}, 1000);

