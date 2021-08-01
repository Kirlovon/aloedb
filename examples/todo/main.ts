import { Database } from 'https://deno.land/x/aloedb@0.9.0/mod.ts';
import { Application, Router, send } from 'https://deno.land/x/oak@v8.0.0/mod.ts';
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts';
import { assert, object, string, boolean, Infer } from 'https://cdn.skypack.dev/superstruct?dts';
import { dirname, fromFileUrl } from 'https://deno.land/std@0.103.0/path/mod.ts';

// Get parent directory of main.ts
const DIRNAME = dirname(fromFileUrl(import.meta.url));

// Specify Superstruct structure
const TaskStructure = object({
	id: string(),
	text: string(),
	done: boolean()
});

// Create validation function
const TaskValidator = (document: any) => assert(document, TaskStructure);

// Convert structure to TypeScript type
type Task = Infer<typeof TaskStructure>;

// Initialize database
const db = new Database<Task>({
	path: `${DIRNAME}/tasks.json`,
	validator: TaskValidator,
	pretty: true
});

// Router setup
const router = new Router();

// Add simple logger
router.use(async (context, next) => {
	console.log('[SERVER]', `${context.request.method} ${context.request.url}`);
	await next();
});

// Get all tasks
router.get('/tasks', async (context) => {
	const tasks = await db.findMany();
	context.response.type = 'json';
	context.response.body = tasks;
});

// Add new task
router.post('/tasks', async (context) => {
	const body = await context.request.body().value;

	await db.insertOne({
		id: nanoid(),
		text: body.text,
		done: false,
	});

	const tasks = await db.findMany();
	context.response.type = 'json';
	context.response.body = tasks;
});

// Toggle task
router.put('/tasks/:id', async (context) => {

	await db.updateOne(
		{ id: context.params.id },
		{ done: (value) => !value }
	);

	const tasks = await db.findMany();
	context.response.type = 'json';
	context.response.body = tasks;
});

// Delete task
router.delete('/tasks/:id', async (context) => {

	await db.deleteOne({ id: context.params.id });

	const tasks = await db.findMany();
	context.response.type = 'json';
	context.response.body = tasks;
});

// Setup Oak and router
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

// Static content
app.use(async (context) => {
	await send(context, context.request.url.pathname, {
		root: `${DIRNAME}/static`,
		index: 'index.html',
	});
});

// Log about server start
app.addEventListener('listen', ({ hostname, port, secure }) => {
	console.log('[SERVER]', `Server started on: ${secure ? 'https://' : 'http://'}${hostname ?? 'localhost'}:${port}`);
});

// Start webserver
await app.listen({ port: 3000 });
