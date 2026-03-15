import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  try {
    console.log("Testing with key:", process.env.TRIPO_API_KEY ? "Set" : "Not Set");
    
    // Explicit API call to verify the key logic independent of Tripo ts errors
    const res = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.TRIPO_API_KEY}`,
        },
        body: JSON.stringify({ type: 'text_to_model', prompt: 'a yellow banana' }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Tripo create task error:", res.status, err);
        return;
    }

    const data = await res.json();
    console.log("Success! Task ID:", data.data?.task_id);
  } catch(e) {
    console.error("Tripo Test Failed:", e);
  }
}
test();
