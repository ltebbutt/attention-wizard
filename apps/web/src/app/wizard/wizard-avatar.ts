import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type WizardState = 'idle' | 'thinking' | 'celebrating' | 'concerned';
export type WizardSize = 'sm' | 'md' | 'lg';

/** Spec 002 + 006 (wizard v2): the app's single illustrative element. Pure inline
 *  SVG drawn from design tokens; beard/hat/band are the constant silhouette
 *  (WIZ2-05), expressions change eyes/mouth/hat tilt only. */
@Component({
  selector: 'aw-wizard-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="px()"
      [attr.height]="px()"
      viewBox="0 0 64 72"
      fill="none"
      role="img"
      [attr.aria-label]="'Wizard, ' + state()"
      [class]="'wiz wiz-' + state()"
    >
      <!-- WIZ2-02: levitation shadow, scales in counterpoint to the float -->
      <ellipse class="shadow" cx="32" cy="68" rx="14" ry="3" fill="var(--aw-surface-2)" />

      <g class="float">
        <!-- face -->
        <circle cx="32" cy="40" r="18" fill="var(--aw-surface-2)" stroke="var(--aw-line)" stroke-width="2" />
        <!-- WIZ2-01: the beard that makes the wizard a wizard -->
        <path
          class="beard"
          d="M17 44 C17 58 24 63 32 63 C40 63 47 58 47 44 C43 50 38 52 32 52 C26 52 21 50 17 44 Z"
          fill="var(--aw-ink)"
          opacity="0.92"
        />
        <!-- hat: cone + band; tilt transitions per state (MO-50) -->
        <g class="hat">
          <path
            d="M32 2 C33.5 2 34.5 3 35 4.5 L44 25 C45 27.5 43.5 29 41 29 L23 29 C20.5 29 19 27.5 20 25 L29 4.5 C29.5 3 30.5 2 32 2 Z"
            fill="var(--aw-emerald)"
          />
          <path d="M21.5 23.5 h21 l1 2.5 c0.5 1.8 -0.6 3 -2.5 3 h-18 c-1.9 0 -3 -1.2 -2.5 -3 Z" fill="var(--aw-emerald-press)" />
          <g class="star">
            <path d="M32 9 l1.7 3.3 3.6 .5 -2.6 2.5 .6 3.6 -3.3 -1.7 -3.3 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 Z" fill="var(--aw-ink-on-emerald)" />
          </g>
        </g>
        <!-- WIZ2-04: orbiting spark while thinking -->
        @if (state() === 'thinking') {
          <g class="orbit">
            <circle cx="53" cy="24" r="2.4" fill="var(--aw-emerald)" />
            <circle cx="55" cy="30" r="1.2" fill="var(--aw-emerald)" opacity="0.6" />
          </g>
        }
        <!-- eyes -->
        @if (state() === 'thinking') {
          <g class="eyes">
            <circle cx="25" cy="40" r="2.6" fill="var(--aw-ink)" />
            <circle cx="39" cy="38.5" r="2.6" fill="var(--aw-ink)" />
            <circle cx="26" cy="39.2" r="0.8" fill="var(--aw-surface-2)" />
            <circle cx="40" cy="37.7" r="0.8" fill="var(--aw-surface-2)" />
          </g>
        } @else if (state() === 'celebrating') {
          <g class="eyes" stroke="var(--aw-ink)" stroke-width="2.4" stroke-linecap="round">
            <path d="M22.5 40 q2.5 -3.5 5 0" fill="none" />
            <path d="M36.5 40 q2.5 -3.5 5 0" fill="none" />
          </g>
          <!-- cheek dots -->
          <circle cx="21" cy="44" r="1.8" fill="var(--aw-emerald)" opacity="0.5" />
          <circle cx="43" cy="44" r="1.8" fill="var(--aw-emerald)" opacity="0.5" />
        } @else if (state() === 'concerned') {
          <g class="eyes">
            <circle cx="25" cy="41" r="2.6" fill="var(--aw-ink)" />
            <circle cx="39" cy="41" r="2.6" fill="var(--aw-ink)" />
            <path d="M21.5 35.5 l6 -1.5 M42.5 35.5 l-6 -1.5" stroke="var(--aw-ink-mute)" stroke-width="2" stroke-linecap="round" />
          </g>
        } @else {
          <g class="eyes">
            <circle cx="25" cy="40" r="2.6" fill="var(--aw-ink)" />
            <circle cx="39" cy="40" r="2.6" fill="var(--aw-ink)" />
            <circle cx="26" cy="39.2" r="0.8" fill="var(--aw-surface-2)" />
            <circle cx="40" cy="39.2" r="0.8" fill="var(--aw-surface-2)" />
          </g>
        }
        <!-- mouth (sits on the beard) -->
        @if (state() === 'celebrating') {
          <path d="M26 47.5 q6 6 12 0" stroke="var(--aw-emerald)" stroke-width="2.6" stroke-linecap="round" fill="none" />
        } @else if (state() === 'concerned') {
          <path d="M27 50 q5 -2.5 10 0" stroke="var(--aw-surface-2)" stroke-width="2.4" stroke-linecap="round" fill="none" />
        } @else if (state() === 'thinking') {
          <circle cx="33" cy="49" r="2" fill="var(--aw-surface-2)" />
        } @else {
          <path d="M27 48 q5 3.5 10 0" stroke="var(--aw-surface-2)" stroke-width="2.4" stroke-linecap="round" fill="none" />
        }
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }

    /* MO-50: hat tilt transitions instead of snapping */
    .hat {
      transform-origin: 32px 29px;
      transition: transform var(--aw-t-base) var(--aw-ease);
    }

    .wiz-celebrating .hat {
      transform: rotate(-8deg);
    }

    .wiz-concerned .hat {
      transform: rotate(4deg);
    }

    /* WIZ-04 + WIZ2: subtle life only; removed entirely under reduced motion */
    @media (prefers-reduced-motion: no-preference) {
      /* WIZ2-02: levitation + counterpoint shadow */
      .float {
        animation: aw-float var(--aw-t-idle) ease-in-out infinite;
      }
      .shadow {
        transform-origin: 32px 68px;
        animation: aw-shadow var(--aw-t-idle) ease-in-out infinite;
      }
      /* WIZ2-03: twinkle */
      .star {
        transform-origin: 32px 14px;
        animation: aw-twinkle calc(var(--aw-t-idle) * 2) ease-in-out infinite;
      }
      .wiz-idle .eyes {
        transform-origin: 32px 40px;
        animation: aw-blink var(--aw-t-idle) infinite;
      }
      /* WIZ2-04: orbiting spark */
      .orbit {
        transform-origin: 32px 29px;
        animation: aw-orbit calc(var(--aw-t-slow) * 6) linear infinite;
      }
      /* WIZ2-04: one bounce on entering celebration */
      .wiz-celebrating .float {
        animation: aw-bounce calc(var(--aw-t-slow) * 2) var(--aw-ease-spring), aw-float var(--aw-t-idle) ease-in-out infinite;
      }
    }

    @keyframes aw-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2.5px); }
    }

    @keyframes aw-shadow {
      0%, 100% { transform: scaleX(1); opacity: 1; }
      50% { transform: scaleX(0.85); opacity: 0.7; }
    }

    @keyframes aw-twinkle {
      0%, 82%, 100% { transform: rotate(0deg) scale(1); opacity: 1; }
      88% { transform: rotate(30deg) scale(1.25); opacity: 1; }
      94% { transform: rotate(60deg) scale(0.9); opacity: 0.6; }
    }

    @keyframes aw-blink {
      0%, 91%, 97%, 100% { transform: scaleY(1); }
      94% { transform: scaleY(0.12); }
    }

    @keyframes aw-orbit {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes aw-bounce {
      0% { transform: translateY(0); }
      35% { transform: translateY(-7px); }
      70% { transform: translateY(1.5px); }
      100% { transform: translateY(0); }
    }
  `,
})
export class WizardAvatar {
  readonly state = input<WizardState>('idle');
  readonly size = input<WizardSize>('sm');

  /** WIZ-02 sizes */
  readonly px = computed(() => ({ sm: 32, md: 56, lg: 96 })[this.size()]);
}
