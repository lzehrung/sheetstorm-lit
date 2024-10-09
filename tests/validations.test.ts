import { validateData, ValidateSchema, ValidateResult } from '../src/validations';

describe('Validation Tests', () => {
  const schema: ValidateSchema = {
    name: {
      label: 'Name',
      type: 'string',
      validators: [
        (value: string) => ({
          isValid: value.trim().length > 0,
          message: 'Name is required',
        }),
        (value: string) => ({
          isValid: /^[A-Za-z\s]+$/.test(value),
          message: 'Name must contain only letters and spaces',
        }),
      ],
    },
    age: {
      label: 'Age',
      type: 'number',
      validators: [
        (value: string) => ({
          isValid: !isNaN(Number(value)),
          message: 'Age must be a number',
        }),
        (value: string) => ({
          isValid: Number(value) > 0,
          message: 'Age must be greater than zero',
        }),
      ],
    },
    email: {
      label: 'Email',
      type: 'string',
      validators: [
        (value: string) => ({
          isValid: value.trim().length > 0,
          message: 'Email is required',
        }),
        (value: string) => ({
          isValid: /^\S+@\S+\.\S+$/.test(value),
          message: 'Email must be a valid email address',
        }),
      ],
    },
  };

  const columnMappings = {
    '0': 'name',
    '1': 'age',
    '2': 'email',
  };

  test('should validate data correctly with single validator passing', () => {
    const data: string[][] = [
      ['Alice', '28', 'alice@example.com'],
    ];
    const result: ValidateResult[] = validateData(data, schema, columnMappings);
    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(true);
    expect(result[0].errors).toEqual([]);
  });

  test('should validate data correctly with single validator failing', () => {
    const data: string[][] = [
      ['Alice', 'twenty-eight', 'alice@example.com'],
    ];
    const result: ValidateResult[] = validateData(data, schema, columnMappings);
    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(false);
    // Expect only the first failing validator's message
    expect(result[0].errors).toEqual([
      { key: 'age', message: 'Age must be a number' },
    ]);
  });

  test('should accumulate multiple validation errors per row', () => {
    const data: string[][] = [
      ['Bob123', '-5', 'bobexample.com'],
    ];
    const result: ValidateResult[] = validateData(data, schema, columnMappings);
    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(false);
    expect(result[0].errors).toEqual([
      { key: 'name', message: 'Name must contain only letters and spaces' },
      { key: 'age', message: 'Age must be greater than zero' },
      { key: 'email', message: 'Email must be a valid email address' },
    ]);
  });

  test('should handle missing schema keys gracefully', () => {
    const invalidColumnMappings = {
      '0': 'username', // 'username' does not exist in schema
      '1': 'age',
      '2': 'email',
    };
    const data: string[][] = [
      ['Charlie', '22', 'charlie@example.com'],
    ];
    const result: ValidateResult[] = validateData(data, schema, invalidColumnMappings);
    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(false);
    expect(result[0].errors).toEqual([
      { key: 'username', message: 'Schema for "username" not found.' },
    ]);
  });

  test('should handle empty data array', () => {
    const data: string[][] = [];
    const result: ValidateResult[] = validateData(data, schema, columnMappings);
    expect(result.length).toBe(0);
  });

  test('should handle rows with missing columns', () => {
    const data: string[][] = [
      ['Dave', '40'], // Missing email
    ];
    const result: ValidateResult[] = validateData(data, schema, columnMappings);
    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(false);
    // Expect only the first failing validator's message for email
    expect(result[0].errors).toEqual([
      { key: 'email', message: 'Email is required' },
    ]);
  });
});
