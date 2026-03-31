import pt from './pt.json'
import en from './en.json'
import es from './es.json'
import ru from './ru.json'

export const locales = { pt, en, es, ru } as const
export type Locale = keyof typeof locales
export type TranslationKey = keyof typeof pt

export function t(locale: Locale, key: TranslationKey, vars?: Record<string, string>): string {
  let text = locales[locale]?.[key] ?? locales.pt[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v)
    }
  }
  return text
}

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  ru: 'Русский',
}
