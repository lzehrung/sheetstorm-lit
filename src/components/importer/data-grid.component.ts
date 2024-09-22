/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ValidateSchema } from '../../validations';
import '@vaadin/grid';

@customElement('data-grid-component')
export class DataGridComponent extends LitElement {
  @property({ type: Array }) data: Record<string, string>[] = [];
  @property({ type: Object }) schema!: ValidateSchema;
  @property({ type: Object }) cellErrors: Record<number, Record<string, string>> = {};

  static styles = css`
    vaadin-grid {
      width: 100%;
      height: 400px;
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
      position: absolute;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10;
      top: 100%;
      left: 0;
      display: none;
      margin-top: 2px;
    }
    .cell-container {
      position: relative;
    }
    .exclude-button {
      background: transparent;
      border: none;
      cursor: pointer;
      color: red;
      font-size: 1.2em;
    }
  `;

  /**
   * Renders the Vaadin Grid with editable cells.
   */
  render() {
    return html`
      <vaadin-grid .items="${this.data}" theme="no-border">
        ${Object.keys(this.schema).map(key => html`
          <vaadin-grid-column
            path="${key}"
            header="${this.schema[key].label}"
            .renderer="${(root: HTMLElement, column: any, rowData: any) => this.gridRenderer(root, column, rowData, key)}"
          ></vaadin-grid-column>
        `)}
        <!-- Exclude Column -->
        <vaadin-grid-column header="Exclude" flex-grow="0" width="50px">
          <template class="header">Exclude</template>
          <template>
          <button class="exclude-button" @click="${() => this.handleExclude(rowData.index)}" title="Exclude Row">
              🗑️
            </button>
          </template>
        </vaadin-grid-column>
      </vaadin-grid>
    `;
  }

  /**
   * Renders each cell with an editable input and error handling.
   */
  private gridRenderer(root: HTMLElement, column: any, rowData: any, key: string): void {
    if (!root.firstElementChild) {
      const container = document.createElement('div');
      container.classList.add('cell-container');

      const input = document.createElement('input');
      input.type = 'text';
      input.value = rowData.item[key] || '';
      input.classList.add('editable-cell');
      if (this.cellErrors[rowData.index]?.[key]) {
        input.classList.add('error');
      }

      input.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.dispatchEvent(new CustomEvent('cell-edit', {
          detail: {
            rowIndex: rowData.index,
            key: key,
            value: target.value,
          },
          bubbles: true,
          composed: true,
        }));
      });

      // Create popover for errors
      const errorTooltip = document.createElement('div');
      errorTooltip.classList.add('popover');
      container.appendChild(input);
      container.appendChild(errorTooltip);

      // Show popover on focus
      input.addEventListener('focus', () => {
        const errors = this.cellErrors[rowData.index]?.[key];
        if (errors) {
          errorTooltip.innerHTML = errors.split('; ').map(err => `<div>${err}</div>`).join('');
          errorTooltip.style.display = 'block';
        }
      });

      // Hide popover on blur
      input.addEventListener('blur', () => {
        errorTooltip.style.display = 'none';
      });

      root.appendChild(container);
    }
  }

  /**
   * Handles excluding a row when the trash can button is clicked.
   */
  private handleExclude(rowIndex: number) {
    this.dispatchEvent(new CustomEvent('row-exclude', {
      detail: { rowIndex },
      bubbles: true,
      composed: true,
    }));
  }

  /**
   * Updates cell errors based on validation.
   */
  public updateCellErrors(errors: Record<number, Record<string, string>>) {
    this.cellErrors = errors;
    this.requestUpdate();
  }
}
