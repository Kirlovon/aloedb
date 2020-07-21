![Logo](https://raw.githubusercontent.com/Kirlovon/AloeDB/master/other/head.png)

<h3 align="center">AloeDB</h3>
<p align="center">Light, Embeddable, NoSQL database for Deno</p>

## Features
* ⚖ No dependencies, ___even without [std](https://deno.land/std)!___
* ✨ Simple to use API, similar to [MongoDB](https://www.mongodb.com/)!
* 📁 Stores data in JSON file.

## Example
```typescript
import { Database, Document } from "https://deno.land/x/aloedb/mod.ts"

// Structure
interface Film extends Document {
    title: string;
    year: number;
    film: boolean;
    genres: string[];
    authors: { director: string };
}

// Initialization
const db = new Database<Film>('./path/to/the/file.json');

// Insert operations
await db.insertOne({ 
    title: 'Drive', 
    year: 2011,
    film: true,
    genres: ['crime', 'drama', 'noir'],
    authors: { director: 'Nicolas Winding Refn' }
});

// Search operations
const found = await db.findOne({ title: 'Drive', film: true });

// Delete operations
await db.deleteOne({ title: 'Drive' });
```
_P.S: More example can be found [here]()!_