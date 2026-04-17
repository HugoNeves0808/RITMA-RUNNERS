import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import ptPT from 'antd/locale/pt_PT'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/pt'
import { useAuth } from '../features/auth/hooks/useAuth'
import i18n, { LANGUAGE_STORAGE_KEY, resolveInitialLanguage, type Language } from '../i18n'

type LanguageContextValue = {
  language: Language
  preferredLanguage: Language
  setLanguage: (language: Language) => void
  setPreferredLanguage: (language: Language) => void
  setSessionLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)
const SESSION_LANGUAGE_STORAGE_KEY = 'ritma:session-language'

function resolveSessionLanguage(): Language | null {
  const stored = sessionStorage.getItem(SESSION_LANGUAGE_STORAGE_KEY)
  if (stored === 'pt') {
    return 'pt'
  }

  if (stored === 'en') {
    return 'en'
  }

  return null
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [preferredLanguage, setPreferredLanguageState] = useState<Language>(() => resolveInitialLanguage())
  const [language, setLanguageState] = useState<Language>(() => resolveSessionLanguage() ?? resolveInitialLanguage())
  const previousTokenRef = useRef(token)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, preferredLanguage)
  }, [preferredLanguage])

  useEffect(() => {
    dayjs.locale(language === 'pt' ? 'pt' : 'en')
    void i18n.changeLanguage(language)
  }, [language])

  useEffect(() => {
    if (token) {
      const sessionLanguage = resolveSessionLanguage() ?? preferredLanguage
      setLanguageState(sessionLanguage)
      sessionStorage.setItem(SESSION_LANGUAGE_STORAGE_KEY, sessionLanguage)
    } else {
      sessionStorage.removeItem(SESSION_LANGUAGE_STORAGE_KEY)
      setLanguageState(preferredLanguage)
    }
  }, [preferredLanguage, token])

  useEffect(() => {
    if (previousTokenRef.current && !token) {
      sessionStorage.removeItem(SESSION_LANGUAGE_STORAGE_KEY)
      setLanguageState(preferredLanguage)
    }

    previousTokenRef.current = token
  }, [preferredLanguage, token])

  const setPreferredLanguage = (nextLanguage: Language) => {
    setPreferredLanguageState(nextLanguage)
    setLanguageState(nextLanguage)

    if (token) {
      sessionStorage.setItem(SESSION_LANGUAGE_STORAGE_KEY, nextLanguage)
    }
  }

  const setSessionLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)

    if (token) {
      sessionStorage.setItem(SESSION_LANGUAGE_STORAGE_KEY, nextLanguage)
    }
  }

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    preferredLanguage,
    setLanguage: setPreferredLanguage,
    setPreferredLanguage,
    setSessionLanguage,
  }), [language, preferredLanguage, token])

  const antdLocale = language === 'pt' ? ptPT : enUS

  return (
    <LanguageContext.Provider value={value}>
      <ConfigProvider locale={antdLocale}>
        {children}
      </ConfigProvider>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.')
  }
  return context
}
