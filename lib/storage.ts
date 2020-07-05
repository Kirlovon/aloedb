import DatabaseError from './error.ts';
import { prepareObject } from './preparer.ts';
import { isUndefined, isArray, isNumber, isObject } from './types.ts';
import { DatabaseConfig, DatabaseFile, Document } from './declarations.ts';
import { writeFile, readFileSync, ensureFileSync, renameFile, fileExistsSync } from './files.ts';

class Storage {
	/** Database configuration. */
	private config: DatabaseConfig;

	/** Next data for writing. */
	private toWrite: Document[] | null = null;

	/** Lock writing. */
	private isLocked: boolean = false;

	/** Temporary file extension. */
	private extension: string = '.temp';

	/** Storage initialization. */
	constructor(config: DatabaseConfig) {
		this.config = config;
	}

	/**
	 * Write data to the database file.
	 */
	public async write(documents: Document[]): Promise<void> {
		try {
			const { filePath, onlyInMemory, safeWrite } = this.config;
			const file = filePath as string;

			// Skip writing if file not specified or only in memory mode enabled
			if (!filePath || onlyInMemory) return;

			// Skip writing if it is locked
			if (this.isLocked) {
				this.toWrite = documents;
				return;
			}

			// Lock writing
			this.isLocked = true;

			// Encode data
			const encoded = this.encode(documents);

			// Write data to the file
			if (safeWrite) {
				const tempFile = file + this.extension;
				await writeFile(tempFile, encoded);
				await renameFile(tempFile, file);
			} else {
				await writeFile(file, encoded);
			}

			// Unlock writing
			this.isLocked = false;

			// Start next writing
			if (isArray(this.toWrite)) {
				const toWriteCopy: Document[] = this.toWrite;
				this.toWrite = null;

				await this.write(toWriteCopy);
			}
		} catch (error) {
			throw new DatabaseError('Error writing database file', error);
		}
	}

	/**
	 * Read and parse database file.
	 * @returns Database data as an object.
	 */
	public read(): Document[] {
		try {
			const { filePath } = this.config;

			// If file is not specified
			if (isUndefined(filePath)) return [];

			// If files not found
			if (fileExistsSync(filePath) === false) {
				ensureFileSync(filePath, this.encode());
				return [];
			}

			// Read & Parse database file
			const fileContent: string = readFileSync(filePath);
			const parsedFile: DatabaseFile = JSON.parse(fileContent);

			// Validate data from file
			if (!isNumber(parsedFile?.timestamp)) throw new TypeError('Field "timestamp" must be a number');
			if (!isArray(parsedFile?.documents)) throw new TypeError('Field "documents" must be an array');

			// Validate documents from file
			for (let i = 0; i < parsedFile.documents.length; i++) {
				const document: Document = parsedFile.documents[i];
				if (!isObject(document)) throw new TypeError('Field "documents" must contain only objects');
				prepareObject(document);
			}

			return parsedFile.documents;
		} catch (error) {
			throw new DatabaseError('Error reading database file', error);
		}
	}

	/**
	 * Encodes data in suitable format.
	 * @param documents Documents to encode.
	 * @returns Encoded data.
	 */
	private encode(documents: Document[] = []): string {
		const { pretty } = this.config;

		// Specify data
		const data: DatabaseFile = {
			timestamp: Date.now(),
			documents: documents,
		};

		// Stringify data
		const encoded: string = pretty ? JSON.stringify(data, null, '\t') : JSON.stringify(data);

		return encoded;
	}
}

export default Storage;
