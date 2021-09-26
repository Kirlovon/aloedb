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

	/** Write data in easy-to-read format. */
	private readonly pretty: boolean;

	/**
	 * Writer initialization.
	 * @param path Path to the database file.
	 * @param pretty Write data in easy-to-read format.
	 */
	constructor(path: string, pretty: boolean) {
		this.path = path;
		this.pretty = pretty;
	}

	/**
	 * Safe & fast data writing.
	 * If you call this method with `await`, the data will be writen without batching.
	 *
	 * @param documents Array with documents to write.
	 */
	public async write(documents: Document[]): Promise<void> {
		if (this.locked) {
			this.next = documents;
			return;
		}

		this.locked = true;

		try {

			const temp: string = this.path + '.temp';
			const serialized: string = this.pretty
				? JSON.stringify(documents, null, '\t')
				: JSON.stringify(documents);

			// Atomic write
			await Deno.writeTextFile(temp, serialized);
			await Deno.rename(temp, this.path);

		} finally {
			this.locked = false;
		}

		if (this.next) {
			const nextCopy = this.next;
			this.next = null;
			await this.write(nextCopy);
		}
	}
}
