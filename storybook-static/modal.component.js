var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseExcelFile, parseCsvFile } from './data-parser';
import { validateData } from './validations';
let DataImportModal = class DataImportModal extends LitElement {
    constructor() {
        super();
        this.open = false;
        this.schema = [];
        this.step = 1;
        this.columns = [];
        this.data = [];
        this.columnMappings = {};
        this.validationErrors = [];
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }
    async handleFileSelect(event) {
        const input = event.target;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                this.data = await parseExcelFile(file);
            }
            else if (file.type === 'text/csv') {
                this.data = await parseCsvFile(file);
            }
            this.columns = Object.keys(this.data[0]);
            this.step = 2;
        }
    }
    handleColumnMappingChange(event, sourceColumn) {
        const targetColumn = event.target.value;
        this.columnMappings = { ...this.columnMappings, [sourceColumn]: targetColumn };
    }
    handleConfirmColumnMapping() {
        this.validationErrors = validateData(this.data, this.schema, this.columnMappings);
        if (this.validationErrors.length > 0) {
            this.step = 3;
        }
        else {
            this.dispatchEvent(new CustomEvent('data-import-success', { detail: this.data }));
            this.open = false;
        }
    }
    handleEditCell(event, rowIndex, column) {
        const value = event.target.value;
        this.data[rowIndex][column] = value;
        this.validationErrors = validateData(this.data, this.schema, this.columnMappings);
    }
    render() {
        return html `
      ${this.open
            ? html `
            <div class="modal">
              <div class="modal-content">
                <span class="close" @click="${() => (this.open = false)}">&times;</span>
                ${this.step === 1
                ? html `
                      <h2>Import Data</h2>
                      <button @click="${() => this.fileInput.click()}">Upload File</button>
                    `
                : ''}
                ${this.step === 2
                ? html `
                      <h2>Map Columns</h2>
                      <table>
                        <tr>
                          <th>Source Column</th>
                          <th>Target Column</th>
                        </tr>
                        ${this.columns.map((col) => html `
                            <tr>
                              <td>${col}</td>
                              <td>
                                <select @change="${(e) => this.handleColumnMappingChange(e, col)}">
                                  ${this.schema.map((schemaCol) => html `<option value="${schemaCol.name}">${schemaCol.name}</option>`)}
                                </select>
                              </td>
                            </tr>
                          `)}
                      </table>
                      <button @click="${this.handleConfirmColumnMapping}">Confirm Mapping</button>
                    `
                : ''}
                ${this.step === 3
                ? html `
                      <h2>Validation Errors</h2>
                      <table>
                        <tr>
                          ${Object.keys(this.data[0]).map((col) => html `<th>${col}</th>`)}
                        </tr>
                        ${this.validationErrors.map((row, rowIndex) => html `
                            <tr>
                              ${Object.keys(row).map((col) => html `
                                  <td>
                                    <input
                                      type="text"
                                      value="${row[col]}"
                                      @input="${(e) => this.handleEditCell(e, rowIndex, col)}"
                                    />
                                  </td>
                                `)}
                            </tr>
                          `)}
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
};
DataImportModal.styles = css `
    /* Modal styles here */
  `;
__decorate([
    property({ type: Boolean })
], DataImportModal.prototype, "open", void 0);
__decorate([
    property({ type: Array })
], DataImportModal.prototype, "schema", void 0);
__decorate([
    state()
], DataImportModal.prototype, "step", void 0);
__decorate([
    state()
], DataImportModal.prototype, "columns", void 0);
__decorate([
    state()
], DataImportModal.prototype, "data", void 0);
__decorate([
    state()
], DataImportModal.prototype, "columnMappings", void 0);
__decorate([
    state()
], DataImportModal.prototype, "validationErrors", void 0);
DataImportModal = __decorate([
    customElement('data-import-modal')
], DataImportModal);
export { DataImportModal };
