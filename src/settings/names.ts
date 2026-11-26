// The three settings files by name and where they live. Import-free, so scripts, the Worker and the build share one list.
export const SETTINGS_NAMES = ["business", "brand", "notice"] as const;
export type SettingsName = (typeof SETTINGS_NAMES)[number];
export const settingsPath = (name: SettingsName): string => `src/content/${name}.json`;
