import { Appearance } from "react-native";

const lightColors = {
  primary: "#E8636F",
  primaryLight: "#FDE8EA",
  primaryMuted: "#F1A3AA",
  secondary: "#5BA19B",
  secondaryLight: "#E5F2F0",
  background: "#FFFFFF",
  backgroundAlt: "#F5F4F0",
  surface: "#FFFFFF",
  textDark: "#1A1A1A",
  textMedium: "#4A4A4A",
  textMuted: "#7A7A7A",
  textLight: "#A3A3A3",
  border: "#E5E4E0",
  borderLight: "#F0EFEB",
  success: "#3AAF6C",
  successLight: "#E8F8EF",
  warning: "#E5A117",
  warningLight: "#FEF6E0",
  danger: "#D94452",
  dangerLight: "#FDE8EA",
  npcBubble: "#F7F6F3",
} as const;

const darkColors = {
  primary: "#F08A93",
  primaryLight: "#3D2224",
  primaryMuted: "#7A4249",
  secondary: "#6BB8B1",
  secondaryLight: "#1A2E2C",
  background: "#0F0F0E",
  backgroundAlt: "#1A1A18",
  surface: "#1E1E1C",
  textDark: "#F0EFEB",
  textMedium: "#B8B8B5",
  textMuted: "#8A8A87",
  textLight: "#5A5A58",
  border: "#2E2E2C",
  borderLight: "#1E1E1C",
  success: "#4AC77E",
  successLight: "#1A2E22",
  warning: "#F0B535",
  warningLight: "#2E2814",
  danger: "#E85B67",
  dangerLight: "#3D2224",
  npcBubble: "#252523",
} as const;

export type ColorScheme = "light" | "dark" | "system";

let _colorScheme: ColorScheme = "system";
let _resolvedDark = Appearance.getColorScheme() === "dark";

export function setColorScheme(scheme: ColorScheme) {
  _colorScheme = scheme;
  if (scheme === "system") {
    _resolvedDark = Appearance.getColorScheme() === "dark";
  } else {
    _resolvedDark = scheme === "dark";
  }
}

export function getColorScheme(): ColorScheme {
  return _colorScheme;
}

export function isDark(): boolean {
  return _resolvedDark;
}

// For backward compatibility, `colors` always returns light colors.
// Screens that want dark mode support should use `getColors()`.
export const colors = lightColors;

export function getColors() {
  return _resolvedDark ? darkColors : lightColors;
}

export const typography = {
  heading: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.3 },
  title: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: "400" as const },
  label: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  japanese: { fontSize: 20, fontWeight: "500" as const, lineHeight: 30 },
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;
