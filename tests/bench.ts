const arr: string[] = [];
const set = new Set();

for (let i = 0; i < 5000000; i++) {
	arr.push(i + '');
	set.add(i + '');
}

Deno.bench('array iter', () => {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] === 'a') console.log(123);
	}
});

Deno.bench('set iter', () => {
	for (const key of set) {
		if (key === 'a') console.log(123);
	}
});

Deno.bench('array includes', () => {
	for (let i = 0; i < arr.length; i++) {
		arr.includes(arr[i] + 'a');
	}
});

Deno.bench('set has', () => {
	for (const key of set) {
		set.has(key + 'a');
	}
});
