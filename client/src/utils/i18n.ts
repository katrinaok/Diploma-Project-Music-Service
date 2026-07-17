import { ui, defaultLang } from './i18nConfig';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: string) {
    const keys = key.split('.');
    let result: any = ui[lang];
    for (const k of keys) {
      if (result === undefined) break;
      result = result[k];
    }
    if (result !== undefined) return result;

    let fallback: any = ui[defaultLang];
    for (const k of keys) {
      if (fallback === undefined) break;
      fallback = fallback[k];
    }
    return fallback || key;
  }
}
