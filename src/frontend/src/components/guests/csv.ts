import type { ColumnMapping } from "@/backend";

/** Minimal RFC-4180 style parser: handles quotes, escaped quotes and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

export type MappingField = keyof ColumnMapping;

export const MAPPING_FIELDS: MappingField[] = [
  "name",
  "phone",
  "email",
  "tags",
  "allergies",
  "preferences",
  "notes",
  "vip",
  "marketingOptIn",
];

const HEADER_HINTS: Record<MappingField, string[]> = {
  name: ["name", "nom", "guest", "client", "full name", "nom complet"],
  phone: ["phone", "téléphone", "telephone", "tel", "mobile", "portable"],
  email: ["email", "e-mail", "mail", "courriel"],
  tags: ["tags", "étiquettes", "etiquettes", "labels"],
  allergies: ["allergies", "allergie", "allergy"],
  preferences: ["preferences", "préférences", "prefs"],
  notes: ["notes", "note", "commentaire", "comments"],
  vip: ["vip"],
  marketingOptIn: ["opt-in", "optin", "marketing", "consent", "consentement"],
};

/** Guess a column index per field from the header row, when present. */
export function guessMapping(
  header: string[],
): Partial<Record<MappingField, number>> {
  const guess: Partial<Record<MappingField, number>> = {};
  header.forEach((cell, index) => {
    const normalized = cell.trim().toLowerCase();
    for (const field of MAPPING_FIELDS) {
      if (guess[field] !== undefined) continue;
      if (HEADER_HINTS[field].some((hint) => normalized === hint)) {
        guess[field] = index;
      }
    }
  });
  return guess;
}

/** Build the backend `ColumnMapping` from the per-field column selections. */
export function buildColumnMapping(
  selection: Partial<Record<MappingField, number>>,
): ColumnMapping | null {
  if (selection.name === undefined || selection.phone === undefined) {
    return null;
  }
  const mapping: ColumnMapping = {
    name: BigInt(selection.name),
    phone: BigInt(selection.phone),
  };
  for (const field of MAPPING_FIELDS) {
    if (field === "name" || field === "phone") continue;
    const index = selection[field];
    if (index !== undefined) {
      mapping[field] = BigInt(index);
    }
  }
  return mapping;
}

/** Trigger a browser download for generated text content. */
export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
