import { UnprocessableEntityException } from '@nestjs/common';
import { localDate } from '../domain/models';
import { TasksService } from '../tasks/tasks.service';
import { PlansService } from './plans.service';

const USER = 'dev-user';
const TZ = 'Europe/London';

describe('PlansService (spec 003)', () => {
  let tasks: TasksService;
  let plans: PlansService;

  const makeTask = (title: string) => tasks.create(USER, { title });

  beforeEach(() => {
    tasks = new TasksService();
    plans = new PlansService(tasks);
  });

  it('AC-1: rejects a 4th entry with TOP3_FULL (TOP3-02)', () => {
    for (let i = 0; i < 3; i++) {
      plans.addEntry(USER, TZ, makeTask(`task ${i}`).id);
    }
    const fourth = makeTask('one too many');
    try {
      plans.addEntry(USER, TZ, fourth.id);
      fail('expected TOP3_FULL');
    } catch (err) {
      expect(err).toBeInstanceOf(UnprocessableEntityException);
      expect((err as UnprocessableEntityException).getResponse()).toMatchObject({ code: 'TOP3_FULL' });
    }
  });

  it('AC-2: starting entry B pauses in-progress entry A (TOP3-03 single focus)', () => {
    const a = plans.addEntry(USER, TZ, makeTask('a').id).entries[0];
    const plan = plans.addEntry(USER, TZ, makeTask('b').id);
    const b = plan.entries.find((e) => e.id !== a.id)!;

    plans.setEntryStatus(USER, TZ, a.id, 'in_progress');
    const after = plans.setEntryStatus(USER, TZ, b.id, 'in_progress');

    expect(after.entries.find((e) => e.id === a.id)!.status).toBe('pending');
    expect(after.entries.find((e) => e.id === b.id)!.status).toBe('in_progress');
  });

  it('AC-3: wrap-up rolls over unfinished entries and they surface first tomorrow (TOP3-06)', () => {
    const doneTask = makeTask('finished');
    const leftTask = makeTask('left behind');
    plans.addEntry(USER, TZ, doneTask.id);
    plans.addEntry(USER, TZ, leftTask.id);
    const plan = plans.getToday(USER, TZ);
    const doneEntry = plan.entries.find((e) => e.taskId === doneTask.id)!;

    plans.setEntryStatus(USER, TZ, doneEntry.id, 'done', 'about_right');
    const wrapped = plans.wrapUp(USER, TZ);

    expect(wrapped.status).toBe('wrapped');
    expect(wrapped.entries.find((e) => e.taskId === leftTask.id)!.status).toBe('rolled_over');
    const backlog = tasks.list(USER, 'backlog');
    expect(backlog[0].id).toBe(leftTask.id); // rolled-over first (TOP3-31)
    expect(backlog[0].rolledOverCount).toBe(1);
  });

  it('AC-5: plan date respects the user timezone (TOP3-01)', () => {
    // 2026-07-01T21:30Z is 22:30 July 1st in London (BST) but 09:30 July 2nd in Auckland.
    const now = new Date('2026-07-01T21:30:00Z');
    expect(localDate('Europe/London', now)).toBe('2026-07-01');
    expect(localDate('Pacific/Auckland', now)).toBe('2026-07-02');

    const londonPlan = plans.getToday(USER, 'Europe/London', now);
    const aucklandPlan = plans.getToday(USER, 'Pacific/Auckland', now);
    expect(londonPlan.planDate).toBe('2026-07-01');
    expect(aucklandPlan.planDate).toBe('2026-07-02');
    expect(londonPlan.id).not.toBe(aucklandPlan.id);
  });

  it('records swaps after confirmation without judging (TOP3-05)', () => {
    const kept = makeTask('kept');
    const swappedOut = makeTask('swapped out');
    plans.addEntry(USER, TZ, kept.id);
    const plan = plans.addEntry(USER, TZ, swappedOut.id);
    plans.confirm(USER, TZ);

    const entry = plan.entries.find((e) => e.taskId === swappedOut.id)!;
    plans.removeEntry(USER, TZ, entry.id);
    plans.addEntry(USER, TZ, makeTask('replacement').id);

    expect(plans.getToday(USER, TZ).swaps).toBe(2);
  });
});
