/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './file-select.component';
import './column-mapping.component';
import './data-grid.component';
import { ValidateSchema, ValidateResult } from '../../validations';
import { validateData } from '../../validations';

@customElement('sheetstorm-import')
export class SheetstormImport extends LitElement {
  @property({ type: Object, attribute: 'schema' }) schema!: ValidateSchema;

  @state() private step = 1;
  @state() private rawData: string[][] = [];
  @state() private hasHeaders = false;
  @state() private schemaKeys: string[] = [];
  @state() private columnMappings: Record<string, string> = {};
  @state() private validationResults: ValidateResult[] = [];
  @state() private transformedData: Record<string, string>[] = [];
  @state() private cellErrors: Record<number, Record<string, string>> = {};
  @state() private excludedRows: Set<number> = new Set();

  static styles = css`
    /* Existing styles */
    :host {
      display: block;
      padding: 16px;
      font-family: Arial, sans-serif;
    }
    h2 {
      margin-top: 0;
    }
    button {
      margin-top: 16px;
      margin-bottom: 16px;
      padding: 8px 16px;
      margin-right: 8px;
    }
  `;

  /**
   * Handles the file-parsed event from FileSelectComponent.
   */
  private handleFileParsed(event: CustomEvent<string[][]>) {
    this.rawData = event.detail;
    this.hasHeaders = this.detectHasHeaders(this.rawData);
    this.step = 2;
    this.requestUpdate();
  }

  /**
   * Detects whether the first row of data is a header row.
   */
  private detectHasHeaders(data: string[][]): boolean {
    if (data.length < 2) return false;

    const firstRow = data[0];
    const otherRows = data.slice(1, 4);

    const isFirstRowAllStrings = firstRow.every(cell => typeof cell === 'string' && cell.trim() !== '');

    if (!isFirstRowAllStrings) return false;

    const isOtherRowsMixed = otherRows.some(row => {
      const types = row.map(cell => {
        if (!isNaN(Number(cell))) return 'number';
        if (Date.parse(cell)) return 'date';
        if (cell.toLowerCase() === 'true' || cell.toLowerCase() === 'false') return 'boolean';
        return 'string';
      });
      return new Set(types).size > 1;
    });

    return isFirstRowAllStrings && isOtherRowsMixed;
  }

  /**
   * Handles errors from FileSelectComponent.
   */
  private handleFileError(event: CustomEvent) {
    console.error('File parsing error:', event.detail);
    alert('An error occurred while parsing the file.');
  }

  /**
   * Handles column mappings from ColumnMappingComponent.
   */
  private handleColumnMapping(event: CustomEvent<{ mappings: Record<string, string>, schemaKeys: string[] }>) {
    this.columnMappings = event.detail.mappings;
    this.schemaKeys = event.detail.schemaKeys;
    this.transformData();
    this.validateData();
    this.step = 3;
    this.requestUpdate();
  }

  /**
   * Transforms raw data based on column mappings.
   */
  private transformData(): void {
    const startIndex = this.hasHeaders ? 1 : 0;
    this.transformedData = this.rawData.slice(startIndex).map(row => {
      const obj: Record<string, string> = {};
      Object.entries(this.columnMappings).forEach(([sourceCol, schemaKey]) => {
        obj[schemaKey] = row[parseInt(sourceCol, 10)] || '';
      });
      return obj;
    });
  }

  /**
   * Validates the transformed data.
   */
  private validateData(): void {
    // Select data rows to validate, considering excludedRows
    const dataToValidate = this.hasHeaders ? this.rawData.slice(1) : this.rawData;
    const dataIndices = this.hasHeaders ? dataToValidate.map((_, index) => index + 1) : dataToValidate.map((_, index) => index);

    // Filter out excluded rows
    const filteredData = dataToValidate.filter((_, idx) => !this.excludedRows.has(dataIndices[idx]));

    // Validate the filtered data
    this.validationResults = validateData(filteredData, this.schema, this.columnMappings);

    // Initialize cellErrors based on validationResults
    this.cellErrors = {};
    this.validationResults.forEach(result => {
      if (!result.isValid) {
        result.errors.forEach(error => {
          if (!this.cellErrors[result.rowIndex]) {
            this.cellErrors[result.rowIndex] = {};
          }
          this.cellErrors[result.rowIndex][error.key] = error.message;
        });
      }
    });
  }

