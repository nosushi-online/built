import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { ExternalBlob } from "@caffeineai/object-storage";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { onboardingCopy } from "./copy";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

/**
 * Uploads the venue logo through the platform blob storage and reports the
 * resulting direct URL. Progress is tracked per upload so a retry starts clean.
 */
export function LogoUploader({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const { language } = useI18n();
  const t = (
    key: Parameters<typeof onboardingCopy>[1],
    vars?: Record<string, string | number>,
  ) => onboardingCopy(language, key, vars);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type) || file.size > MAX_BYTES) {
      setError(t("onboarding.field.logoError"));
      return;
    }
    setProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name,
      ).withUploadProgress((pct) => setProgress(Math.round(pct)));
      // Reading the bytes forces the upload to complete before we store the URL.
      await blob.getBytes();
      onChange(blob.getDirectURL());
      setProgress(null);
    } catch {
      setProgress(null);
      setError(t("onboarding.field.logoError"));
    }
  };

  const uploading = progress !== null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {t("onboarding.field.logo")}
      </span>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary",
            value ? "bg-card" : "text-muted-foreground",
          )}
        >
          {value ? (
            <img
              src={value}
              alt={t("onboarding.field.logo")}
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-6" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={ACCEPTED.join(",")}
              className="sr-only"
              data-ocid="onboarding.logo_input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              data-ocid="onboarding.logo_upload_button"
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {value
                ? t("onboarding.field.logoReplace")
                : t("onboarding.field.logoUpload")}
            </Button>
            {value && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                data-ocid="onboarding.logo_remove_button"
                onClick={() => onChange(undefined)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t("onboarding.field.logoRemove")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("onboarding.field.logoHint")}
          </p>
        </div>
      </div>

      {uploading && (
        <div className="space-y-1" data-ocid="onboarding.logo_progress">
          <Progress value={progress} aria-label={t("onboarding.field.logo")} />
          <p className="text-xs text-muted-foreground">
            {t("onboarding.field.logoUploading", { percent: progress })}
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          data-ocid="onboarding.logo_error"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
