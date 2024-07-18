import { parseDate } from './utils';

export function validateData(data: any[], schema: any[], columnMappings: any): any[] {
  const errors = [];
  data.forEach((row, rowIndex) => {
    const errorRow = {};
    schema.forEach((col) => {
      const value = row[columnMappings[col.name]];
      if (!isValid(value, col)) {
        errorRow[columnMappings[col.name]] = value;
      }
    });
    if (Object.keys(errorRow).length > 0) {
      errors.push({ ...errorRow, rowIndex });
    }
  });
  return errors;
}

function isValid(value: any, col: any): boolean {
  switch (col.type) {
    case 'number':
      return !isNaN(value);
    case 'integer':
      return Number.isInteger(value);
    case 'date':
      return !isNaN(parseDate(value, col.format).valueOf());
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
}
