// rrule.ts
// Helper functions for RRULE generation and parsing
// If you see an import error here, make sure to install rrule.js:
// npm install rrule
import { RRule, rrulestr } from 'rrule';

export function generateRRule({
  frequency,
  interval = 1,
  byweekday = [],
  dtstart,
  until,
  count,
}: {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval?: number;
  byweekday?: string[];
  dtstart: Date;
  until?: Date;
  count?: number;
}): string {
  const options: any = {
    freq: RRule[frequency],
    interval,
    dtstart,
  };
  if (byweekday.length) {
    options.byweekday = byweekday.map(day => RRule[day]);
  }
  if (until) options.until = until;
  if (count) options.count = count;
  return new RRule(options).toString();
}

export function parseRRule(rruleString: string): RRule {
  return rrulestr(rruleString) as RRule;
}

export function getRecurrenceText(rruleString: string): string {
  try {
    const rule = parseRRule(rruleString);
    return rule.toText();
  } catch {
    return '';
  }
}
