/** Domain models for Phase 1 (spec 003). In-memory persistence for now; the shapes
 *  mirror docs/04-data-model.md so the later Postgres move is a repository swap. */

export type TaskStatus = 'backlog' | 'in_top3' | 'done' | 'dismissed';

export interface Task {
  id: string;
  userId: string;
  source: 'manual';
  title: string;
  note?: string;
  deadlineAt?: string; // ISO
  estimateMin?: number;
  status: TaskStatus;
  rolledOverCount: number;
  createdAt: string;
}

export type PlanStatus = 'proposed' | 'confirmed' | 'wrapped';
export type EntryStatus = 'pending' | 'in_progress' | 'done' | 'rolled_over';
export type ActualFeedback = 'about_right' | 'took_longer' | 'was_quicker';

export interface Top3Entry {
  id: string;
  taskId: string;
  position: 1 | 2 | 3;
  status: EntryStatus;
  estimateMin?: number;
  actualFeedback?: ActualFeedback;
  startedAt?: string;
  doneAt?: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  planDate: string; // YYYY-MM-DD in the user's timezone (TOP3-01)
  status: PlanStatus;
  swaps: number; // TOP3-05: recorded, never a guilt metric
  entries: Top3Entry[];
  confirmedAt?: string;
  wrappedAt?: string;
}

/** YYYY-MM-DD for `now` in an IANA timezone (AC-5 of spec 003). */
export function localDate(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
