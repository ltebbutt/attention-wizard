export type UseCase = 'estimation' | 'triage' | 'ranking' | 'onboarding' | 'nudge_copy';

export type GatewayResultStatus =
  | 'ok'
  | 'truncated'
  | 'schema_invalid'
  | 'refused'
  | 'budget_denied'
  | 'provider_error';

export type BudgetScope = 'request' | 'user_daily' | 'feature_hourly' | 'global_daily';

/** Shallow JSON schema — enough for structured outputs in Phase 0 (LLM-04). */
export interface JsonSchema {
  type: 'object';
  required: string[];
  properties: Record<string, { type: 'string' | 'number' | 'boolean' }>;
}

export interface GatewayRequest {
  useCase: UseCase;
  userId: string;
  prompt: { key: UseCase; version: string };
  variables: Record<string, string | number>;
  schema: JsonSchema;
}

export type GatewayResult<T> =
  | { ok: true; value: T; usageId: string }
  | { ok: false; status: Exclude<GatewayResultStatus, 'ok'>; deniedScope?: BudgetScope; usageId: string };

/** LLM-12: content-free telemetry — counts and metadata only, never text. */
export interface LlmUsage {
  id: string;
  userId: string;
  useCase: UseCase;
  promptVersion: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUsd: number;
  latencyMs: number;
  result: GatewayResultStatus;
  budgetSnapshot: Partial<Record<BudgetScope, { used: number; limit: number }>>;
  createdAt: string;
}

export interface ProviderResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  stopReason: 'end' | 'max_tokens' | 'refusal';
}

export interface LlmProvider {
  readonly name: string;
  complete(args: {
    model: string;
    system: string;
    user: string;
    maxOutputTokens: number;
  }): Promise<ProviderResponse>;
}

export interface UseCaseBudget {
  maxInputTokens: number;
  maxOutputTokens: number;
  userDailyTokens: number;
  featureHourlyTokens: number;
  /** LLM-20: gateway may hop to the cheap model instead of denying. */
  degradable: boolean;
}

export interface BudgetConfig {
  useCases: Partial<Record<UseCase, UseCaseBudget>>;
  globalDailyCostUsd: number;
}
