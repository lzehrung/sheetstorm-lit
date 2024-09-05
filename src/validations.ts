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
