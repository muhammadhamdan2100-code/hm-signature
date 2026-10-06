/**
 * Phase 9 report exports: CSV and XLSX, generated in the browser from the rows
 * the caller was already authorised to read.
 *
 * The report payload describes its own columns, so an export can never carry a
 * field the screen did not show — and the columns that leave this file are the
 * columns `report_*` selects, which exclude provider references, payment
 * identifiers and proof links by construction. Numbers are written as raw
 * values, not formatted strings, so a spreadsheet can still add them up; the
 * locale and currency belong to the screen, not to the file.
 *
 * XLSX is a ZIP of XML parts. Rather than add a spreadsheet dependency for one
 * button, this writes the five parts a workbook needs and stores them with no
 * compression, which is a valid (and simple) ZIP. `tests/phase9-export.test.ts`
 * reads the archive back and checks every CRC.
 */

import type { AdminReportPayload } from "../services/businessIntelligence";

export interface ExportContext {
  /** Localised column header for a column's `label_key`. */
  label: (key: string) => string;
  /** Section title, already translated. */
  title: string;
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV_MIME = "text/csv;charset=utf-8";

function valueText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** True when a column should be written as a number rather than as text. */
function numericColumn(kind: string): boolean {
  return kind === "money" || kind === "number" || kind === "count" || kind === "percent";
}

export function csvFromReport(report: AdminReportPayload, ctx: ExportContext): string {
  const escape = (text: string): string => {
    // A leading =, +, - or @ turns a cell into a formula in Excel. Reports carry
    // customer-supplied text, so the guard belongs here.
    const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
  };

  const header = report.columns.map((c) => escape(ctx.label(c.label_key))).join(",");
  const lines = report.rows.map((row) =>
    report.columns.map((c) => escape(valueText(row[c.key]))).join(",")
  );
  // A BOM is what makes Excel open a UTF-8 CSV as UTF-8 rather than as Latin-1,
  // which matters most for the Arabic and Urdu rows.
  return `${["﻿" + header, ...lines].join("\r\n")}\r\n`;
}

// ---------------------------------------------------------------------------
// Minimal ZIP writer (stored entries only).
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
  offset: number;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const y = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((y - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function zipStore(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(new Date());
  const chunks: Uint8Array[] = [];
  let size = 0;

  const push = (bytes: Uint8Array) => {
    chunks.push(bytes);
    size += bytes.length;
  };
  const header = (extra: number[]) => {
    const buf = new Uint8Array(extra.length);
    buf.set(extra.map((b) => b & 0xff));
    return buf;
  };
  const u16 = (v: number) => [(v & 0xff), ((v >>> 8) & 0xff)];
  const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    entry.offset = size;
    push(header([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0),
      ...u16(time), ...u16(date),
      ...u32(crc), ...u32(entry.data.length), ...u32(entry.data.length),
      ...u16(name.length), ...u16(0),
    ]));
    push(name);
    push(entry.data);
  }

  const centralStart = size;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    push(header([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0),
      ...u16(time), ...u16(date),
      ...u32(crc), ...u32(entry.data.length), ...u32(entry.data.length),
      ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(entry.offset),
    ]));
    push(name);
  }
  const centralSize = size - centralStart;

  push(header([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(centralStart), ...u16(0),
  ]));

  const out = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// SpreadsheetML parts.
// ---------------------------------------------------------------------------

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Control characters are illegal in XML 1.0 even when escaped.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

