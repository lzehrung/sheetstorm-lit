/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ValidateSchema } from '../../validations';
import '@vaadin/grid';

@customElement('data-grid-component')
export class DataGridComponent extends LitElement {
  @property({ type: Array }) data: Record<string, string>[] = [];
  @property({ type: Object }) schema!: ValidateSchema;

  @state() private cellErrors: Record<number, Record<string, string>> = {};

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
    }
    input[type='text'].error {
      border-color: red;
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
      top: -5px;
      right: -5px;
    }
    .cell-container {
      position: relative;
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

      const rowIndex = rowData.index;
      const error = this.cellErrors[rowIndex]?.[key];
      if (error) {
        input.classList.add('error');
      }

      input.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.dispatchEvent(new CustomEvent('cell-edit', {
          detail: {
            rowIndex: rowIndex,
            key: key,
            value: target.value,
          },
          bubbles: true,
          composed: true,
        }));
      });

      container.appendChild(input);

      if (error) {
        const errorTooltip = document.createElement('div');
        errorTooltip.classList.add('popover');
        errorTooltip.textContent = error;
        container.appendChild(errorTooltip);
      }

      root.appendChild(container);
    }
  }

  /**
   * Updates cell errors based on validation.
   */
  public updateCellErrors(errors: Record<number, Record<string, string>>) {
    this.cellErrors = errors;
    this.requestUpdate();
  }
}
