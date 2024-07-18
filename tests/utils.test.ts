import { parseDate } from '../src/utils';

describe('Utils Tests', () => {
  test('parseDate should parse date correctly', () => {
    const date = parseDate('2021-12-01', 'yyyy-MM-dd');
    expect(date).toEqual(new Date(2021, 11, 1));
  });
});
