export type ColValidateFunction = (value: any, data: any[], key: string, rowIndex: number) => Promise<string[]> | string[];
export declare const colValidations: Record<string, ColValidateFunction>;
export type RowValidateFunction<T> = (row: T, rowIndex: number) => Promise<string[]> | string[];
