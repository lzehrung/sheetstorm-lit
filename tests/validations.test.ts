import { validateData } from '../src/validations';

describe('Validation Tests', () => {
  test('validateData should validate data against schema and column mappings correctly', () => {
    const data = [
      { col1: 'John', col2: 30 },
      { col1: 'Doe', col2: 'thirty' },
    ];
    const schema = [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'number' },
    ];
    const columnMappings = { col1: 'name', col2: 'age' };
    const result = validateData(data, schema, columnMappings);
    expect(result).toEqual([{ age: 'thirty', rowIndex: 1 }]);
  });
});
