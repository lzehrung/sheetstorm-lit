import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ValidateSchema } from '../../validations';

@customElement('column-mapping-component')
export class ColumnMappingComponent extends LitElement {
  @property({ type: Array }) rawData: string[][] = [];
  @property({ type: Boolean }) hasHeaders = false;
  @property({ type: Object }) schema!: ValidateSchema;

  @state() private columns: string[] = [];
  @state() private columnMappings: Record<string, string> = {};

  static styles = css`
    /* Existing styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    select {
      width: 100%;
    }
    .header-option {
      margin-bottom: 10px;
    }
    button {
      padding: 8px 16px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.initializeColumns();
  }

  /**
   * Initializes column names based on headers or default naming.
   */
  private initializeColumns() {
    if (this.hasHeaders && this.rawData.length > 0) {
      // Use the first row as column headers
      this.columns = this.rawData[0];
    } else if (this.rawData.length > 0) {
      // Generate default column names
      this.columns = this.rawData[0].map((_, index) => `Column ${index + 1}`);
    }
  }

  /**
   * Handles changes in column mappings.
   */
  private handleMappingChange(event: Event, sourceColumn: string) {
    const targetColumn = (event.target as HTMLSelectElement).value;
    if (targetColumn) {
      if (targetColumn in this.schema) {
        this.columnMappings[sourceColumn] = targetColumn;
      }
    } else {
      delete this.columnMappings[sourceColumn];
    }
    this.requestUpdate();
  }

  /**
   * Confirms the column mapping and emits an event to the parent component.
   */
  private confirmMapping() {
    const mappedSchemaKeys = new Set(Object.values(this.columnMappings));
    const requiredFields = Object.keys(this.schema);
    const unmappedFields = requiredFields.filter(field => !mappedSchemaKeys.has(field));

    if (unmappedFields.length > 0) {
      alert(`Please map all required fields: ${unmappedFields.join(', ')}`);
      return;
    }

    this.dispatchEvent(new CustomEvent('mapping-confirmed', { detail: { mappings: this.columnMappings, schemaKeys: requiredFields } }));
  }

  /**
   * Toggles the "Has Headers" state and reinitializes columns.
   */
  private toggleHeaders(e: Event) {
    const input = e.target as HTMLInputElement;
    this.hasHeaders = input.checked;
    this.initializeColumns();
    this.columnMappings = {}; // Reset mappings as columns have changed
    this.requestUpdate();
  }

  render() {
    const schemaKeys = Object.keys(this.schema);
    const mappedKeys = new Set(Object.values(this.columnMappings));

    return html`
      <h2>Map Columns</h2>
      <div class="header-option">
        <label>
          <input type="checkbox" .checked=${this.hasHeaders} @change="${this.toggleHeaders}" />
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
          ${this.columns.map((col, index) => html`
            <tr>
              <td>${col}</td>
              <td>
                <select @change="${(e: Event) => this.handleMappingChange(e, index.toString())}" .value="${this.columnMappings[index.toString()] || ''}">
                  <option value="">--Select--</option>
                  ${schemaKeys.map(key => {
                    const isDisabled = mappedKeys.has(key) && this.columnMappings[index.toString()] !== key;
                    return html`<option value="${key}" ?selected="${this.columnMappings[index.toString()] === key}" ?disabled="${isDisabled}">
                      ${this.schema[key].label}
                    </option>`;
                  })}
                </select>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
      <button @click="${this.confirmMapping}">Confirm Mapping</button>
    `;
  }
}
