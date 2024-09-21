import { html, TemplateResult } from 'lit';
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

export const Default = (): TemplateResult =>
  html`<sheetstorm-import .schema=${schema}></sheetstorm-import>`;

export const WithModal = (): TemplateResult => {
  let open = false;

  const handleOpenClick = () => {
    open = true;
  };

  const handleSuccess = (event: CustomEvent) => {
    console.log('Data imported successfully:', event.detail);
    open = false;
  };

  return html`
    <button @click="${handleOpenClick}" style="margin-bottom: 16px;">
      Open Sheetstorm Modal
    </button>
    <sheetstorm-modal
      .open="${open}"
      .schema="${schema}"
      @data-import-success="${handleSuccess}"
    ></sheetstorm-modal>
  `;
};
