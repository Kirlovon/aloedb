import { AloeDB } from 'https://deno.land/x/aloedb/mod.ts';
import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import { assert, object, number, string } from 'https://cdn.skypack.dev/superstruct@^0.10.11';

interface Film {
	id: number;
	title: string;
	year: number;
}

const FilmSchema = object({
	id: number(),
	title: string(),
	year: number()
});

const FilmValidator = (document: any) => assert(document, FilmSchema);

const db = new AloeDB<Film>({ 
    filePath: './films.json', 
    schemaValidator: FilmValidator 
});

const app = new Application();
const router = new Router();

router.get('/films', async ({ response }) => {
	response.body = { films: db.documents };
});

router.get('/films/:id', async ({ response, params }) => {
	const id = parseInt(params.id as string);
	const film = await db.findOne({ id });

	response.body = { film };
});

router.post('/films', async ({ request, response }) => {
	if (request.hasBody) {
		const result = request.body({ type: 'json' });
		const { title, year } = await result.value;
		const id = Date.now();

		await db.insertOne({ id, title, year });
	}

	response.body = { films: db.documents };
});

router.delete('/films/:id', async ({ response, params }) => {
	const id = parseInt(params.id as string);
	const film = await db.deleteOne({ id });

	response.body = { film };
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
