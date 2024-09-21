/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './main.component'; // Ensure this path is correct based on your project structure
import { ValidateSchema } from './validations';

@customElement('sheetstorm')
export class SheetstormModal extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Object, attribute: 'schema' }) schema!: ValidateSchema;

  static styles = css`
    /* Modal styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 5px;
      width: 80%;
      max-height: 90%;
      overflow-y: auto;
      position: relative;
    }
    .close {
      position: absolute;
      top: 10px;
      right: 20px;
      cursor: pointer;
      font-size: 1.5em;
    }
  `;

  /**
   * Renders the modal with the Sheetstorm component inside.
   *
   * @returns The modal template.
   */
  render() {
    return html`
      ${this.open
        ? html`
            <div class="modal" @click="${this.handleBackdropClick}">
              <div class="modal-content" @click="${this.stopPropagation}">
                <span class="close" @click="${this.closeModal}">&times;</span>
                <sheetstorm
                  .schema="${this.schema}"
                  @data-import-success="${this.handleSuccess}"
                ></sheetstorm>
              </div>
            </div>
          `
        : ''}
    `;
  }

  /**
   * Closes the modal.
   */
  private closeModal() {
    this.open = false;
  }

  /**
   * Prevents modal from closing when clicking inside the content.
   *
   * @param e - The click event.
   */
  private stopPropagation(e: Event) {
    e.stopPropagation();
  }

  /**
   * Handles clicking on the backdrop to close the modal.
   *
   * @param e - The click event.
   */
  private handleBackdropClick(e: Event) {
    this.closeModal();
  }

  /**
   * Handles the success event from the Sheetstorm component.
   *
   * @param e - The custom event containing the transformed data.
   */
  private handleSuccess(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('data-import-success', { detail: e.detail }));
    this.closeModal();
  }
}
