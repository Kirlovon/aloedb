import { DatabaseError } from './error.ts';
import { DatabaseConfig, DataStorage, Document } from './types.ts';
import { isUndefined, isArray, isNumber, isObject, getPathDirname, prepareObject } from './utils.ts';

/**
 * Storage manager. Responsible for writing and reading data.
 * The only file that contains platform specific code.
 */
export class Storage {
	/** Next data for writing. */
	private toWrite: Document[] | null = null;

	/** Lock writing. */
	private isLocked: boolean = false;

	/** Database configuration. */
	private readonly config: DatabaseConfig;

	/** Temporary file extension. */
	private readonly extension: string = '.temp';

	/**
	 * Storage initialization. 
	 * @param config Database config.
	 */
	constructor(config: DatabaseConfig) {
		this.config = config;
	}

	/**
	 * Write data to the database file.
	 * @param documents Documents to write.
	 */
	public async write(documents: Document[]): Promise<void> {
		try {
			const { path, onlyInMemory } = this.config;
			const file: string = path as string;

			if (!path || onlyInMemory) return;

			if (this.isLocked) {
				this.toWrite = documents;
				return;
			}

			this.isLocked = true;

			const encoded: string = this.encode(documents);
			const tempFile: string = file + this.extension;

			await Deno.writeTextFile(tempFile, encoded);
			await Deno.rename(tempFile, file);

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
			if (existsSync(path) === false) {
				ensureFileSync(path, this.encode());
				return [];
			}

			const fileContent: string = Deno.readTextFileSync(path).trim();
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

/**
 * Test whether or not the given path exists by checking with the file system
 * @param path Path to the file.
 * @returns Is file exists.
 */
function existsSync(path: string): boolean {
	try {
		Deno.lstatSync(path);
		return true;
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) return false;
		throw error;
	}
}

/**
 * Ensures that the file exists synchronously.
 * @param path Path to the file.
 * @param data Data to write to if file not exists.
 * @returns Is file created.
 */
function ensureFileSync(path: string, data: string = ''): void {
	try {
		const info = Deno.lstatSync(path);
		if (!info.isFile) throw new Error('Invalid file specified');
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			const dirname: string = getPathDirname(path);
			ensureDirSync(dirname);
			Deno.writeTextFileSync(path, data);
			return;
		}

		throw error;
	}
}

/**
 * Ensures that the file directory synchronously.
 * @param path Path to the directory.
 * @returns Is directory created.
 */
function ensureDirSync(path: string): void {
	try {
		const info: Deno.FileInfo = Deno.lstatSync(path);
		if (!info.isDirectory) throw new Error('Invalid directory specified');
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			Deno.mkdirSync(path, { recursive: true });
			return;
		}

		throw error;
	}
}
