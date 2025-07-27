export const darkTheme = {
  primary: "rgba(12,24,54,1)",             // Deep navy
  secondary: "rgba(28,50,85,1)",           // Dark blue-gray
  accent: "rgba(72,144,255,1)",            // Lively sky blue
  gold: "rgba(255,214,102,1)",             // Softer gold
  text: "rgba(230,245,255,1)",             // Cool white-blue
  textSecondary: "rgba(230,245,255,0.85)",
  textMuted: "rgba(230,245,255,0.6)",
  background: "rgba(10,18,40,1)",          // Very dark navy
  surface: "rgba(20,32,60,1)",             // Panel background
  surfaceSecondary: "rgba(30,45,75,1)",
  border: "rgba(230,245,255,0.1)",
  success: "rgba(34,204,151,1)",
  warning: "rgba(255,171,64,1)",
  error: "rgba(255,87,87,1)",
  card: "rgba(24,36,66,1)",
  shadow: "rgba(0,0,0,0.45)",
  gradientStart: "rgba(12,24,54,1)",
  gradientEnd: "rgba(28,50,85,1)",
  tabBar: "rgba(12,24,54,0.95)",
  tabBarInactive: "rgba(230,245,255,0.5)",
  tabBarActive: "rgba(72,144,255,1)"
};


export const lightTheme = {
  primary: "rgba(240,248,255,1)",          // Lightest blue (almost white)
  secondary: "rgba(198,225,255,1)",        // Soft baby blue
  accent: "rgba(36,78,128,1)",             // Rich blue for contrast
  gold: "rgba(255,214,102,1)",
  text: "rgba(18,45,75,1)",                // Navy text
  textSecondary: "rgba(18,45,75,0.85)",
  textMuted: "rgba(18,45,75,0.6)",
  background: "rgba(240,248,255,1)",       // Light blue background
  surface: "rgba(250,252,255,1)",          // Card/panel bg
  surfaceSecondary: "rgba(226,238,251,1)",
  border: "rgba(18,45,75,0.1)",
  success: "rgba(34,204,151,1)",
  warning: "rgba(255,171,64,1)",
  error: "rgba(255,87,87,1)",
  card: "rgba(255,255,255,1)",
  shadow: "rgba(0,0,0,0.08)",
  gradientStart: "rgba(255,255,255,1)",
  gradientEnd: "rgba(230,244,255,1)",
  tabBar: "rgba(240,248,255,0.95)",
  tabBarInactive: "rgba(18,45,75,0.5)",
  tabBarActive: "rgba(36,78,128,1)"
};


export const getTheme = (isDark) => (isDark ? darkTheme : lightTheme)
