import { html } from 'lit-html';
import '../../dist/index'; // Import your Lit component
import { ValidateSchema } from '../../dist/index';

export default {
  title: 'Sheetstorm Import Modal',
  component: 'sheetstorm-modal',
};

const schema: ValidateSchema<{
  name: string;
  email: string;
}> = {
  name: {
    label: 'Name',
    type: 'string',
    valid: (value) => {
      if (value.length === 0) {
        return {
          isValid: false,
          message: 'Name is required',
        };
      }
      return {
        isValid: true
      };
    },
  },
  email: {
    label: 'Email',
    type: 'string',
    valid: (value) => {
      if (value.length === 0) {
        return {
          isValid: false,
          message: 'Email is required',
        };
      }
      if (!value.includes('@')) {
        return {
          isValid: false,
          message: 'Email is invalid',
        };
      }
      return {
        isValid: true,
      };
    },
  },
};

export const Default = () => html`<sheetstorm-modal open="true" .schema=${schema}></sheetstorm-modal>`;
