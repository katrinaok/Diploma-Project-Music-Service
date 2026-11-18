import { defineMiddleware } from "astro:middleware";

const SUPPORTED_LANGS = new Set(["uk", "en"]);

export const onRequest = defineMiddleware((context, next) => {
  const { lang } = context.params;

  // If this route matched a [lang] parameter, verify it's a real supported language
  if (lang && !SUPPORTED_LANGS.has(lang)) {
    return context.redirect("/404");
  }

  return next();
});

