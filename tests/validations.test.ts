import { ImportRow, validateData, ValidateSchema } from '../src/validations';

interface TestRow extends ImportRow {
  name: string;
  age: number;
}

describe('Validation Tests', () => {
  test('validateData should validate data against schema and column mappings correctly', () => {
    const data = [
      { col1: 'John', col2: '30', col3: 'j@test.com' },
      { col1: 'Doe', col2: 'thirty', col3: 'd@test.com' },
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
    const columnMappings = { name: 'col1', age: 'col2', email: 'col3' };
    const result = validateData(data, schema, columnMappings);
    expect(result).toEqual([{ age: 'thirty', rowIndex: 1 }]);
  });
});
