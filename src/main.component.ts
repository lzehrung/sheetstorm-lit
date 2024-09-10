import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ColValidateFunction } from './workflow/validation';
import { parseExcelFile, parseCsvFile } from './data-parser';
import { validateData } from './validations';

const importSteps = ['1:select-file', '2:map-columns', '3:correct-issues'] as const;
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

@customElement('sheetstorm-modal')
export class SheetstormModal extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Array }) schema: any[] = [];
  @state() private step = 1;
  @state() private columns: string[] = [];
  @state() private data: any[] = [];
  @state() private columnMappings = {};
  @state() private validationErrors: any[] = [];

  static styles = css`
    /* Modal styles here */
  `;

  private fileInput: HTMLInputElement;

  constructor() {
    super();
    if (!window.XLSX || !window.Papa) {
      throw new Error('Sheetstorm requires XLSX and Papa libraries to be loaded globally');
    }

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
  }

  private async handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        this.data = await parseExcelFile(file);
      } else if (file.type === 'text/csv') {
        this.data = await parseCsvFile(file);
      }
      this.columns = Object.keys(this.data[0]);
      this.step = 2;
    }
  }

  private handleColumnMappingChange(event: Event, sourceColumn: string) {
    const targetColumn = (event.target as HTMLSelectElement).value;
    this.columnMappings = { ...this.columnMappings, [sourceColumn]: targetColumn };
  }

  private handleConfirmColumnMapping() {
    this.validationErrors = validateData(this.data, this.schema, this.columnMappings);
    if (this.validationErrors.length > 0) {
      this.step = 3;
    } else {
      this.dispatchEvent(new CustomEvent('data-import-success', { detail: this.data }));
      this.open = false;
    }
  }

  private handleEditCell(event: Event, rowIndex: number, column: string) {
    const value = (event.target as HTMLInputElement).value;
    this.data[rowIndex][column] = value;
    this.validationErrors = validateData(this.data, this.schema, this.columnMappings);
  }

  render() {
    return html`
      ${this.open
        ? html`
            <div class="modal">
              <div class="modal-content">
                <span class="close" @click="${() => (this.open = false)}">&times;</span>
                ${this.step === 1
                  ? html`
                      <h2>Import Data</h2>
                      <button @click="${() => this.fileInput.click()}">Upload File</button>
                    `
                  : ''}
                ${this.step === 2
                  ? html`
                      <h2>Map Columns</h2>
                      <table>
                        <tr>
                          <th>Source Column</th>
                          <th>Target Column</th>
                        </tr>
                        ${this.columns.map(
                          (col) => html`
                            <tr>
                              <td>${col}</td>
                              <td>
                                <select @change="${(e: Event) => this.handleColumnMappingChange(e, col)}">
                                  ${this.schema.map(
                                    (schemaCol) => html`<option value="${schemaCol.name}">${schemaCol.name}</option>`
                                  )}
                                </select>
                              </td>
                            </tr>
                          `
                        )}
                      </table>
                      <button @click="${this.handleConfirmColumnMapping}">Confirm Mapping</button>
                    `
                  : ''}
                ${this.step === 3
                  ? html`
                      <h2>Validation Errors</h2>
                      <table>
                        <tr>
                          ${Object.keys(this.data[0]).map((col) => html`<th>${col}</th>`)}
                        </tr>
                        ${this.validationErrors.map(
                          (row, rowIndex) => html`
                            <tr>
                              ${Object.keys(row).map(
                                (col) => html`
                                  <td>
                                    <input
                                      type="text"
                                      value="${row[col]}"
                                      @input="${(e: any) => this.handleEditCell(e, rowIndex, col)}"
                                    />
                                  </td>
                                `
                              )}
                            </tr>
                          `
                        )}
                      </table>
                      <button @click="${this.handleConfirmColumnMapping}">Revalidate</button>
                    `
                  : ''}
              </div>
            </div>
          `
        : ''}
    `;
  }
}
