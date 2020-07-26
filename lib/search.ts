import { isUndefined } from './types.ts';
import { cleanArray, getNestedValue, isObjectEmpty, matchValues } from './utils.ts';
import { SearchQuery, SearchQueryValue, DocumentValue, Acceptable } from './declarations.ts';

/**
 * Find documents positions.
 * @param query Documents search query.
 * @param documents An array of positions of suitable documents.
 * @returns Found positions.
 */
export function Search<T extends Acceptable<T>>(query: SearchQuery<T> | undefined, documents: T[]): number[] {
	let found: number[] = [];
	let firstSearch: boolean = true;

	if (documents.length === 0) return [];
	if (isUndefined(query) || isObjectEmpty(query)) return [...Array(documents.length).keys()];

	for (const key in query) {
		const queryValue: SearchQueryValue = query[key] as SearchQueryValue;
		const isNested: boolean = key.includes('.');

		if (firstSearch) {
			firstSearch = false;

			for (let i = 0; i < documents.length; i++) {
				const document: T = documents[i];
				const documentValue: DocumentValue = isNested ? getNestedValue(key, document) : document[key as keyof T];

				const isMatched: boolean = matchValues(queryValue, documentValue);
				if (isMatched) found.push(i);
			}

			if (found.length === 0) return [];
			continue;
		}

		for (let i = 0; i < found.length; i++) {
			if (isUndefined(found[i])) continue;

			const position: number = found[i];
			const document: T = documents[position];
			const documentValue: DocumentValue = isNested ? getNestedValue(key, document) : document[key as keyof T];

			const isMatched: boolean = matchValues(queryValue, documentValue);
			if (isMatched) continue;
			delete found[i];
		}
	}

	return cleanArray(found);
}
