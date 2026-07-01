import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WizardAvatar } from './wizard/wizard-avatar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WizardAvatar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
