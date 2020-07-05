/*
	Functions for file system manipulation.
	Lightweight version of standard library module. ( https://deno.land/std/fs )
	TODO: Сan be replaced with a standard module when it becomes stable.
*/

/**
 * Write content to the file.
 * @param filePath Path to the file.
 * @param content Content to write.
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
	await Deno.writeTextFile(filePath, content);
}

/**
 * Write content to the file synchronously.
 * @param filePath Path to the file.
 * @param content Content to write.
 */
export function writeFileSync(filePath: string, content: string): void {
	Deno.writeTextFileSync(filePath, content);
}

/**
 * Read file.
 * @param filePath Path to the file.
 * @retunrs File content.
 */
export async function readFile(filePath: string): Promise<string> {
	return await Deno.readTextFile(filePath);
}

/**
 * Read file synchronously.
 * @param filePath Path to the file.
 * @returns File content.
 */
export function readFileSync(filePath: string): string {
	return Deno.readTextFileSync(filePath);
}

/**
 * Check if file exists.
 * @param filePath Path to the file.
 * @returns Is file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await Deno.lstat(filePath);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Check if file exists synchronously.
 * @param filePath Path to the file.
 * @returns Is file exists.
 */
export function fileExistsSync(filePath: string): boolean {
	try {
		Deno.lstatSync(filePath);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Rename file.
 * @param oldPath Old file name.
 * @param newPath New file name.
 */
export async function renameFile(oldPath: string, newPath: string): Promise<void> {
	await Deno.rename(oldPath, newPath);
}

/**
 * Rename file synchronously.
 * @param oldPath Old file name.
 * @param newPath New file name.
 */
export function renameFileSync(oldPath: string, newPath: string): void {
	Deno.renameSync(oldPath, newPath);
}

/**
 * Delete file.
 * @param filePath Path to the file.
 */
export async function deleteFile(filePath: string): Promise<void> {
	await Deno.remove(filePath, { recursive: false });
}

/**
 * Delete file synchronously.
 * @param filePath Path to the file.
 */
export function deleteFileSync(filePath: string): void {
	Deno.removeSync(filePath, { recursive: false });
}

/**
 * Ensures that the file exists.
 * @param path Path to the file.
 * @param data Data to write to if file not exists.
 * @returns Is file created.
 */
export async function ensureFile(path: string, data: string = ''): Promise<void> {
	try {
		const fileInfo: Deno.FileInfo = await Deno.lstat(path);
		if (!fileInfo.isFile) throw new Error('Invalid file specified');
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			const dirname: string = getPathDirname(path);
			await ensureDir(dirname);
			await Deno.writeTextFile(path, data);
			return;
		}

		throw error;
	}
}

/**
 * Ensures that the file exists synchronously.
 * @param path Path to the file.
 * @param data Data to write to if file not exists.
 * @returns Is file created.
 */
export function ensureFileSync(path: string, data: string = ''): void {
	try {
		const fileInfo: Deno.FileInfo = Deno.lstatSync(path);
		if (!fileInfo.isFile) throw new Error('Invalid file specified');
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
 * Ensures that the directory exists.
 * @param path Path to the directory.
 * @returns Is directory created.
 */
export async function ensureDir(path: string): Promise<void> {
	try {
		const status: Deno.FileInfo = await Deno.lstat(path);
		if (!status.isDirectory) throw new Error('Invalid directory specified');
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			await Deno.mkdir(path, { recursive: true });
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
export function ensureDirSync(path: string): void {
	try {
		const fileInfo: Deno.FileInfo = Deno.lstatSync(path);
		if (!fileInfo.isDirectory) throw new Error('Invalid directory specified');
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			Deno.mkdirSync(path, { recursive: true });
			return;
		}

		throw error;
	}
}

/**
 * Get filename from the path.
 * @param path Path to the file.
 * @returns Filename from the path.
 */
export function getPathFilename(path: string): string {
	const parsed: string[] = path.split(/[\\\/]/);
	const filename: string | undefined = parsed.pop();

	return filename ? filename : '';
}

/**
 * Get dirname from the path.
 * @param path Path to the file.
 * @returns Dirname from the path.
 */
export function getPathDirname(path: string): string {
	const parsed: string[] = path.split(/[\\\/]/);
	parsed.pop();
	const dirname: string = parsed.join('/');

	return dirname;
}
