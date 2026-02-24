import { readFileSync } from 'fs';
import { join } from 'path';

export const defaultLang = 'en-US';

// Locale routes supported for legal pages.
export const LEGAL_LOCALES = [
  'ar',
  'ar-SA',
  'bg',
  'cs',
  'da',
  'de',
  'de-DE',
  'el',
  'en',
  'en-AU',
  'en-CA',
  'en-GB',
  'en-US',
  'es',
  'es-ES',
  'fi',
  'fr',
  'fr-CA',
  'fr-FR',
  'he',
  'hi',
  'hr',
  'hu',
  'it',
  'ja',
  'ko',
  'lt',
  'nb',
  'nl',
  'nl-NL',
  'pl',
  'pt-BR',
  'pt-PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'tr',
  'uk',
  'zh-HK',
] as const;

export type SupportedLanguage = (typeof LEGAL_LOCALES)[number];

const translationCache = new Map<string, Record<string, string[]>>();
let sourceStrings: Record<string, { terms?: string[]; privacy?: string[] }> | null = null;

function loadSourceStrings() {
  if (sourceStrings) return sourceStrings;

  try {
    const filePath = join(process.cwd(), 'translations', 'website_strings.json');
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    sourceStrings = parsed.by_page || {};
    return sourceStrings;
  } catch (_error) {
    sourceStrings = {};
    return sourceStrings;
  }
}

function loadTranslations(lang: SupportedLanguage): Record<string, string[]> {
  if (translationCache.has(lang)) {
    return translationCache.get(lang)!;
  }

  const candidates = [lang];
  if (lang.includes('-')) {
    candidates.push(lang.split('-')[0] as SupportedLanguage);
  }

  for (const candidate of candidates) {
    try {
      const filePath = join(process.cwd(), 'translations', `${candidate}.json`);
      const content = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      translationCache.set(lang, parsed);
      return parsed;
    } catch (_error) {
      // Try next fallback candidate.
    }
  }

  const empty: Record<string, string[]> = {};
  translationCache.set(lang, empty);
  return empty;
}

export function getLangFromUrl(url: URL): SupportedLanguage {
  const [, firstSegment] = url.pathname.split('/');
  if (LEGAL_LOCALES.includes(firstSegment as SupportedLanguage)) {
    return firstSegment as SupportedLanguage;
  }
  return defaultLang;
}

export function useTranslations(lang: SupportedLanguage, pageName: 'terms' | 'privacy' | string) {
  // All English locales use source text as-is.
  if (lang === 'en' || lang.startsWith('en-')) {
    return function t(text: string): string {
      return text;
    };
  }

  const source = loadSourceStrings();
  const translations = loadTranslations(lang);

  const sourcePageStrings = source[pageName]?.slice() || [];
  const translatedPageStrings = translations[pageName] || [];

  const translationMap = new Map<string, string>();
  sourcePageStrings.forEach((sourceText, idx) => {
    const translated = translatedPageStrings[idx];
    if (translated && translated.trim().length > 0) {
      translationMap.set(sourceText, translated);
    }
  });

  return function t(text: string): string {
    return translationMap.get(text) || text;
  };
}

export function getAvailableLanguages(): SupportedLanguage[] {
  return [...LEGAL_LOCALES];
}
