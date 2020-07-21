import matchValues from './match.ts';
import { isUndefined } from './types.ts';
import { getNestedValue, isObjectEmpty } from './utils.ts';
import { SearchQuery, Document, DocumentValue, SearchQueryValue } from './declarations.ts';

/** Search methods. */
class Search {

	/**
	 * Find documents.
	 * @param query Documents search query.
	 * @param documents An array of documents to look for the suitable ones.
	 * @returns Found documents.
	 */
	public static documents(query: SearchQuery | undefined, documents: Document[]): Document[] {
		let found: Document[] = [];
		let firstSearch: boolean = true;
	
		if (documents.length === 0) return [];
		if (isUndefined(query) || isObjectEmpty(query)) return [...documents];
	
		for (const key in query) {
			const queryValue = query[key];
			const isNested = key.includes('.');
	
			if (firstSearch) {
				firstSearch = false;
	
				for (let i = 0; i < documents.length; i++) {
					const document = documents[i];
					const documentValue = isNested ? getNestedValue(key, document) : document[key];
	
					const isMatched = matchValues(queryValue, documentValue);
					if (isMatched) found.push(document);
				}
	
				if (found.length === 0) return [];
				continue;
			}
	
			for (let i = 0; i < found.length; i++) {
				if (isUndefined(found[i])) continue;
	
				const document = found[i];
				const documentValue = isNested ? getNestedValue(key, document) : document[key];
				
				const isMatched = matchValues(queryValue, documentValue);
				if (isMatched) continue;
				delete found[i];
			}
		}
	
		found = found.filter((value) => !isUndefined(value));
		return found;
	}

	/**
	 * Find documents indexes.
	 * @param query Documents search query.
	 * @param documents An array of documents to look for the suitable ones.
	 * @returns Found indexes.
	 */
	public static indexes(query: SearchQuery | undefined, documents: Document[]): number[] {
		let found: number[] = [];
		let firstSearch: boolean = true;
	
		if (documents.length === 0) return [];
		if (isUndefined(query) || isObjectEmpty(query)) return [...Array(documents.length).keys()];
	
		for (const key in query) {
			const queryValue = query[key];
			const isNested = key.includes('.');
	
			if (firstSearch) {
				firstSearch = false;
	
				for (let i = 0; i < documents.length; i++) {
					const document = documents[i];
					const documentValue = isNested ? getNestedValue(key, document) : document[key];
	
					const isMatched = matchValues(queryValue, documentValue);
					if (isMatched) found.push(i);
				}
	
				if (found.length === 0) return [];
				continue;
			}
	
			for (let i = 0; i < found.length; i++) {
				if (isUndefined(found[i])) continue;
	
				const index = found[i];
				const document = documents[index];
				const documentValue = isNested ? getNestedValue(key, document) : document[key];
				
				const isMatched = matchValues(queryValue, documentValue);
				if (isMatched) continue;
				delete found[i];
			}
		}
	
		found = found.filter((value) => !isUndefined(value));
		return found;
	}
}

export default Search;