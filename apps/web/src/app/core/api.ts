import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** DTOs mirroring apps/api/src/domain/models.ts (moves to packages/shared later). */
export type EntryStatus = 'pending' | 'in_progress' | 'done' | 'rolled_over';
export type ActualFeedback = 'about_right' | 'took_longer' | 'was_quicker';

export interface Task {
  id: string;
  title: string;
  note?: string;
  estimateMin?: number;
  status: 'backlog' | 'in_top3' | 'done' | 'dismissed';
  rolledOverCount: number;
}

export interface Top3Entry {
  id: string;
  taskId: string;
  position: 1 | 2 | 3;
  status: EntryStatus;
  estimateMin?: number;
  startedAt?: string;
}

export interface DailyPlan {
  id: string;
  planDate: string;
  status: 'proposed' | 'confirmed' | 'wrapped';
  entries: Top3Entry[];
}

export interface EstimateResponse {
  estimated: boolean;
  estimateMin?: number;
  firstStep?: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1';

  createTask(title: string, estimateMin?: number): Promise<Task> {
    return firstValueFrom(this.http.post<Task>(`${this.base}/tasks`, { title, estimateMin }));
  }

  listTasks(): Promise<Task[]> {
    return firstValueFrom(this.http.get<Task[]>(`${this.base}/tasks`));
  }

  estimateTask(id: string): Promise<EstimateResponse> {
    return firstValueFrom(this.http.post<EstimateResponse>(`${this.base}/tasks/${id}/estimate`, {}));
  }

  todayPlan(): Promise<DailyPlan> {
    return firstValueFrom(this.http.get<DailyPlan>(`${this.base}/plans/today`));
  }

  addEntry(taskId: string): Promise<DailyPlan> {
    return firstValueFrom(this.http.post<DailyPlan>(`${this.base}/plans/today/entries`, { taskId }));
  }

  removeEntry(entryId: string): Promise<DailyPlan> {
    return firstValueFrom(this.http.delete<DailyPlan>(`${this.base}/plans/today/entries/${entryId}`));
  }

  confirmPlan(): Promise<DailyPlan> {
    return firstValueFrom(this.http.post<DailyPlan>(`${this.base}/plans/today/confirm`, {}));
  }

  wrapUp(): Promise<DailyPlan> {
    return firstValueFrom(this.http.post<DailyPlan>(`${this.base}/plans/today/wrapup`, {}));
  }

  setEntryStatus(entryId: string, status: EntryStatus, actualFeedback?: ActualFeedback): Promise<DailyPlan> {
    return firstValueFrom(
      this.http.post<DailyPlan>(`${this.base}/entries/${entryId}/status`, { status, actualFeedback }),
    );
  }
}
