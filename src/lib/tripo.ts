// ============================================================
// Tripo AI API helper
// ============================================================

const TRIPO_API = 'https://api.tripo3d.ai/v2/openapi';

interface TripoTaskResult {
    task_id: string;
    status: string;
    output?: {
        model?: {
            url?: string;
        };
    };
}

/** Create a text-to-3D generation task */
export async function createTripoTask(prompt: string): Promise<string> {
    const apiKey = process.env.TRIPO_API_KEY;
    if (!apiKey) throw new Error('TRIPO_API_KEY is not set');

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

/** Poll a Tripo task until complete or timeout */
export async function pollTripoTask(
    taskId: string,
    maxWaitMs = 120_000,
    intervalMs = 5_000
): Promise<string | null> {
    const apiKey = process.env.TRIPO_API_KEY;
    if (!apiKey) throw new Error('TRIPO_API_KEY is not set');

    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
        const res = await fetch(`${TRIPO_API}/task/${taskId}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (res.ok) {
            const data = await res.json();
            const task = data.data as TripoTaskResult;

            if (task.status === 'success') {
                return task.output?.model?.url ?? null;
            }
            if (task.status === 'failed' || task.status === 'cancelled') {
                return null;
            }
        }

        await new Promise((r) => setTimeout(r, intervalMs));
    }

    return null; // timeout
}

/**
 * Generate a 3D model using Tripo.
 * Returns the model URL on success, or null on failure/timeout.
 */
export async function generateTripoModel(prompt: string): Promise<string | null> {
    try {
        const taskId = await createTripoTask(prompt);
        if (!taskId) return null;
        return await pollTripoTask(taskId);
    } catch {
        return null;
    }
}
