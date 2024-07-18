import { parse } from 'date-fns';

export function parseDate(dateString: string, format: string): Date {
  return parse(dateString, format, new Date());
}
