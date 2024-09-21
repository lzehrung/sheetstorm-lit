/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './importer/index';
import { ValidateSchema } from '../validations';

@customElement('sheetstorm-modal')
export class SheetstormModal extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Object, attribute: 'schema' })
  schema!: ValidateSchema;

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
                <sheetstorm-import
                  .schema="${this.schema}"
                  @data-import-success="${this.handleSuccess}"
                ></sheetstorm-import>
              </div>
            </div>
          `
        : ''}
    `;
  }

  /**
   * Closes the modal by emitting a 'close' event.
   */
  private closeModal() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
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
   * Handles clicking on the backdrop by emitting a 'backdrop-click' event.
   *
   * @param e - The click event.
   */
  private handleBackdropClick(e: Event) {
    this.dispatchEvent(new CustomEvent('backdrop-click', { bubbles: true, composed: true }));
  }

  /**
   * Handles the success event from the Sheetstorm component.
   *
   * @param e - The custom event containing the transformed data.
   */
  private handleSuccess(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('data-import-success', { detail: e.detail, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }
}
