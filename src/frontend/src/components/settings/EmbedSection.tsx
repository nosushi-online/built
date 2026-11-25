import { Button } from "@/components/ui/button";
import { Check, Code2, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { SettingsSection, useSettingsText } from "./SettingsPrimitives";

function buildSnippets(slug: string, origin: string) {
  const pageUrl = `${origin}/site/${slug}/reserver`;
  const iframe = `<iframe
  src="${pageUrl}"
  title="Réservation en ligne"
  width="100%"
  height="720"
  style="border:0;border-radius:16px"
  loading="lazy"
></iframe>`;
  const script = `<div id="maison-booking"></div>
<script
  src="${origin}/embed.js"
  data-venue="${slug}"
  data-target="maison-booking"
  async
></script>`;
  return { pageUrl, iframe, script };
}

function CodeBlock({
  label,
  code,
  ocid,
}: {
  label: string;
  code: string;
  ocid: string;
}) {
  const s = useSettingsText();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setFailed(true);
      setCopied(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="label-caps">{label}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid={`${ocid}.copy_button`}
          onClick={() => void copy()}
        >
          {copied ? (
            <Check className="size-3.5 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {s("embed.copy")}
        </Button>
      </div>
      <pre
        data-ocid={`${ocid}.code`}
        className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-3 font-mono text-xs leading-relaxed text-foreground"
      >
        <code>{code}</code>
      </pre>
      {copied && (
        <p
          data-ocid={`${ocid}.copied_state`}
          className="text-xs font-medium text-success"
        >
          {s("embed.copied")}
        </p>
      )}
      {failed && (
        <p
          data-ocid={`${ocid}.copy_error_state`}
          className="text-xs font-medium text-destructive"
        >
          {s("embed.copyError")}
        </p>
      )}
    </div>
  );
}

export function EmbedSection({ slug }: { slug: string }) {
  const s = useSettingsText();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const { pageUrl, iframe, script } = buildSnippets(slug, origin);

  return (
    <SettingsSection
      ocid="settings.embed.section"
      title={s("embed.title")}
      description={s("embed.subtitle")}
      actions={
        slug ? (
          <Button asChild type="button" variant="outline" size="sm">
            <a
              href={pageUrl}
              target="_blank"
              rel="noreferrer"
              data-ocid="settings.embed.preview_link"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {s("embed.preview")}
            </a>
          </Button>
        ) : undefined
      }
    >
      {!slug ? (
        <p
          data-ocid="settings.embed.empty_state"
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground"
        >
          <Code2 className="size-4" aria-hidden="true" />
          {s("embed.slugMissing")}
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
            <span className="label-caps">{s("embed.preview")}</span>
            <code className="truncate font-mono text-xs text-foreground">
              {pageUrl}
            </code>
          </div>
          <CodeBlock
            label={s("embed.iframe")}
            code={iframe}
            ocid="settings.embed.iframe"
          />
          <CodeBlock
            label={s("embed.script")}
            code={script}
            ocid="settings.embed.script"
          />
        </div>
      )}
    </SettingsSection>
  );
}
