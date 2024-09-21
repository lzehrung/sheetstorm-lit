/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseExcelFile, parseCsvFile } from '../data-parser'; // Correct import path

@customElement('file-select-component')
export class FileSelectComponent extends LitElement {
  static styles = css`
    .file-input {
      margin: 20px 0;
    }
    .error {
      color: red;
    }
  `;

  @state()
  private parsedData: string[][] = [];

  render() {
    return html`
      <div class="file-input">
        <input type="file" @change="${this.handleFileSelect}" accept=".csv, .xlsx" />
      </div>
      ${this.parsedData.length > 0
        ? html`<p>File loaded successfully. Proceed to map columns.</p>`
        : ''}
    `;
  }

  private async handleFileSelect(event: Event) {
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

        this.parsedData = data.map(row => row.map(cell => cell.trim()));
        this.dispatchEvent(new CustomEvent('file-parsed', { detail: this.parsedData }));
      } catch (error: any) {
        this.dispatchEvent(new CustomEvent('error', { detail: error.message }));
      }
    }
  }
}
