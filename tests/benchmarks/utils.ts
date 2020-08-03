export interface BenchmarkDocument {
	number: number;
	string: string;
	array: number[];
	object: { boolean: boolean };
}

export function CalculateResult(results: number[], ops: number): string {
	if (results.length === 0) return 'invalid';

	const average = results.reduce((a, b) => a + b) / results.length;
	const modified = Math.round(ops / (average / 1000));
	const formated = modified.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	return formated;
}