import { Database } from '../../mod.ts';
import { BenchmarkDocument, CalculateResult } from './utils.ts';

/**
 * At this moment, this benchmark should not be taken seriously, the data may not be accurate.
 */

const DocumentsCount = 1000;
const Iterations = 10;
const Results = [];

const db = new Database<BenchmarkDocument>({ onlyInMemory: true });

for (let i = -1; i < Iterations; i++) {
    const first: boolean = i === -1;

    db.documents = [];
    for (let i = 0; i < DocumentsCount; i++) {
        db.documents.push({
			number: i,
			string: `test-${i}`,
			array: [i, i, i],
			object: { boolean: true },
		});
    }

    const time = await FindOneBenchmark();
    if (first) continue;

    Results.push(time);
}

async function FindOneBenchmark(): Promise<number> {
    const start = performance.now();
    
    for (let i = 0; i < DocumentsCount; i++) {
        await db.findOne({
            number: i,
            string: `test-${i}`,
            array: [i, i, i],
            object: { boolean: true },
        });
    }

    const end = performance.now();
    return end - start;
}

console.log('FindOne:', CalculateResult(Results, DocumentsCount), 'ops/sec');