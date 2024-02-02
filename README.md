<p align="center">
	<img src="./other/head.png" alt="AloeDB Logo" width="220">
</p>

<p align="center">
	<h3 align="center">AloeDB</h3>
	<p align="center"><i>Light, Embeddable, NoSQL database for Deno & Deno Deploy</i></p>
</p>

<br>

> ℹ️ **AloeDB v2** was rewritten from the ground up! Its moved from the JSON storage engine to the new Deno KV.

<br>

## ✨ Features
* 🎉 Simple to use Document-Oriented API!
* 🚀 Optimized for a large number of operations.
* ⚖ No dependencies, even without [std](https://deno.land/std)!
* ☁ Deno Deploy support!

<br>

## 📦 Importing
```typescript
import { Database } from 'https://deno.land/x/aloedb@2.0.0/mod.ts'
```

<br>

## 📖 Example
```typescript
import { Database, Base } from 'https://deno.land/x/aloedb@2.0.0/mod.ts';

// Structure of stored documents
interface Film extends Base {
    title: string;
    year: number;
    film: boolean;
    genres: string[];
    authors: { director: string };
}

// Initialization
const db = new Database('./path/to/the/file.json');

// Collection specification
const films = db.collection<Film>('films');

// Insert operations
await films.insertOne({
    title: 'Drive',
    year: 2012,
    film: true,
    genres: ['crime', 'drama', 'noir'],
    authors: { director: 'Nicolas Winding Refn' }
});

// Search operations
const found = await films.findOne({ title: 'Drive', film: true });

// Update operations
await films.updateOne({ title: 'Drive' }, { year: 2011 });

// Delete operations
await films.deleteOne({ title: 'Drive' });
```
_P.S. You can find a complete example [here](https://github.com/Kirlovon/AloeDB/tree/master/example)!_


<br>

## 🏃‍ Benchmarks
This database is not aimed at a heavily loaded backend, but its speed should be good enough for small APIs working with less than a million documents.

To give you an example, here is the speed of a database operations with *1000* documents:

| Insertion      | Searching     | Updating      | Deleting      |
|:---------------|:--------------|:--------------|:--------------|
| 300k _ops/sec_ | 80k _ops/sec_ | 40k _ops/sec_ | 45k _ops/sec_ |

<br>

## 📚 Documentation

### Initialization
```typescript
import { Database, Base } from 'https://deno.land/x/aloedb@2.0.0/mod.ts';

interface Schema extends Base {
	username: string;
	password: string;
}

const db = new Database({ path: './data.db' });

const users = db.collection<Schema>('users');

```
The following fields are available for configuration:
* `path` - Path to the database file. If undefined, data will be stored in temp folder. _(Default: undefined)_
* `kv` - Custom Deno Kv instance. If undefined, the new Kv instance will be automatically created.

Also, you can initialize the database in the following ways:
```typescript
// In-memory database
const db = new Database();
```

```typescript
// Short notation, specifying the file path only
const db = new Database('./path/to/the/file.json');
```

<br>

### Typization
AloeDB allows you to specify the schema of your documents.
By doing this, you will get auto-completion and types validation. This is a **completely optional, but highly recommended** feature that can make it easier for you to work with the database.

Just specify an interface that contains only the types supported by the database _(strings, numbers, booleans, nulls, array, objects)_, and everything will works like magic! 🧙‍

```typescript
// Your schema
interface User extends Base {
	username: string;
	password: string;
}

// Initialize a database with a specific schema
const db = new Database();

// Initialize a collection for users
const users = db.collection<Schema>('users');

await users.insertOne({ username: 'bob', password: 'qwerty' }); // Ok 👌
await users.insertOne({ username: 'greg' }); // Error: Property 'password' is missing
```

<br>

### Inserting
AloeDB is a document-oriented database, so you storing objects in it. The supported types are **Strings**, **Numbers**, **Booleans**, **Nulls**, **Arrays** & **Objects**.

Keep in mind that data types such as **Date**, **Map**, **Set** and other complex types are **not supported**, and all fields with them will be deleted. Also, any blank documents will not be inserted.

```typescript
const inserted = await db.insertOne({ text: 'Hey hey, im inserted!' });
console.log(inserted); // { text: 'Hey hey, im inserted!' }
```

<br>

### Querying
Search query can be an object or a search function. If query is an object, then the search will be done by deeply comparing the fields values in the query with the fields values in the documents.

In search queries you can use **Primitives** _(strings, numbers, booleans, nulls)_, **Arrays**, **Objects**, **RegExps** and **Functions**.

 ```typescript
await db.insertMany([
	{ key: 1, value: 'one' },
	{ key: 2, value: 'two' },
	{ key: 3, value: 'three' },
]);

// Simple query
const found1 = await db.findOne({ key: 1 });
console.log(found1); // { key: 1, value: 'one' }

// Advanced query with search function
const found2 = await db.findOne((document: any) => document.key === 2);
console.log(found2); // { key: 2, value: 'two' }

// Query with regular expression
const found3 = await db.findOne({ key: /three/ });
console.log(found2); // { key: 3, value: 'three' }

```

When specifying **Arrays** or **Objects**, a deep comparison will be performed.
 ```typescript
await db.insertMany([
	{ key: 1, values: [1, 2] },
	{ key: 2, values: [1, 2, 3] },
	{ key: 3, values: [1, 2, 3, 4] },
]);

const found = await db.findOne({ values: [1, 2, 3] });
console.log(found); // { key: 2, values: [1, 2, 3] }
```

Also, we have premade querying functions called [Helpers](https://github.com/Kirlovon/AloeDB#helpers):

```typescript
import { Database, includes } from 'https://deno.land/x/aloedb@0.9.0/mod.ts';

const db = new Database();
await db.insertOne({ test: [1, 2, 3] });

const found = await db.findOne({ test: includes(2) });
console.log(found); // { test: [1, 2, 3] }
```

<br>

### Updating
As with search queries, update queries can be either a function or an object. If this is a function, then the function receives the document to update as a parameter, and you must return updated document from the function. _(or return `null` or `{}` to delete it)_

By the way, you can pass a function as a parameter value in an object. This can be useful if you want to update a specific field in your document. Also, you can return `undefined`, to remove this field.

 ```typescript
await db.insertMany([
	{ key: 1, value: 'one' },
	{ key: 2, value: 'two' },
	{ key: 3, value: 'three' },
]);

// Simple update
const updated1 = await db.updateOne({ key: 1 }, { key: 4, value: 'four' });
console.log(updated1); // { key: 4, value: 'four' }

// Advanced update with update function
const updated2 = await db.updateOne({ key: 2 }, (document: any) => {
	document.key = 5;
	document.value = 'five';
	return document;
});
console.log(updated2); // { key: 5, value: 'five' }

// Advanced update with field update function
const updated3 = await db.updateOne({ key: 3 }, {
	key: (value: any) => value === 6,
	value: (value: any) => value === 'six'
});
console.log(updated3); // { key: 6, value: 'six' }
```

<br>

## 🔧 Methods

### Documents
```typescript
await collection.documents();
```
This property stores all your documents. It is better not to modify these property manually, as database methods do a bunch of checks for security and stability reasons. But, if you do this, be sure to call `await db.save()` method after your changes.

<br>

### InsertOne
```typescript
await collection.insertOne({ foo: 'bar' });
```
Inserts a document into the database. After insertion, it returns the inserted document.

All fields with `undefined` values will be deleted. Empty documents will not be inserted.

<br>

### InsertMany
```typescript
await collection.insertMany([{ foo: 'bar' }, { foo: 'baz' }]);
```
Inserts multiple documents into the database. After insertion, it returns the array with inserted documents.

This operation is **atomic**, so if something goes wrong, nothing will be inserted.

<br>

### FindOne
```typescript
await collection.findOne({ foo: 'bar' });
```
Returns a document that matches the search query. Returns `null` if nothing found.

<br>

### FindMany
```typescript
await collection.findMany({ foo: 'bar' });
```
Returns an array of documents matching the search query.

<br>

### UpdateOne
```typescript
await collection.updateOne({ foo: 'bar' }, { foo: 'baz' });
```
Modifies an existing document that match search query. Returns the found document with applied modifications. If nothing is found, it will return `null`.

The document will be deleted if all of its fields are `undefined`, or if you return `null` or `{}` using a update function.

This operation is **atomic**, so if something goes wrong, nothing will be updated.

<br>

### UpdateMany
```typescript
await collection.updateMany({ foo: 'bar' }, { foo: 'baz' });
```
Modifies all documents that match search query. Returns an array with updated documents.

This operation is **atomic**, so if something goes wrong, nothing will be updated.

<br>

### DeleteOne
```typescript
await collection.deleteOne({ foo: 'bar' });
```
Deletes first found document that matches the search query. After deletion, it will return deleted document.

<br>

### DeleteMany
```typescript
await collection.deleteMany({ foo: 'bar' });
```
Deletes all documents that matches the search query. After deletion, it will return all deleted documents.

This operation is **atomic**, so if something goes wrong, nothing will be deleted.

<br>

### Count
```typescript
await collection.count({ foo: 'bar' });
```
Returns the number of documents found by the search query. If the query is not specified or empty, it will return total number of documents in the database.

<br>

### Drop
```typescript
await collection.drop();
```
Removes all documents from the database.

<br>

### Load
```typescript
await collection.load();
```
Loads, parses and validates documents from the specified database file. If the file is not specified, then nothing will be done.

<br>

### LoadSync
```typescript
db.loadSync();
```
Same as `db.load()` method, but synchronous. Will be called automatically if the `autoload` parameter is set to **true**.

<br>

### Save
```typescript
await db.save();
```
Saves documents from memory to a database file. If the `optimize` parameter is **false**, then the method execution will be completed when data writing is completely finished. Otherwise the data record will be added to the queue and executed later.

<br>

### Helpers
This module contains helper functions that will make it easier to write search queries.

 ```typescript
 // Importing database & helpers
import { Database, and, includes, length, not, exists } from 'https://deno.land/x/aloedb@0.9.0/mod.ts';

const db = new Database();
await db.insertOne({ test: [1, 2, 3] });

// Helpers usage
const found = await db.findOne({
	test: and(
		length(3),
		includes(2)
	),
	other: not(exists())
});

console.log(found); // { test: [1, 2, 3] }
```

#### List of all available helpers:
* moreThan
* moreThanOrEqual
* lessThan
* lessThanOrEqual
* between
* betweenOrEqual
* exists
* type
* includes
* length
* someElementMatch
* everyElementMatch
* and
* or
* not

<br>

## 💡 Tips & Tricks

### Multiple Collections

By default, one database instance has only one collection. However, since the database instances are quite lightweight, you can initialize multiple instances for each collection.

Keep in mind that you **cannot specify the same file for multiple instances!**

```typescript
import { Database } from 'https://deno.land/x/aloedb@0.9.0/mod.ts';

const db = new Database('./data.db');

// Initialize database instances
const users = new Database({ path: './users.json' });
const posts = new Database({ path: './posts.json' });
const comments = new Database({ path: './comments.json' });

// For convenience, you can collect all instances into one object
const db = { users, posts, comments };

// Looks nice 😎
await db.users.insertOne({ username: 'john', password: 'qwerty123' });
```

<br>

### Runtime Validation

You cannot always be sure about the data that comes to your server. TypeScript highlights a lot of errors at compilation time, but it doesn't help at runtime.

Luckily, you can use a library such as [SuperStruct](https://github.com/ianstormtaylor/superstruct), which allows you to check your documents structure:

```typescript
import { Database } from 'https://deno.land/x/aloedb@0.9.0/mod.ts';
import { assert, object, string, Infer } from 'https://cdn.skypack.dev/superstruct@0.15.2?dts';

// Specify structure
const User = object({
	username: string(),
	password: string()
});

// Create validation function
const UserValidator = (document: any) => assert(document, User);

// Convert structure to TypeScript type
type UserSchema = Infer<typeof User>;

// Initialize
const db = new Database<UserSchema>({ validator: UserValidator });

// Ok 👌
await db.insertOne({ username: 'bob', password: 'dylan' });

// StructError: At path: password -- Expected a string, but received: null
await db.insertOne({ username: 'bob', password: null as any });
```

<br>

### Manual Changes

For performance reasons, a copy of the whole storage is kept in memory. Knowing this, you can modify the documents manually by modifying the `db.documents` parameter.

Most of the time this is not necessary, as the built-in methods are sufficient, but if you want to have full control, you can do it!

Keep in mind that after your changes, **you should always call the `await db.save()` method!**

```typescript
import { Database } from 'https://deno.land/x/aloedb@0.9.0/mod.ts';

// Initialize
const db = new Database('./data.json');

try {

	// Your changes...
	db.documents.push({ foo: 'bar' });

} finally {
	await db.save(); // ALWAYS CALL SAVE!
}
```

Also, if you set the parameter **immutable** to `false` when initializing the database, you will get back references to in-memory documents instead of their copies. This means that you cannot change the returned documents without calling the `await db.save()` method.

```typescript
import { Database } from 'https://deno.land/x/aloedb@0.9.0/mod.ts';

// Initialization with immutability disabled
const db = new Database({ path: './data.json', immutable: false });

// Initial data
await db.insertOne({ field: 'The Days' });

// Finding and modifying document
const found = await db.findOne({ field: 'The Days' }) as { field: string };
found.field = 'The Nights';

// Saving
await db.save();

console.log(db.documents); // [{ field: 'The Nights' }]
```

<br>

## 📃 License
MIT _(see [LICENSE](https://github.com/Kirlovon/AloeDB/blob/master/LICENSE) file)_
