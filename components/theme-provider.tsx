'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme as useNextTheme,
} from 'next-themes'
import { useUserSettingsStore } from '@/lib/stores/userSettingsStore'


function useSystemTheme() {
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')
  
  React.useEffect(() => {

    const detectSystemTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    }
    

    setSystemTheme(detectSystemTheme())
    

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {

      mediaQuery.addListener(handleChange)
    }
    

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])
  
  return systemTheme
}


function ThemeSync() {
  const { settings, isInitialized } = useUserSettingsStore()
  const { theme: currentTheme, setTheme } = useNextTheme()
  const systemTheme = useSystemTheme()
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  

  React.useEffect(() => {
    if (!isInitialized || !isInitialLoad) return
    
    console.log('🎨 초기 테마 설정 적용:', { 
      userTheme: settings.theme, 
      systemTheme,
      isInitialized 
    })
    
    if (settings.theme === 'SYSTEM') {

      console.log('🖥️ 시스템 테마 적용:', systemTheme)
      setTheme(systemTheme)
    } else {

      const theme = settings.theme.toLowerCase()
      console.log('👤 사용자 테마 적용:', theme)
      setTheme(theme)
    }
    
    setIsInitialLoad(false)
  }, [settings.theme, systemTheme, isInitialized, setTheme, isInitialLoad])
  

  React.useEffect(() => {
    if (isInitialized && settings.theme === 'SYSTEM' && !isInitialLoad) {
      console.log('🔄 시스템 테마 변경 감지, 테마 업데이트:', systemTheme)
      setTheme(systemTheme)
    }
  }, [systemTheme, isInitialized, settings.theme, setTheme, isInitialLoad])
  
  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}
