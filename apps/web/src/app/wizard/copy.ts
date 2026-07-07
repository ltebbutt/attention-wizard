/** WIZ-14: the wizard's copy registry. Every user-facing wizard line lives here so
 *  tone rules (WIZ-11) are reviewable in one place. No shame vocabulary. */
const withName = (base: string, name?: string) => (name ? `${base}, ${name}.` : `${base}.`);

export const WIZARD_COPY = {
  greeting_morning: (name?: string) => `${withName('Morning', name)} What are your three for today?`,
  greeting_afternoon: (name?: string) => `${withName('Afternoon', name)} What are your three for today?`,
  greeting_evening: (name?: string) => `${withName('Evening', name)} Still time to name your three.`,
  ask_name: 'Before we begin — what should I call you?',
  name_saved: (name: string) => `${name} it is. Let’s keep today small.`,
  greeting_planning: 'Pick up to three. Everything else can wait in the pile.',
  greeting_confirmed: 'Three things, locked in. I’m here when you start.',
  greeting_in_progress: 'One thing at a time — you’re on it.',
  greeting_all_done: (tone?: 'cheer' | 'calm') =>
    tone === 'calm' ? 'All three done. Well worked.' : 'All three done. That’s a full day!',
  interview_offer: 'Fancy a two-minute tune-up so I fit how you work?',
  planning_peak_hint: 'These are your good hours — maybe start with the heavy one.',
  checkin: (title: string, min: number, tone?: 'cheer' | 'calm') =>
    tone === 'calm'
      ? `Still on “${title}”? ${min} minutes in — finish line or a break, both count.`
      : `Still on “${title}”? ${min} minutes in — finish line or a break, both count!`,
  calibration_insight: (x: number) =>
    x > 1
      ? `Your tasks tend to run a little long — I pad estimates ×${x}. That’s pace, not a flaw.`
      : 'Your estimates land true — I don’t pad them.',
  greeting_wrapped: 'Today is wrapped. Rest easy — tomorrow starts fresh.',
  wrap_review_intro: 'Quick look back before we close the day.',
  wrap_question_unfinished: 'Done or tomorrow?',
  wrap_question_feedback: 'How was the estimate?',
  summary_all_done: (name?: string) => `Three for three${name ? `, ${name}` : ''}. See you tomorrow!`,
  summary_partial: (done: number) => `${done} done today. The rest waits in tomorrow’s pile — that’s how this works.`,
  summary_none: 'Today is closed. Tomorrow starts fresh.',
  past_day_empty: 'No plan that day.',
  empty_backlog: 'Nothing in the pile yet. Add the first thing on your mind.',
  rollover_note: 'This one moves to tomorrow’s pile.',
  undo_note: 'Back to pending — no harm done.',
  estimate_thinking: 'Let me size that up…',
  estimate_result: (min: number, firstStep: string) =>
    `I’d plan about ${min} minutes. First step: ${firstStep}`,
  estimate_unavailable: 'I can’t size that one up right now — your own guess is plenty.',
  budget_exhausted: 'I’ve hit today’s thinking budget. I’ll be sharper after midnight.',
  celebration: 'Three for three!',
  invite_ack: 'Once Outlook is connected, blocks like this land in your calendar — you just tap Accept.',
  ai_saved: 'Saved. Your key stays on this device — I never see it.',
  ai_linked: 'Linked! “Size it up” and the brain dump now use your model.',
  ai_failed: (reason: string) =>
    reason === 'budget_denied'
      ? 'That’s today’s call budget spent — resets at midnight.'
      : 'That link didn’t take — double-check the key, model and URL.',
  ai_disconnected: 'Disconnected and wiped from this device.',
  triage_thinking: 'Sorting through that…',
  triage_result: (n: number) =>
    n > 0 ? `I found ${n} thing${n === 1 ? '' : 's'} in there. Add the real ones.` : 'Nothing actionable in that — lucky you.',
  connections_intro: 'Here’s what I’ll watch for you. Each one feeds your pile — you stay at three.',
} as const;

/** CONN-01: planned connectors, described in the wizard's voice. */
export const CONNECTIONS = [
  { initial: 'M', name: 'Outlook Mail', blurb: 'I’ll read the asks buried in your inbox and turn them into pile items.' },
  { initial: 'C', name: 'Outlook Calendar', blurb: 'I’ll send you a meeting invite with a session plan — you just tap Accept.' },
  { initial: 'T', name: 'Teams', blurb: 'Mentions and DMs that need action become pile items, not anxiety.' },
  { initial: 'J', name: 'Jira', blurb: 'Your assigned tickets and due dates, triaged into the pile.' },
  { initial: 'W', name: 'Confluence', blurb: 'Page mentions and inline tasks find their way to you.' },
  { initial: 'S', name: 'Slack', blurb: 'Same deal as Teams, for Slack shops.' },
] as const;
