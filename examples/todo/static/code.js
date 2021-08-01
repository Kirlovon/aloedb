// Initializtion
document.addEventListener('DOMContentLoaded', async () => {
	const response = await fetch('/tasks');
	const data = await response.json();
	render(data);
});

/**
 * Render todo list tasks
 * @param {{ id: string, text: string, done: boolean }[]} data Array with tasks
 */
function render(data) {
	const list = document.querySelector('#list');

	// Remove old DOM content
	list.innerHTML = '';

	// If list is empty
	if (data.length === 0) {
		const nothingElement = document.createElement('h2');
		nothingElement.innerText = 'There\'s no tasks here! 😎';

		list.appendChild(nothingElement);
		return;
	}

	// Add each task to the list element
	data.forEach((task) => {
		const taskElement = document.createElement('li');
		taskElement.className = task.done ? 'task done' : 'task';
		taskElement.innerText = task.text;

		// Toggle task on click
		taskElement.addEventListener('click', async () => {
			const response = await fetch(`/tasks/${task.id}`, { method: 'PUT' });
			const data = await response.json();
			render(data);
		});

		// Delete task
		taskElement.addEventListener('dblclick', async () => {
			const response = await fetch(`/tasks/${task.id}`, { method: 'DELETE' });
			const data = await response.json();
			render(data);
		});

		list.appendChild(taskElement);
	});

}

// Add new task
document.querySelector('#add').addEventListener('click', async () => {
	const textElement = document.querySelector('#text');
	const text = textElement.value.trim();

	// Skip if input is empty
	if (text === '') return;

	// Remove old text
	textElement.value = '';

	// Send task to the server
	const response = await fetch('/tasks', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ text: text })
	});

	// Render response
	const data = await response.json();
	render(data);
});
