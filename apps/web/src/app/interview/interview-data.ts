import { HardestPhase, Peak, ProfileDims, Recommendation, Tone } from '../core/profile';

/** INT-01/02: five structured questions; the LLM-conversational interview reuses
 *  this shape when the real API lands (INT-01 note). */
export interface InterviewQuestion {
  id: keyof InterviewAnswers;
  prompt: string;
  options: Array<{ label: string; value: string }>;
}

export interface InterviewAnswers {
  peak: Peak;
  timeSense: 'often' | 'sometimes' | 'rarely';
  hardest: HardestPhase;
  tone: Tone;
  reality: 'about' | 'half_more' | 'double';
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'peak',
    prompt: 'When does your brain properly switch on?',
    options: [
      { label: 'mornings', value: 'morning' },
      { label: 'afternoons', value: 'afternoon' },
      { label: 'evenings', value: 'evening' },
      { label: 'it varies', value: 'varies' },
    ],
  },
  {
    id: 'timeSense',
    prompt: 'Do minutes vanish on you — look up and an hour’s gone?',
    options: [
      { label: 'all the time', value: 'often' },
      { label: 'sometimes', value: 'sometimes' },
      { label: 'rarely', value: 'rarely' },
    ],
  },
  {
    id: 'hardest',
    prompt: 'Which part of a task fights you hardest?',
    options: [
      { label: 'starting it', value: 'starting' },
      { label: 'switching to it', value: 'switching' },
      { label: 'finishing it', value: 'finishing' },
    ],
  },
  {
    id: 'tone',
    prompt: 'When you finish something, how should I be?',
    options: [
      { label: 'bring the confetti', value: 'cheer' },
      { label: 'a quiet nod', value: 'calm' },
    ],
  },
  {
    id: 'reality',
    prompt: 'When you guess “30 minutes”, reality usually says…',
    options: [
      { label: 'about 30', value: 'about' },
      { label: 'more like 45', value: 'half_more' },
      { label: 'closer to an hour', value: 'double' },
    ],
  },
];

/** INT-03 */
export function scoreProfile(a: InterviewAnswers): ProfileDims {
  return {
    peak: a.peak,
    timeBlindness: a.timeSense === 'often' ? 4 : a.timeSense === 'sometimes' ? 2 : 0,
    hardestPhase: a.hardest,
    tone: a.tone,
    bufferX: a.reality === 'about' ? 1 : a.reality === 'half_more' ? 1.5 : 2,
  };
}

/** REC-01/03: deterministic, explainable recommendations. */
export function recommend(dims: ProfileDims): Recommendation[] {
  const recs: Recommendation[] = [];
  if (dims.hardestPhase === 'starting') {
    recs.push({
      title: 'Use the first step, not the task',
      why: 'You said starting fights you hardest — every estimate I give includes a tiny first step. Do that step only; momentum handles the rest.',
    });
  } else if (dims.hardestPhase === 'switching') {
    recs.push({
      title: 'One thing in progress, always',
      why: 'You said switching is the fight — I enforce single-focus, and swapping your 3 mid-day is allowed so switches are chosen, not accidental.',
    });
  } else {
    recs.push({
      title: 'Define “done” before you start',
      why: 'You said finishing is the fight — when you pick a task, add a note saying what done looks like. Stopping needs a finish line.',
    });
  }
  if (dims.timeBlindness >= 2) {
    recs.push({
      title: 'Trust the timer, not the feeling',
      why: 'You said minutes vanish on you — I show elapsed time on the active task and check in when it runs past your pace. Let those be the clock.',
    });
  }
  if (dims.bufferX > 1) {
    recs.push({
      title: `Plan at ×${dims.bufferX} — that’s your real pace`,
      why: `You said a 30-minute guess runs to ${dims.bufferX === 1.5 ? '45' : '60'} — I pad every estimate accordingly. Honest plans beat hopeful ones.`,
    });
  } else {
    recs.push({
      title: 'Your estimates are good — protect them',
      why: 'You said your guesses land about right. The trap is interruptions, not optimism — the calendar invites will guard the time you plan.',
    });
  }
  return recs.slice(0, 3);
}
