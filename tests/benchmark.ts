import { AloeDB, Operators } from '../mod.ts';
import { type } from '../lib/operators.ts';

/**
 * At this moment, this benchmark should not be taken seriously, the data may not be accurate.
 */

const DocumentsCount = 1000;
const Iterations = 10;

interface Results {
	insert: number[];
	find: number[];
	count: number[];
	update: number[];
	delete: number[];
}

interface TestDocument {
	number: number;
	string: string;
	deleted: undefined;
	array: number[];
	object: { boolean: boolean };
}

const results: Results = {
	insert: [],
	find: [],
	count: [],
	update: [],
	delete: [],
};

const db = new AloeDB<TestDocument>({ filePath: 'text.txt' });

for (let i = 0; i < Iterations; i++) {
	console.log('iteration', i);

	await insertBenchmark();
	await updateBenchmark();
	await countBenchmark();
	await findBenchmark();
	await deleteBenchmark();
}

async function insertBenchmark(): Promise<void> {
	const start = performance.now();

	for (let j = 0; j < DocumentsCount; j++) {
		await db.insertOne({
			number: j,
			string: `test-${j}`,
			deleted: undefined,
			array: [j, j, j],
			object: { boolean: true },
		});
	}

	const end = performance.now();
	results.insert.push(end - start);
}

async function findBenchmark(): Promise<void> {
	const start = performance.now();

	for (let j = 0; j < DocumentsCount; j++) {
		const result = await db.findOne({
			number: j,
			array: [j, j, j],
			object: { boolean: false },
		});
	}

	const end = performance.now();
	results.find.push(end - start);
}

async function countBenchmark(): Promise<void> {
	const start = performance.now();

	for (let j = 0; j < DocumentsCount; j++) {
		const result = await db.count({
			number: j,
			array: [j, j, j],
			object: { boolean: false },
		});
	}

	const end = performance.now();
	results.count.push(end - start);
}

async function updateBenchmark(): Promise<void> {
	const start = performance.now();

	for (let j = 0; j < DocumentsCount; j++) {
		const result = await db.updateOne(
			{ number: j },
			{
				number: j,
				string: `x-${j}`,
				array: [1, 1, 1],
				object: { boolean: false },
			}
		);
	}

	
	const end = performance.now();
	results.update.push(end - start);
}

async function deleteBenchmark(): Promise<void> {
	const start = performance.now();

	await db.deleteMany({
		string: /x/,
		array: [1, 1, 1],
		object: { boolean: false },
	});

	const end = performance.now();
	results.delete.push(end - start);
}

function calculate(nums: number[]) {
	const average = nums.reduce((a, b) => a + b) / nums.length;
	return numberWithCommas(Math.round(DocumentsCount / (average / 1000)));
}

function numberWithCommas(x: number) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

console.log(results);
console.log('insert:', calculate(results.insert), 'ops/sec');
console.log('find:', calculate(results.find), 'ops/sec');
console.log('count:', calculate(results.count), 'ops/sec');
console.log('update:', calculate(results.update), 'ops/sec');
console.log('delete:', calculate(results.delete), 'ops/sec');
