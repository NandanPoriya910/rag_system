// Structured records (CSV / JSON rows) → one retrievable chunk per row, with row-level ACL.
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { normalizeText } from './chunker.js';

export function readRows(filePath, ext) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (ext === '.csv') {
    return parse(raw, { columns: true, skip_empty_lines: true, bom: true, trim: true, relax_column_count: true });
  }
  const json = JSON.parse(raw);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json?.records)) return json.records;
  throw new Error('JSON must be an array of objects (or {"rows":[…]}).');
}

export function rowToText(table, rowIndex, row) {
  const fields = Object.entries(row)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('; ');
  return normalizeText(`Record from table "${table}", row ${rowIndex}. ${fields}`);
}
