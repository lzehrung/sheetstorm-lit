/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@vaadin/grid';
import { validateData, ValidateResult, ValidateSchema, ValidationError } from './validations';
import './workflow/file-select.component';

@customElement('sheetstorm-import')
export class Sheetstorm extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Object, attribute: 'schema' }) schema!: ValidateSchema;

  @state() private step = 1;
  @state() private columns: string[] = [];
  @state() private columnMappings: Record<string, string> = {}; // Source column index to schema key
  @state() private rawData: string[][] = []; // All parsed data
  @state() private filteredData: string[][] = []; // Data excluding header if hasHeaders
  @state() private validationErrors: ValidateResult[] = [];
  @state() private transformedData: Record<string, string>[] = []; // Transformed data per schema
  @state() private hasHeaders = false;

  // New state for per-cell errors
  @state() private cellErrors: Record<number, Record<string, string>> = {};

  static styles = css`
    /* General styles */
    vaadin-grid {
      width: 100%;
      height: 400px;
    }
    vaadin-grid-cell-content {
      padding: 8px;
      box-sizing: border-box;
    }
    input[type='text'] {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--input-border-color, #ccc);
      border-radius: 4px;
      padding: 4px;
    }
    input[type='text'].error {
      border-color: red;
    }
    .popover {
      position: absolute;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10;
      top: -5px;
      right: -5px;
    }
    .cell-container {
      position: relative;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    select {
      width: 100%;
    }
    button {
      margin-top: 16px;
      padding: 8px 16px;
    }
    .header-option {
      margin-bottom: 10px;
    }
  `;

  constructor() {
    super();
    // Initialization if needed
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.schema) {
      throw new Error('Schema is required');
    }
  }

  /**
   * Handles the parsed file data.
   *
   * @param event - The file-parsed event containing the data.
   */
  private async handleFileParsed(event: CustomEvent<string[][]>) {
    this.rawData = event.detail;
    this.hasHeaders = this.detectHasHeaders(this.rawData);
    if (this.hasHeaders) {
      this.filteredData = this.rawData.slice(1); // Exclude header row
      this.columns = this.rawData[0].map((header, index) => header || `Column ${index + 1}`);
    } else {
      this.filteredData = this.rawData;
      this.columns = this.rawData[0].map((_, index) => `Column ${index + 1}`);
    }
    this.step = 2;
    this.requestUpdate();
  }

  /**
   * Detects whether the first row of data is a header row.
   *
   * @param data - The parsed data array.
   * @returns True if a header row is detected, false otherwise.
   */
  private detectHasHeaders(data: string[][]): boolean {
    if (data.length < 2) {
      return false; // Not enough data to determine
    }

    const firstRow = data[0];
    const otherRows = data.slice(1, 4); // Check next 3 rows

    // Check if all cells in the first row are non-empty strings
    const isFirstRowAllStrings = firstRow.every(cell => typeof cell === 'string' && cell.trim() !== '');

    if (!isFirstRowAllStrings) {
      return false;
    }

    // Check if other rows have mixed types
    const isOtherRowsMixed = otherRows.some(row => {
      const types = row.map(cell => {
        if (!isNaN(Number(cell))) return 'number';
        if (Date.parse(cell)) return 'date';
        if (cell.toLowerCase() === 'true' || cell.toLowerCase() === 'false') return 'boolean';
        return 'string';
      });
      // If there is a mix of types, return true
      const uniqueTypes = new Set(types);
      return uniqueTypes.size > 1;
    });

    return isFirstRowAllStrings && isOtherRowsMixed;
  }

  /**
   * Handles errors during file parsing.
   *
   * @param event - The error event.
   */
  private handleFileError(event: CustomEvent) {
    console.error('File parsing error:', event.detail);
    alert('An error occurred while parsing the file.');
    // Handle error UI feedback if needed
  }

  /**
   * Handles changes in column mappings.
   *
   * @param event - The change event from the select dropdown.
   * @param sourceColumn - The index of the source column being mapped.
   */
  private handleColumnMappingChange(
    event: Event,
    sourceColumn: string
  ): void {
    const targetColumn = (event.target as HTMLSelectElement).value;
    if (targetColumn) {
      // Ensure the targetColumn is a valid key in the schema
      if (targetColumn in this.schema) {
        this.columnMappings[sourceColumn] = targetColumn;
      }
    } else {
      // Remove the mapping if no target is selected
      delete this.columnMappings[sourceColumn];
    }
    this.requestUpdate();
  }

  /**
   * Confirms the column mappings and initiates validation.
   */
  private handleConfirmColumnMapping(): void {
    // Ensure all required schema fields are mapped
    const requiredFields = Object.keys(this.schema);
    const mappedFields = Object.values(this.columnMappings);
    const unmappedFields = requiredFields.filter(
      (field) => !mappedFields.includes(field)
    );

    if (unmappedFields.length > 0) {
      alert(
        `Please map all required fields: ${unmappedFields
          .map((f) => this.schema[f].label)
          .join(', ')}`
      );
      return;
    }

    // Validate the data
    const validationResults = validateData(this.filteredData, this.schema, this.columnMappings);

    // Initialize cellErrors based on validationResults
    this.cellErrors = {}; // Reset previous errors
    validationResults.forEach(result => {
      if (!result.isValid) {
        result.errors.forEach(error => {
          if (!this.cellErrors[result.rowIndex]) {
            this.cellErrors[result.rowIndex] = {};
          }
          this.cellErrors[result.rowIndex][error.key] = error.message;
        });
      }
    });

    this.validationErrors = validationResults.filter(
      (result) => !result.isValid
    );

    if (this.validationErrors.length > 0) {
      this.step = 3;
    } else {
      this.transformData();
    }
  }

  /**
   * Transforms the validated data into the desired format and emits a success event.
   */
  private transformData(): void {
    this.transformedData = this.filteredData.map(row => {
      const obj: Record<string, string> = {};
      Object.entries(this.columnMappings).forEach(([sourceCol, schemaKey]) => {
        obj[schemaKey] = row[parseInt(sourceCol, 10)] || '';
      });
      return obj;
    });

    this.dispatchEvent(
      new CustomEvent('data-import-success', { detail: this.transformedData })
    );
    this.open = false;
    this.step = 1; // Reset to initial step if needed
  }

  /**
   * Handles cell edits in the data grid.
   *
   * @param event - The cell-edit event containing row and column details.
   */
  private handleCellEdit(event: CustomEvent) {
    const { rowIndex, key, value } = event.detail;
    if (this.transformedData[rowIndex]) {
      this.transformedData[rowIndex][key] = value;
      this.requestUpdate();
      this.validateCell(rowIndex, key, value);
    }
  }

  /**
   * Validates a single cell and updates the cellErrors state.
   *
   * @param rowIndex - The index of the row being validated.
   * @param key - The schema key corresponding to the column.
   * @param value - The new value of the cell.
   */
  private validateCell(rowIndex: number, key: string, value: string): void {
    const schemaField = this.schema[key];
    if (!schemaField) {
      console.warn(`No schema found for key: ${key}`);
      return;
    }

    let errorMessage = '';

    for (const validator of schemaField.validators) {
      const result = validator(value);
      if (!result.isValid) {
        errorMessage = result.message || 'Invalid value';
        break; // Stop at the first validation error
      }
    }

    if (!this.cellErrors[rowIndex]) {
      this.cellErrors[rowIndex] = {};
    }

    if (errorMessage) {
      this.cellErrors[rowIndex][key] = errorMessage;
    } else {
      delete this.cellErrors[rowIndex][key];
      // Clean up if no more errors in the row
      if (Object.keys(this.cellErrors[rowIndex]).length === 0) {
        delete this.cellErrors[rowIndex];
      }
    }

    this.requestUpdate();
  }

  /**
   * Handles sorting logic for the data grid columns.
   *
   * @param event - The sort event.
   */
  private handleSort(event: Event): void {
    const grid = event.currentTarget as any;
    const column = event.target as any;
    const path = column.closest('vaadin-grid-column');
    if (path) {
      const direction = path.getAttribute('sort-direction');
      const newDirection = direction === 'asc' ? 'desc' : 'asc';
      grid.columns.forEach((col: any) =>
        col.removeAttribute('sort-direction')
      );
      path.setAttribute('sort-direction', newDirection);
      // Implement sorting logic based on newDirection
      // This may require additional state management
    }
  }

  /**
   * Renders the data grid with editable cells and error indicators.
   *
   * @returns The Vaadin grid template.
   */
  private renderGrid(): unknown {
    return html`
      <vaadin-grid
        .items="${this.transformedData}"
        theme="no-border"
        @active-item-changed="${(e: any) =>
          this.handleCellEdit(e.detail.value)}"
      >
        ${Object.entries(this.schema).map(
          ([key, colConfig]) => html`
            <vaadin-grid-column
              path="${key}"
              header="${colConfig.label}"
              .renderer="${(root: HTMLElement, column: any, rowData: any) =>
                this.gridRenderer(root, column, rowData, key)}"
              @sort="${this.handleSort}"
            ></vaadin-grid-column>
          `
        )}
      </vaadin-grid>
    `;
  }

  /**
   * Renders each cell in the data grid as an editable input field with error handling.
   *
   * @param root - The cell element.
   * @param column - The column configuration.
   * @param rowData - The row data.
   * @param key - The schema key corresponding to the column.
   */
  private gridRenderer(
    root: HTMLElement,
    column: any,
    rowData: any,
    key: string
  ): void {
    if (!root.firstElementChild) {
      // Create a container for relative positioning
      const container = document.createElement('div');
      container.classList.add('cell-container');

      const input = document.createElement('input');
      input.type = 'text';
      input.value = rowData.item[key] || '';
      input.classList.add('editable-cell');

      // Check for existing errors
      const rowIndex = rowData.index;
      const error = this.cellErrors[rowIndex]?.[key];
      if (error) {
        input.classList.add('error');
      }

      input.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const customEvent = new CustomEvent('cell-edit', {
          detail: {
            rowIndex: rowIndex,
            key: key,
            value: target.value,
          },
          bubbles: true,
          composed: true,
        });
        root.dispatchEvent(customEvent);
      });

      container.appendChild(input);

      // If there's an error, display a tooltip/popover
      if (error) {
        const errorTooltip = document.createElement('div');
        errorTooltip.classList.add('popover');
        errorTooltip.textContent = error;
        container.appendChild(errorTooltip);
      }

      root.appendChild(container);
    }
  }

  /**
   * Renders the column mapping interface with the "Has Headers" checkbox.
   *
   * @returns The column mapping template.
   */
  private renderColumnMapping(): unknown {
    // Get list of mapped schema keys
    const mappedKeys = new Set(Object.values(this.columnMappings));

    return html`
      <h2>Map Columns</h2>
      <div class="header-option">
        <label>
          <input type="checkbox" .checked=${this.hasHeaders} @change=${this.toggleHeaders} />
          First row contains headers
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Source Column</th>
            <th>Target Column</th>
          </tr>
        </thead>
        <tbody>
          ${this.columns.map(
            (col, index) => html`
              <tr>
                <td>${col}</td>
                <td>
                  <select
                    @change="${(e: Event) => this.handleColumnMappingChange(e, index.toString())}"
                    .value="${this.columnMappings[index.toString()] || ''}"
                  >
                    <option value="">--Select--</option>
                    ${Object.entries(this.schema).map(
                      ([key, colSchema]) => {
                        // Disable option if it's already mapped to another column
                        const isDisabled = mappedKeys.has(key) && this.columnMappings[index.toString()] !== key;
                        return html`<option
                          value="${key}"
                          ?selected="${this.columnMappings[index.toString()] === key}"
                          ?disabled="${isDisabled}"
                        >
                          ${colSchema.label}
                        </option>`;
                      }
                    )}
                  </select>
                </td>
              </tr>
            `
          )}
        </tbody>
      </table>
      <button @click="${this.handleConfirmColumnMapping}">
        Confirm Mapping
      </button>
    `;
  }

  /**
   * Toggles the "Has Headers" state and updates columns and data accordingly.
   *
   * @param e - The change event from the checkbox.
   */
  private toggleHeaders(e: Event) {
    const input = e.target as HTMLInputElement;
    const newHasHeaders = input.checked;
    if (newHasHeaders !== this.hasHeaders) {
      this.hasHeaders = newHasHeaders;
      if (this.hasHeaders) {
        // Treat first row as header
        if (this.rawData.length > 0) {
          this.filteredData = this.rawData.slice(1);
          this.columns = this.rawData[0].map((header, index) => header || `Column ${index + 1}`);
        }
      } else {
        // Include all data and use generic column names
        this.filteredData = this.rawData;
        this.columns = this.rawData[0].map((_, index) => `Column ${index + 1}`);
      }
      // Reset column mappings as column names might have changed
      this.columnMappings = {};
      this.requestUpdate();
    }
  }

  /**
   * Renders the component content based on the current step.
   *
   * @returns The component template.
   */
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
        ? this.renderColumnMapping()
        : ''}
      ${this.step === 3
        ? html`
            <h2>Review and Submit</h2>
            ${this.validationErrors.length > 0
              ? html`
                  <ul>
                    ${this.validationErrors.map(
                      (error) => html`
                        <li>
                          Row ${error.rowIndex + 1}:
                          <ul>
                            ${error.errors.map(
                              (err) => html`<li>${err.key}: ${err.message}</li>`
                            )}
                          </ul>
                        </li>
                      `
                    )}
                  </ul>
                  <button @click="${this.handleRevalidate}">
                    Revalidate
                  </button>
                `
              : ''}
            ${this.renderGrid()}
            <button
              ?disabled="${Object.keys(this.cellErrors).length > 0}"
              @click="${this.handleFinalSubmit}"
            >
              Submit
            </button>
          `
        : ''}
    `;
  }

  /**
   * Handles revalidation when the user opts to fix validation errors.
   */
  private handleRevalidate(): void {
    this.handleConfirmColumnMapping();
  }

  /**
   * Handles the final submission of data after all validations pass.
   */
  private handleFinalSubmit(): void {
    if (Object.keys(this.cellErrors).length === 0) {
      this.transformData();
    } else {
      alert('Please fix all validation errors before submitting.');
    }
  }
}
