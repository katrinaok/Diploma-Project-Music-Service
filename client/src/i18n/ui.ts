import ukTranslations from './uk';
import enTranslations from './en';

export const languages = {
  uk: 'UA',
  en: 'EN',
};

export const defaultLang = 'uk';

export const ui = {
  uk: ukTranslations,
  en: enTranslations,
} as const;
