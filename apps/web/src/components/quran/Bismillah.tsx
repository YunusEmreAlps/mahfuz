import { usePreferencesStore, getArabicFontSizeForMode } from "~/stores/usePreferencesStore";

export function Bismillah() {
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const scale = getArabicFontSizeForMode({ viewMode, normalArabicFontSize, wbwArabicFontSize, mushafArabicFontSize });

  const fontSize = 28 * scale;

  return (
    <div className="my-8 text-center" dir="rtl">
      <p className="arabic-text text-[var(--theme-text)]" style={{ fontSize: `${fontSize}px` }}>
        ﷽
      </p>
    </div>
  );
}
