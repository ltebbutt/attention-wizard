import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Task, TaskStatus } from '../domain/models';

export interface CreateTaskDto {
  title: string;
  note?: string;
  deadlineAt?: string;
  estimateMin?: number;
}

export type UpdateTaskDto = Partial<CreateTaskDto> & { status?: TaskStatus };

/** Backlog of manually entered tasks (TOP3-04, TOP3-20). */
@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  create(userId: string, dto: CreateTaskDto): Task {
    const task: Task = {
      id: randomUUID(),
      userId,
      source: 'manual',
      title: dto.title,
      note: dto.note,
      deadlineAt: dto.deadlineAt,
      estimateMin: dto.estimateMin,
      status: 'backlog',
      rolledOverCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  list(userId: string, status?: TaskStatus): Task[] {
    return [...this.tasks.values()]
      .filter((t) => t.userId === userId && (!status || t.status === status))
      // Rolled-over items surface first in the picking view (TOP3-31)
      .sort((a, b) => b.rolledOverCount - a.rolledOverCount || a.createdAt.localeCompare(b.createdAt));
  }

  get(userId: string, id: string): Task {
    const task = this.tasks.get(id);
    if (!task || task.userId !== userId) throw new NotFoundException('Task not found');
    return task;
  }

  update(userId: string, id: string, dto: UpdateTaskDto): Task {
    const task = this.get(userId, id);
    Object.assign(task, dto);
    return task;
  }

  markRolledOver(userId: string, id: string): void {
    const task = this.get(userId, id);
    task.status = 'backlog';
    task.rolledOverCount += 1;
  }

  remove(userId: string, id: string): void {
    this.get(userId, id);
    this.tasks.delete(id);
  }
}
