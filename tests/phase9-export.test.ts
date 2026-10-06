import { describe, expect, it } from "vitest";
import { crc32 as nodeCrc32 } from "node:zlib";
import { csvFromReport, xlsxFromReport, exportFileName, type ExportContext } from "../src/lib/reportExport";
import type { AdminReportPayload } from "../src/services/businessIntelligence";

/**
 * Phase 9 exports.
 *
 * A spreadsheet is a ZIP of XML parts, and a ZIP is only openable if every
 * entry's CRC and every offset in the central directory is right — so this reads
 * the produced archive back and checks it byte for byte rather than trusting
 * that "it looked like a file". The CSV half matters just as much: a report
 * column can contain a customer's own text, and text that starts with "=" is a
 * formula the moment Excel opens it.
 */

const report = (over: Partial<AdminReportPayload> = {}): AdminReportPayload => ({
  section: "sales",
  scope: "business",
  currency: "PKR",
  from_date: "2026-10-01",
  to_date: "2026-10-31",
  country: null,
  columns: [
    { key: "period", label_key: "period", kind: "text" },
    { key: "orders", label_key: "orders", kind: "count" },
    { key: "gross", label_key: "gross", kind: "money" },
    { key: "repeat", label_key: "repeat_buyer", kind: "boolean" },
    { key: "note", label_key: "customer", kind: "text" },
  ],
  rows: [
    { period: "2026-10-02", orders: 3, gross: 9150, repeat: true, note: "Oud & Amber" },
    { period: "2026-10-03", orders: 1, gross: 3050, repeat: false, note: '=HYPERLINK("http://evil")' },
    { period: "2026-10-04", orders: 0, gross: null, repeat: null, note: 'said "hello", then\nleft' },
  ],
  data_status: "actual",
  note: null,
  ...over,
});

const context: ExportContext = {
  label: (key) => ({ period: "Date", orders: "Orders", gross: "Gross", repeat_buyer: "Repeat", customer: "Customer" }[key] || key),
  title: "Sales",
};

describe("CSV export", () => {
  const csv = csvFromReport(report(), context);
  const lines = (csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv).split("\r\n");

  it("starts with a byte-order mark so Excel reads UTF-8", () => {
    const bytes = new TextEncoder().encode(csvFromReport(report(), context));
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("uses the translated headers, not the raw column keys", () => {
    expect(lines[0]).toBe("Date,Orders,Gross,Repeat,Customer");
  });

  it("quotes a field containing a comma, a quote or a newline and doubles the quotes", () => {
    expect(lines[3]).toContain('"said ""hello"", then');
    expect(lines[3]).toContain('left"');
  });

  it("neutralises a cell that Excel would otherwise run as a formula", () => {
    const guarded = lines.find((line) => line.includes("HYPERLINK"));
    expect(guarded, "the formula-looking row is missing").toBeTruthy();
    // The leading apostrophe stops Excel evaluating it; the quotes keep the CSV valid.
    expect(guarded).toContain('"\'=HYPERLINK(""http://evil"")"');
  });

  it("writes an empty cell for a null measure rather than a zero", () => {
    const zeroRow = lines[3];
    expect(zeroRow.endsWith(",,," ) || zeroRow.includes(",0,,")) .toBe(true);
    expect(zeroRow.split(",")[2]).toBe("");
  });

  it("names the file after the section and the window it was cut for", () => {
    expect(exportFileName("sales", { from: "2026-10-01", to: "2026-10-31" }, "csv")).toBe("hm-sales-2026-10-01_2026-10-31.csv");
    expect(exportFileName("payments", {}, "xlsx")).toMatch(/^hm-payments-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});

// A second ZIP reader, deliberately written without reusing the module's code.
function readZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  expect(eocd, "no end-of-directory record: not a readable archive").toBeGreaterThan(-1);
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries: { name: string; crc: number; size: number; local: number; text: string }[] = [];

  for (let i = 0; i < count; i += 1) {
    expect(view.getUint32(offset, true), "central directory signature broken").toBe(0x02014b50);
    const crc = view.getUint32(offset + 16, true);
    const size = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const local = view.getUint32(offset + 42, true);
    const name = dec.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    // Every entry must agree with its own local header, or a reader stops there.
    expect(view.getUint32(local, true), `${name}: local header signature broken`).toBe(0x04034b50);
    expect(view.getUint32(local + 14, true), `${name}: crc disagrees with local header`).toBe(crc);
    const localNameLength = view.getUint16(local + 26, true);
    const data = bytes.subarray(local + 30 + localNameLength, local + 30 + localNameLength + size);
    entries.push({ name, crc, size, local, text: dec.decode(data) });
    offset += 46 + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return entries;
}

describe("XLSX export", () => {
  const bytes = xlsxFromReport(report(), context, [["Currency", "PKR"], ["Rows", "3"]]);

  it("is a ZIP container, which is what an .xlsx has to be", () => {
    expect([...bytes.subarray(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("carries the parts a workbook reader looks for", () => {
    const names = readZip(bytes).map((e) => e.name);
    expect(names).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
      "xl/worksheets/sheet2.xml",
    ]);
  });

  it("stores a CRC that matches the bytes in every entry", () => {
    for (const entry of readZip(bytes)) {
      const payload = new Uint8Array(entry.size);
      const source = new TextEncoder().encode(entry.text);
      payload.set(source.subarray(0, payload.length));
      expect(entry.crc, `${entry.name} has a bad checksum`).toBe(nodeCrc32(payload) >>> 0);
    }
  });

  it("writes the header row in the requested language", () => {
    const sheet = readZip(bytes).find((e) => e.name === "xl/worksheets/sheet1.xml");
    expect(sheet?.text).toContain("<t xml:space=\"preserve\">Date</t>");
    expect(sheet?.text).toContain("<t xml:space=\"preserve\">Repeat</t>");
  });

  it("keeps money as a number so a spreadsheet can total it", () => {
    const sheet = readZip(bytes).find((e) => e.name === "xl/worksheets/sheet1.xml");
    expect(sheet?.text).toContain("<c r=\"C2\"><v>9150</v></c>");
  });

  it("escapes markup in a customer's own text instead of corrupting the sheet", () => {
    const sheet = readZip(bytes).find((e) => e.name === "xl/worksheets/sheet1.xml");
    expect(sheet?.text).toContain("Oud &amp; Amber");
    // A raw ampersand or an unclosed tag would make Excel refuse the whole file.
    expect(sheet?.text).not.toContain("&Amber");
  });

  it("puts the run parameters on a second tab so the data tab stays machine-readable", () => {
    const details = readZip(bytes).find((e) => e.name === "xl/worksheets/sheet2.xml");
    expect(details?.text).toContain("<t xml:space=\"preserve\">Currency</t>");
    expect(details?.text).toContain("<t xml:space=\"preserve\">PKR</t>");
    const workbook = readZip(bytes).find((e) => e.name === "xl/workbook.xml");
    expect(workbook?.text).toContain('name="Sales"');
    expect(workbook?.text).toContain('name="Details"');
  });

  it("survives a report with no rows", () => {
    const empty = xlsxFromReport(report({ rows: [] }), context, [["Rows", "0"]]);
    expect(readZip(empty).length).toBe(7);
  });
});
