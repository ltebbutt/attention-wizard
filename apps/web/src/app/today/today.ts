import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActualFeedback, Api, DailyPlan, Task, Top3Entry, WrapUpOutcome } from '../core/api';
import { DemoApi } from '../core/demo-api';
import { ProfileStore } from '../core/profile';
import { CONNECTIONS, WIZARD_COPY } from '../wizard/copy';
import { WizardState } from '../wizard/wizard-avatar';
import { WizardMessage } from '../wizard/wizard-message';

interface WeekDay {
  date: string;
  weekday: string;
  dayNum: number;
  isToday: boolean;
  dot: 'all' | 'some' | 'none' | null; // NAV-03: calm outcome dot, never a streak guilt UI
}

/** Spec 003 UI (TOP3-30..34) + spec 007: week navigator, wrap-up ritual,
 *  personalisation, reversible states. One primary action per loop state (DS-30). */
@Component({
  selector: 'aw-today',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, WizardMessage],
  templateUrl: './today.html',
  styleUrl: './today.scss',
})
export class Today implements OnInit, OnDestroy {
  private readonly api = inject(Api);
  readonly profile = inject(ProfileStore);

  /** MO-20: half-minute tick driving the count-up focus timer (DS-22). */
  private readonly now = signal(Date.now());
  private readonly ticker = setInterval(() => this.now.set(Date.now()), 30_000);

  readonly plan = signal<DailyPlan | null>(null);
  readonly backlog = signal<Task[]>([]);
  readonly tasksById = signal<Map<string, Task>>(new Map());
  readonly picking = signal(false);
  readonly backlogOpen = signal(false); // TOP3-33: collapsed by default
  readonly connectionsOpen = signal(false);
  readonly invitePreviewDismissed = signal(false);
  readonly newTitle = signal('');
  readonly wizardNote = signal<string | null>(null);
  readonly thinking = signal(false);
  readonly burst = signal(false); // MO-40

  /** PERS-01 */
  readonly nameDraft = signal('');
  readonly nameAskDismissed = signal(false);

  /** NAV-01: null = today (interactive); a date = read-only past view. */
  readonly selectedDate = signal<string | null>(null);
  readonly pastPlans = signal<Map<string, DailyPlan | null>>(new Map());

  /** WRAP-01: review state before the day closes. */
  readonly wrapping = signal(false);
  readonly wrapChoices = signal<Map<string, { status?: 'done' | 'rolled_over'; feedback?: ActualFeedback }>>(new Map());

  readonly copy = WIZARD_COPY;
  readonly connections = CONNECTIONS;
  readonly feedbackOptions: Array<{ value: ActualFeedback; label: string }> = [
    { value: 'about_right', label: 'about right' },
    { value: 'took_longer', label: 'took longer' },
    { value: 'was_quicker', label: 'was quicker' },
  ];

  readonly entries = computed(() => this.plan()?.entries ?? []);
  readonly allDone = computed(
    () => this.entries().length === 3 && this.entries().every((e) => e.status === 'done'),
  );
  readonly doneCount = computed(() => this.entries().filter((e) => e.status === 'done').length);

  readonly viewedPast = computed(() => {
    const date = this.selectedDate();
    return date ? { date, plan: this.pastPlans().get(date) ?? null } : null;
  });

