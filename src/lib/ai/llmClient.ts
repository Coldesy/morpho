// ============================================================
// Morpho 2.0 — Multi-Model LLM Client
// Primary: OpenRouter (deepseek → llama-3 → mixtral)
// Fallback: Groq (llama-3.3-70b-versatile)
// ============================================================

interface LLMProvider {
    name: string;
    url: string;
    models: string[];
    getHeaders: (apiKey: string) => Record<string, string>;
    getApiKey: () => string | undefined;
}

const OPENROUTER: LLMProvider = {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
        'deepseek/deepseek-chat',
        'meta-llama/llama-3-70b-instruct',
        'mistralai/mixtral-8x7b-instruct',
    ],
    getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://morpho-3d.app',
        'X-Title': 'Morpho 2.0',
    }),
    getApiKey: () => process.env.OPENROUTER_API_KEY,
};

const GROQ: LLMProvider = {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.3-70b-versatile'],
    getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    }),
    getApiKey: () => process.env.GROQ_API_KEY,
};

const PROVIDERS: LLMProvider[] = [OPENROUTER, GROQ];

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

/** Sleep helper */
function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * Call an LLM with automatic multi-model, multi-provider failover.
 * Tries OpenRouter models first, then falls back to Groq.
 */
export async function callLLM(prompt: string): Promise<string> {
    const errors: string[] = [];

    for (const provider of PROVIDERS) {
        const apiKey = provider.getApiKey();
        if (!apiKey) {
            errors.push(`${provider.name}: no API key`);
            continue;
        }

        for (const model of provider.models) {
            for (let retry = 0; retry <= MAX_RETRIES; retry++) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

                    const res = await fetch(provider.url, {
                        method: 'POST',
                        headers: provider.getHeaders(apiKey),
                        body: JSON.stringify({
                            model,
                            messages: [{ role: 'user', content: prompt }],
                            temperature: 0.4,
                            max_tokens: 2048,
                        }),
                        signal: controller.signal,
                    });

                    clearTimeout(timeout);

                    if (res.status === 429) {
                        // Rate limited — wait and try next model
                        errors.push(`${provider.name}/${model}: rate limited (429)`);
                        await sleep(1000 * (retry + 1));
                        continue;
                    }

                    if (!res.ok) {
                        const errText = await res.text();
                        errors.push(`${provider.name}/${model}: ${res.status} — ${errText.slice(0, 200)}`);
                        break; // Try next model
                    }

                    const data = await res.json();
                    const content = data.choices?.[0]?.message?.content ?? '';
                    if (!content) {
                        errors.push(`${provider.name}/${model}: empty response`);
                        break;
                    }

                    return content;
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    errors.push(`${provider.name}/${model} (attempt ${retry + 1}): ${msg}`);
                    if (retry < MAX_RETRIES) await sleep(500 * (retry + 1));
                }
            }
        }
    }

    throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
}

/** Parse a JSON block from an LLM response (handles ```json fences) */
export function parseLLMJSON<T>(raw: string): T {
    let cleaned = raw.trim();
    // Remove markdown fences
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleaned) as T;
}

/**
 * Call LLM and parse the response as JSON.
 * Convenience wrapper combining callLLM + parseLLMJSON.
 */
export async function callLLMWithJSON<T>(prompt: string): Promise<T> {
    const raw = await callLLM(prompt);
    return parseLLMJSON<T>(raw);
}
