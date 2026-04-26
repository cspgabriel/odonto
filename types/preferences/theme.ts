export const THEME_MODE_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((m) => m.value);

export type ThemeMode = (typeof THEME_MODE_VALUES)[number];

export const THEME_PRESET_OPTIONS = [
  { label: "Default", value: "default", primary: { light: "#4f46e5", dark: "#6366f1" } },
  { label: "Ocean", value: "ocean", primary: { light: "#0ea5e9", dark: "#38bdf8" } },
  { label: "Forest", value: "forest", primary: { light: "#10b981", dark: "#34d399" } },
  { label: "Slate", value: "slate", primary: { light: "#64748b", dark: "#94a3b8" } },
  { label: "Rose", value: "rose", primary: { light: "#f43f5e", dark: "#fb7185" } },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_VALUES)[number];
