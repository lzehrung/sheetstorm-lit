/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { parseCsvFile, parseExcelFile } from '../../data-parser';

@customElement('file-select-component')
export class FileSelectComponent extends LitElement {
  @property({ type: Boolean }) private loading = false;

  static styles = css`
    /* Styles for file select */
    input[type="file"] {
      display: block;
      margin-bottom: 16px;
    }
    button {
      padding: 8px 16px;
    }
  `;

  private async handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      try {
        let data: string[][];
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          data = await parseExcelFile(file);
        } else if (file.type === 'text/csv') {
          data = await parseCsvFile(file);
        } else {
          throw new Error('Unsupported file type');
        }

        const parsedData = data.map(row => row.map(cell => cell.trim()));
        this.dispatchEvent(new CustomEvent('file-parsed', { detail: parsedData }));
      } catch (error: any) {
        this.dispatchEvent(new CustomEvent('error', { detail: error.message }));
      }
    }
  }

  render() {
    return html`
      <input type="file" accept=".csv,.xlsx,.xls" @change="${this.handleFileChange}" />
      ${this.loading ? html`<p>Loading...</p>` : ''}
    `;
  }
}
