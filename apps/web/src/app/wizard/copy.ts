/** WIZ-14: the wizard's copy registry. Every user-facing wizard line lives here so
 *  tone rules (WIZ-11) are reviewable in one place. No shame vocabulary. */
export const WIZARD_COPY = {
  greeting_morning: 'Morning. What are your three for today?',
  greeting_afternoon: 'Afternoon. What are your three for today?',
  greeting_evening: 'Evening. Still time to name your three.',
  greeting_planning: 'Pick up to three. Everything else can wait in the pile.',
  greeting_confirmed: 'Three things, locked in. I’m here when you start.',
  greeting_in_progress: 'One thing at a time — you’re on it.',
  greeting_all_done: 'All three done. That’s a full day!',
  greeting_wrapped: 'Today is wrapped. Rest easy — tomorrow starts fresh.',
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
