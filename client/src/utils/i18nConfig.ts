import ukTranslations from '../i18n/uk.json';
import enTranslations from '../i18n/en.json';

export const languages = {
  uk: 'UA',
  en: 'EN',
};

export const defaultLang = 'uk';

export const ui = {
  uk: ukTranslations,
  en: enTranslations,
} as const;
