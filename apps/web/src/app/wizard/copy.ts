/** WIZ-14: the wizard's copy registry. Every user-facing wizard line lives here so
 *  tone rules (WIZ-11) are reviewable in one place. No shame vocabulary. */
export const WIZARD_COPY = {
  greeting_morning: 'Morning. What are your three for today?',
  greeting_planning: 'Pick up to three. Everything else can wait in the pile.',
  greeting_confirmed: 'Three things, locked in. I’m here when you start.',
  greeting_in_progress: 'One thing at a time — you’re on it.',
  greeting_all_done: 'All three done. That’s a full day!',
  greeting_wrapped: 'Today is wrapped. Rest easy — tomorrow starts fresh.',
  empty_backlog: 'Nothing in the pile yet. Add the first thing on your mind.',
  rollover_note: 'This one moves to tomorrow’s pile.',
  estimate_thinking: 'Let me size that up…',
  estimate_result: (min: number, firstStep: string) =>
    `I’d plan about ${min} minutes. First step: ${firstStep}`,
  estimate_unavailable: 'I can’t size that one up right now — your own guess is plenty.',
  budget_exhausted: 'I’ve hit today’s thinking budget. I’ll be sharper after midnight.',
  celebration: 'Three for three!',
} as const;
