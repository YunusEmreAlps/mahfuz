import type { Verse } from "@mahfuz/shared/types";
import { Bismillah } from "./Bismillah";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";

/** Surahs that do NOT get a Bismillah prefix */
const NO_BISMILLAH_SURAHS = new Set([1, 9]);

interface MushafViewProps {
  verses: Verse[];
  showBismillah?: boolean;
}

export function MushafView({ verses, showBismillah = true }: MushafViewProps) {
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);
  const selectedTranslations = usePreferencesStore((s) => s.selectedTranslations);
  const { t } = useTranslation();

  const hasTranslations = verses.some((v) => v.translations && v.translations.length > 0);

  return (
    <div className="mushaf-spread">
      {/* Arabic page — right on desktop, first on mobile */}
      <div className="mushaf-spread-page mushaf-spread-arabic">
        <ArabicPage
          verses={verses}
          showBismillah={showBismillah}
          colorizeWords={colorizeWords}
          colors={colors}
          fontSize={mushafArabicFontSize}
        />
      </div>

      {/* Spine divider — desktop only */}
      <div className="mushaf-spread-spine" />

      {/* Translation page — left on desktop, swipe-to on mobile */}
      <div className="mushaf-spread-page mushaf-spread-meal">
        {hasTranslations ? (
          <MealPage
            verses={verses}
            fontSize={mushafTranslationFontSize}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-center text-[13px] text-[var(--theme-text-quaternary)]">
              {selectedTranslations.length === 0
                ? t.toolbar.mushafNoTranslation
                : t.toolbar.mushafNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Arabic flowing text with verse markers (durak) */
function ArabicPage({
  verses,
  showBismillah,
  colorizeWords,
  colors,
  fontSize,
}: {
  verses: Verse[];
  showBismillah: boolean;
  colorizeWords: boolean;
  colors: string[];
  fontSize: number;
}) {
  return (
    <p
      className="arabic-text text-center leading-[2.8] text-[var(--mushaf-ink)]"
      style={{ fontSize: `calc(1.65rem * ${fontSize})` }}
      dir="rtl"
    >
      {verses.map((verse) => {
        const surahId = Number(verse.verse_key.split(":")[0]);
        const needsBismillah =
          showBismillah &&
          verse.verse_number === 1 &&
          !NO_BISMILLAH_SURAHS.has(surahId);
        const words =
          verse.words?.filter((w) => w.char_type_name === "word") ?? [];
        return (
          <span key={verse.id}>
            {needsBismillah && (
              <span className="block w-full py-2 text-[1.5rem]">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </span>
            )}
            {colorizeWords && words.length > 0
              ? words.map((w, i) => (
                  <span
                    key={w.id}
                    style={{ color: colors[i % colors.length] }}
                  >
                    {w.text_uthmani}{" "}
                  </span>
                ))
              : (
                  <>
                    {verse.text_uthmani}{" "}
                  </>
                )}
            <span className="mushaf-durak">
              {toArabicNumeral(verse.verse_number)}
            </span>
            {"  "}
          </span>
        );
      })}
    </p>
  );
}

/** Translation page — verse-by-verse meal text */
function MealPage({
  verses,
  fontSize,
}: {
  verses: Verse[];
  fontSize: number;
}) {
  return (
    <div className="space-y-4">
      {verses.map((verse) => (
        <div key={verse.id}>
          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-verse-number-bg)] text-[10px] font-semibold tabular-nums text-[var(--theme-text-tertiary)]">
            {verse.verse_number}
          </span>
          {verse.translations?.map((tr, i) => (
            <p
              key={i}
              className="mt-1 font-sans leading-[1.8] text-[var(--theme-text-secondary)]"
              style={{ fontSize: `calc(15px * ${fontSize})` }}
              dangerouslySetInnerHTML={{ __html: tr.text }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}
