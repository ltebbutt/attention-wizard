import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { WizardAvatar, WizardState } from './wizard-avatar';

/** WIZ-10: avatar + speech bubble. All app-initiated copy renders through this. */
@Component({
  selector: 'aw-wizard-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardAvatar],
  template: `
    <aw-wizard-avatar [state]="state()" size="sm" />
    <div class="bubble aw-lead">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: var(--aw-s3);
    }

    .bubble {
      position: relative;
      background: var(--aw-surface);
      border: 1px solid var(--aw-line);
      border-radius: var(--aw-r-lg);
      border-top-left-radius: var(--aw-r-sm);
      padding: var(--aw-s3) var(--aw-s4);
      max-width: 42ch;
    }
  `,
})
export class WizardMessage {
  readonly state = input<WizardState>('idle');
}
