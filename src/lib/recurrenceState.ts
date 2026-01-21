// Helper to extract recurrence state from an RRULE string using rrule.js
import { RRule, rrulestr } from 'rrule';

export function extractRecurrenceState(rruleString: string) {
  if (!rruleString) return {
    recurrenceType: 'none',
    recurrenceInterval: 1,
    recurrenceWeekdays: [],
    recurrenceEndType: 'never',
    recurrenceCount: 1,
    recurrenceEndDate: ''
  };
  try {
    const rule = rrulestr(rruleString);
    let recurrenceType = 'none';
    if (rule.options.freq === RRule.DAILY) recurrenceType = 'daily';
    if (rule.options.freq === RRule.WEEKLY) recurrenceType = 'weekly';
    if (rule.options.freq === RRule.MONTHLY) recurrenceType = 'monthly';
    const recurrenceInterval = rule.options.interval || 1;
    const recurrenceWeekdays = rule.options.byweekday ? rule.options.byweekday.map((d: any) => d.toString().toUpperCase().slice(0,2)) : [];
    let recurrenceEndType = 'never';
    let recurrenceCount = 1;
    let recurrenceEndDate = '';
    if (rule.options.count) {
      recurrenceEndType = 'after';
      recurrenceCount = rule.options.count;
    } else if (rule.options.until) {
      recurrenceEndType = 'on';
      recurrenceEndDate = rule.options.until.toISOString().slice(0,10);
    }
    return {
      recurrenceType,
      recurrenceInterval,
      recurrenceWeekdays,
      recurrenceEndType,
      recurrenceCount,
      recurrenceEndDate
    };
  } catch {
    return {
      recurrenceType: 'none',
      recurrenceInterval: 1,
      recurrenceWeekdays: [],
      recurrenceEndType: 'never',
      recurrenceCount: 1,
      recurrenceEndDate: ''
    };
  }
}
