import { parse } from 'date-fns';
export function parseDate(dateString, format) {
    return parse(dateString, format, new Date());
}
