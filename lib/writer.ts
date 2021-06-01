// Copyright 2020-2021 the AloeDB authors. All rights reserved. MIT license.

/**
 * Data writing manager.
 * Uses atomic writing and prevents race condition.
 */
export class Writer {

	/** Next data for writing. */
	private next: string | null = null;

	/** Lock writing. */
	private locked: boolean = false;

	/** Path to the database file. */
	private readonly path: string;

	/** Temporary file extension. */
	private readonly extension: string = '.temp';

	/**
	 * Storage initialization.
	 * @param path Path to the database file.
	 */
	constructor(path: string) {
		this.path = path;
	}

	/**
	 * Add data to the writing queue.
	 * Do not call this method with `await`, otherwise the result of this method will be identical to the `write()` method.
	 *
	 * @param data Data to add to the queue.
	 */
	public async add(data: string): Promise<void> {
		if (this.locked) {
			this.next = data;
			return;
		}

		try {
			this.locked = true;
			await this.write(data);
		} finally {
			this.locked = false;
		}

		if (this.next) {
			const nextCopy: string = this.next;
			this.next = null;
			this.add(nextCopy);
		}
	}

	/**
	  * Write data to the database file.
	  * @param data Data to write.
	  */
	public async write(data: string): Promise<void> {
		const temp: string = this.path + this.extension;
		await Deno.writeTextFile(temp, data);
		await Deno.rename(temp, this.path);
	}
}
