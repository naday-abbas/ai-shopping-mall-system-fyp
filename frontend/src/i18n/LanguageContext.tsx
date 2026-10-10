import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type TranslationKey } from './translations'

export type Lang = 'en' | 'ur'

interface LanguageContextValue {
  lang: Lang
  toggleLang: () => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  toggleLang: () => {},
  t: key => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('kiosk_lang') as Lang) || 'en')

  useEffect(() => {
    localStorage.setItem('kiosk_lang', lang)
  }, [lang])

  const toggleLang = () => setLang(l => (l === 'en' ? 'ur' : 'en'))

  const t = (key: TranslationKey, vars?: Record<string, string | number>) => {
    let str: string = translations[key]?.[lang] ?? translations[key]?.en ?? key
    if (vars) {
      for (const k in vars) str = str.replace(`{${k}}`, String(vars[k]))
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
