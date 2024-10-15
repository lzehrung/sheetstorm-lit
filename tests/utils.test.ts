import { parseDate } from '../src/utils';

describe('utils tests', () => {
  test('parseDate handles expected formats', () => {
    const date = parseDate('2021-12-02');
    expect(date).toEqual(new Date(2021, 11, 2));
  });
});
