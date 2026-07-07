import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { SHOWCASE } from './core/storage';
import { Today } from './today/today';
import { WizardAvatar } from './wizard/wizard-avatar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Today, WizardAvatar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly demo = environment.demo;
  /** SHOW-03 */
  protected readonly chipLabel = SHOWCASE ? 'showcase' : 'demo';
}
