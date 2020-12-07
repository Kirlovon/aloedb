import DatabaseError from './error.ts';
import { DatabaseConfig, DataStorage, Document } from './types.ts';
import { prepareObject, isUndefined, isArray, isNumber, isObject } from './utils.ts';
import { writeFile, readFileSync, ensureFileSync, renameFile, fileExistsSync } from './files.ts';

/**
 * Storage manager. Responsible for writing and reading data.
 */
export default class Storage {
	/** Next data for writing. */
	private toWrite: Document[] | null = null;

	/** Lock writing. */
	private isLocked: boolean = false;

	/** Database configuration. */
	private readonly config: DatabaseConfig;

	/** Temporary file extension. */
	private readonly extension: string = '.temp';

	/** Storage initialization. */
	constructor(config: DatabaseConfig) {
		this.config = config;
	}

	/**
	 * Write data to the database file.
	 * @param documents Documents to write.
	 */
	public async write(documents: Document[]): Promise<void> {
		try {
			const { path, onlyInMemory, safeWrite } = this.config;
			const file: string = path as string;

			if (!path || onlyInMemory) return;

			if (this.isLocked) {
				this.toWrite = documents;
				return;
			}

			this.isLocked = true;

			const encoded: string = this.encode(documents);

			if (safeWrite) {
				const tempFile: string = file + this.extension;
				await writeFile(tempFile, encoded);
				await renameFile(tempFile, file);
			} else {
				await writeFile(file, encoded);
			}

			this.isLocked = false;

			if (isArray(this.toWrite)) {
				const toWriteCopy: Document[] = this.toWrite;
				this.toWrite = null;
				this.write(toWriteCopy);
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
			const { path, schemaValidator } = this.config;

			if (isUndefined(path)) return [];
			if (fileExistsSync(path) === false) {
				ensureFileSync(path, this.encode());
				return [];
			}

			const fileContent: string = readFileSync(path).trim();
			if (fileContent === '') return [];

			const parsedFile: DataStorage = JSON.parse(fileContent);

			if (!isNumber(parsedFile?.timestamp)) throw new TypeError('Field "timestamp" must be a number');
			if (!isArray(parsedFile?.documents)) throw new TypeError('Field "documents" must be an array');

			for (let i = 0; i < parsedFile.documents.length; i++) {
				const document: Document = parsedFile.documents[i];
				if (!isObject(document)) throw new TypeError('Field "documents" must contain only objects');
				prepareObject(document);
				if (schemaValidator) schemaValidator(document);
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

		const data: DataStorage = {
			timestamp: Date.now(),
			documents: documents,
		};

		const encoded: string = pretty ? JSON.stringify(data, null, '\t') : JSON.stringify(data);
		return encoded;
	}
}
