export interface ValidationError<T extends ImportRow> {
  key: keyof T;
  message?: string;
}

export interface ValidateResult<T extends ImportRow> {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationError<T>[];
}

export type ImportRow = { [key: string | number]: unknown };

export type ValidatorFunc = (value: string) => { isValid: boolean; message?: string; };

export type ValidateSchema<T extends ImportRow> = Record<keyof T, {
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  valid: ValidatorFunc;
}>;

export function validateData<T extends ImportRow>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  schema: ValidateSchema<T>,
  columnMappings: Record<keyof T, string>
): ValidateResult<T>[] {
  const allErrors: ValidateResult<T>[] = [];
  data.forEach((row, rowIndex) => {
    const rowErrors: ValidationError<T>[] = [];
    Object.entries(schema).forEach(([destProp, schema]) => {
      const srcProp = columnMappings[destProp];
      const value = row[srcProp];

      const result = schema.valid(value);
      if (!result.isValid) {
        rowErrors.push({ key: destProp, message: result.message });
      }
    });
    allErrors.push({ rowIndex, isValid: rowErrors.length === 0, errors: rowErrors });
  });
  return allErrors;
}
