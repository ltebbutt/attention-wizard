import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, DailyPlan, Task, Top3Entry } from '../core/api';
import { CONNECTIONS, WIZARD_COPY } from '../wizard/copy';
import { WizardState } from '../wizard/wizard-avatar';
import { WizardMessage } from '../wizard/wizard-message';

/** Spec 003 UI: TOP3-30..34. One primary action per loop state (DS-30). */
@Component({
  selector: 'aw-today',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, WizardMessage],
  templateUrl: './today.html',
  styleUrl: './today.scss',
})
export class Today implements OnInit, OnDestroy {
  private readonly api = inject(Api);

  /** MO-20: half-minute tick driving the count-up focus timer (DS-22). */
  private readonly now = signal(Date.now());
  private readonly ticker = setInterval(() => this.now.set(Date.now()), 30_000);

  /** MO-40: true for the ~1.2s star-burst after the 3rd completion. */
  readonly burst = signal(false);

  /** CONN-01 / INV-01 */
  readonly copy = WIZARD_COPY;
  readonly connections = CONNECTIONS;
  readonly connectionsOpen = signal(false);
  readonly invitePreviewDismissed = signal(false);

  readonly plan = signal<DailyPlan | null>(null);
  readonly backlog = signal<Task[]>([]);
  readonly tasksById = signal<Map<string, Task>>(new Map());
  readonly picking = signal(false);
  readonly backlogOpen = signal(false); // TOP3-33: collapsed by default
  readonly newTitle = signal('');
  readonly wizardNote = signal<string | null>(null);
  readonly thinking = signal(false);

  readonly entries = computed(() => this.plan()?.entries ?? []);
  readonly allDone = computed(
    () => this.entries().length === 3 && this.entries().every((e) => e.status === 'done'),
  );

  readonly wizardState = computed<WizardState>(() => {
    if (this.thinking()) return 'thinking';
    if (this.allDone() || this.plan()?.status === 'wrapped') return 'celebrating';
    return 'idle';
  });

  readonly wizardLine = computed(() => {
    if (this.wizardNote()) return this.wizardNote()!;
    const plan = this.plan();
    if (!plan) return this.timeGreeting();
    if (plan.status === 'wrapped') return WIZARD_COPY.greeting_wrapped;
    if (this.allDone()) return WIZARD_COPY.greeting_all_done;
    if (plan.status === 'confirmed') {
      return this.entries().some((e) => e.status === 'in_progress')
        ? WIZARD_COPY.greeting_in_progress
        : WIZARD_COPY.greeting_confirmed;
    }
    return this.picking() ? WIZARD_COPY.greeting_planning : this.timeGreeting();
  });

  /** GREET-01: the wizard respects the clock. */
  private timeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return WIZARD_COPY.greeting_morning;
    if (hour < 18) return WIZARD_COPY.greeting_afternoon;
    return WIZARD_COPY.greeting_evening;
  }

  /** INV-01: first estimated entry gets the invite preview after lock-in. */
  readonly inviteCandidate = computed(() => {
    if (this.invitePreviewDismissed()) return null;
    if (this.plan()?.status !== 'confirmed' || this.allDone()) return null;
    return this.entries().find((e) => e.estimateMin && e.status === 'pending') ?? null;
  });

  /** INV-02 */
  acceptInvitePreview(): void {
    this.invitePreviewDismissed.set(true);
    this.wizardNote.set(WIZARD_COPY.invite_ack);
  }

  /** UNDO-01: tap the check, it's pending again. */
  async undo(entry: Top3Entry): Promise<void> {
    this.plan.set(await this.api.setEntryStatus(entry.id, 'pending'));
    this.wizardNote.set(WIZARD_COPY.undo_note);
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  ngOnDestroy(): void {
    clearInterval(this.ticker);
  }

  /** Minutes since an entry was started; calm count-up, never seconds (MO-20). */
  elapsedMin(entry: Top3Entry & { startedAt?: string }): number {
    if (!entry.startedAt) return 0;
    return Math.max(0, Math.floor((this.now() - new Date(entry.startedAt).getTime()) / 60_000));
  }

  closePile(): void {
    this.picking.set(false);
    this.backlogOpen.set(false);
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

  async addTask(): Promise<void> {
    const title = this.newTitle().trim();
    if (!title) return;
    const task = await this.api.createTask(title);
    this.newTitle.set('');
    this.tasksById.update((m) => new Map(m).set(task.id, task));
    await this.refresh();
  }

  async pick(task: Task): Promise<void> {
    const plan = await this.api.addEntry(task.id);
    this.plan.set(plan);
    await this.refresh();
  }

  async unpick(entry: Top3Entry): Promise<void> {
    const plan = await this.api.removeEntry(entry.id);
    this.plan.set(plan);
    await this.refresh();
  }

  async confirm(): Promise<void> {
    this.plan.set(await this.api.confirmPlan());
    this.picking.set(false);
  }

  async start(entry: Top3Entry): Promise<void> {
    this.plan.set(await this.api.setEntryStatus(entry.id, 'in_progress'));
  }

  async done(entry: Top3Entry): Promise<void> {
    this.plan.set(await this.api.setEntryStatus(entry.id, 'done', 'about_right'));
    if (this.allDone()) {
      this.burst.set(true);
      setTimeout(() => this.burst.set(false), 1800);
    }
  }

  async wrapUp(): Promise<void> {
    this.plan.set(await this.api.wrapUp());
    await this.refresh();
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
