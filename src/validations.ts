export interface ValidationError {
  key: string;
  message: string;
}

export interface ValidateResult {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationError[];
}

export type ImportRow = { [key: string]: string };

export type ValidatorFunc = (value: string) => { isValid: boolean; message?: string };

export type ValidateSchema = Record<
  string,
  {
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    validators: ValidatorFunc[]; // Array of validation functions
  }
>;

/**
 * Validates the transformed data against the provided schema.
 *
 * @param data - The array of data arrays to validate. Each inner array represents a row.
 * @param schema - The validation schema defining rules for each field.
 * @param columnMappings - Mapping from source columns (as string indices) to schema fields.
 * @returns An array of validation results, each corresponding to a row of data.
 */
export function validateData(
  data: string[][],
  schema: ValidateSchema,
  columnMappings: Record<string, string>
): ValidateResult[] {
  const allErrors: ValidateResult[] = [];

  data.forEach((row, rowIndex) => {
    const rowErrors: ValidationError[] = [];

    Object.entries(columnMappings).forEach(([sourceCol, schemaKey]) => {
      const schemaField = schema[schemaKey];
      if (!schemaField) {
        rowErrors.push({ key: schemaKey, message: `Schema for "${schemaKey}" not found.` });
        return;
      }

      const value = row[parseInt(sourceCol, 10)] || '';

      for (const validator of schemaField.validators) {
        const result = validator(value);
        if (!result.isValid) {
          rowErrors.push({ key: schemaKey, message: result.message || 'Invalid value' });
          // Stop further validation for this field after the first failure
          break;
        }
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
