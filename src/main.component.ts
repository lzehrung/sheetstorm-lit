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
  @state() private data: string[][] = [];
  @state() private validationErrors: ValidateResult[] = [];
  @state() private transformedData: Record<string, string>[] = []; // Transformed data per schema

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

  private async handleFileParsed(event: CustomEvent<string[][]>) {
    this.data = event.detail;
    // Assign column indices as names
    this.columns = this.data[0].map((_, index) => `Column ${index + 1}`);
    this.step = 2;
    this.requestUpdate();
  }

  private handleFileError(event: CustomEvent) {
    console.error('File parsing error:', event.detail);
    alert('An error occurred while parsing the file.');
    // Handle error UI feedback if needed
  }

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
    const validationResults = validateData(this.data, this.schema, this.columnMappings);

    // Filter out valid rows
    this.validationErrors = validationResults.filter(
      (result) => !result.isValid
    );

    if (this.validationErrors.length > 0) {
      this.step = 3;
    } else {
      this.transformData();
    }
  }

  private transformData(): void {
    this.transformedData = this.data.map(row => {
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

  private handleCellEdit(event: CustomEvent) {
    const { rowIndex, key, value } = event.detail;
    if (this.transformedData[rowIndex]) {
      this.transformedData[rowIndex][key] = value;
      this.requestUpdate();
    }
  }

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
                  ? html`
                      <h2>Map Columns</h2>
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
                                    @change="${(e: Event) =>
                                      this.handleColumnMappingChange(e, index.toString())}"
                                    .value="${this.columnMappings[index.toString()] || ''}"
                                  >
                                    <option value="">--Select--</option>
                                    ${Object.entries(this.schema).map(
                                      ([key, colSchema]) => html`<option
                                        value="${key}"
                                        ?selected="${this.columnMappings[index.toString()] === key}"
                                      >
                                        ${colSchema.label}
                                      </option>`
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
                    `
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

  private handleRevalidate(): void {
    this.handleConfirmColumnMapping();
  }
}
