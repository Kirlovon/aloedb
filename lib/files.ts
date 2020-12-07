/*
	Functions for file system manipulation. 
	The only file that contains platform specific code.
	Lightweight version of standard library module. ( https://deno.land/std/fs )
*/

import { getPathDirname } from './utils.ts'

/**
 * Write content to the file.
 * @param path Path to the file.
 * @param content Content to write.
 */
export async function writeFile(path: string, content: string): Promise<void> {
	await Deno.writeTextFile(path, content);
}

/**
 * Write content to the file synchronously.
 * @param path Path to the file.
 * @param content Content to write.
 */
export function writeFileSync(path: string, content: string): void {
	Deno.writeTextFileSync(path, content);
}

/**
 * Read file.
 * @param path Path to the file.
 * @retunrs File content.
 */
export async function readFile(path: string): Promise<string> {
	return await Deno.readTextFile(path);
}

/**
 * Read file synchronously.
 * @param path Path to the file.
 * @returns File content.
 */
export function readFileSync(path: string): string {
	return Deno.readTextFileSync(path);
}

/**
 * Check if file exists.
 * @param path Path to the file.
 * @returns Is file exists.
 */
export async function fileExists(path: string): Promise<boolean> {
	try {
		await Deno.lstat(path);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Check if file exists synchronously.
 * @param path Path to the file.
 * @returns Is file exists.
 */
export function fileExistsSync(path: string): boolean {
	try {
		Deno.lstatSync(path);
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
 * @param path Path to the file.
 */
export async function deleteFile(path: string): Promise<void> {
	await Deno.remove(path, { recursive: false });
}

/**
 * Delete file synchronously.
 * @param path Path to the file.
 */
export function deleteFileSync(path: string): void {
	Deno.removeSync(path, { recursive: false });
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
