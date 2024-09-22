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
      position: relative;
      z-index: 1;
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
      display: none;
      pointer-events: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
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
      z-index: 1;
    }
  `;

  private currentPopover: HTMLElement | null = null;
  private currentInput: HTMLInputElement | null = null;
  private resizeTimeout: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this.handleWindowResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleWindowResize);
    super.disconnectedCallback();
  }

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
        <!-- Exclude Column with Renderer -->
        <vaadin-grid-column header="Exclude" flex-grow="0" width="50px"
          .renderer="${this.excludeRenderer}">
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

      // Show popover on focus with dynamic positioning
      input.addEventListener('focus', (e: Event) => {
        const errors = this.cellErrors[rowData.index]?.[key];
        if (errors) {
          this.showErrorsPopover((e.target as HTMLInputElement), errors);
        }
      });

      // Hide popover on blur
      input.addEventListener('blur', () => {
        this.hidePopover();
      });

      container.appendChild(input);

      root.appendChild(container);
    }
  }

  /**
   * Creates and displays the popover.
   */
  private showErrorsPopover(input: HTMLInputElement, errors: string) {
    this.hidePopover(); // Ensure only one popover is visible
    this.currentInput = input;

    // Create popover element
    const popover = document.createElement('div');
    popover.setAttribute('role', 'alert');
    popover.setAttribute('aria-live', 'assertive');
    popover.innerHTML = errors.split('; ').map(err => `<div>${err}</div>`).join('');

    // Apply inline styles
    popover.style.position = 'fixed';
    popover.style.background = 'rgba(255, 0, 0, 0.9)';
    popover.style.color = 'white';
    popover.style.padding = '8px 12px';
    popover.style.borderRadius = '4px';
    popover.style.fontSize = '12px';
    popover.style.whiteSpace = 'nowrap';
    popover.style.zIndex = '10000';
    popover.style.display = 'block';
    popover.style.pointerEvents = 'none';
    popover.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    document.body.appendChild(popover);

    // Position the popover
    this.positionPopover(input, popover);

    this.currentPopover = popover;
  }

  /**
   * Hides and removes the current popover.
   */
  public hidePopover() {
    if (this.currentPopover) {
      this.currentPopover.remove();
      this.currentPopover = null;
      this.currentInput = null;
    }
  }

  /**
   * Positions the popover dynamically based on available space.
   */
  private positionPopover(input: HTMLInputElement, popover: HTMLElement) {
    const inputRect = input.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Determine vertical position
    let top: number;
    if (inputRect.bottom + popoverRect.height + 8 < viewportHeight) {
      // Pop down
      top = inputRect.bottom + 4; // 4px gap
    } else if (inputRect.top - popoverRect.height - 8 > 0) {
      // Pop up
      top = inputRect.top - popoverRect.height - 4; // 4px gap
    } else {
      // Default to pop down
      top = inputRect.bottom + 4;
    }

    // Determine horizontal position
    let left: number;
    if (inputRect.left + popoverRect.width > viewportWidth) {
      // Align to right
      left = viewportWidth - popoverRect.width - 8; // 8px from edge
    } else {
      // Align to left
      left = inputRect.left;
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  /**
   * Handles window resize events to reposition the popover.
   */
  private handleWindowResize = () => {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = window.setTimeout(() => {
      if (this.currentPopover && this.currentInput) {
        this.positionPopover(this.currentInput, this.currentPopover);
      }
      this.resizeTimeout = null;
    }, 100); // Adjust the debounce delay as needed
  }

  /**
   * Renderer for the Exclude button column.
   */
  private excludeRenderer = (root: HTMLElement, column: any, rowData: any) => {
    // Clear previous content
    root.innerHTML = '';

    // Create button
    const button = document.createElement('button');
    button.className = 'exclude-button';
    button.title = 'Exclude Row';
    button.textContent = '🗑️';

    // Add click event listener
    button.addEventListener('click', () => this.handleExclude(rowData.index));

    // Append button to root
    root.appendChild(button);
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
