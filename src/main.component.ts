/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@vaadin/grid';
import { validateData, ValidateResult, ValidateSchema } from './validations';
import './workflow/file-select.component';

@customElement('sheetstorm-modal')
export class SheetstormModal extends LitElement {
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

  static styles = css`
    /* Modal styles here */
    .modal {
      /* Your modal styles */
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 5px;
      width: 80%;
      max-height: 90%;
      overflow-y: auto;
    }
    .close {
      float: right;
      cursor: pointer;
      font-size: 1.5em;
    }
    /* Add more styles as needed */
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
    // Removed direct fileInput handling
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

    // Filter out invalid rows
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
    }
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
   * Renders the data grid with editable cells.
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
              .renderer="${this.gridRenderer}"
              @sort="${this.handleSort}"
            ></vaadin-grid-column>
          `
        )}
      </vaadin-grid>
    `;
  }

  /**
   * Renders each cell in the data grid as an editable input field.
   *
   * @param root - The cell element.
   * @param column - The column configuration.
   * @param rowData - The row data.
   */
  private gridRenderer(
    root: HTMLElement,
    column: any,
    rowData: any
  ): void {
    if (!root.firstElementChild) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = rowData.item[column.path] || '';
      input.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const customEvent = new CustomEvent('cell-edit', {
          detail: {
            rowIndex: rowData.index,
            key: column.path,
            value: target.value,
          },
          bubbles: true,
          composed: true,
        });
        root.dispatchEvent(customEvent);
      });
      root.appendChild(input);
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
   * Renders the modal content based on the current step.
   *
   * @returns The modal content template.
   */
  render() {
    return html`
      ${this.open
        ? html`
            <div class="modal">
              <div class="modal-content">
                <span class="close" @click="${() => (this.open = false)}
                  ">&times;</span
                >
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
                      <h2>Validation Errors</h2>
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
              </div>
            </div>
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
}
