import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { ProfileStore } from '../core/profile';
import { WizardMessage } from '../wizard/wizard-message';
import { INTERVIEW_QUESTIONS, InterviewAnswers, recommend, scoreProfile } from './interview-data';

/** INT-01..06: five questions, one at a time, chip answers, skippable. */
@Component({
  selector: 'aw-interview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardMessage],
  template: `
    <div class="scrim" (click)="close.emit()" aria-hidden="true"></div>
    <section class="sheet" role="dialog" aria-label="Get to know you">
      <header class="head">
        <h2 class="aw-lead">Two minutes, five questions</h2>
        <button class="aw-btn aw-btn-ghost" (click)="close.emit()">close</button>
      </header>
      <p class="aw-small">
        This tunes how I help — it isn’t a test or an assessment, and there are no wrong answers.
      </p>

      @if (!doneStep()) {
        <aw-wizard-message state="idle">{{ current().prompt }}</aw-wizard-message>
        <div class="chip-col">
          @for (opt of current().options; track opt.value) {
            <button class="chip" (click)="answer(opt.value)">{{ opt.label }}</button>
          }
        </div>
        <div class="dots" aria-label="progress">
          @for (q of questions; track q.id; let i = $index) {
            <span class="dot" [class.dot-on]="i <= step()"></span>
          }
        </div>
      } @else {
        <aw-wizard-message state="celebrating">
          Got it. Here’s what I’ll do differently for you.
        </aw-wizard-message>
        <ul class="recs">
          @for (rec of profile.recommendations(); track rec.title) {
            <li class="aw-card rec">
              <strong>{{ rec.title }}</strong>
              <span class="aw-small">{{ rec.why }}</span>
            </li>
          }
        </ul>
        <button class="aw-btn aw-btn-primary" (click)="close.emit()">Let’s go</button>
      }
    </section>
  `,
  styles: `
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 10;
      background: var(--aw-scrim);
      animation: aw-fade var(--aw-t-base) var(--aw-ease);
    }

    .sheet {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 11;
      margin: 0 auto;
      max-width: 560px;
      max-height: 85dvh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--aw-s4);
      background: var(--aw-surface);
      border: 1px solid var(--aw-line);
      border-bottom: none;
      border-radius: var(--aw-r-lg) var(--aw-r-lg) 0 0;
      box-shadow: var(--aw-sheet-shadow);
      padding: var(--aw-s4) var(--aw-s4) calc(var(--aw-s4) + env(safe-area-inset-bottom));
      animation: aw-sheet-up var(--aw-t-slow) var(--aw-ease);
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .chip-col {
      display: flex;
      flex-direction: column;
      gap: var(--aw-s2);
    }

    .chip {
      min-height: 48px;
      padding: var(--aw-s2) var(--aw-s4);
      background: var(--aw-surface-2);
      border: 1px solid var(--aw-line);
      border-radius: var(--aw-r-pill);
      color: var(--aw-ink);
      font: inherit;
      cursor: pointer;
      text-align: left;
      transition: border-color var(--aw-t-fast) var(--aw-ease), transform var(--aw-t-fast) var(--aw-ease);
      animation: aw-rise var(--aw-t-base) var(--aw-ease) backwards;
    }

    .chip:nth-child(2) { animation-delay: calc(var(--aw-stagger) * 1); }
    .chip:nth-child(3) { animation-delay: calc(var(--aw-stagger) * 2); }
    .chip:nth-child(4) { animation-delay: calc(var(--aw-stagger) * 3); }

    .chip:hover {
      border-color: var(--aw-emerald);
    }

    .chip:active {
      transform: scale(0.98);
    }

    .dots {
      display: flex;
      gap: var(--aw-s2);
      justify-content: center;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: var(--aw-r-pill);
      background: var(--aw-line);
      transition: background-color var(--aw-t-base) var(--aw-ease);
    }

    .dot-on {
      background: var(--aw-emerald);
    }

    .recs {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--aw-s2);
    }

    .rec {
      display: flex;
      flex-direction: column;
      gap: var(--aw-s1);
      padding: var(--aw-s3) var(--aw-s4);
      animation: aw-rise var(--aw-t-base) var(--aw-ease) backwards;
    }

    .rec:nth-child(2) { animation-delay: calc(var(--aw-stagger) * 1); }
    .rec:nth-child(3) { animation-delay: calc(var(--aw-stagger) * 2); }
  `,
})
export class Interview {
  readonly profile = inject(ProfileStore);
  readonly close = output();

  readonly questions = INTERVIEW_QUESTIONS;
  readonly step = signal(0);
  readonly doneStep = signal(false);
  private readonly answers: Partial<InterviewAnswers> = {};

  readonly current = computed(() => this.questions[Math.min(this.step(), this.questions.length - 1)]);

  answer(value: string): void {
    const q = this.questions[this.step()];
    (this.answers as Record<string, string>)[q.id] = value;
    if (this.step() + 1 < this.questions.length) {
      this.step.update((s) => s + 1);
    } else {
      const dims = scoreProfile(this.answers as InterviewAnswers);
      this.profile.completeInterview(dims, recommend(dims)); // INT-06
      this.doneStep.set(true);
    }
  }
}
