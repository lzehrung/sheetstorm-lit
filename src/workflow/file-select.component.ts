/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { parseExcelFile, parseCsvFile } from '../data-parser';

@customElement('file-select-component')
export class FileSelectComponent extends LitElement {
  @state()
  private parsedData: any[] = [];

  static styles = css`
    .file-input {
      margin: 20px 0;
    }
    .error {
      color: red;
    }
  `;

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
        let data: any[];
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          data = await parseExcelFile(file);
        } else if (file.type === 'text/csv') {
          data = await parseCsvFile(file);
        } else {
          throw new Error('Unsupported file type');
        }
        // Key objects with column index
        this.parsedData = data.map((row) => {
          const keyedRow: any = {};
          Object.keys(row).forEach((key, colIndex) => {
            keyedRow[`column_${colIndex}`] = row[key];
          });
          return keyedRow;
        });
        this.dispatchEvent(new CustomEvent('file-parsed', { detail: this.parsedData }));
      } catch (error: any) {
        this.dispatchEvent(new CustomEvent('error', { detail: error.message }));
      }
    }
  }
}
