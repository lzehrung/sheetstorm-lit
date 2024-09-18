import { parse, isValid } from 'date-fns';

function getCurrentLocaleDateFormat() {
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(new Date());

  return parts.map(part => {
    if (part.type === 'literal') {
      return part.value;
    } else {
      return part.type.toUpperCase();
    }
  }).join('');
}

export function parseDate(dateString: string, format: string): Date {
  return parse(dateString, format, new Date());
}

export function isValidDate(value: string | number | Date, format: string = getCurrentLocaleDateFormat()): boolean {
  if (typeof value === 'string') {
    const parsedDate = parseDate(value, format);
    return isValid(parsedDate);
  } else if (typeof value === 'number') {
    const parsedDate = new Date(value);
    return isValid(parsedDate);
  } else if (value instanceof Date) {
    return isValid(value);
  }

  return false;
}
