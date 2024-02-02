```js
// TODO: Add support for different ID's, like ULID, NANOID, UUID or custom (Optional, good to have but not really needed)

// TODO: Don't allow to change IDs or manually set ID of documents

// TODO: Internally, return entities from Insert, Update, Delete.
// TODO: Move Search method from the Update & Delete methods d

// TODO: Allow to use 'undefined', 'null' & 'other' values for indexing. The Uint8Array can be used to implement other types.
// Possible problem: Uint8Array will be not allowed for storage.

// TODO: Idea to add "metadata" column, that will store database version & indexed keys, and will migrate in case of database update
// Idea for this todo: Store list of indexed keys it in metadata table, and reindex keys on launch if list of keys changed. 
// Possible problem: If multiple database connections, response can be incorrect during reindexing.

// TODO: Make updateMany & insertMany "rollback" the changes in case of an error. (Maybe add additional configuration)
// Idea for this todo: Maybe add "_temp" field to those documents, that will mark document as temp document. 
// All documents with "_temp" will be automatically not accepted during the search.
// It can also be used for transactions! 🔥
```