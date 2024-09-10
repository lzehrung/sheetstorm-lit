import type XLSXType from 'xlsx';
import type PapaType from 'papaparse';
declare global {
  interface Window {
    XLSX: typeof XLSXType;
    Papa: typeof PapaType;
  }
}

export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = window.XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = window.XLSX.utils.sheet_to_json(worksheet);
      resolve(jsonData);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseCsvFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    window.Papa.parse(file, {
      header: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
}
