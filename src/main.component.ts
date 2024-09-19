/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@vaadin/grid';
import { parseExcelFile, parseCsvFile } from './data-parser';
import { ImportRow, validateData, ValidateResult, ValidateSchema } from './validations';
import './workflow/file-select.component';

@customElement('sheetstorm-modal')
export class SheetstormModal<T extends ImportRow> extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Object, attribute: 'schema' }) schema!: ValidateSchema<T>;

  @state() private step = 1;
  @state() private columns: string[] = [];
  @state() private columnMappings: Partial<Record<keyof T, string>> = {};
  @state() private data: ImportRow[] = [];
  @state() private validationErrors: ValidateResult<T>[] = [];
  @state() private transformedData: T[] = []; // State for transformed data

  static styles = css`
    /* Modal styles here */
    .modal {
      /* Your modal styles */
    }
    .modal-content {
      /* Your modal content styles */
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

  private fileInput: HTMLInputElement;

  constructor() {
    super();
    if (!window.XLSX || !window.Papa) {
      throw new Error(
        'Sheetstorm requires XLSX and Papa libraries to be loaded globally'
      );
    }

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept =
      '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    this.fileInput.addEventListener(
      'change',
      this.handleFileSelect.bind(this)
    );
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.schema) {
      throw new Error('Schema is required');
    }
  }

  private async handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (
        file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        this.data = await parseExcelFile(file);
      } else if (file.type === 'text/csv') {
        this.data = await parseCsvFile(file);
      }
      this.columns = Object.keys(this.data[0] || {});
      this.step = 2;
      this.requestUpdate();
    }
  }

  get asRowData(): T[] {
    return this.transformedData as T[];
  }

  private handleCellEdit(event: CustomEvent) {
    const { path, field, value } = event.detail;
    if (this.transformedData[path]) {
      this.transformedData[path][field] = value;
      this.requestUpdate();
    }
  }

  private handleColumnMappingChange(
    event: Event,
    sourceColumn: string
  ): void {
    const targetColumn = (event.target as HTMLSelectElement).value;
    if (targetColumn) {
      // Ensure the targetColumn is a valid key in the schema
      if (targetColumn in this.schema) {
        this.columnMappings = {
          ...this.columnMappings,
          [sourceColumn as keyof T]: targetColumn,
        };
      }
    } else {
      // Remove the mapping if no target is selected
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [sourceColumn as keyof T]: _, ...rest } = this.columnMappings;
      this.columnMappings = rest as Partial<Record<keyof T, string>>;
    }
  }

  private handleConfirmColumnMapping(): void {
    // Ensure all required schema fields are mapped
    const requiredFields = Object.keys(this.schema) as (keyof T)[];
    const mappedFields = Object.values(this.columnMappings);
    const unmappedFields = requiredFields.filter(
      (field) => !mappedFields.includes(field as string)
    );

    if (unmappedFields.length > 0) {
      alert(
        `Please map all required fields: ${unmappedFields
          .map((f) => this.schema[f].label)
          .join(', ')}`
      );
      return;
    }

    // Transform data based on columnMappings
    this.transformedData = this.data.map((item) => {
      const transformedItem: any = {};
      for (const [sourceKey, targetKey] of Object.entries(this.columnMappings)) {
        transformedItem[targetKey] = item[sourceKey];
      }
      return transformedItem as T;
    });

    // Validate the transformed data
    this.validationErrors = validateData(this.transformedData, this.schema).filter(
      (error) => !error.isValid
    );

    if (this.validationErrors.length > 0) {
      this.step = 3;
    } else {
      this.dispatchEvent(
        new CustomEvent('data-import-success', { detail: this.transformedData })
      );
      this.open = false;
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
            path: rowData.index,
            field: column.path,
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
                            (col) => html`
                              <tr>
                                <td>${col}</td>
                                <td>
                                  <select
                                    @change="${(e: Event) =>
                                      this.handleColumnMappingChange(e, col)}"
                                    .value="${this.columnMappings[
                                      col as keyof T
                                    ] || ''}"
                                  >
                                    <option value="">--Select--</option>
                                    ${Object.entries(this.schema).map(
                                      ([key, colSchema]) => html`<option
                                        value="${key}"
                                        ?selected="${this.columnMappings[
                                          col as keyof T
                                        ] === key}"
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
                      ${this.renderGrid()}
                      <button @click="${this.handleConfirmColumnMapping}">
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

  private handleFileParsed(event: CustomEvent) {
    this.data = event.detail;
    this.columns = Object.keys(this.data[0] || {});
    this.step = 2;
    this.requestUpdate();
  }

  private handleFileError(event: CustomEvent) {
    console.error('File parsing error:', event.detail);
    alert('An error occurred while parsing the file.');
    // Handle error UI feedback if needed
  }
}
