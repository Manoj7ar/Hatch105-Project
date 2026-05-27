import { parse } from "csv-parse/sync";
import { ThesisSchema, type Thesis } from "./types";

export function parseThesesJson(raw: string): Thesis[] {
  const data = JSON.parse(raw);
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((t) => ThesisSchema.parse(t));
}

export function parseThesesCsv(raw: string): Thesis[] {
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return records.map((row) =>
    ThesisSchema.parse({
      ref: row.ref,
      title: row.title,
      one_liner: row.one_liner,
      example_customer: row.example_customer,
      wedge: row.wedge,
    })
  );
}

export function parseThesesInput(
  raw: string,
  format: "json" | "csv" | "auto"
): Thesis[] {
  const trimmed = raw.trim();
  if (format === "json" || (format === "auto" && trimmed.startsWith("["))) {
    return parseThesesJson(trimmed);
  }
  return parseThesesCsv(trimmed);
}