  readonly weekDays = computed<WeekDay[]>(() => {
    const days: WeekDay[] = [];
    const past = this.pastPlans();
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(this.now() - offset * 86_400_000);
      const date = this.toLocalDate(d);
      const plan = offset === 0 ? this.plan() : past.get(date);
      let dot: WeekDay['dot'] = null;
      if (plan && plan.entries.length > 0) {
        const done = plan.entries.filter((e) => e.status === 'done').length;
        dot = done === plan.entries.length ? 'all' : done > 0 ? 'some' : 'none';
      }
      days.push({
        date,
        weekday: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday: offset === 0,
        dot,
      });
    }
    return days;
  });

  readonly wizardState = computed<WizardState>(() => {
    if (this.thinking()) return 'thinking';
    if (this.allDone() || this.plan()?.status === 'wrapped') return 'celebrating';
    return 'idle';
  });

  readonly wizardLine = computed(() => {
    if (this.wizardNote()) return this.wizardNote()!;
    const plan = this.plan();
    const name = this.profile.name() || undefined;
    if (!plan) return this.timeGreeting(name);
    if (plan.status === 'wrapped') return this.summaryLine();
    if (this.allDone()) return WIZARD_COPY.greeting_all_done;
    if (plan.status === 'confirmed') {
      return this.entries().some((e) => e.status === 'in_progress')
        ? WIZARD_COPY.greeting_in_progress
        : WIZARD_COPY.greeting_confirmed;
    }
    return this.picking() ? WIZARD_COPY.greeting_planning : this.timeGreeting(name);
  });

  /** INV-01 */
  readonly inviteCandidate = computed(() => {
    if (this.invitePreviewDismissed()) return null;
    if (this.plan()?.status !== 'confirmed' || this.allDone()) return null;
    return this.entries().find((e) => e.estimateMin && e.status === 'pending') ?? null;
  });

  async ngOnInit(): Promise<void> {
    await this.refresh();
    await this.loadWeek();
  }

  ngOnDestroy(): void {
    clearInterval(this.ticker);
  }

  private toLocalDate(d: Date): string {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }

  private timeGreeting(name?: string): string {
    const hour = new Date().getHours();
    if (hour < 12) return WIZARD_COPY.greeting_morning(name);
    if (hour < 18) return WIZARD_COPY.greeting_afternoon(name);
    return WIZARD_COPY.greeting_evening(name);
  }

  /** WRAP-04 */
  summaryLine(): string {
    const done = this.doneCount();
    const total = this.entries().length;
    if (total > 0 && done === total) return WIZARD_COPY.summary_all_done(this.profile.name() || undefined);
    if (done > 0) return WIZARD_COPY.summary_partial(done);
    return WIZARD_COPY.summary_none;
  }

  formatDay(date: string): string {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  taskTitle(entry: Top3Entry): string {
    return this.tasksById().get(entry.taskId)?.title ?? '…';
  }

  async refresh(): Promise<void> {
    const [plan, tasks] = await Promise.all([this.api.todayPlan(), this.api.listTasks()]);
    this.plan.set(plan);
    this.backlog.set(tasks.filter((t) => t.status === 'backlog'));
    this.tasksById.set(new Map(tasks.map((t) => [t.id, t])));
  }

  /** NAV-02: read-only lookups for the strip and past views. */
  async loadWeek(): Promise<void> {
    const map = new Map<string, DailyPlan | null>();
    for (let offset = 1; offset <= 6; offset++) {
      const date = this.toLocalDate(new Date(Date.now() - offset * 86_400_000));
      try {
        map.set(date, await this.api.planByDate(date));
      } catch {
        map.set(date, null);
      }
    }
    this.pastPlans.set(map);
  }

  selectDay(day: WeekDay): void {
    this.selectedDate.set(day.isToday ? null : day.date);
  }

  /** PERS-01 */
  saveName(): void {
    const name = this.nameDraft().trim();
    if (!name) return;
    this.profile.setName(name);
    this.wizardNote.set(WIZARD_COPY.name_saved(this.profile.name()));
  }

  async addTask(): Promise<void> {
    const title = this.newTitle().trim();
    if (!title) return;
    const task = await this.api.createTask(title);
    this.newTitle.set('');
    this.tasksById.update((m) => new Map(m).set(task.id, task));
    await this.refresh();
  }

  async pick(task: Task): Promise<void> {
    this.plan.set(await this.api.addEntry(task.id));
    await this.refresh();
  }

  async unpick(entry: Top3Entry): Promise<void> {
    this.plan.set(await this.api.removeEntry(entry.id));
    await this.refresh();
  }

  async confirm(): Promise<void> {
    this.plan.set(await this.api.confirmPlan());
    this.picking.set(false);
  }

  /** ST-01 */
  async unlock(): Promise<void> {
    this.plan.set(await this.api.unlockPlan());
  }

  /** ST-02 */
  async reopen(): Promise<void> {
    this.plan.set(await this.api.reopenPlan());
    await this.refresh();
  }

  async start(entry: Top3Entry): Promise<void> {
    this.plan.set(await this.api.setEntryStatus(entry.id, 'in_progress'));
  }

  async done(entry: Top3Entry): Promise<void> {
    this.plan.set(await this.api.setEntryStatus(entry.id, 'done'));
    if (this.allDone()) {
      this.burst.set(true);
      setTimeout(() => this.burst.set(false), 1800);
    }
  }

  /** UNDO-01 */
  async undo(entry: Top3Entry): Promise<void> {
    this.plan.set(await this.api.setEntryStatus(entry.id, 'pending'));
    this.wizardNote.set(WIZARD_COPY.undo_note);
  }

  /** WRAP-01..03 */
  startWrap(): void {
    this.wrapChoices.set(new Map());
    this.wrapping.set(true);
  }

  chooseOutcome(entryId: string, status: 'done' | 'rolled_over'): void {
    this.wrapChoices.update((m) => {
      const next = new Map(m);
      next.set(entryId, { ...next.get(entryId), status });
      return next;
    });
  }

  chooseFeedback(entryId: string, feedback: ActualFeedback): void {
    this.wrapChoices.update((m) => {
      const next = new Map(m);
      next.set(entryId, { ...next.get(entryId), feedback });
      return next;
    });
  }

  async finishWrap(): Promise<void> {
    const outcomes: WrapUpOutcome[] = [];
    for (const entry of this.entries()) {
      const choice = this.wrapChoices().get(entry.id);
      if (entry.status === 'done') {
        if (choice?.feedback) outcomes.push({ entryId: entry.id, status: 'done', actualFeedback: choice.feedback });
      } else if (choice?.status === 'done') {
        outcomes.push({ entryId: entry.id, status: 'done', actualFeedback: choice.feedback });
      }
    }
    this.plan.set(await this.api.wrapUp(outcomes));
    this.wrapping.set(false);
    await this.refresh();
  }

  /** INV-02 */
  acceptInvitePreview(): void {
    this.invitePreviewDismissed.set(true);
    this.wizardNote.set(WIZARD_COPY.invite_ack);
  }

  /** ST-04: demo-only. */
  get canReset(): boolean {
    return this.api instanceof DemoApi;
  }

  async resetDemo(): Promise<void> {
    if (this.api instanceof DemoApi) {
      this.api.reset();
      this.connectionsOpen.set(false);
      this.wizardNote.set(null);
      await this.refresh();
      await this.loadWeek();
    }
  }

  /** MO-20 */
  elapsedMin(entry: Top3Entry): number {
    if (!entry.startedAt) return 0;
    return Math.max(0, Math.floor((this.now() - new Date(entry.startedAt).getTime()) / 60_000));
  }

  closePile(): void {
    this.picking.set(false);
    this.backlogOpen.set(false);
  }

  /** LLM estimation via the gateway; degrades honestly (LLM-21, WIZ-13). */
  async estimate(task: Task): Promise<void> {
    this.thinking.set(true);
    this.wizardNote.set(WIZARD_COPY.estimate_thinking);
    try {
      const res = await this.api.estimateTask(task.id);
      this.wizardNote.set(
        res.estimated && res.estimateMin
          ? WIZARD_COPY.estimate_result(res.estimateMin, res.firstStep ?? '')
          : res.reason === 'budget_denied'
            ? WIZARD_COPY.budget_exhausted
            : WIZARD_COPY.estimate_unavailable,
      );
      await this.refresh();
    } catch {
      this.wizardNote.set(WIZARD_COPY.estimate_unavailable);
    } finally {
      this.thinking.set(false);
    }
  }

  clearNote(): void {
    this.wizardNote.set(null);
  }
}
