/**
 * Run benchmark test
 * @param name Name of the benchmark
 * @param iterations Amount of iterations
 * @param test Test to run
 */
export async function RunBenchmark(name: string, iterations: number, test: (iteration: number) => Promise<void>): Promise<void> {
	const testStart = performance.now();
	for (let i = 0; i < iterations; i++) await test(i);
	const testEnd = performance.now();

	const timeResult = testEnd - testStart;
	const operationsCount = 1000 / (timeResult / iterations);
	const formated = formatNumber(operationsCount);

	console.log(`${name}: ${formated} ops/sec (${timeResult.toFixed(2)} ms)`);
}

/**
 * Format big numbers to more readable format (16000000 -> 16M)
 * @param number Number to format
 * @returns Formated number
 */
export function formatNumber(number: number): string {
	if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M';
	if (number >= 1000) return (number / 1000).toFixed(1) + 'K';
	return number.toFixed(1);
}

/**
 * Generate random ID
 * @param length Length of the id
 * @returns Random id
 */
export function randomID(length: number = 32): string {
	const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}

	return result;
};
