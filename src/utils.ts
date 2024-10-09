import { parse, parseISO, isValid } from 'date-fns';

export function parseDate(value: string | number | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    // Try treating the number as milliseconds since epoch
    let date = new Date(value);
    if (isValid(date)) {
      return date;
    }
    // If invalid, try treating the number as seconds since epoch
    date = new Date(value * 1000);
    if (isValid(date)) {
      return date;
    }
    return null;
  } else if (typeof value === 'string') {
    value = value.trim();
    if (value === '') {
      return null;
    }

    // Try parsing as ISO 8601 string
    let date = parseISO(value);
    if (isValid(date)) {
      return date;
    }

    // Common date formats to try
    const dateFormats = [
      "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      "yyyy-MM-dd'T'HH:mm:ss.SSS",
      "yyyy-MM-dd'T'HH:mm:ss",
      "yyyy-MM-dd'T'HH:mm",
      "yyyy-MM-dd",
      "MM/dd/yyyy",
      "M/d/yyyy",
      "dd/MM/yyyy",
      "d/M/yyyy",
      "MM-dd-yyyy",
      "M-d-yyyy",
      "yyyy/MM/dd",
      "dd-MM-yyyy",
      "d-M-yyyy",
      "MMM dd, yyyy",
      "MMMM dd, yyyy",
      "dd MMM yyyy",
      "d MMM yyyy",
      "EEE MMM dd yyyy HH:mm:ss 'GMT'xxx (zzzz)",
      "EEE MMM dd HH:mm:ss zzz yyyy",
    ];

    // Attempt to parse using each date format
    for (const dateFormat of dateFormats) {
      date = parse(value, dateFormat, new Date());
      if (isValid(date)) {
        return date;
      }
    }

    // Fallback to built-in Date parsing
    date = new Date(value);
    if (isValid(date)) {
      return date;
    }
  }
  return null; // Return null if no valid date is found
}


export function isValidDate(value: string | number | Date): boolean {
  if (typeof value === 'string') {
    const parsedDate = parseDate(value);
    return isValid(parsedDate);
  } else if (typeof value === 'number') {
    const parsedDate = new Date(value);
    return isValid(parsedDate);
  } else if (value instanceof Date) {
    return isValid(value);
  }

  return false;
}
