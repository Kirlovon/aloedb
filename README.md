<p align="center">
	<img src="https://raw.githubusercontent.com/Kirlovon/AloeDB/master/other/head.png" alt="Zoomtastic Logo" width="256">
</p>

<h3 align="center">AloeDB</h3>
<p align="center"><i>Light, Embeddable, NoSQL database for Deno</i></p>

<p align="center">
    <b>Work in progress!</b>
</p>

## Features
* ✨ Simple to use API, similar to [MongoDB](https://www.mongodb.com/)!
* 🛠 Easily integrates with [Oak](https://github.com/oakserver/oak), [Superstruct](https://github.com/ianstormtaylor/superstruct), [Nano ID](https://github.com/ai/nanoid), etc.
* 🚀 Optimized for a large number of operations.
* ⚖ No dependencies, even without [std](https://deno.land/std)!
* 📁 Stores data in readable JSON file.

## Example
```typescript
import { Database } from 'https://deno.land/x/aloedb@0.1.0/mod.ts'

// Structure of stored documents
interface Film {
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
    year: 2012,
    film: true,
    genres: ['crime', 'drama', 'noir'],
    authors: { director: 'Nicolas Winding Refn' }
});

// Search operations
const found = await db.findOne({ title: 'Drive', film: true });

// Update operations
await db.updateOne({ title: 'Drive' }, { year: 2011 });

// Delete operations
await db.deleteOne({ title: 'Drive' });
```
_P.S: More example can be found [here](https://github.com/Kirlovon/AloeDB/tree/master/examples)!_