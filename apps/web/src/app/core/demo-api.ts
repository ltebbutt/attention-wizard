import { Injectable } from '@angular/core';
import { ActualFeedback, Api, DailyPlan, EntryStatus, EstimateResponse, Task, Top3Entry } from './api';

interface DemoState {
  tasks: Task[];
  plans: Array<DailyPlan & { entries: Top3Entry[] }>;
}

const STORAGE_KEY = 'aw-demo-v1';

/** Demo mode for GitHub Pages: the spec 003 rules (3-cap, single focus, rollover)
 *  running entirely in the browser, persisted to localStorage. Mirrors
 *  apps/api/src/plans/plans.service.ts — behaviour changes must land in both. */
@Injectable()
export class DemoApi extends Api {
  private state: DemoState = this.load();

  private load(): DemoState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as DemoState;
    } catch {
      /* fresh start */
    }
    return { tasks: [], plans: [] };
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private today(): string {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date(),
    );
  }

  private id(): string {
    return crypto.randomUUID();
  }

  /** TOP3-06: entering a new day rolls over any unwrapped previous plan. */
  private rolloverStalePlans(): void {
    const today = this.today();
    for (const plan of this.state.plans) {
      if (plan.planDate < today && plan.status !== 'wrapped') {
        for (const entry of plan.entries) {
          if (entry.status !== 'done') {
            entry.status = 'rolled_over';
            const task = this.state.tasks.find((t) => t.id === entry.taskId);
            if (task) {
              task.status = 'backlog';
              task.rolledOverCount += 1;
            }
          }
        }
        plan.status = 'wrapped';
      }
    }
  }

  private plan(): DailyPlan & { entries: Top3Entry[] } {
    this.rolloverStalePlans();
    const today = this.today();
    let plan = this.state.plans.find((p) => p.planDate === today);
    if (!plan) {
      plan = { id: this.id(), planDate: today, status: 'proposed', entries: [] };
      this.state.plans.push(plan);
      this.save();
    }
    return plan;
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  override async createTask(title: string, estimateMin?: number): Promise<Task> {
    const task: Task = { id: this.id(), title, estimateMin, status: 'backlog', rolledOverCount: 0 };
    this.state.tasks.push(task);
    this.save();
    return this.clone(task);
  }

  override async listTasks(): Promise<Task[]> {
    this.rolloverStalePlans();
    return this.clone(
      [...this.state.tasks].sort((a, b) => b.rolledOverCount - a.rolledOverCount),
    );
  }

  /** Deterministic mock estimation, same shape as the API's mock provider. */
  override async estimateTask(id: string): Promise<EstimateResponse> {
    await new Promise((r) => setTimeout(r, 900)); // let the wizard think (WIZ-13)
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return { estimated: false, reason: 'provider_error' };
    const estimateMin = Math.min(240, Math.max(5, 15 + (task.title.length % 8) * 10));
    task.estimateMin = estimateMin;
    this.save();
    return {
      estimated: true,
      estimateMin,
      firstStep: `Open what you need for “${task.title.slice(0, 40)}” and set a 10-minute timer.`,
    };
  }

  override async todayPlan(): Promise<DailyPlan> {
    return this.clone(this.plan());
  }

  override async addEntry(taskId: string): Promise<DailyPlan> {
    const plan = this.plan();
    if (plan.entries.length >= 3) throw { error: { code: 'TOP3_FULL' } };
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task || plan.entries.some((e) => e.taskId === taskId)) return this.clone(plan);
    const used = new Set(plan.entries.map((e) => e.position));
    const position = ([1, 2, 3] as const).find((p) => !used.has(p))!;
    plan.entries.push({ id: this.id(), taskId, position, status: 'pending', estimateMin: task.estimateMin });
    plan.entries.sort((a, b) => a.position - b.position);
    task.status = 'in_top3';
    this.save();
    return this.clone(plan);
  }

  override async removeEntry(entryId: string): Promise<DailyPlan> {
    const plan = this.plan();
    const entry = plan.entries.find((e) => e.id === entryId);
    plan.entries = plan.entries.filter((e) => e.id !== entryId);
    const task = entry && this.state.tasks.find((t) => t.id === entry.taskId);
    if (task) task.status = 'backlog';
    this.save();
    return this.clone(plan);
  }

  override async confirmPlan(): Promise<DailyPlan> {
    const plan = this.plan();
    plan.status = 'confirmed';
    this.save();
    return this.clone(plan);
  }

  override async wrapUp(): Promise<DailyPlan> {
    const plan = this.plan();
    for (const entry of plan.entries) {
      if (entry.status !== 'done') {
        entry.status = 'rolled_over';
        const task = this.state.tasks.find((t) => t.id === entry.taskId);
        if (task) {
          task.status = 'backlog';
          task.rolledOverCount += 1;
        }
      }
    }
    plan.status = 'wrapped';
    this.save();
    return this.clone(plan);
  }

  override async setEntryStatus(
    entryId: string,
    status: EntryStatus,
    _actualFeedback?: ActualFeedback,
  ): Promise<DailyPlan> {
    const plan = this.plan();
    const entry = plan.entries.find((e) => e.id === entryId);
    if (!entry) return this.clone(plan);
    if (status === 'in_progress') {
      for (const other of plan.entries) {
        if (other.id !== entryId && other.status === 'in_progress') other.status = 'pending';
      }
    }
    if (status === 'done') {
      const task = this.state.tasks.find((t) => t.id === entry.taskId);
      if (task) task.status = 'done';
    }
    entry.status = status;
    this.save();
    return this.clone(plan);
  }
}
