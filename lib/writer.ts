// Copyright 2020-2021 the AloeDB authors. All rights reserved. MIT license.

import { Document } from './types.ts';

/**
 * Data writing manager.
 * Uses atomic writing and prevents race condition.
 */
export class Writer {

	/** Next data for writing. */
	private next: Document[] | null = null;

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
	 * Batch data writing.
	 * Do not call this method with `await`, otherwise the result of this method will be identical to the `write()` method.
	 *
	 * @param documents Array with documents to write.
	 * @param pretty Write data in easy-to-read format.
	 */
	public async batchWrite(documents: Document[], pretty: boolean): Promise<void> {
		if (this.locked) {
			this.next = documents;
			return;
		}

		try {
			this.locked = true;
			await this.write(documents, pretty);
		} finally {
			this.locked = false;
		}

		if (this.next) {
			const nextCopy = this.next;
			this.next = null;
			this.batchWrite(nextCopy, pretty);
		}
	}

	/**
	  * Write data to the database file.
	  * @param documents Array with documents to write.
	  * @param pretty Write data in easy-to-read format.
	  */
	public async write(documents: Document[], pretty: boolean): Promise<void> {
		const temp: string = this.path + this.extension;
		const encoded: string = pretty ? JSON.stringify(documents, null, '\t') : JSON.stringify(documents);

		await Deno.writeTextFile(temp, encoded);
		await Deno.rename(temp, this.path);
	}
}
