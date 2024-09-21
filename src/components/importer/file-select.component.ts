import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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

  /**
   * Handles file input change event.
   */
  private async handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.loading = true;

    try {
      const data = await this.parseCSV(file);
      this.dispatchEvent(new CustomEvent('file-parsed', { detail: data }));
    } catch (error) {
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    } finally {
      this.loading = false;
    }
  }

  /**
   * Parses a CSV file into a 2D string array.
   */
  private async parseCSV(file: File): Promise<string[][]> {
    const text = await file.text();
    const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    return rows;
  }

  render() {
    return html`
      <input type="file" accept=".csv" @change="${this.handleFileChange}" />
      ${this.loading ? html`<p>Loading...</p>` : ''}
    `;
  }
}
