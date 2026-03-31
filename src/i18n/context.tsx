'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { t, type Locale, type TranslationKey } from '.'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'pt',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && saved !== locale) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
  }, [])

  const translate = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) => t(locale, key, vars),
    [locale],
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
