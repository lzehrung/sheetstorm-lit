import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseExcelFile, parseCsvFile } from './data-parser';
import { validateData } from './validations';

@customElement('data-import-modal')
export class DataImportModal extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Array }) schema = [];
  @state() private step = 1;
  @state() private columns = [];
  @state() private data = [];
  @state() private columnMappings = {};
  @state() private validationErrors = [];

  static styles = css`
    /* Modal styles here */
  `;

  private fileInput: HTMLInputElement;

  constructor() {
    super();
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
                                <select @change="${(e) => this.handleColumnMappingChange(e, col)}">
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
                                      @input="${(e) => this.handleEditCell(e, rowIndex, col)}"
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
