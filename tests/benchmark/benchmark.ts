import { Database } from '../../mod.ts';
import { RunBenchmark, randomID, delay } from './utils.ts';

const TEMP_FILE: string = './temp_benchmark_db.json';
const ITERATIONS = 1000;

const IDS: string[] = [];
for (let i = 0; i < ITERATIONS; i++) IDS.push(randomID());

// Initialization
const db = new Database({ path: TEMP_FILE, autosave: true, immutable: true, pretty: true, batching: true });

// Running insertion operations
await RunBenchmark('Insertion', ITERATIONS, async (iteration) => {
	await db.insertOne({ foo: IDS[iteration], i: iteration });
});

await delay(500);

// Running searching operations
await RunBenchmark('Searching', ITERATIONS, async (iteration) => {
	await db.findOne({ foo: IDS[iteration] });
});

await delay(500);

// Running updating operations
await RunBenchmark('Updating', ITERATIONS, async (iteration) => {
	await db.updateMany({ foo: IDS[iteration] }, { foo: IDS[iteration] });
});

await delay(500);

// Running deleting operations
await RunBenchmark('Deleting', ITERATIONS, async (iteration) => {
	await db.deleteMany({ foo: IDS[iteration] });
});

// Remove temp file
setTimeout(() => {
	Deno.removeSync(TEMP_FILE);
}, 1000);

