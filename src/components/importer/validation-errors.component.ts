import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ValidateResult } from '../../validations';

@customElement('validation-errors-component')
export class ValidationErrorsComponent extends LitElement {
  @property({ type: Array }) validationResults: ValidateResult[] = [];

  static styles = css`
    ul {
      color: red;
    }
    li {
      margin-bottom: 8px;
    }
  `;

  render() {
    if (this.validationResults.length === 0) {
      return html`<p>No validation errors detected.</p>`;
    }

    return html`
      <h3>Validation Errors:</h3>
      <ul>
        ${this.validationResults.map(result => html`
          <li>
            Row ${result.rowIndex + 1}:
            <ul>
              ${result.errors.map(err => html`<li>${err.key}: ${err.message}</li>`)}
            </ul>
          </li>
        `)}
      </ul>
    `;
  }
}
