"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { updateTheme: updateThemeStore } = useUserSettingsStore()


  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    console.log('🔄 테마 변경 (로컬만):', { from: theme, to: newTheme })
    

    setTheme(newTheme)
    

    updateThemeStore(newTheme.toUpperCase() as 'LIGHT' | 'DARK')
    

  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-9 h-9 rounded-full bg-green-100 hover:bg-green-200 transition-all duration-300"
      >
        <Sun className="h-4 w-4 text-green-700" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="w-9 h-9 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 transition-all duration-300"
    >
      {theme === "dark" ? <Sun className="h-4 w-4 text-green-300" /> : <Moon className="h-4 w-4 text-green-700" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
