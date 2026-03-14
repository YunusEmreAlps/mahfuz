import { createPreferenceStore } from "~/lib/create-preference-store";

export const useAppUI = createPreferenceStore("mahfuz-app-ui", {
  sidebarCollapsed: false,
  hasSeenOnboarding: false,
  showLearnTab: true,
  showMemorizeTab: true,
});
