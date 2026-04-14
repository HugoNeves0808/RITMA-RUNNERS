import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { pt } from './locales/pt'

export const SUPPORTED_LANGUAGES = ['en', 'pt'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = 'ritma:language'

function normalizeLanguage(value: string | null | undefined): Language | null {
  if (!value) {
    return null
  }

  const lower = value.toLowerCase()
  if (lower === 'pt' || lower.startsWith('pt-')) {
    return 'pt'
  }

  if (lower === 'en' || lower.startsWith('en-')) {
    return 'en'
  }

  return null
}

export function resolveInitialLanguage(): Language {
  const stored = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
  if (stored) {
    return stored
  }

  const browser = normalizeLanguage(navigator.language)
  return browser ?? 'en'
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n

