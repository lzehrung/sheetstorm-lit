import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/table-core';
import type { ColumnDef,Table, CellContext, Row } from '@tanstack/table-core';
import '@lit-labs/virtualizer';
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
  @state() private columnMappings!: Record<keyof T, string>;
  @state() private data: ImportRow[] = [];
  @state() private validationErrors: ValidateResult<T>[] = [];

  // Table-related states
  @state() private table!: Table<T>;
  @state() private globalFilter = '';

  static styles = css`
    /* Modal styles here */
    .modal {
      /* Your modal styles */
    }
    .modal-content {
      /* Your modal content styles */
    }
    /* Add more styles as needed */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    th {
      cursor: pointer;
    }
    input[type='text'] {
      width: 100%;
      box-sizing: border-box;
    }
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
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        this.data = await parseExcelFile(file);
      } else if (file.type === 'text/csv') {
        this.data = await parseCsvFile(file);
      }
      this.columns = Object.keys(this.data[0]);
      this.step = 2;
      this.initializeTable();
    }
  }

  get asRowData(): T[] {
    return this.data as T[];
  }

  private initializeTable() {
    const columns: ColumnDef<T>[] = Object.entries(this.schema).map(([key, value]) => ({
      accessorKey: key as keyof T,
      header: value.label,
      cell: (info) => this.renderEditableCell(info),
    }));

    this.table = createTable<T>({
      data: this.asRowData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        sorting: [],
        globalFilter: this.globalFilter,
      },
      onSortingChange: (sorting) => {
        this.table.setSorting(sorting);
      },
      onGlobalFilterChange: (filter: string) => {
        this.globalFilter = filter;
        this.table.setGlobalFilter(filter);
      },
      // Add the missing properties below
      onStateChange: () => {
        // Handle state changes if necessary
        this.requestUpdate();
      },
      renderFallbackValue: () => html`<div>Loading...</div>`,
    });

    this.requestUpdate();
  }

  private renderEditableCell(info: CellContext<T, unknown>): TemplateResult {
    const row = info.row.original;
    const columnId = info.column.id;
    return html`<input
      type="text"
      .value="${row[columnId]}"
      @input="${(e: Event) => this.handleEditCell(e, info.row.index, columnId)}"
    />`;
  }

  private handleEditCell(event: Event, rowIndex: number, column: string) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.data = [
      ...this.data.slice(0, rowIndex),
      { ...this.data[rowIndex], [column]: value },
      ...this.data.slice(rowIndex + 1),
    ];
    const rowValidationErrors = validateData(this.data, this.schema, this.columnMappings);
    this.validationErrors = [
      ...this.validationErrors,
      ...rowValidationErrors,
    ];
    this.initializeTable(); // Re-initialize table with updated data
  }

  private handleColumnMappingChange(event: Event, sourceColumn: string) {
    const targetColumn = (event.target as HTMLSelectElement).value;
    this.columnMappings = { ...this.columnMappings, [sourceColumn]: targetColumn };
  }

  private handleConfirmColumnMapping() {
    this.validationErrors = validateData(this.data, this.schema, this.columnMappings).filter((error) => !error.isValid);
    if (this.validationErrors.length > 0) {
      this.step = 3;
    } else {
      this.dispatchEvent(new CustomEvent('data-import-success', { detail: this.data }));
      this.open = false;
    }
  }

  renderTable() {
    if (!this.table) return html``;

    return html`
      <input
        type="text"
        placeholder="Search..."
        @input="${(e: Event) => this.table.setGlobalFilter((e.target as HTMLInputElement).value)}"
      />
      <table>
        <thead>
          ${this.table.getHeaderGroups().map(
      (headerGroup) => html`
              <tr>
                ${headerGroup.headers.map(
        (header) => html`
                    <th @click="${() => this.handleSort(header.column.id)}">
                      ${header.column.columnDef.header}
                      ${this.getSortIndicator(header.column.getIsSorted())}
                    </th>
                  `
      )}
              </tr>
            `
    )}
        </thead>
        <tbody>
          <lit-virtualizer
            items="${this.table.getRowModel().rows}"
            scroller
            style="height: 400px; overflow: auto;"
            .renderItem="${(row: Row<T>) => this.renderTableRow(row)}"
          ></lit-virtualizer>
        </tbody>
      </table>
    `;
  }

  private renderTableRow(row: Row<T>): TemplateResult {
    return html`
      <tr>
        ${row.getVisibleCells().map(
      (cell) => html`<td>${cell.getValue()}</td>`
    )}
      </tr>
    `;
  }

  private handleSort(columnId: string) {
    const isSorted = this.table.getColumn(columnId)?.getIsSorted();
    let newSort = [];

    if (isSorted === 'asc') {
      newSort = [{ id: columnId, desc: true }];
    } else {
      newSort = [{ id: columnId, desc: false }];
    }

    this.table.setSorting(newSort);
    this.requestUpdate();
  }

  private getSortIndicator(isSorted: false | 'asc' | 'desc'): string {
    if (isSorted === 'asc') return ' 🔼';
    if (isSorted === 'desc') return ' 🔽';
    return '';
  }

  private handleFileParsed(event: CustomEvent) {
    this.data = event.detail;
    this.columns = Object.keys(this.data[0]);
    this.step = 2;
    this.initializeTable();
  }

  private handleFileError(event: CustomEvent) {
    console.error('File parsing error:', event.detail);
    // Handle error UI feedback if needed
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
                                  <option value="">--Select--</option>
                                  ${Object.entries(this.schema).map(
                ([key, col]) => html`<option value="${key}">${col.label}</option>`
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
                      ${this.renderTable()}
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
