import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import ptPT from 'antd/locale/pt_PT'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/pt'
import i18n, { LANGUAGE_STORAGE_KEY, resolveInitialLanguage, type Language } from '../i18n'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => resolveInitialLanguage())

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    dayjs.locale(language === 'pt' ? 'pt' : 'en')
    void i18n.changeLanguage(language)
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
  }), [language])

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
