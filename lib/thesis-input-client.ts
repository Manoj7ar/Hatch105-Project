import { parse } from "csv-parse/sync";
import { ThesisSchema, type Thesis } from "./types";

export type InputFormat = "json" | "csv" | "auto";

export type ThesisPreviewResult =
  | { ok: true; theses: Thesis[]; format: "json" | "csv" }
  | { ok: false; errors: string[] };

function detectFormat(raw: string, format: InputFormat): "json" | "csv" {
  const trimmed = raw.trim();
  if (format === "json") return "json";
  if (format === "csv") return "csv";
  return trimmed.startsWith("[") || trimmed.startsWith("{") ? "json" : "csv";
}

export function previewThesesInput(
  raw: string,
  format: InputFormat = "auto"
): ThesisPreviewResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, errors: ["Paste JSON or CSV thesis data to continue."] };
  }

  const resolved = detectFormat(trimmed, format);

  try {
    if (resolved === "json") {
      const data = JSON.parse(trimmed);
      const arr = Array.isArray(data) ? data : [data];
      const theses: Thesis[] = [];
      const errors: string[] = [];
      arr.forEach((row, i) => {
        const parsed = ThesisSchema.safeParse(row);
        if (parsed.success) theses.push(parsed.data);
        else {
          errors.push(
            `Row ${i + 1}: ${parsed.error.issues.map((x) => x.message).join(", ")}`
          );
        }
      });
      if (errors.length) return { ok: false, errors };
      if (theses.length === 0) {
        return { ok: false, errors: ["JSON array is empty."] };
      }
      return { ok: true, theses, format: "json" };
    }

    const records = parse(trimmed, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const theses: Thesis[] = [];
    const errors: string[] = [];
    records.forEach((row, i) => {
      const parsed = ThesisSchema.safeParse({
        ref: row.ref,
        title: row.title,
        one_liner: row.one_liner,
        example_customer: row.example_customer,
        wedge: row.wedge,
      });
      if (parsed.success) theses.push(parsed.data);
      else {
        errors.push(
          `Row ${i + 2}: ${parsed.error.issues.map((x) => x.message).join(", ")}`
        );
      }
    });
    if (errors.length) return { ok: false, errors };
    if (theses.length === 0) {
      return { ok: false, errors: ["CSV has no data rows."] };
    }
    return { ok: true, theses, format: "csv" };
  } catch (e) {
    return {
      ok: false,
      errors: [e instanceof Error ? e.message : "Could not parse input"],
    };
  }
}

export const THESIS_JSON_EXAMPLE = `[
  {
    "ref": "H-51",
    "title": "TrackReply",
    "one_liner": "WISMO deflection for Shopify support teams.",
    "example_customer": "DTC brands on Shopify App Store",
    "wedge": "Per-ticket savings vs Gorgias — App Store distribution"
  }
]`;

export const THESIS_CSV_HEADER =
  "ref,title,one_liner,example_customer,wedge";
