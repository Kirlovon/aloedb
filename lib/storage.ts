import DatabaseError from './error.ts';
import { prepareObject } from './utils.ts';
import { isUndefined, isArray, isNumber, isObject } from './types.ts';
import { DatabaseConfig, DatabaseFile, Document } from './declarations.ts';
import { writeFile, readFileSync, ensureFileSync, renameFile, fileExistsSync } from './files.ts';

export class Storage {
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
			const file: string = filePath as string;

			if (!filePath || onlyInMemory) return;
			if (this.isLocked) {
				this.toWrite = documents;
				return;
			}

			this.isLocked = true;
			const encoded: string = this.encode(documents);

			if (safeWrite) {
				const tempFile = file + this.extension;
				await writeFile(tempFile, encoded);
				await renameFile(tempFile, file);
			} else {
				await writeFile(file, encoded);
			}

			this.isLocked = false;

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

			if (isUndefined(filePath)) return [];
			if (fileExistsSync(filePath) === false) {
				ensureFileSync(filePath, this.encode());
				return [];
			}

			const fileContent: string = readFileSync(filePath);
			if (fileContent.trim() === '') return [];

			const parsedFile: DatabaseFile = JSON.parse(fileContent);

			if (!isNumber(parsedFile?.timestamp)) throw new TypeError('Field "timestamp" must be a number');
			if (!isArray(parsedFile?.documents)) throw new TypeError('Field "documents" must be an array');

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

		const data: DatabaseFile = {
			timestamp: Date.now(),
			documents: documents,
		};

		const encoded: string = pretty ? JSON.stringify(data, null, '\t') : JSON.stringify(data);
		return encoded;
	}
}

export default Storage;
