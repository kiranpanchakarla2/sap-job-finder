import type {
  ResolvedThemeMode,
  ThemeBrandColors,
  ThemeNeutralColors,
  ThemePalette,
} from "../theme-types";
import { darkNeutrals } from "./dark";
import { lightNeutrals } from "./light";

export function getModeNeutrals(mode: ResolvedThemeMode): ThemeNeutralColors {
  return mode === "dark" ? darkNeutrals : lightNeutrals;
}

export function applyThemeMode(
  brand: ThemeBrandColors,
  mode: ResolvedThemeMode,
): ThemePalette {
  return {
    ...brand,
    ...getModeNeutrals(mode),
  };
}

export { lightNeutrals } from "./light";
export { darkNeutrals } from "./dark";
