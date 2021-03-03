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
	  * @param pretty Write data in easy-to-read format.
	  */
	constructor(path: string) {
		this.path = path;
	}

	 /**
	  * Write data to the database file.
	  * @param data Data to write.
	  */
	public async write(data: string): Promise<void> {

		// Add writing to the queue if writing is locked
		if (this.locked) {
			this.next = data;
			return;
		}

		// Lock writing
		this.locked = true;

		// Write data
		const temp: string = this.path + this.extension;
		await Deno.writeTextFile(temp, data);
		await Deno.rename(temp, this.path);

		// Unlock writing
		this.locked = false;

		// Start next writing if there is data in the queue
		if (this.next) {
			const nextCopy: string = this.next;
			this.next = null;
			this.write(nextCopy);
		}
	}
}
