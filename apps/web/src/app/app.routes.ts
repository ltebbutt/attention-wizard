import { Routes } from '@angular/router';
import { Today } from './today/today';

export const routes: Routes = [
  { path: '', component: Today },
  { path: '**', redirectTo: '' },
];
