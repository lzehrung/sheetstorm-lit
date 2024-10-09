import { ColValidateFunction } from "./workflow/validation";

export const importSteps = ['1:select-file', '2:map-columns', '3:correct-issues'] as const;
export type ImportSteps = (typeof importSteps)[number];

export interface ImportOptions {
  fields: {
    /** Name of the column */
    label: string;
    /** Description of the column */
    description?: string;
    /** Property this column will be extracted to in result row objects. */
    key: string;
    // type: 'string' | 'number' | 'integer' | 'date' | 'boolean' | 'custom';
    /** A function that validates the column's values and returns an array of errors. */
    validators?: ColValidateFunction[];
    /** Alternate field names to assist with matching. */
    alternates?: string[];
  }[];
  text?: {
    name?: string;
    fileSelectDescription?: string;
    mapFieldsDescription?: string;
    correctErrorsDescription?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    nextButtonText?: string;
    previousButtonText?: string;
    finishButtonText?: string;
  };
}
