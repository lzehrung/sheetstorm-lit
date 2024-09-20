import { html } from 'lit-html';
import '../../dist/index'; // Import your Lit component
import { ValidateSchema } from '../../src/validations';

export default {
  title: 'Sheetstorm Import Modal',
  component: 'sheetstorm-modal',
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

export const Default = () => html`<sheetstorm-modal open="true" .schema=${schema}></sheetstorm-modal>`;
