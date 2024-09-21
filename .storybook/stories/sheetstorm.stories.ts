/* eslint-disable @typescript-eslint/no-unused-vars */
import { html, TemplateResult } from 'lit';
import { LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../dist/index'; // Import your Lit components
import { ValidateSchema } from '../../src/validations';

export default {
  title: 'Sheetstorm Import',
  component: 'sheetstorm-import',
};

const schema: ValidateSchema = {
  name: {
    label: 'Name',
    type: 'string',
    validators: [
      (value: string) => ({
        isValid: value.trim().length > 0,
        message: 'Name is required',
      }),
    ],
  },
  email: {
    label: 'Email',
    type: 'string',
    validators: [
      (value: string) => ({
        isValid: value.trim().length > 0,
        message: 'Email is required',
      }),
      (value: string) => ({
        isValid: value.includes('@'),
        message: 'Email must contain "@" symbol',
      }),
    ],
  },
};

@customElement('with-modal-wrapper')
class WithModalWrapper extends LitElement {
  @state()
  private open = false;

  private handleOpenClick() {
    this.open = true;
  }

  private handleSuccess(event: CustomEvent) {
    console.log('Data imported successfully:', event.detail);
    this.open = false;
  }

  render(): TemplateResult {
    return html`
      <button @click="${this.handleOpenClick}" style="margin-bottom: 16px;">
        Open Sheetstorm Modal
      </button>
      <sheetstorm-modal
        .open="${this.open}"
        .schema="${schema}"
        @data-import-success="${this.handleSuccess}"
      ></sheetstorm-modal>
    `;
  }
}

export const Default = (): TemplateResult =>
  html`<sheetstorm-import .schema=${schema}></sheetstorm-import>`;

export const WithModal = (): TemplateResult =>
  html`<with-modal-wrapper></with-modal-wrapper>`;
