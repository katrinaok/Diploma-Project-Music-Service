import { createI18n } from 'vue-i18n';
import { ui, defaultLang } from './i18nConfig';
import type { App } from 'vue';

// --- Fix for vue-i18n SSR crash ---
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__VUE_PROD_DEVTOOLS__ = false;
  (globalThis as any).__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
}
// ----------------------------------

export default (app: App) => {
  // Determine language from the HTML tag if running on the client
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : defaultLang;
  
  const i18n = createI18n({
    legacy: false,
    locale: lang,
    fallbackLocale: defaultLang,
    messages: ui,
  });

  app.use(i18n);
};
