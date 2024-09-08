import { LitElement } from 'lit';
import { ColValidateFunction } from './workflow/validation';
declare const importSteps: readonly ["1:select-file", "2:map-columns", "3:correct-issues"];
export type ImportSteps = (typeof importSteps)[number];
export interface ImportOptions {
    fields: {
        /** Name of the column */
        label: string;
        /** Description of the column */
        description?: string;
        /** Property this column will be extracted to in result row objects. */
        key: string;
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
export declare class SheetstormModal extends LitElement {
    open: boolean;
    schema: any[];
    private step;
    private columns;
    private data;
    private columnMappings;
    private validationErrors;
    static styles: import("lit").CSSResult;
    private fileInput;
    constructor();
    private handleFileSelect;
    private handleColumnMappingChange;
    private handleConfirmColumnMapping;
    private handleEditCell;
    render(): import("lit-html").TemplateResult<1>;
}
export {};
