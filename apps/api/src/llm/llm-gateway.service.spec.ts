import { BudgetService } from './budget.service';
import { LlmGatewayService } from './llm-gateway.service';
import { PromptRegistry } from './prompt-registry';
import { GatewayRequest } from './types';
import { UsageStore } from './usage.store';

const req = (userId = 'dev-user'): GatewayRequest => ({
  useCase: 'estimation',
  userId,
  prompt: { key: 'estimation', version: 'v1' },
  variables: { title: 'write the report', note: '' },
  schema: {
    type: 'object',
    required: ['estimateMin', 'firstStep'],
    properties: { estimateMin: { type: 'number' }, firstStep: { type: 'string' } },
  },
});

function makeGateway(budgets?: string) {
  if (budgets !== undefined) process.env.AW_LLM_BUDGETS = budgets;
  else delete process.env.AW_LLM_BUDGETS;
  const usage = new UsageStore();
  const gateway = new LlmGatewayService(new PromptRegistry(), new BudgetService(usage), usage);
  return { gateway, usage };
}

afterEach(() => delete process.env.AW_LLM_BUDGETS);

describe('LlmGatewayService (spec 004)', () => {
  it('AC-1: fails closed with no budget config and still records usage (LLM-11/12)', async () => {
    const { gateway, usage } = makeGateway(JSON.stringify({ useCases: {}, globalDailyCostUsd: 5 }));
    const result = await gateway.complete(req());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('budget_denied');
      expect(result.deniedScope).toBe('request');
    }
    const rows = usage.aggregates();
    expect(rows).toHaveLength(1);
    expect(rows[0].denied).toBe(1);
  });

  it('AC-2: denies once the per-user daily budget is exhausted (LLM-10)', async () => {
    const { gateway, usage } = makeGateway(
      JSON.stringify({
        useCases: {
          estimation: {
            maxInputTokens: 2000,
            maxOutputTokens: 300,
            userDailyTokens: 5000,
            featureHourlyTokens: 100000,
            degradable: true,
          },
        },
        globalDailyCostUsd: 5,
      }),
    );

    const first = await gateway.complete(req());
    expect(first.ok).toBe(true);

    // Deterministically exhaust today's allowance, then the next call must be denied.
    usage.record({
      userId: 'dev-user',
      useCase: 'estimation',
      promptVersion: 'v1',
      provider: 'mock',
      model: 'mock',
      inputTokens: 5000,
      outputTokens: 0,
      cachedTokens: 0,
      costUsd: 0,
      latencyMs: 0,
      result: 'ok',
      budgetSnapshot: {},
    });
    const denied = await gateway.complete(req());
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.status).toBe('budget_denied');
      expect(denied.deniedScope).toBe('user_daily');
    }
  });

  it('AC-4: usage rows carry provider-reported token counts (LLM-12/13)', async () => {
    const { gateway, usage } = makeGateway();
    const result = await gateway.complete<{ estimateMin: number; firstStep: string }>(req());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.estimateMin).toBeGreaterThanOrEqual(5);
      expect(result.value.firstStep.length).toBeGreaterThan(0);
    }
    const agg = usage.aggregates()[0];
    expect(agg.inputTokens).toBeGreaterThan(0);
    expect(agg.outputTokens).toBe(40); // mock provider reports 40
  });

  it('validates output against the schema (LLM-04)', async () => {
    const { gateway } = makeGateway();
    const badSchema = {
      ...req(),
      schema: {
        type: 'object' as const,
        required: ['somethingTheMockNeverReturns'],
        properties: { somethingTheMockNeverReturns: { type: 'string' as const } },
      },
    };
    const result = await gateway.complete(badSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('schema_invalid');
  });
});
