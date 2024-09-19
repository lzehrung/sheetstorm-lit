import { ImportRow, validateData, ValidateSchema } from '../src/validations';

interface TestRow extends ImportRow {
  name: string;
  age: number;
  email: string;
}

describe('Validation Tests', () => {
  test('validateData should validate data against schema and column mappings correctly', () => {
    const data: ImportRow[] = [
      { name: 'John', age: 30, email: 'j@test.com' },
      { name: 'Doe', age: 'thirty', email: 'd@test.com' },
    ];
    const schema: ValidateSchema<TestRow> = {
      name: {
        label: 'Name',
        type: 'string',
        valid: (value: string) => {
          return { isValid: value?.trim().length > 0, message: 'Name is required' };
        }
      },
      age: {
        label: 'Age',
        type: 'number',
        valid: (value: string) => {
          return { isValid: !isNaN(Number(value)), message: 'Age must be a number' };
        }
      },
      email: {
        label: 'Email',
        type: 'string',
        valid: (value: string) => {
          return { isValid: value?.includes('@'), message: 'Invalid email address' };
        }
      },
    };
    const result = validateData(data, schema);
    expect(result.length).toBe(1);
    expect(result).toEqual([{ age: 'thirty', rowIndex: 1 }]);
  });
});
