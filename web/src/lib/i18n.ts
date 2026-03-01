import { getLocale, setLocale } from "@/paraglide/runtime.js";

/**
 * Initialize the i18n system. Reads the locale from the cookie/strategy chain
 * (falling back to baseLocale) and syncs it without a page reload.
 */
export function initI18n(): void {
  setLocale(getLocale(), { reload: false });
  document.documentElement.lang = getLocale();
}
