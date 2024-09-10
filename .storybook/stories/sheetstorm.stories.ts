import { html } from 'lit-html';
import '../../dist/index'; // Import your Lit component

export default {
  title: 'Sheetstorm Import Modal',
  component: 'sheetstorm-modal',
};

export const Default = () => html`<sheetstorm-modal open="true"></sheetstorm-modal>`;