  /**
   * Handles submission of validated data.
   */
  private handleSubmit() {
    if (this.validationResults.every(result => result.isValid)) {
      const finalData = this.transformedData.filter((_, index) => !this.excludedRows.has(index));
      this.dispatchEvent(new CustomEvent('data-import-success', { detail: finalData }));
      this.reset();
    } else {
      alert('Please fix all validation errors before submitting.');
    }
  }

  /**
   * Handles going back to the previous step.
   */
  private handleBack() {
    if (this.step > 1) {
      this.step -= 1;
      this.requestUpdate();
    }
  }

  /**
   * Resets the component to initial state.
   */
  private reset() {
    this.step = 1;
    this.rawData = [];
    this.hasHeaders = false;
    this.columnMappings = {};
    this.validationResults = [];
    this.transformedData = [];
    this.cellErrors = {};
    this.excludedRows = new Set();
    this.requestUpdate();
  }

  /**
   * Handles cell edits from DataGridComponent.
   */
  private async handleCellEdit(event: CustomEvent<{ rowIndex: number; key: string; value: string }>) {
    const { rowIndex, key, value } = event.detail;
    // Update the transformed data
    this.transformedData[rowIndex][key] = value;

    // Revalidate the specific cell
    const schemaField = this.schema[key];
    if (schemaField) {
      const validators = schemaField.validators;
      const errors: string[] = [];

      for (const validator of validators) {
        const result = await Promise.resolve(validator(value));
        if (!result.isValid) {
          errors.push(result.message || 'Invalid value');
          break; // Stop after first failure
        }
      }

      // Update cellErrors
      if (errors.length > 0) {
        if (!this.cellErrors[rowIndex]) {
          this.cellErrors[rowIndex] = {};
        }
        this.cellErrors[rowIndex][key] = errors.join('; ');
      } else {
        if (this.cellErrors[rowIndex]) {
          delete this.cellErrors[rowIndex][key];
          if (Object.keys(this.cellErrors[rowIndex]).length === 0) {
            delete this.cellErrors[rowIndex];
          }
        }
      }

      // Update validationResults
      const correspondingResult = this.validationResults.find(r => r.rowIndex === rowIndex);
      if (correspondingResult) {
        correspondingResult.isValid = Object.keys(this.cellErrors[rowIndex] || {}).length === 0;
        correspondingResult.errors = correspondingResult.errors.filter(err => err.key !== key);
        if (errors.length > 0) {
          correspondingResult.errors.push(
            ...errors.map(message => ({ key, message }))
          );
        }
      }

      this.requestUpdate();
    }
  }

  /**
   * Handles excluding a row from DataGridComponent.
   */
  private handleRowExclude(event: CustomEvent<{ rowIndex: number }>) {
    const { rowIndex } = event.detail;
    this.excludedRows.add(rowIndex);
    this.validateData();
    this.requestUpdate();
  }

  render() {
    return html`
      ${this.step === 1
        ? html`
            <h2>Import Data</h2>
            <file-select-component
              @file-parsed="${this.handleFileParsed}"
              @error="${this.handleFileError}"
            ></file-select-component>
          `
        : ''}
      ${this.step === 2
        ? html`
            <button @click="${this.handleBack}">Back</button>
            <column-mapping-component
              .rawData="${this.rawData}"
              .hasHeaders="${this.hasHeaders}"
              .schema="${this.schema}"
              @mapping-confirmed="${this.handleColumnMapping}"
            ></column-mapping-component>
          `
        : ''}
      ${this.step === 3
        ? html`
            <button @click="${this.handleBack}">Back</button>
            <data-grid-component
              .data="${this.transformedData}"
              .schema="${this.schema}"
              .cellErrors="${this.cellErrors}"
              @cell-edit="${this.handleCellEdit}"
              @row-exclude="${this.handleRowExclude}"
            ></data-grid-component>
            <button @click="${this.handleSubmit}" ?disabled="${this.validationResults.some(r => !r.isValid)}">
              Submit
            </button>
          `
        : ''}
    `;
  }
}
