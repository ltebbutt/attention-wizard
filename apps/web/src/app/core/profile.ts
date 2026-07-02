import { Injectable, signal } from '@angular/core';

const KEY = 'aw-profile-v1';

/** PERS-01..03: local profile store — the seed of the onboarding interview.
 *  Name only for now; migrates to the server Profile when Entra ID lands. */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  readonly name = signal<string>(this.load());

  private load(): string {
    try {
      return (JSON.parse(localStorage.getItem(KEY) ?? '{}') as { name?: string }).name ?? '';
    } catch {
      return '';
    }
  }

  setName(raw: string): void {
    const name = raw.trim().slice(0, 20);
    this.name.set(name);
    try {
      localStorage.setItem(KEY, JSON.stringify({ name }));
    } catch {
      /* no storage in sandboxed contexts */
    }
  }
}
