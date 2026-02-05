import { Appearance } from "react-native";

const lightColors = {
  primary: "#4f46e5",
  background: "#f8fafc",
  surface: "#fff",
  textDark: "#1e293b",
  textMuted: "#64748b",
  textLight: "#6b7280",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

const darkColors = {
  primary: "#818cf8",
  background: "#0f172a",
  surface: "#1e293b",
  textDark: "#f1f5f9",
  textMuted: "#94a3b8",
  textLight: "#64748b",
  border: "#334155",
  borderLight: "#1e293b",
  success: "#22c55e",
  warning: "#fbbf24",
  danger: "#f87171",
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

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;