function columnName(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function cell(ref: string, value: unknown, numeric: boolean): string {
  if (value === null || value === undefined || value === "") return `<c r="${ref}"/>`;
  if (numeric) {
    const n = numberOrNull(value);
    if (n !== null) return `<c r="${ref}"><v>${n}</v></c>`;
  }
  if (typeof value === "boolean") {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(valueText(value))}</t></is></c>`;
}

function sheetXml(rows: (string | number | boolean | null)[][]): string {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) =>
          cell(`${columnName(colIndex)}${rowIndex + 1}`, value, numericOnly(value))
        )
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + `<sheetData>${body}</sheetData></worksheet>`;
}

function numericOnly(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
  + `<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>`
  + `<fills count="1"><fill><patternFill patternType="none"/></fill></fills>`
  + `<borders count="1"><border/></borders>`
  + `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
  + `<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>`
  + `</styleSheet>`;

function workbookXml(sheetNames: string[]): string {
  const sheets = sheetNames
    .map((name, i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"`
    + ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<sheets>${sheets}</sheets></workbook>`;
}

function workbookRels(sheetCount: number): string {
  const rels = Array.from({ length: sheetCount }, (_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  ).join("");
  const styleId = sheetCount + 1;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + `${rels}`
    + `<Relationship Id="rId${styleId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
    + `</Relationships>`;
}

function contentTypes(sheetCount: number): string {
  const overrides = Array.from({ length: sheetCount }, (_, i) =>
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
    + `<Default Extension="xml" ContentType="application/xml"/>`
    + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`
    + overrides
    + `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`
    + `</Types>`;
}

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`
  + `</Relationships>`;

function safeSheetName(name: string): string {
  // Excel forbids []:*?/\ in a tab name and caps it at 31 characters.
  return (name.replace(/[[\]:*?/\\]/g, " ").trim() || "Report").slice(0, 31);
}

/** Build a real .xlsx workbook: the requested rows, plus a Details tab. */
export function xlsxFromReport(report: AdminReportPayload, ctx: ExportContext, meta: string[][]): Uint8Array {
  const encoder = new TextEncoder();
  const dataRows = report.rows.map((row) =>
    report.columns.map((c) => {
      const value = row[c.key];
      if (numericColumn(c.kind) && typeof value === "number") return value;
      if (typeof value === "boolean") return value;
      return valueText(value);
    })
  );
  const main = [report.columns.map((c) => ctx.label(c.label_key)), ...dataRows];
  const details = [["Field", "Value"], ...meta];

  const sheetNames = [safeSheetName(ctx.title), safeSheetName("Details")];
  const parts: [string, string][] = [
    ["[Content_Types].xml", contentTypes(sheetNames.length)],
    ["_rels/.rels", ROOT_RELS],
    ["xl/workbook.xml", workbookXml(sheetNames)],
    ["xl/_rels/workbook.xml.rels", workbookRels(sheetNames.length)],
    ["xl/styles.xml", STYLES_XML],
    ["xl/worksheets/sheet1.xml", sheetXml(main)],
    ["xl/worksheets/sheet2.xml", sheetXml(details)],
  ];

  return zipStore(
    parts.map(([name, xml], index) => ({
      name,
      data: encoder.encode(xml),
      offset: index,
    }))
  );
}

// ---------------------------------------------------------------------------
// Filenames and the one DOM-touching helper.
// ---------------------------------------------------------------------------

export function exportFileName(section: string, filters: { from?: string | null; to?: string | null }, ext: "csv" | "xlsx"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const window = filters.from ? `${filters.from}_${filters.to || stamp}` : stamp;
  return `hm-${section}-${window}.${ext}`;
}

export function downloadFile(fileName: string, mime: string, data: Uint8Array | string): void {
  if (typeof document === "undefined") return;
  const body = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const buffer = new ArrayBuffer(body.byteLength);
  new Uint8Array(buffer).set(body);
  const url = URL.createObjectURL(new Blob([buffer], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoked on the next tick so the download has taken the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(report: AdminReportPayload, ctx: ExportContext, fileName: string): void {
  downloadFile(fileName, CSV_MIME, csvFromReport(report, ctx));
}

export function downloadXlsx(
  report: AdminReportPayload,
  ctx: ExportContext,
  meta: string[][],
  fileName: string
): void {
  downloadFile(fileName, XLSX_MIME, xlsxFromReport(report, ctx, meta));
}

export { numericColumn };
