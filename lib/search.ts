import { isUndefined, isFunction } from './types.ts';
import { cleanArray, isObjectEmpty, matchValues, numbersList } from './utils.ts';
import { Document, SearchQuery, SearchQueryValue, DocumentValue, Acceptable } from './declarations.ts';

/**
 * Find documents positions.
 * @param query Documents search query.
 * @param documents An array of positions of suitable documents.
 * @returns Found positions.
 */
export function Search<T extends Acceptable<T> = Document>(query: SearchQuery<T> | undefined, documents: T[]): number[] {
	let found: number[] = [];
	let firstSearch: boolean = true;

	if (documents.length === 0) return [];
	if (isUndefined(query) || isObjectEmpty(query)) return numbersList(documents.length);

	if (isFunction(query)) {
		for (let i = 0; i < documents.length; i++) {
			const document: T = documents[i];

			const isMatched: boolean = query(document);
			if (isMatched) found.push(i);
		}

		return found;
	}

	for (const key in query) {
		const queryValue: SearchQueryValue = query[key] as SearchQueryValue;

		if (firstSearch) {
			firstSearch = false;

			for (let i = 0; i < documents.length; i++) {
				const document: Acceptable<T> = documents[i] as Acceptable<T>;
				const documentValue: DocumentValue = document[key] as DocumentValue;

				const isMatched: boolean = matchValues(queryValue, documentValue);
				if (isMatched) found.push(i);
			}

			if (found.length === 0) return [];
			continue;
		}

		for (let i = 0; i < found.length; i++) {
			if (isUndefined(found[i])) continue;

			const position: number = found[i];
			const document: Acceptable<T> = documents[position] as Acceptable<T>;
			const documentValue: DocumentValue = document[key] as DocumentValue;

			const isMatched: boolean = matchValues(queryValue, documentValue);
			if (isMatched) continue;
			delete found[i];
		}
	}

	return cleanArray(found);
}
