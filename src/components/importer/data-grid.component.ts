/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ValidateSchema } from '../../validations';

@customElement('data-grid-component')
export class DataGridComponent extends LitElement {
  @property({ type: Array }) data: Record<string, string>[] = [];
  @property({ type: Object }) schema!: ValidateSchema;
  @property({ type: Object }) cellErrors: Record<number, Record<string, string>> = {};

  @state() private sortColumn: string | null = null;
  @state() private sortDirection: 'asc' | 'desc' = 'asc';
  @state() private filters: Record<string, string> = {};
  @state() private filteredData: Record<string, string>[] = [];
  @state() private errorsPopoverDetails: { rowIndex: number; key: string; x: number; y: number; message: string } | null = null;

  static styles = css`
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      position: relative;
    }
    th {
      background-color: #f2f2f2;
      cursor: pointer;
      user-select: none;
    }
    th .filter-input {
      width: 90%;
      margin-top: 4px;
      padding: 4px;
      box-sizing: border-box;
    }
    input[type='text'] {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--input-border-color, #ccc);
      border-radius: 4px;
      padding: 4px;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    input[type='text'].error {
      border-color: red;
      box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
    }
    .popover {
      position: fixed;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    th.sort-asc::after {
      content: ' ▲';
      font-size: 12px;
    }
    th.sort-desc::after {
      content: ' ▼';
      font-size: 12px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.applyFiltersAndSorting();
  }

  updated(changedProperties: PropertyValues) {
    if (
      changedProperties.has('data') ||
      changedProperties.has('filters') ||
      changedProperties.has('sortColumn') ||
      changedProperties.has('sortDirection')
    ) {
      this.applyFiltersAndSorting();
    }
  }

  /**
   * Applies filtering and sorting to the data.
   */
  private applyFiltersAndSorting() {
    let tempData = [...this.data];

    // Apply filters
    Object.keys(this.filters).forEach(key => {
      const filterValue = this.filters[key].toLowerCase();
      if (filterValue) {
        tempData = tempData.filter(row => row[key]?.toLowerCase().includes(filterValue));
      }
    });

    // Apply sorting
    if (this.sortColumn) {
      tempData.sort((a, b) => {
        const valA = a[this.sortColumn!] || '';
        const valB = b[this.sortColumn!] || '';
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredData = tempData;
  }

  /**
   * Handles sorting when a header is clicked.
   */
  private handleSort(column: string) {
    if (this.sortColumn === column) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  /**
   * Handles filter input changes.
   */
  private handleFilterChange(e: Event, column: string) {
    const input = e.target as HTMLInputElement;
    this.filters = { ...this.filters, [column]: input.value };
  }

  /**
   * Handles cell value changes (inline editing).
   */
  private handleInputChange(e: Event, rowIndex: number, key: string) {
    const input = e.target as HTMLInputElement;
    const newValue = input.value;

    // Emit cell-edit event to inform parent of the change
    this.dispatchEvent(new CustomEvent('cell-edit', {
      detail: {
        rowIndex,
        key,
        value: newValue,
      },
      bubbles: true,
      composed: true,
    }));
  }

  /**
   * Shows the popover with error messages.
   */
  private showErrorsPopover(e: MouseEvent, rowIndex: number, key: string) {
    const errorMessage = this.cellErrors[rowIndex]?.[key];
    if (errorMessage) {
      const x = e.clientX;
      const y = e.clientY;
      this.errorsPopoverDetails = { rowIndex, key, x, y, message: errorMessage };
      window.addEventListener('click', this.handleOutsideClick);
    }
  }

  /**
   * Handles clicks outside the popover to close it.
   */
  private handleOutsideClick = () => {
    this.errorsPopoverDetails = null;
    window.removeEventListener('click', this.handleOutsideClick);
  }

  /**
   * Renders the popover if it exists.
   */
  private renderPopover() {
    if (this.errorsPopoverDetails) {
      const { x, y, message } = this.errorsPopoverDetails;
      return html`
        <div class="popover" style="top: ${y + 10}px; left: ${x + 10}px;">
          ${message.split('; ').map(err => html`<div>${err}</div>`)}
        </div>
      `;
    }
    return null;
  }

  render() {
    const columns = Object.keys(this.schema);
    return html`
      <table>
        <thead>
          <tr>
            ${columns.map(column => html`
              <th
                @click="${() => this.handleSort(column)}"
                class="${this.sortColumn === column ? `sort-${this.sortDirection}` : ''}"
              >
                ${this.schema[column].label}
                <div>
                  <input
                    class="filter-input"
                    type="text"
                    placeholder="Filter"
                    .value="${this.filters[column] || ''}"
                    @input="${(e: Event) => this.handleFilterChange(e, column)}"
                    @click="${(e: Event) => e.stopPropagation()}"
                  />
                </div>
              </th>
            `)}
          </tr>
        </thead>
        <tbody>
          ${this.filteredData.map((row, rowIndex) => html`
            <tr>
              ${columns.map(key => html`
                <td>
                  <input
                    type="text"
                    .value="${row[key] || ''}"
                    class="${this.cellErrors[rowIndex]?.[key] ? 'error' : ''}"
                    @input="${(e: Event) => this.handleInputChange(e, rowIndex, key)}"
                    @click="${(e: MouseEvent) => this.showErrorsPopover(e, rowIndex, key)}"
                  />
                </td>
              `)}
            </tr>
          `)}
        </tbody>
      </table>
      ${this.renderPopover()}
    `;
  }
}
