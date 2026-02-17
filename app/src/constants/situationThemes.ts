export interface SituationTheme {
  slug: string;
  primary: string;
  secondary: string;
  background: string;
  accent: string;
  emoji: string;
  headerGradient?: [string, string];
}

export interface SituationThemeDark {
  slug: string;
  primary: string;
  secondary: string;
  background: string;
  accent: string;
  emoji: string;
  headerGradient?: [string, string];
}

const lightThemes: SituationTheme[] = [
  {
    slug: "airport_pickup",
    primary: "#87CEEB",
    secondary: "#FFFFFF",
    background: "#F0F8FF",
    accent: "#5BA3CF",
    emoji: "\u2708\uFE0F",
    headerGradient: ["#87CEEB", "#B0E0FF"],
  },
  {
    slug: "train_station",
    primary: "#4CAF50",
    secondary: "#9E9E9E",
    background: "#F1F8E9",
    accent: "#2E7D32",
    emoji: "\uD83D\uDE83",
    headerGradient: ["#4CAF50", "#81C784"],
  },
  {
    slug: "hotel_checkin",
    primary: "#D2B48C",
    secondary: "#8B7355",
    background: "#FFF8F0",
    accent: "#A0845C",
    emoji: "\uD83C\uDFE8",
    headerGradient: ["#D2B48C", "#E8D5B7"],
  },
  {
    slug: "convenience_store",
    primary: "#FF9800",
    secondary: "#4CAF50",
    background: "#FFF9F0",
    accent: "#F57C00",
    emoji: "\uD83C\uDFEA",
    headerGradient: ["#FF9800", "#FFB74D"],
  },
  {
    slug: "restaurant",
    primary: "#FF8C00",
    secondary: "#8B6914",
    background: "#FFF3E0",
    accent: "#E65100",
    emoji: "\uD83C\uDF5C",
    headerGradient: ["#FF8C00", "#FFB84D"],
  },
  {
    slug: "ask_directions",
    primary: "#DC143C",
    secondary: "#228B22",
    background: "#FFF0F0",
    accent: "#B71C1C",
    emoji: "\u26E9\uFE0F",
    headerGradient: ["#DC143C", "#E85B6B"],
  },
  {
    slug: "shopping_market",
    primary: "#FF69B4",
    secondary: "#FFFFFF",
    background: "#FFF0F5",
    accent: "#D81B60",
    emoji: "\uD83D\uDECD\uFE0F",
    headerGradient: ["#FF69B4", "#FF9AC6"],
  },
  {
    slug: "taxi",
    primary: "#1E90FF",
    secondary: "#FFFFFF",
    background: "#F0F4FF",
    accent: "#1565C0",
    emoji: "\uD83D\uDE95",
    headerGradient: ["#1E90FF", "#64B5F6"],
  },
];

const darkThemes: SituationThemeDark[] = [
  {
    slug: "airport_pickup",
    primary: "#5BA3CF",
    secondary: "#2A2A2A",
    background: "#0F1A24",
    accent: "#87CEEB",
    emoji: "\u2708\uFE0F",
    headerGradient: ["#1A3A52", "#0F1A24"],
  },
  {
    slug: "train_station",
    primary: "#66BB6A",
    secondary: "#616161",
    background: "#0F1A0F",
    accent: "#81C784",
    emoji: "\uD83D\uDE83",
    headerGradient: ["#1A3A1A", "#0F1A0F"],
  },
  {
    slug: "hotel_checkin",
    primary: "#C9A96E",
    secondary: "#6B5840",
    background: "#1A150F",
    accent: "#D2B48C",
    emoji: "\uD83C\uDFE8",
    headerGradient: ["#2A2010", "#1A150F"],
  },
  {
    slug: "convenience_store",
    primary: "#FFB74D",
    secondary: "#66BB6A",
    background: "#1A150F",
    accent: "#FF9800",
    emoji: "\uD83C\uDFEA",
    headerGradient: ["#2A1E0F", "#1A150F"],
  },
  {
    slug: "restaurant",
    primary: "#FFB84D",
    secondary: "#7A5A12",
    background: "#1A130A",
    accent: "#FF8C00",
    emoji: "\uD83C\uDF5C",
    headerGradient: ["#2A1A0A", "#1A130A"],
  },
  {
    slug: "ask_directions",
    primary: "#E85B6B",
    secondary: "#4CAF50",
    background: "#1A0F0F",
    accent: "#DC143C",
    emoji: "\u26E9\uFE0F",
    headerGradient: ["#2A1212", "#1A0F0F"],
  },
  {
    slug: "shopping_market",
    primary: "#FF9AC6",
    secondary: "#2A2A2A",
    background: "#1A0F14",
    accent: "#FF69B4",
    emoji: "\uD83D\uDECD\uFE0F",
    headerGradient: ["#2A1220", "#1A0F14"],
  },
  {
    slug: "taxi",
    primary: "#64B5F6",
    secondary: "#2A2A2A",
    background: "#0F1220",
    accent: "#1E90FF",
    emoji: "\uD83D\uDE95",
    headerGradient: ["#1A2440", "#0F1220"],
  },
];

const defaultLightTheme: SituationTheme = {
  slug: "default",
  primary: "#E8636F",
  secondary: "#5BA19B",
  background: "#FAFAF8",
  accent: "#D94452",
  emoji: "\uD83D\uDDFE",
};

const defaultDarkTheme: SituationThemeDark = {
  slug: "default",
  primary: "#F08A93",
  secondary: "#6BB8B1",
  background: "#0F0F0E",
  accent: "#E85B67",
  emoji: "\uD83D\uDDFE",
};

const lightMap = new Map(lightThemes.map((t) => [t.slug, t]));
const darkMap = new Map(darkThemes.map((t) => [t.slug, t]));

/** Returns the light-mode theme for a situation slug, with a sensible fallback. */
export function getSituationTheme(slug: string): SituationTheme {
  return lightMap.get(slug) ?? defaultLightTheme;
}

/** Returns the dark-mode theme for a situation slug, with a sensible fallback. */
export function getSituationThemeDark(slug: string): SituationThemeDark {
  return darkMap.get(slug) ?? defaultDarkTheme;
}

/** All light themes for iteration (e.g. map rendering). */
export const situationThemes = lightThemes;

/** All dark themes for iteration. */
export const situationThemesDark = darkThemes;
