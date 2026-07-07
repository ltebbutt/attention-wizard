import { Injectable, signal } from '@angular/core';
import { storageGet, storageSet } from './storage';

const KEY = 'aw-profile-v1';

export type Tone = 'cheer' | 'calm';
export type Peak = 'morning' | 'afternoon' | 'evening' | 'varies';
export type HardestPhase = 'starting' | 'switching' | 'finishing';

/** INT-03: scored by the interview; grows into the server Profile later (PERS-02). */
export interface ProfileDims {
  peak: Peak;
  timeBlindness: number; // 0–4
  hardestPhase: HardestPhase;
  tone: Tone;
  bufferX: 1 | 1.5 | 2;
}

export interface Recommendation {
  title: string;
  why: string; // REC-01: always explainable
}

interface ProfileState {
  name?: string;
  dims?: ProfileDims;
  recommendations?: Recommendation[];
  /** CAL-01: calibration steps applied on top of dims.bufferX (-1, 0, +1 …). */
  calibrationSteps?: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private state: ProfileState = this.load();

  readonly name = signal<string>(this.state.name ?? '');
  readonly dims = signal<ProfileDims | undefined>(this.state.dims);
  readonly recommendations = signal<Recommendation[]>(this.state.recommendations ?? []);
  readonly calibrationSteps = signal<number>(this.state.calibrationSteps ?? 0);

  private load(): ProfileState {
    try {
      return JSON.parse(storageGet(KEY) ?? '{}') as ProfileState;
    } catch {
      return {};
    }
  }

  private persist(): void {
    this.state = {
      name: this.name(),
      dims: this.dims(),
      recommendations: this.recommendations(),
      calibrationSteps: this.calibrationSteps(),
    };
    storageSet(KEY, JSON.stringify(this.state));
  }

  setName(raw: string): void {
    this.name.set(raw.trim().slice(0, 20));
    this.persist();
  }

  /** INT-06 */
  completeInterview(dims: ProfileDims, recommendations: Recommendation[]): void {
    this.dims.set(dims);
    this.recommendations.set(recommendations);
    this.calibrationSteps.set(0);
    this.persist();
  }

  /** CAL-01: recomputed from feedback data; bounded via effectiveBufferX. */
  setCalibration(steps: number): void {
    this.calibrationSteps.set(steps);
    this.persist();
  }

  /** Effective padding multiplier: interview baseline ± calibration steps of 0.5. */
  effectiveBufferX(): number {
    const base = this.dims()?.bufferX ?? 1;
    const x = base + this.calibrationSteps() * 0.5;
    return Math.min(2, Math.max(1, x));
  }

  paddedMin(estimateMin: number): number {
    return Math.round(estimateMin * this.effectiveBufferX() / 5) * 5 || estimateMin;
  }
}
