export type ExperienceMode =
  | "enhanced"
  | "mobile"
  | "reduced"
  | "no-webgl"
  | "static";

export type StaticReadingPreference = "enhanced" | "static" | null;

const STORAGE_KEY = "ocean-r7-static-reading";
const FORCED_MODES = new Set<ExperienceMode>([
  "enhanced",
  "mobile",
  "reduced",
  "no-webgl",
  "static",
]);

export function getStaticReadingPreference(): StaticReadingPreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "enhanced" || value === "static" ? value : null;
  } catch {
    return null;
  }
}

export function setStaticReadingPreference(
  preference: Exclude<StaticReadingPreference, null>,
) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage is optional; the current session still follows the selected mode.
  }
}

export function getPreferredExperienceMode(): ExperienceMode {
  const requestedMode = new URLSearchParams(window.location.search).get("mode");

  if (requestedMode && FORCED_MODES.has(requestedMode as ExperienceMode)) {
    return requestedMode as ExperienceMode;
  }

  const storedPreference = getStaticReadingPreference();
  if (storedPreference === "static") {
    return "static";
  }

  if (storedPreference !== "enhanced") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return "reduced";
    }

    if (window.matchMedia("(forced-colors: active)").matches) {
      return "static";
    }
  }

  if (
    window.matchMedia("(max-width: 860px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  ) {
    return "mobile";
  }

  return "enhanced";
}

export function isStaticMode(mode: ExperienceMode) {
  return mode !== "enhanced";
}
