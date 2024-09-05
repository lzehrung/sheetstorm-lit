export type ColValidateFunction = (
  value: any,
  data: any[],
  key: string,
  rowIndex: number
) => Promise<string[]> | string[];
export const colValidations: Record<string, ColValidateFunction> = {
  required: (value: any, data: any[], key: string) => {
    const isEmpty = value === undefined || value === null || value === '';
    return !isEmpty ? [] : ['This field is required'];
  },
  unique: (value: any, data: any[], key: string) => {
    const uniqueValues = new Set(data.map((row) => row[key]));
    return uniqueValues.size === data.length ? [] : ['This field must be unique'];
  },
};

export type RowValidateFunction<T> = (row: T, rowIndex: number) => Promise<string[]> | string[];
