import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/States";
import { useI18n } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/dictionaries";
import { Construction } from "lucide-react";

/**
 * Placeholder body for a screen another task will implement. It keeps the
 * route resolvable and the shell coherent without inventing page behaviour.
 */
export function PlaceholderPage({
  titleKey,
  subtitleKey,
}: {
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title={t(titleKey)} subtitle={t(subtitleKey)} />
      <EmptyState
        icon={<Construction className="size-5" aria-hidden="true" />}
        title={t("common.comingSoon")}
        description={t("common.comingSoonBody")}
      />
    </div>
  );
}
