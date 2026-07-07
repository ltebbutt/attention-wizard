import { Injectable, signal } from '@angular/core';
import { storageGet, storageRemove, storageSet } from './storage';

const SETTINGS_KEY = 'aw-ai-v1';
const USAGE_KEY = 'aw-ai-usage-v1';
const DAILY_CAP = 50; // AI-04

export interface AiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AiPreset {
  name: string;
  baseUrl: string;
  model: string;
  hint: string;
}

/** AI-01: phone-friendly free tiers first; anything OpenAI-compatible works. */
export const AI_PRESETS: AiPreset[] = [
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    hint: 'console.groq.com — free key in about 3 minutes, works from a phone',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    hint: 'openrouter.ai/keys — free models available',
  },
  {
    name: 'Custom',
    baseUrl: '',
    model: '',
    hint: 'any OpenAI-compatible endpoint (Ollama, vLLM, your own proxy)',
  },
];

/** Spec 009: the browser-side miniature of the LLM Gateway (spec 004).
 *  Key lives on-device only (AI-02); calls go straight to the provider. */
@Injectable({ providedIn: 'root' })
export class LlmClient {
  readonly settings = signal<AiSettings | null>(this.load());

  private load(): AiSettings | null {
    try {
      const raw = storageGet(SETTINGS_KEY);
      return raw ? (JSON.parse(raw) as AiSettings) : null;
    } catch {
      return null;
    }
  }

  configured(): boolean {
    const s = this.settings();
    return !!(s?.baseUrl && s.apiKey && s.model);
  }

  save(settings: AiSettings): void {
    this.settings.set(settings);
    storageSet(SETTINGS_KEY, JSON.stringify(settings));
  }

  /** AI-02: disconnect wipes the key. */
  clear(): void {
    this.settings.set(null);
    storageRemove(SETTINGS_KEY);
  }

  /** AI-04: content-free daily counter; fail closed when unset or over cap.
   *  In showcase mode storage is inert, so the session counter backs it up. */
  private sessionCalls = 0;

  callsToday(): number {
    try {
      const raw = JSON.parse(storageGet(USAGE_KEY) ?? '{}') as { day?: string; count?: number };
      const stored = raw.day === new Date().toDateString() ? (raw.count ?? 0) : 0;
      return Math.max(stored, this.sessionCalls);
    } catch {
      return this.sessionCalls;
    }
  }

  private recordCall(): void {
    this.sessionCalls += 1;
    storageSet(USAGE_KEY, JSON.stringify({ day: new Date().toDateString(), count: this.callsToday() }));
  }

  /** Returns provider text, or a typed failure reason (AI-06). */
  async complete(system: string, user: string, maxTokens = 500): Promise<
    { ok: true; text: string } | { ok: false; reason: 'not_configured' | 'budget_denied' | 'provider_error' }
  > {
    const s = this.settings();
    if (!this.configured() || !s) return { ok: false, reason: 'not_configured' };
    if (this.callsToday() >= DAILY_CAP) return { ok: false, reason: 'budget_denied' };
    this.recordCall();
    try {
      const res = await fetch(`${s.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${s.apiKey}` },
        body: JSON.stringify({
          model: s.model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) return { ok: false, reason: 'provider_error' };
      const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = body.choices?.[0]?.message?.content ?? '';
      return text ? { ok: true, text } : { ok: false, reason: 'provider_error' };
    } catch {
      return { ok: false, reason: 'provider_error' };
    }
  }

  /** LLM-04 in miniature: extract the first JSON value from a completion. */
  parseJson<T>(text: string): T | undefined {
    for (const open of ['[', '{'] as const) {
      const close = open === '[' ? ']' : '}';
      const start = text.indexOf(open);
      const end = text.lastIndexOf(close);
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1)) as T;
        } catch {
          /* try next shape */
        }
      }
    }
    return undefined;
  }
}
