import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getTheme } from './theme'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false) // Default to light
  const [theme, setTheme] = useState(getTheme(false))

  useEffect(() => {
    loadThemePreference()
  }, [])

  useEffect(() => {
    setTheme(getTheme(isDark))
    saveThemePreference()
  }, [isDark])

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme')
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark')
      }
    } catch (error) {
      console.log('Error loading theme:', error)
    }
  }

  const saveThemePreference = async () => {
    try {
      await AsyncStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch (error) {
      console.log('Error saving theme:', error)
    }
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 