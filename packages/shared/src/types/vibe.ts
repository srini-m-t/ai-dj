export type EnergyLevel = "low" | "medium" | "high";

export type MainstreamnessLevel = "low" | "medium" | "high";

/**
 * Structured vibe state shared across the app.
 * This is designed to map cleanly to server persistence.
 */
export type VibeState = {
  energy: EnergyLevel;
  mood: string | null;
  languages: string[];
  mainstreamness: MainstreamnessLevel;
  genreHints: string[];
  setting: string | null;
};

/**
 * Partial vibe updates produced by prompt interpretation.
 */
export type IntentPatch = {
  energy?: EnergyLevel;
  mood?: string | null;
  languages?: string[];
  mainstreamness?: MainstreamnessLevel;
  genreHints?: string[];
  setting?: string | null;
};
