import type { ColumnMapping } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useRef, useState } from "react";
import {
  MAPPING_FIELDS,
  type MappingField,
  buildColumnMapping,
  guessMapping,
  parseCsv,
} from "./csv";
import { type GuestTextKey, useGuestText } from "./guestText";

const FIELD_LABEL: Record<
  MappingField,
  Parameters<ReturnType<typeof useGuestText>>[0]
> = {
  name: "guests.import.field.name",
  phone: "guests.import.field.phone",
  email: "guests.import.field.email",
  tags: "guests.import.field.tags",
  allergies: "guests.import.field.allergies",
  preferences: "guests.import.field.preferences",
  notes: "guests.import.field.notes",
  vip: "guests.import.field.vip",
  marketingOptIn: "guests.import.field.marketingOptIn",
};

const IGNORE = "ignore";

export function CsvImportDialog({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (csv: string, mapping: ColumnMapping) => void;
}) {
  const t = useGuestText();
  const fileRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState("");
  const [selection, setSelection] = useState<
    Partial<Record<MappingField, number>>
  >({});
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => parseCsv(raw), [raw]);
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);
  const columnCount = header.length;
  const columnIds = useMemo(
    () => header.map((cell, index) => `col-${index}-${cell.trim()}`),
    [header],
  );
  const previewRows = useMemo(
    () =>
      dataRows.slice(0, 4).map((row, index) => ({
        id: `preview-${index}-${row.join("|")}`,
        cells: row,
      })),
    [dataRows],
  );

  const handleRaw = (text: string) => {
    setRaw(text);
    const parsed = parseCsv(text);
    setSelection(guessMapping(parsed[0] ?? []));
    setError(null);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    handleRaw(text);
  };

  const setField = (field: MappingField, value: string) => {
    setSelection((current) => {
      const next = { ...current };
      if (value === IGNORE) {
        delete next[field];
      } else {
        next[field] = Number(value);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const mapping = buildColumnMapping(selection);
    if (!mapping) {
      setError(t("guests.import.needNamePhone"));
      return;
    }
    if (dataRows.length === 0) {
      setError(t("guests.import.empty"));
      return;
    }
    setError(null);
    onSubmit(raw, mapping);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="guests.import.dialog"
        className="max-h-[90dvh] overflow-y-auto rounded-xl sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t("guests.import.title")}
          </DialogTitle>
          <DialogDescription>{t("guests.import.body")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              data-ocid="guests.import.file_input"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              data-ocid="guests.import.upload_button"
              onClick={() => fileRef.current?.click()}
            >
              {t("guests.import.file")}
            </Button>
            {dataRows.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {t("guests.import.rows", { count: dataRows.length })}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csv-paste">{t("guests.import.paste")}</Label>
            <Textarea
              id="csv-paste"
              data-ocid="guests.import.textarea"
              value={raw}
              onChange={(event) => handleRaw(event.target.value)}
              rows={4}
              className="font-mono text-xs"
              placeholder={
                "name,phone,email\nCamille Roy,+33612345678,camille@example.com"
              }
            />
          </div>

          {columnCount > 0 && (
            <div className="space-y-2">
              <p className="label-caps">{t("guests.import.mapping")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {MAPPING_FIELDS.map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <span className="text-sm font-medium">
                      {t(FIELD_LABEL[field])}
                    </span>
                    <Select
                      value={
                        selection[field] !== undefined
                          ? String(selection[field])
                          : IGNORE
                      }
                      onValueChange={(value) => setField(field, value)}
                    >
                      <SelectTrigger
                        data-ocid={`guests.import.mapping.${field}`}
                        className="h-8 w-40"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IGNORE}>
                          {t("guests.import.ignore")}
                        </SelectItem>
                        {header.map((cell, index) => (
                          <SelectItem
                            key={columnIds[index]}
                            value={String(index)}
                          >
                            {cell.trim() === ""
                              ? t("guests.import.column", { index: index + 1 })
                              : cell.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dataRows.length > 0 && (
            <div className="space-y-1.5">
              <p className="label-caps">{t("guests.import.preview")}</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      {header.map((cell, index) => (
                        <th
                          key={columnIds[index]}
                          className="whitespace-nowrap px-3 py-2 font-medium"
                        >
                          {cell.trim() || `#${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        {header.map((_, cellIndex) => (
                          <td
                            key={columnIds[cellIndex]}
                            className="max-w-40 truncate px-3 py-1.5"
                          >
                            {row.cells[cellIndex] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <p
              data-ocid="guests.import.error"
              className="text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="guests.import.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            data-ocid="guests.import.submit_button"
            disabled={pending || dataRows.length === 0}
            onClick={handleSubmit}
          >
            {t("guests.import.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
