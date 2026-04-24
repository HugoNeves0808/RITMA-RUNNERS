import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo } from 'react'
import { ConfigProvider } from 'antd'
import ptPT from 'antd/locale/pt_PT'
import dayjs from 'dayjs'
import 'dayjs/locale/pt'
import i18n, { type Language } from '../i18n'

type LanguageContextValue = {
  language: Language
  preferredLanguage: Language
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language: Language = 'pt'
  const preferredLanguage: Language = 'pt'

  useEffect(() => {
    dayjs.locale('pt')
    void i18n.changeLanguage(language)
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    preferredLanguage,
  }), [language, preferredLanguage])

  return (
    <LanguageContext.Provider value={value}>
      <ConfigProvider locale={ptPT}>
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
