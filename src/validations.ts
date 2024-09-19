export interface ValidationError<T extends ImportRow> {
  key: keyof T;
  message: string;
}

export interface ValidateResult<T extends ImportRow> {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationError<T>[];
}

export type ImportRow = { [key: string | number]: unknown };

export type ValidatorFunc = (value: string) => { isValid: false; message: string } | { isValid: true };

export type ValidateSchema<T extends ImportRow> = Record<
  keyof T,
  {
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    valid: ValidatorFunc;
  }
>;

/**
 * Validates the transformed data against the provided schema.
 *
 * @param data - The array of data objects to validate. Each object should have keys matching the schema.
 * @param schema - The validation schema defining rules for each field.
 * @returns An array of validation results, each corresponding to a row of data.
 */
export function validateData<T extends ImportRow>(
  data: T[],
  schema: ValidateSchema<T>
): ValidateResult<T>[] {
  const allErrors: ValidateResult<T>[] = [];

  data.forEach((row, rowIndex) => {
    const rowErrors: ValidationError<T>[] = [];

    Object.entries(schema).forEach(([fieldKey, schemaField]) => {
      const value = row[fieldKey as keyof T];

      // Ensure the value is a string before validation
      const stringValue = value !== undefined && value !== null ? String(value) : '';

      const result = schemaField.valid(stringValue);
      if (!result.isValid) {
        rowErrors.push({ key: fieldKey as keyof T, message: result.message });
      }
    });

    allErrors.push({
      rowIndex,
      isValid: rowErrors.length === 0,
      errors: rowErrors,
    });
  });

  return allErrors;
}
