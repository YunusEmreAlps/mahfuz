import { createPreferenceStore } from "~/lib/create-preference-store";
import type { Theme } from "~/lib/constants";
import type { ColorPaletteId } from "~/lib/fonts";

export const useDisplayPrefs = createPreferenceStore("mahfuz-display-prefs", {
  theme: "sepia" as Theme,
  arabicFontId: "scheherazade-new",
  colorizeWords: false,
  colorPaletteId: "pastel" as ColorPaletteId,
  textType: "uthmani" as "uthmani" | "simple",
});
