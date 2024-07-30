-   **TODO**: Add support for different IDs, like ULID, NANOID, UUID, or custom. (Optional, good to have but not really needed)

-   **TODO**: Don't allow changing IDs or manually setting IDs of documents.

-   **TODO**: Internally, return entities from Insert, Update, Delete.

-   **TODO**: Move the Search method from the Update & Delete methods.

-   **TODO**: Allow using 'undefined', 'null' & 'other' values for indexing. The Uint8Array can be used to implement other types. Possible problem: Uint8Array will not be allowed for storage.

-   **TODO**: Idea to add a "metadata" table that will store the database version & indexed keys, and will migrate in case of a database update.
    Idea for this todo: Store the list of indexed keys in the metadata table and reindex keys on launch if the list of keys changed. Possible problem: If multiple database connections, the response can be incorrect during reindexing.

-   **TODO**: Make updateMany & insertMany "rollback" the changes in case of an error. (Maybe add additional configuration) Idea for this todo: Maybe add "\_temp" field to those documents, which
    will mark the document as a temp document. All documents with "\_temp" will not be accepted during the search. It can also be used for transactions! 🔥

