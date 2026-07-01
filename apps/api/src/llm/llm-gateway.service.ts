import { Injectable, Logger } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { PromptRegistry } from './prompt-registry';
import { costUsd, providerFromEnv } from './providers';
import {
  BudgetScope,
  GatewayRequest,
  GatewayResult,
  GatewayResultStatus,
  JsonSchema,
  LlmProvider,
} from './types';
import { UsageStore } from './usage.store';

/** Spec 004: the single choke point. No other module talks to a provider. */
@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);
  private readonly provider: LlmProvider;
  private readonly model: string;
  private readonly lockedUsers = new Set<string>();

  constructor(
    private readonly prompts: PromptRegistry,
    private readonly budgets: BudgetService,
    private readonly usage: UsageStore,
  ) {
    const { provider, model } = providerFromEnv();
    this.provider = provider;
    this.model = model;
  }

  async complete<T>(req: GatewayRequest): Promise<GatewayResult<T>> {
    const template = this.prompts.get(req.prompt.key, req.prompt.version);
    const userPrompt = this.prompts.render(template.user, req.variables);
    // Pre-dispatch estimate only (LLM-13); accounting uses provider-reported counts.
    const estimatedInput = Math.ceil((template.system.length + userPrompt.length) / 4);

    // LLM-14: locked users are denied non-interactive calls before budget checks.
    if (this.lockedUsers.has(req.userId) && req.useCase !== 'onboarding') {
      return this.deny(req, 'user_daily', { user_daily: { used: -1, limit: -1 } });
    }

    const decision = this.budgets.check(req.useCase, req.userId, estimatedInput);
    if (!decision.allowed) {
      return this.deny(req, decision.deniedScope, decision.snapshot);
    }

    const started = Date.now();
    let response;
    try {
      response = await this.provider.complete({
        model: this.model,
        system: template.system,
        user: userPrompt,
        maxOutputTokens: decision.budget.maxOutputTokens,
      });
    } catch (err) {
      this.logger.warn(`Provider failure for ${req.useCase}: ${String(err)}`);
      const usageId = this.record(req, 0, 0, 0, 0, 'provider_error', decision.snapshot);
      return { ok: false, status: 'provider_error', usageId };
    }

    let status: GatewayResultStatus =
      response.stopReason === 'max_tokens' ? 'truncated' : response.stopReason === 'refusal' ? 'refused' : 'ok';
    let value = status === 'ok' ? this.parse<T>(response.text, req.schema) : undefined;

    // LLM-04: one repair retry on schema failure.
    if (status === 'ok' && value === undefined) {
      try {
        const retry = await this.provider.complete({
          model: this.model,
          system: template.system,
          user: `${userPrompt}\n\nYour previous reply was not valid JSON for the schema. Reply with ONLY the JSON object.`,
          maxOutputTokens: decision.budget.maxOutputTokens,
        });
        response = {
          ...retry,
          inputTokens: response.inputTokens + retry.inputTokens,
          outputTokens: response.outputTokens + retry.outputTokens,
        };
        value = this.parse<T>(retry.text, req.schema);
      } catch {
        // fall through to schema_invalid with first-call usage
      }
      if (value === undefined) status = 'schema_invalid';
    }

    const latency = Date.now() - started;
    const cost = costUsd(this.model, response.inputTokens, response.outputTokens);
    const usageId = this.record(
      req,
      response.inputTokens,
      response.outputTokens,
      response.cachedTokens,
      latency,
      status,
      decision.snapshot,
      cost,
    );

    if (this.budgets.isRunaway(req.userId)) {
      this.lockedUsers.add(req.userId);
      this.logger.error(`Runaway usage detected for ${req.userId}; non-interactive use cases locked (LLM-14)`);
    }

    if (status === 'ok' && value !== undefined) return { ok: true, value, usageId };
    return { ok: false, status: status as Exclude<GatewayResultStatus, 'ok'>, usageId };
  }

  private parse<T>(text: string, schema: JsonSchema): T | undefined {
    try {
      const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      for (const key of schema.required) {
        if (!(key in parsed)) return undefined;
      }
      for (const [key, def] of Object.entries(schema.properties)) {
        if (key in parsed && typeof parsed[key] !== def.type) return undefined;
      }
      return parsed as T;
    } catch {
      return undefined;
    }
  }

  private deny(
    req: GatewayRequest,
    deniedScope: BudgetScope,
    snapshot: Partial<Record<BudgetScope, { used: number; limit: number }>>,
  ): GatewayResult<never> {
    const usageId = this.record(req, 0, 0, 0, 0, 'budget_denied', snapshot);
    return { ok: false, status: 'budget_denied', deniedScope, usageId };
  }

  private record(
    req: GatewayRequest,
    inputTokens: number,
    outputTokens: number,
    cachedTokens: number,
    latencyMs: number,
    result: GatewayResultStatus,
    budgetSnapshot: Partial<Record<BudgetScope, { used: number; limit: number }>>,
    cost = 0,
  ): string {
    return this.usage.record({
      userId: req.userId,
      useCase: req.useCase,
      promptVersion: req.prompt.version,
      provider: this.provider.name,
      model: this.model,
      inputTokens,
      outputTokens,
      cachedTokens,
      costUsd: cost,
      latencyMs,
      result,
      budgetSnapshot,
    }).id;
  }
}
