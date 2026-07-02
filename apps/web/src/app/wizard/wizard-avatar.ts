import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type WizardState = 'idle' | 'thinking' | 'celebrating' | 'concerned';
export type WizardSize = 'sm' | 'md' | 'lg';

/** Spec 002 WIZ-01..05: the app's single illustrative element. Pure inline SVG drawn
 *  from design tokens; expressions change eyes/mouth/hat only, silhouette constant. */
@Component({
  selector: 'aw-wizard-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="px()"
      [attr.height]="px()"
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      [attr.aria-label]="'Wizard, ' + state()"
      [class]="'wiz wiz-' + state()"
    >
      <!-- face -->
      <circle cx="32" cy="40" r="18" fill="var(--aw-surface-2)" stroke="var(--aw-line)" stroke-width="2" />
      <!-- hat: rounded cone; tilt transitions smoothly per state (MO-50) -->
      <g class="hat">
        <path
          d="M32 4 C33.5 4 34.5 5 35 6.5 L44 26 C45 28.5 43.5 30 41 30 L23 30 C20.5 30 19 28.5 20 26 L29 6.5 C29.5 5 30.5 4 32 4 Z"
          fill="var(--aw-emerald)"
        />
        <path class="star" d="M32 12 l1.3 2.6 2.9 .4 -2.1 2 .5 2.9 -2.6 -1.4 -2.6 1.4 .5 -2.9 -2.1 -2 2.9 -.4 Z" fill="var(--aw-ink-on-emerald)" />
      </g>
      <!-- eyes -->
      @if (state() === 'thinking') {
        <g class="eyes">
          <circle cx="25" cy="40" r="2.4" fill="var(--aw-ink)" />
          <circle cx="39" cy="38.5" r="2.4" fill="var(--aw-ink)" />
          <circle class="thought" cx="50" cy="26" r="2.2" fill="var(--aw-emerald)" />
        </g>
      } @else if (state() === 'celebrating') {
        <g class="eyes" stroke="var(--aw-ink)" stroke-width="2.4" stroke-linecap="round">
          <path d="M22.5 40 q2.5 -3 5 0" />
          <path d="M36.5 40 q2.5 -3 5 0" />
        </g>
      } @else if (state() === 'concerned') {
        <g class="eyes">
          <circle cx="25" cy="41" r="2.4" fill="var(--aw-ink)" />
          <circle cx="39" cy="41" r="2.4" fill="var(--aw-ink)" />
          <path d="M21.5 35.5 l6 -1.5 M42.5 35.5 l-6 -1.5" stroke="var(--aw-ink-mute)" stroke-width="2" stroke-linecap="round" />
        </g>
      } @else {
        <g class="eyes">
          <circle cx="25" cy="40" r="2.4" fill="var(--aw-ink)" />
          <circle cx="39" cy="40" r="2.4" fill="var(--aw-ink)" />
        </g>
      }
      <!-- mouth -->
      @if (state() === 'celebrating') {
        <path d="M26 47 q6 6 12 0" stroke="var(--aw-emerald)" stroke-width="2.6" stroke-linecap="round" fill="none" />
      } @else if (state() === 'concerned') {
        <path d="M27 49 q5 -2.5 10 0" stroke="var(--aw-ink-mute)" stroke-width="2.4" stroke-linecap="round" fill="none" />
      } @else if (state() === 'thinking') {
        <circle cx="33" cy="48.5" r="2" fill="var(--aw-ink-mute)" />
      } @else {
        <path d="M27 47.5 q5 3.5 10 0" stroke="var(--aw-ink)" stroke-width="2.4" stroke-linecap="round" fill="none" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }

    /* MO-50: hat tilt transitions instead of snapping */
    .hat {
      transform-origin: 32px 30px;
      transition: transform var(--aw-t-base) var(--aw-ease);
    }

    .wiz-celebrating .hat {
      transform: rotate(-8deg);
    }

    .wiz-concerned .hat {
      transform: rotate(4deg);
    }

    /* WIZ-04: subtle idle life only; removed entirely under reduced motion */
    @media (prefers-reduced-motion: no-preference) {
      .wiz-idle .star {
        animation: aw-shimmer var(--aw-t-idle) ease-in-out infinite;
      }
      .wiz-idle .eyes {
        transform-origin: 32px 40px;
        animation: aw-blink var(--aw-t-idle) infinite;
      }
      .wiz-thinking .thought {
        animation: aw-bob calc(var(--aw-t-slow) * 3) ease-in-out infinite;
      }
      .wiz-celebrating .star {
        animation: aw-shimmer calc(var(--aw-t-idle) / 2) ease-in-out infinite;
      }
    }

    @keyframes aw-shimmer {
      0%, 88%, 100% { opacity: 1; }
      94% { opacity: 0.35; }
    }

    @keyframes aw-blink {
      0%, 91%, 97%, 100% { transform: scaleY(1); }
      94% { transform: scaleY(0.12); }
    }

    @keyframes aw-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  `,
})
export class WizardAvatar {
  readonly state = input<WizardState>('idle');
  readonly size = input<WizardSize>('sm');

  /** WIZ-02 sizes */
  readonly px = computed(() => ({ sm: 32, md: 56, lg: 96 })[this.size()]);
}
