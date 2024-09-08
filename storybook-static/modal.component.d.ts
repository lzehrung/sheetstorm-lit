import { LitElement } from 'lit';
export declare class DataImportModal extends LitElement {
    open: boolean;
    schema: never[];
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
