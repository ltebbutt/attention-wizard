import { LlmProvider, ProviderResponse } from './types';

/** LLM-13: cost accounting uses provider-reported usage. Prices per 1M tokens,
 *  versioned here; unknown models charge the most expensive known rate (fail safe). */
export const PRICE_TABLE: Record<string, { inputPerM: number; outputPerM: number }> = {
  'gpt-4o-mini': { inputPerM: 0.15, outputPerM: 0.6 },
  'claude-haiku-4-5-20251001': { inputPerM: 1.0, outputPerM: 5.0 },
  'claude-sonnet-5': { inputPerM: 3.0, outputPerM: 15.0 },
  mock: { inputPerM: 0, outputPerM: 0 },
};

export function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price =
    PRICE_TABLE[model] ??
    Object.values(PRICE_TABLE).reduce((max, p) => (p.outputPerM > max.outputPerM ? p : max));
  return Number(((inputTokens * price.inputPerM + outputTokens * price.outputPerM) / 1_000_000).toFixed(6));
}

/** LLM-02: one driver covers every OpenAI-compatible endpoint — Azure AI Foundry,
 *  OpenAI, Ollama, vLLM — via base URL + key + model from env. */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = 'openai-compatible';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async complete(args: {
    model: string;
    system: string;
    user: string;
    maxOutputTokens: number;
  }): Promise<ProviderResponse> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: args.model,
        max_tokens: args.maxOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Provider HTTP ${res.status}`);
    const body = (await res.json()) as {
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage: { prompt_tokens: number; completion_tokens: number; prompt_tokens_details?: { cached_tokens?: number } };
    };
    return {
      text: body.choices[0]?.message?.content ?? '',
      inputTokens: body.usage.prompt_tokens,
      outputTokens: body.usage.completion_tokens,
      cachedTokens: body.usage.prompt_tokens_details?.cached_tokens ?? 0,
      stopReason: body.choices[0]?.finish_reason === 'length' ? 'max_tokens' : 'end',
    };
  }
}

/** Native Anthropic driver (LLM-02). */
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';

  constructor(private readonly apiKey: string) {}

  async complete(args: {
    model: string;
    system: string;
    user: string;
    maxOutputTokens: number;
  }): Promise<ProviderResponse> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: args.model,
        max_tokens: args.maxOutputTokens,
        system: args.system,
        messages: [{ role: 'user', content: args.user }],
      }),
    });
    if (!res.ok) throw new Error(`Provider HTTP ${res.status}`);
    const body = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number };
    };
    return {
      text: body.content.find((c) => c.type === 'text')?.text ?? '',
      inputTokens: body.usage.input_tokens,
      outputTokens: body.usage.output_tokens,
      cachedTokens: body.usage.cache_read_input_tokens ?? 0,
      stopReason: body.stop_reason === 'max_tokens' ? 'max_tokens' : body.stop_reason === 'refusal' ? 'refusal' : 'end',
    };
  }
}

/** Deterministic dev/test provider — the default until real keys are configured. */
export class MockProvider implements LlmProvider {
  readonly name = 'mock';

  async complete(args: { user: string }): Promise<ProviderResponse> {
    const titleMatch = /Task: (.*)/.exec(args.user);
    const title = titleMatch?.[1] ?? 'the task';
    const estimateMin = Math.min(240, Math.max(5, 15 + (title.length % 8) * 10));
    return {
      text: JSON.stringify({
        estimateMin,
        firstStep: `Open what you need for "${title.slice(0, 40)}" and set a 10-minute timer.`,
      }),
      inputTokens: Math.ceil(args.user.length / 4),
      outputTokens: 40,
      cachedTokens: 0,
      stopReason: 'end',
    };
  }
}

export function providerFromEnv(): { provider: LlmProvider; model: string } {
  const kind = process.env.AW_LLM_PROVIDER ?? 'mock';
  const model = process.env.AW_LLM_MODEL ?? 'mock';
  if (kind === 'openai-compatible' && process.env.AW_LLM_BASE_URL && process.env.AW_LLM_API_KEY) {
    return { provider: new OpenAiCompatibleProvider(process.env.AW_LLM_BASE_URL, process.env.AW_LLM_API_KEY), model };
  }
  if (kind === 'anthropic' && process.env.AW_LLM_API_KEY) {
    return { provider: new AnthropicProvider(process.env.AW_LLM_API_KEY), model };
  }
  return { provider: new MockProvider(), model: 'mock' };
}
