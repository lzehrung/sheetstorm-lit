import { parseDate } from './utils';

export interface ValidationError<T extends ImportRow> {
  key: keyof T;
  message: string;
}

export interface ValidateResult<T extends ImportRow> {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationError<T>[];
}

export type ImportRow = { [key: string | number]: string | number };

export type ValidatorFunc = (value: string | number) => { isValid: boolean; message: string };

export function validateData<T extends ImportRow>(
  data: Record<string, string | number>[],
  schema: Record<keyof T, ValidatorFunc>,
  columnMappings: Record<keyof T, string>
): ValidateResult<T>[] {
  const allErrors: ValidateResult<T>[] = [];
  data.forEach((row, rowIndex) => {
    const rowErrors: ValidationError<T>[] = [];
    Object.entries(schema).forEach(([destProp, validator]) => {
      const srcProp = columnMappings[destProp];
      const value = row[srcProp];

      const result = validator(value);
      if (!result.isValid) {
        rowErrors.push({ key: destProp, message: result.message });
      }
    });
  });
  return allErrors;
}
