require('dotenv').config({ path: '.env.local' });

const TRIPO_API = 'https://api.tripo3d.ai/v2/openapi';

async function createTripoTask(prompt) {
    const apiKey = process.env.TRIPO_API_KEY;
    if (!apiKey) throw new Error('TRIPO_API_KEY is not set');

    const fetch = (await import('node-fetch')).default || global.fetch;

    const res = await fetch(`${TRIPO_API}/task`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            type: 'text_to_model',
            prompt,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Tripo create task error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.data?.task_id ?? '';
}

async function main() {
  console.log('Testing Tripo API with key:', process.env.TRIPO_API_KEY ? 'Set' : 'Not Set');
  try {
    const taskId = await createTripoTask('a small green apple');
    console.log('Task Created:', taskId);
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
