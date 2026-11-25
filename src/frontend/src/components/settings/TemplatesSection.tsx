import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Language, TemplateKind } from "@/types";
import type { EmailTemplate } from "@/types";
import { Eye, Loader2, Send } from "lucide-react";
import { useState } from "react";
import {
  Field,
  InlineError,
  SettingsSection,
  useSettingsText,
} from "./SettingsPrimitives";
import type { SettingsKey } from "./settingsCopy";
import {
  TEMPLATE_KINDS,
  TEMPLATE_LANGUAGES,
  useEmailTemplates,
  usePreviewEmailTemplate,
  useSendTestEmail,
  useUpdateEmailTemplate,
} from "./useSettingsQueries";

const KIND_KEYS: Record<TemplateKind, SettingsKey> = {
  [TemplateKind.confirmation]: "templates.kind.confirmation",
  [TemplateKind.modification]: "templates.kind.modification",
  [TemplateKind.cancellation]: "templates.kind.cancellation",
  [TemplateKind.reminder]: "templates.kind.reminder",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TemplatesSection({ venueId }: { venueId: bigint }) {
  const s = useSettingsText();
  const { t } = useI18n();
  const templates = useEmailTemplates(venueId);
  const updateTemplate = useUpdateEmailTemplate(venueId);
  const preview = usePreviewEmailTemplate();
  const sendTest = useSendTestEmail();

  const [kind, setKind] = useState<TemplateKind>(TemplateKind.confirmation);
  const [templateLanguage, setTemplateLanguage] = useState<Language>(
    Language.fr,
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [recipientError, setRecipientError] = useState<string | null>(null);

  const list = templates.data ?? [];
  const current: EmailTemplate | undefined = list.find(
    (template) =>
      template.kind === kind && template.language === templateLanguage,
  );
  const currentKey = current ? current.id.toString() : null;

  // Initialize the editable draft once per template selection; the user's
  // typing is never overwritten by a refetch.
  if (currentKey !== loadedId) {
    setLoadedId(currentKey);
    setSubject(current?.subject ?? "");
    setBody(current?.body ?? "");
  }

  const save = () => {
    if (!current) return;
    updateTemplate.mutate({ id: current.id, subject, body });
  };

  const openPreview = () => {
    if (!current) return;
    preview.mutate(current.id, {
      onSuccess: () => setPreviewOpen(true),
    });
  };

  const submitTest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!current) return;
    const trimmed = recipient.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setRecipientError(s("team.invite.invalidEmail"));
      return;
    }
    setRecipientError(null);
    sendTest.mutate(
      { id: current.id, recipient: trimmed },
      {
        onSuccess: () => {
          setSentTo(trimmed);
          setTestOpen(false);
          setRecipient("");
        },
      },
    );
  };

  return (
    <SettingsSection
      ocid="settings.templates.section"
      title={s("templates.title")}
      description={s("templates.subtitle")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label={s("templates.title")}
          className="flex flex-wrap gap-1 rounded-lg bg-muted p-1"
        >
          {TEMPLATE_KINDS.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={kind === option}
              data-ocid={`settings.templates.tab.${option}`}
              onClick={() => setKind(option)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-smooth",
                kind === option
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s(KIND_KEYS[option])}
            </button>
          ))}
        </div>
        <div
          role="tablist"
          aria-label={s("account.language")}
          className="inline-flex items-center rounded-full border border-border bg-card p-0.5"
        >
          {TEMPLATE_LANGUAGES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={templateLanguage === option}
              data-ocid={`settings.templates.language.${option}`}
              onClick={() => setTemplateLanguage(option)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-smooth",
                templateLanguage === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {templates.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      ) : !current ? (
        <p
          data-ocid="settings.templates.empty_state"
          className="mt-4 text-sm text-muted-foreground"
        >
          {s("templates.empty")}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <Field label={s("templates.subject")} htmlFor="template-subject">
            <Input
              id="template-subject"
              data-ocid="settings.templates.subject_input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </Field>
          <Field
            label={s("templates.body")}
            htmlFor="template-body"
            hint={s("templates.placeholderHint")}
          >
            <Textarea
              id="template-body"
              data-ocid="settings.templates.body_input"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={8}
              className="min-h-40 font-mono text-sm leading-relaxed"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              data-ocid="settings.templates.save_button"
              onClick={save}
              disabled={updateTemplate.isPending}
            >
              {updateTemplate.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {s("templates.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="settings.templates.preview_button"
              onClick={openPreview}
              disabled={preview.isPending}
            >
              <Eye className="size-4" aria-hidden="true" />
              {s("templates.preview")}
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="settings.templates.test_button"
              onClick={() => {
                setRecipientError(null);
                setTestOpen(true);
              }}
            >
              <Send className="size-4" aria-hidden="true" />
              {s("templates.testSend")}
            </Button>
          </div>
          {updateTemplate.isSuccess && (
            <p
              data-ocid="settings.templates.success_state"
              className="text-sm font-medium text-success"
            >
              {s("templates.saved")}
            </p>
          )}
          {updateTemplate.isError && (
            <InlineError message={s("templates.saveError")} />
          )}
          {preview.isError && (
            <InlineError message={s("templates.saveError")} />
          )}
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent data-ocid="settings.templates.preview_dialog">
          <DialogHeader>
            <DialogTitle>{s("templates.previewTitle")}</DialogTitle>
            <DialogDescription>
              {s(KIND_KEYS[kind])} · {templateLanguage.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <p className="label-caps">{s("templates.subject")}</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {preview.data?.subject ?? subject}
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground">
              {preview.data?.body ?? body}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="settings.templates.preview_close_button"
              onClick={() => setPreviewOpen(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent data-ocid="settings.templates.test_dialog">
          <DialogHeader>
            <DialogTitle>{s("templates.testTitle")}</DialogTitle>
            <DialogDescription>{s("templates.subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitTest} className="space-y-4">
            <Field
              label={s("templates.testRecipient")}
              htmlFor="test-recipient"
              error={recipientError ?? undefined}
            >
              <Input
                id="test-recipient"
                type="email"
                inputMode="email"
                data-ocid="settings.templates.recipient_input"
                placeholder={s("team.invite.emailPlaceholder")}
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  if (recipientError) setRecipientError(null);
                }}
                aria-invalid={recipientError ? true : undefined}
              />
            </Field>
            {sendTest.isError && (
              <InlineError message={s("templates.testError")} />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="settings.templates.test_cancel_button"
                onClick={() => setTestOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                data-ocid="settings.templates.test_submit_button"
                disabled={sendTest.isPending || recipient.trim() === ""}
              >
                {sendTest.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {s("templates.testSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {sendTest.isSuccess && (
        <p
          data-ocid="settings.templates.test_success_state"
          className="mt-3 text-sm font-medium text-success"
        >
          {s("templates.testSuccess", { email: sentTo })}
        </p>
      )}
    </SettingsSection>
  );
}
