import { Injectable } from '@nestjs/common';
import { BudgetConfig, BudgetScope, UseCase, UseCaseBudget } from './types';
import { UsageStore } from './usage.store';

/** LLM-10/11: pre-dispatch budget checks, cheapest first, fail closed.
 *  Config is env-seeded (AW_LLM_BUDGETS as JSON) with dev defaults; DB-backed later. */
const DEV_DEFAULTS: BudgetConfig = {
  useCases: {
    estimation: {
      maxInputTokens: 2_000,
      maxOutputTokens: 300,
      userDailyTokens: 20_000,
      featureHourlyTokens: 200_000,
      degradable: true,
    },
  },
  globalDailyCostUsd: 5,
};

export type BudgetDecision =
  | { allowed: true; budget: UseCaseBudget; snapshot: Snapshot }
  | { allowed: false; deniedScope: BudgetScope; snapshot: Snapshot };

type Snapshot = Partial<Record<BudgetScope, { used: number; limit: number }>>;

@Injectable()
export class BudgetService {
  private readonly config: BudgetConfig;

  constructor(private readonly usage: UsageStore) {
    this.config = process.env.AW_LLM_BUDGETS
      ? (JSON.parse(process.env.AW_LLM_BUDGETS) as BudgetConfig)
      : DEV_DEFAULTS;
  }

  check(useCase: UseCase, userId: string, estimatedInputTokens: number, now: Date = new Date()): BudgetDecision {
    const budget = this.config.useCases[useCase];
    const snapshot: Snapshot = {};

    // LLM-11: no config for this use case → deny, never allow.
    if (!budget) {
      snapshot.request = { used: estimatedInputTokens, limit: 0 };
      return { allowed: false, deniedScope: 'request', snapshot };
    }

    snapshot.request = { used: estimatedInputTokens, limit: budget.maxInputTokens };
    if (estimatedInputTokens > budget.maxInputTokens) {
      return { allowed: false, deniedScope: 'request', snapshot };
    }

    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const userUsed = this.usage.userTokensSince(userId, dayStart);
    snapshot.user_daily = { used: userUsed, limit: budget.userDailyTokens };
    if (userUsed + estimatedInputTokens > budget.userDailyTokens) {
      return { allowed: false, deniedScope: 'user_daily', snapshot };
    }

    const hourAgo = new Date(now.getTime() - 3_600_000);
    const featureUsed = this.usage.useCaseTokensSince(useCase, hourAgo);
    snapshot.feature_hourly = { used: featureUsed, limit: budget.featureHourlyTokens };
    if (featureUsed + estimatedInputTokens > budget.featureHourlyTokens) {
      return { allowed: false, deniedScope: 'feature_hourly', snapshot };
    }

    const globalUsed = this.usage.globalCostSince(dayStart);
    snapshot.global_daily = { used: globalUsed, limit: this.config.globalDailyCostUsd };
    if (globalUsed >= this.config.globalDailyCostUsd) {
      return { allowed: false, deniedScope: 'global_daily', snapshot };
    }

    return { allowed: true, budget, snapshot };
  }

  /** LLM-14 runaway guard: last-hour spend vs trailing 7-day hourly average. */
  isRunaway(userId: string, now: Date = new Date()): boolean {
    const hourAgo = new Date(now.getTime() - 3_600_000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3_600_000);
    const lastHour = this.usage.userCostBetween(userId, hourAgo, now);
    const trailingAvg = this.usage.userCostBetween(userId, weekAgo, hourAgo) / (7 * 24);
    const ABSOLUTE_FLOOR_USD = 0.5;
    return lastHour > ABSOLUTE_FLOOR_USD && lastHour > 10 * Math.max(trailingAvg, 0.01);
  }
}
