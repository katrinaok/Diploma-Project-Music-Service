import { createI18n } from 'vue-i18n';
import { ui, defaultLang } from '../i18n/ui';
import type { App } from 'vue';

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
