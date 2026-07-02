import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActualFeedback, DailyPlan, EntryStatus, localDate, Top3Entry } from '../domain/models';
import { TasksService } from '../tasks/tasks.service';

export interface WrapUpOutcome {
  entryId: string;
  status: 'done' | 'rolled_over';
  actualFeedback?: ActualFeedback;
}

/** The Top 3 daily loop (spec 003). All invariants are enforced here, server-side. */
@Injectable()
export class PlansService {
  private readonly plans = new Map<string, DailyPlan>();

  constructor(private readonly tasks: TasksService) {}

  /** TOP3-01/21: one plan per user per local date, created on first read. */
  getToday(userId: string, timezone: string, now: Date = new Date()): DailyPlan {
    const planDate = localDate(timezone, now);
    const key = `${userId}:${planDate}`;
    let plan = this.plans.get(key);
    if (!plan) {
      plan = { id: randomUUID(), userId, planDate, status: 'proposed', swaps: 0, entries: [] };
      this.plans.set(key, plan);
    }
    return plan;
  }

  /** TOP3-02/22: hard cap of three, enforced by the API. */
  addEntry(userId: string, timezone: string, taskId: string, now?: Date): DailyPlan {
    const plan = this.getToday(userId, timezone, now);
    if (plan.status === 'wrapped') throw new ConflictException('Today is already wrapped up');
    if (plan.entries.length >= 3) {
      throw new UnprocessableEntityException({ code: 'TOP3_FULL', message: 'A day holds exactly three things' });
    }
    const task = this.tasks.get(userId, taskId);
    if (plan.entries.some((e) => e.taskId === taskId)) {
      throw new ConflictException('Task is already in today\'s three');
    }
    const positions = new Set(plan.entries.map((e) => e.position));
    const position = ([1, 2, 3] as const).find((p) => !positions.has(p))!;
    const entry: Top3Entry = {
      id: randomUUID(),
      taskId,
      position,
      status: 'pending',
      estimateMin: task.estimateMin,
    };
    plan.entries.push(entry);
    plan.entries.sort((a, b) => a.position - b.position);
    task.status = 'in_top3';
    if (plan.status === 'confirmed') plan.swaps += 1; // TOP3-05
    return plan;
  }

  removeEntry(userId: string, timezone: string, entryId: string, now?: Date): DailyPlan {
    const plan = this.getToday(userId, timezone, now);
    const entry = this.findEntry(plan, entryId);
    plan.entries = plan.entries.filter((e) => e.id !== entryId);
    this.tasks.update(userId, entry.taskId, { status: 'backlog' });
    if (plan.status === 'confirmed') plan.swaps += 1; // TOP3-05
    return plan;
  }

  /** NAV-02: read-only lookup; never creates (creation is a today-only behaviour). */
  getByDate(userId: string, date: string): DailyPlan | null {
    return this.plans.get(`${userId}:${date}`) ?? null;
  }

  /** ST-01: a confirmed plan can be unlocked for editing until it is wrapped. */
  unlock(userId: string, timezone: string, now?: Date): DailyPlan {
    const plan = this.getToday(userId, timezone, now);
    if (plan.status === 'wrapped') throw new ConflictException('Reopen the day first');
    plan.status = 'proposed';
    return plan;
  }

  /** ST-02: reopening un-wraps the day; rolled-over entries come back. */
  reopen(userId: string, timezone: string, now?: Date): DailyPlan {
    const plan = this.getToday(userId, timezone, now);
    if (plan.status !== 'wrapped') return plan;
    for (const entry of plan.entries) {
      if (entry.status === 'rolled_over') {
        entry.status = 'pending';
        const task = this.tasks.get(userId, entry.taskId);
        task.status = 'in_top3';
        task.rolledOverCount = Math.max(0, task.rolledOverCount - 1);
      }
    }
    plan.status = 'confirmed';
    plan.wrappedAt = undefined;
    return plan;
  }

  /** TOP3-05: locking in is an explicit act. */
  confirm(userId: string, timezone: string, now?: Date): DailyPlan {
    const plan = this.getToday(userId, timezone, now);
    if (plan.entries.length === 0) throw new UnprocessableEntityException('Pick at least one thing first');
    plan.status = 'confirmed';
    plan.confirmedAt = new Date().toISOString();
    return plan;
  }

  /** TOP3-03/24: single focus — starting one entry pauses any other in-progress entry.
   *  TOP3-08: completion captures one-tap actual-time feedback. */
  setEntryStatus(
    userId: string,
    timezone: string,
    entryId: string,
    status: EntryStatus,
    actualFeedback?: ActualFeedback,
    now?: Date,
  ): DailyPlan {
    if (status === 'rolled_over') {
      throw new UnprocessableEntityException('rolled_over is set at wrap-up, not directly');
    }
    const plan = this.getToday(userId, timezone, now);
    const entry = this.findEntry(plan, entryId);
    if (status === 'in_progress') {
      for (const other of plan.entries) {
        if (other.id !== entryId && other.status === 'in_progress') other.status = 'pending';
      }
      entry.startedAt = entry.startedAt ?? new Date().toISOString();
    }
    if (status === 'done') {
      entry.doneAt = new Date().toISOString();
      entry.actualFeedback = actualFeedback;
      this.tasks.update(userId, entry.taskId, { status: 'done' });
    }
    // UNDO-01: a done entry can come back to pending until the plan is wrapped
    if (status === 'pending' && entry.status === 'done') {
      entry.doneAt = undefined;
      entry.actualFeedback = undefined;
      this.tasks.update(userId, entry.taskId, { status: 'in_top3' });
    }
    entry.status = status;
    return plan;
  }

  /** TOP3-06: wrap-up rolls unfinished entries over; their tasks are flagged for
   *  tomorrow's proposal via rolledOverCount (surfaced first by TasksService.list). */
  wrapUp(userId: string, timezone: string, outcomes: WrapUpOutcome[] = [], now?: Date): DailyPlan {
    const plan = this.getToday(userId, timezone, now);
    if (plan.status === 'wrapped') return plan;
    for (const outcome of outcomes) {
      const entry = this.findEntry(plan, outcome.entryId);
      if (outcome.status === 'done' && entry.status !== 'done') {
        entry.status = 'done';
        entry.doneAt = new Date().toISOString();
        entry.actualFeedback = outcome.actualFeedback;
        this.tasks.update(userId, entry.taskId, { status: 'done' });
      } else if (entry.status === 'done' && outcome.actualFeedback) {
        entry.actualFeedback = outcome.actualFeedback; // WRAP-03
      }
    }
    for (const entry of plan.entries) {
      if (entry.status !== 'done') {
        entry.status = 'rolled_over';
        this.tasks.markRolledOver(userId, entry.taskId);
      }
    }
    plan.status = 'wrapped';
    plan.wrappedAt = new Date().toISOString();
    return plan;
  }

  private findEntry(plan: DailyPlan, entryId: string): Top3Entry {
    const entry = plan.entries.find((e) => e.id === entryId);
    if (!entry) throw new NotFoundException('Entry not found in today\'s plan');
    return entry;
  }
}
