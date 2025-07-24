export const darkTheme = {
  primary: "rgba(10,31,68,1)",
  secondary: "rgba(18,60,120,1)",
  accent: "rgba(61,125,255,1)",
  gold: "rgba(242,201,76,1)",
  text: "rgba(255,255,255,1)",
  textSecondary: "rgba(255,255,255,0.85)",
  textMuted: "rgba(255,255,255,0.6)",
  background: "rgba(10,31,68,1)",
  surface: "rgba(20,44,87,1)",
  surfaceSecondary: "rgba(27,60,107,1)",
  border: "rgba(255,255,255,0.15)",
  success: "rgba(26,188,156,1)",
  warning: "rgba(243,156,18,1)",
  error: "rgba(231,76,60,1)",
  card: "rgba(18,60,120,1)",
  shadow: "rgba(0,0,0,0.5)",
  gradientStart: "rgba(10,31,68,1)",
  gradientEnd: "rgba(18,60,120,1)",
  tabBar: "rgba(10,31,68,0.95)",
  tabBarInactive: "rgba(255,255,255,0.5)",
  tabBarActive: "rgba(61,125,255,1)"
}

export const lightTheme = {
  primary: "rgba(252,255,255,1)",
  secondary: "rgba(153,225,217,1)",
  accent: "rgba(32,44,57,1)",
  gold: "rgba(242,201,76,1)",
  text: "rgba(10,31,68,1)",
  textSecondary: "rgba(10,31,68,0.85)",
  textMuted: "rgba(10,31,68,0.6)",
  background: "rgba(252,255,255,1)",
  surface: "rgba(247,250,253,1)",
  surfaceSecondary: "rgba(228,236,247,1)",
  border: "rgba(10,31,68,0.15)",
  success: "rgba(26,188,156,1)",
  warning: "rgba(243,156,18,1)",
  error: "rgba(231,76,60,1)",
  card: "rgba(252,255,255,1)",
  shadow: "rgba(0,0,0,0.1)",
  gradientStart: "rgba(255,255,255,1)",
  gradientEnd: "rgba(240,244,250,1)",
  tabBar: "rgba(252,255,255,0.95)",
  tabBarInactive: "rgba(10,31,68,0.5)",
  tabBarActive: "rgba(32,44,57,1)"
}

export const getTheme = (isDark) => (isDark ? darkTheme : lightTheme)
