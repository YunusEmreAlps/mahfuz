import { useTranslation } from "~/hooks/useTranslation";
import { SettingsLabel } from "./SettingsShared";

interface LanguageSectionProps {
  locale: string;
  onLocaleChange: (locale: "tr" | "en") => void;
}

export function LanguageSection({
  locale,
  onLocaleChange,
}: LanguageSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <SettingsLabel label={t.settings.language} description={t.settings.languageDesc} />
      <div className="flex items-center gap-1 rounded-lg bg-[var(--theme-input-bg)] p-0.5">
        {(["tr", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => onLocaleChange(l)}
            className={`rounded-md px-3 py-1 text-[12px] font-medium transition-all ${locale === l ? "bg-[var(--theme-bg-primary)] text-[var(--theme-text)] shadow-sm" : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"}`}
          >
            {l === "tr" ? "Türkçe" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}
