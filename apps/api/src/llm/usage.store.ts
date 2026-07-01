import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LlmUsage, UseCase } from './types';

/** LLM-12/15: one row per gateway call, content-free. In-memory for Phase 0. */
@Injectable()
export class UsageStore {
  private readonly rows: LlmUsage[] = [];

  record(row: Omit<LlmUsage, 'id' | 'createdAt'>): LlmUsage {
    const usage: LlmUsage = { ...row, id: randomUUID(), createdAt: new Date().toISOString() };
    this.rows.push(usage);
    return usage;
  }

  userTokensSince(userId: string, since: Date): number {
    return this.sumTokens((r) => r.userId === userId && new Date(r.createdAt) >= since);
  }

  useCaseTokensSince(useCase: UseCase, since: Date): number {
    return this.sumTokens((r) => r.useCase === useCase && new Date(r.createdAt) >= since);
  }

  globalCostSince(since: Date): number {
    return this.rows
      .filter((r) => new Date(r.createdAt) >= since)
      .reduce((sum, r) => sum + r.costUsd, 0);
  }

  userCostBetween(userId: string, from: Date, to: Date): number {
    return this.rows
      .filter((r) => r.userId === userId && new Date(r.createdAt) >= from && new Date(r.createdAt) < to)
      .reduce((sum, r) => sum + r.costUsd, 0);
  }

  /** LLM-15: the Phase 0 "dashboard" — aggregates per day and use case. */
  aggregates(): Array<{
    day: string;
    useCase: UseCase;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    denied: number;
  }> {
    const byKey = new Map<string, ReturnType<UsageStore['aggregates']>[number]>();
    for (const r of this.rows) {
      const day = r.createdAt.slice(0, 10);
      const key = `${day}:${r.useCase}`;
      const agg =
        byKey.get(key) ??
        { day, useCase: r.useCase, calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, denied: 0 };
      agg.calls += 1;
      agg.inputTokens += r.inputTokens;
      agg.outputTokens += r.outputTokens;
      agg.costUsd = Number((agg.costUsd + r.costUsd).toFixed(6));
      if (r.result === 'budget_denied') agg.denied += 1;
      byKey.set(key, agg);
    }
    return [...byKey.values()].sort((a, b) => a.day.localeCompare(b.day));
  }

  private sumTokens(match: (r: LlmUsage) => boolean): number {
    return this.rows.filter(match).reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);
  }
}
