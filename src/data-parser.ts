declare global {
  interface Window {
    XLSX: typeof import('xlsx');
    Papa: typeof import('papaparse');
  }
}

/**
 * Parses an Excel file and returns a two-dimensional array of strings.
 *
 * @param file - The Excel file to parse.
 * @param hasHeaders - Whether the first row contains headers.
 * @returns A promise that resolves to a 2D array of strings.
 */
export async function parseExcelFile(file: File, hasHeaders: boolean): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonData: any[] = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (hasHeaders) {
          jsonData.shift(); // Remove the header row
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stringData: string[][] = jsonData.map(row => row.map((cell: any) => cell?.toString() || ''));

        resolve(stringData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses a CSV file and returns a two-dimensional array of strings.
 *
 * @param file - The CSV file to parse.
 * @param hasHeaders - Whether the first row contains headers.
 * @returns A promise that resolves to a 2D array of strings.
 */
export async function parseCsvFile(file: File, hasHeaders: boolean): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    window.Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data: string[][] = results.data as string[][];

        if (hasHeaders) {
          data.shift(); // Remove the header row
        }

        resolve(data);
      },
      error: (error) => reject(error),
    });
  });
}
