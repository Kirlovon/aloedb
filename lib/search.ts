import matchValues from './match.ts';
import { isUndefined, isNull } from './types.ts';
import { getNestedValue, isObjectEmpty } from './utils.ts';
import { SearchQuery, Document, DocumentValue, SearchQueryValue } from './declarations.ts';

/**
 * Find documents.
 * @param query Query to search document by.
 * @param documents Documents to search in.
 * @returns Found document.
 */
export async function search(query: SearchQuery<Document> | undefined, documents: Document[]): Promise<Document[]> {
	let found: Array<Document | null> = [];
	let firstSearch: boolean = true;

	// If no documents
	if (documents.length === 0) return [];

	// If query is empty
	if (isUndefined(query) || isObjectEmpty(query)) return found as Document[];

	// Parse query
	for (const key in query) {
		const queryValue: SearchQueryValue = query[key] as SearchQueryValue;
		const isNested: boolean = key.includes('.');

		// Сreate an array of possible matching documents
		if (firstSearch) {
			firstSearch = false;
			
			for (let i = 0; i < documents.length; i++) {
				const document = documents[i];
				const documentValue: DocumentValue = isNested ? getNestedValue(key, document) : document[key];
				
				const isMatched = matchValues(queryValue, documentValue);
				if (isMatched) found.push(document);
			}

			if (documents.length === 0) return [];
			continue;
		}

		// Match documents and query
		for (let i = 0; i < found.length; i++) {
			if (isNull(found[i])) continue;

			const document: Document = found[i] as Document;
			const documentValue: DocumentValue = isNested ? getNestedValue(key, document) : document[key];
			
			const isMatched = matchValues(queryValue, documentValue);
			if (isMatched) continue;

			// Nullify the inappropriate document
			found[i] = null;
		}

	}

	// Delete all nullified documents
	found = found.filter((value) => !isNull(value));

	return found as Document[];
}
