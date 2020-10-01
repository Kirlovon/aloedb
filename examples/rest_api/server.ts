import * as log from 'https://deno.land/std/log/mod.ts';
import { AloeDB } from 'https://deno.land/x/aloedb/mod.ts';
import { Application, Router } from 'https://deno.land/x/oak/mod.ts';

import { nanoid } from 'https://cdn.skypack.dev/nanoid@^3.1.9';
import { assert, object, number, string } from 'https://cdn.skypack.dev/superstruct@^0.10.11';

const HOSTNAME = 'localhost';
const PORT = 8080;

interface Film {
	id: string;
    title: string;
    year: number;
    genres: string[];
    authors: { director: string };
}

const FilmStructure = object({
	id: string(),
	title: string(),
	year: number(),
});

const FilmValidator = (document: any) => assert(document, FilmStructure);

const db = new AloeDB<Film>({
	filePath: './films.json',
	schemaValidator: FilmValidator,
});

const app = new Application();
const router = new Router();

// GET FILMS
router.get('/films', async ({ response }) => {
	response.body = { films: db.documents };
});

// GET FILM BY ID
router.get('/films/:id', async ({ response, params }) => {
	const film = await db.findOne({ id: params.id });
	response.body = { film };
});

// ADD FILM
router.post('/films', async ({ request, response }) => {
	if (request.hasBody) {
		const { title, year, authors, genres } = await request.body({ type: 'json' })?.value;
		await db.insertOne({ id: nanoid(), title, year, authors, genres });
	}

	response.body = { films: db.documents };
});

// UPDATE FILM
router.put('/films/:id', async ({ request, response, params }) => {
	if (request.hasBody) {
		const { title, year, authors, genres } = await request.body({ type: 'json' })?.value;
		await db.updateOne({ id: params.id }, { title, year, authors, genres });
	}
	response.body = { films: db.documents };
});

// DELETE FILM
router.delete('/films/:id', async ({ response, params }) => {
	const film = await db.deleteOne({ id: params.id });
	response.body = { film };
});

// DELETE ALL FILMS
router.delete('/films', async ({ response, params }) => {
	const film = await db.deleteMany();
	response.body = { film };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener('listen', ({ hostname, port }) => {
	log.info(`Server started on ${hostname}:${port}!`);
});

app.addEventListener('error', ({ error }) => {
	log.error(error);
});

await app.listen({ hostname: HOSTNAME, port: PORT });
