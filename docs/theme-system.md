# Theme Experience Engine

Contributor guide for GoResume’s plugin-based theme architecture.

The system separates **brand palettes + personality** (what makes a theme unique) from **appearance modes** (light / dark / system), then combines them at runtime into a **final theme** that is applied as CSS custom properties and `data-*` attributes on `<html>`.

Components should consume semantic tokens (`var(--primary)`, `bg-background`, `theme-btn`, etc.) — never raw hex values and never branch on theme ids.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ThemeProvider (React)                                      │
│  - theme id + mode state                                    │
│  - persistence (localStorage)                               │
│  - system preference watch (prefers-color-scheme)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Combination Engine                                         │
│  definition (colors + personality) + mode → ThemeTokens     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CSS Variable + Data Attribute Engine                       │
│  --primary, --font-heading, --motion-*, data-atmosphere=…   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  UI + Atmosphere                                            │
│  Semantic classes · ThemeAtmosphere · Theme Switcher        │
└─────────────────────────────────────────────────────────────┘
```

### Layers

| Layer | Responsibility |
| --- | --- |
| **Plugins** (`themes/*.ts`) | Full `ThemeDefinition`: colors + typography, radius, glass, shadows, gradients, motion, effects |
| **Modes** (`modes/light.ts`, `modes/dark.ts`) | Neutrals / chrome (background, text, border, …) |
| **Registry** | In-memory map of registered theme definitions |
| **Combine** | Merges definition + mode; memoizes `ThemeTokens` |
| **CSS vars** | Flattens tokens to `--*` + `data-*` on `<html>` |
| **Atmosphere** | Token-driven decorations (`ThemeAtmosphere`) — disabled on editing routes |
| **Provider / context** | App state, persistence, `useTheme()` API |
| **UI** | Theme Switcher, Mode Toggle, Theme Cards |

### Data flow (runtime)

1. App boots → `ThemeProvider` loads `themes/index.ts`.
2. Side-effect imports run each plugin file.
3. Each file calls `defineThemePlugin(id, definition)` → registry.
4. `ThemeProvider` restores `{ palette, mode }` from `localStorage`.
5. If mode is `system`, OS `prefers-color-scheme` is watched and updates live.
6. `combineTheme({ palette, mode })` produces full `ThemeTokens` (memoized).
7. `applyThemeCssVariables(tokens)` writes CSS variables + experience `data-*` onto `<html>`.
8. Components / CSS consume semantic tokens; atmosphere reads `tokens.effects`.

### Public React API

```ts
import { useTheme } from "@/theme";

const {
  theme,          // active palette id, e.g. "water"
  mode,           // "light" | "dark" | "system"
  resolvedMode,   // "light" | "dark" after system resolution
  systemMode,     // live OS preference
  tokens,         // full ThemeTokens including personality
  setTheme,       // (id: string) => void
  setMode,        // (mode) => void
  toggleMode,     // flips resolved light ↔ dark (exits system)
} = useTheme();

// Personality (never check theme === "water" in components)
tokens.typography.fontHeading
tokens.effects.buttonHover
tokens.motion.hoverMs
```

Wrap the app once (already done in `src/app/layout.tsx`):

```tsx
<ThemeProvider>
  <ThemeAtmosphere />
  {children}
  <ThemeSwitcher />
</ThemeProvider>
```

---

## Folder structure

```
src/theme/
├── index.ts                 # Public barrel — import from "@/theme"
├── theme-types.ts           # TypeScript contracts (incl. experience tokens)
├── theme-defaults.ts        # Default radius / type / glass / motion / effects
├── theme-registry.ts        # registerTheme / defineThemePlugin / listThemeIds
├── theme-combine.ts         # Mode + definition → FinalTheme (memoized)
├── theme-semantic.ts        # Derived tokens (glass, button, gradients, …)
├── theme-css-vars.ts        # Tokens → CSS variables + data-* on <html>
├── theme-experience.css     # Hover / atmosphere / button personality CSS
├── theme-context.tsx
├── theme-provider.tsx
├── theme-storage.ts
├── theme-system.ts
├── theme-utils.ts
├── modes/
│   ├── light.ts
│   ├── dark.ts
│   └── …
└── themes/                  # ★ Experience plugins
    ├── index.ts             # Side-effect imports
    ├── default.ts
    ├── water.ts             # Calm / fluid / glass / ripple
    ├── earth.ts             # Warm / Lora / organic lift
    ├── fire.ts              # Bold / glow / Space Grotesk
    └── air.ts               # Minimal / frosted / Outfit

src/components/theme/
├── ThemeAtmosphere.tsx      # Token-driven decorations (distraction-free on /builder)
├── ThemeSwitcher.tsx
├── …
```

---

## How themes (experience plugins) work

A **theme** is a named experience kit: brand colors **plus** typography, radius, glass, shadows, gradients, motion, and effects.

### Brand fields (`ThemeBrandColors`)

| Field | Role |
| --- | --- |
| `primary` | Main brand / CTA |
| `accent` | Secondary brand highlight |
| `success` | Positive status |
| `warning` | Caution status |
| `error` | Destructive status |
| `ring` | Base focus-ring tint |

### Personality fields (`ThemeDefinition`)

| Field | Role |
| --- | --- |
| `typography` | `fontHeading`, `fontBody`, tracking/weight |
| `radius` | `card`, `control`, `button`, `pill` |
| `glass` | fill, blur, saturate, border |
| `shadows` | soft, lift, glow, button |
| `gradients` | brand, hero, soft, button |
| `motion` | hover/transition ms, spring, glow intensity, easing, distance |
| `effects` | atmosphere, buttonHover, cardHover, particles, glow, scrollbar, heroOverlay |
| `derived` | Optional overrides for navbar/button/focus-ring, etc. |

Modes still own neutrals (background/text/border).

### Registration (full experience)

```ts
import { defineThemePlugin } from "@/theme";
import type { ThemeDefinition } from "@/theme";

export default defineThemePlugin("water", {
  colors: {
    primary: "#0284c7",
    accent: "#06b6d4",
    success: "#0d9488",
    warning: "#f59e0b",
    error: "#e11d48",
    ring: "color-mix(in srgb, #0284c7 22%, transparent)",
  },
  typography: {
    fontHeading: "var(--font-manrope), var(--font-inter), sans-serif",
    fontBody: "var(--font-inter), sans-serif",
  },
  radius: { button: "9999px", card: "20px" },
  effects: {
    atmosphere: "water",
    buttonHover: "ripple",
    particleEffect: "circles",
    floating: true,
    ripple: true,
  },
} satisfies ThemeDefinition);
```

Legacy brand-only plugins still work:

```ts
defineThemePlugin("ocean", { primary: "…", accent: "…", /* … */ });
```

### Discovery

Each plugin is registered via a side-effect import in `themes/index.ts`.
After adding a file, add `import "./your-theme";` there once.

### Built-in personalities

| Id | Feel | Heading font | Signature effects |
| --- | --- | --- | --- |
| `default` | Product baseline | Inter | Lift |
| `water` | Calm / fluid / glass | Manrope | Ripple, floating circles |
| `earth` | Warm / grounded | Lora | Organic blobs, gentle lift |
| `fire` | Bold / energetic | Space Grotesk | Glow pulse, rays |
| `air` | Minimal / premium | Outfit | Frosted glass, soft dots |

---

## How modes work

A **mode** is the light/dark appearance overlay.

### Supported preferences (`ThemeMode`)

| Value | Behavior |
| --- | --- |
| `light` | Always light neutrals |
| `dark` | Always dark neutrals |
| `system` | Follows `prefers-color-scheme`; updates live |

`resolvedMode` is always `"light" | "dark"` after resolving `system`.

### Neutral fields (`ThemeNeutralColors`)

Defined in `modes/light.ts` and `modes/dark.ts`:

| Field | CSS variable | Role |
| --- | --- | --- |
| `background` | `--background` | Page background |
| `surface` | `--surface` | Subtle elevated surface |
| `card` | `--card` | Card fill |
| `text` | `--text` | Primary text |
| `mutedText` | `--muted-text` / `--muted` | Supporting text |
| `secondary` | `--secondary` | Mid-emphasis text |
| `border` | `--border` | Dividers / outlines |

### Combination

```
Final colors = { ...brandPalette, ...modeNeutrals }
```

Example combinations (computed, not separate files):

- Water + Light
- Water + Dark
- Earth + Light
- Earth + Dark
- …

Unlimited palettes × 2 modes without combinatorial source files.

### Persistence & fallback

Stored in `localStorage` as:

```json
{ "palette": "water", "mode": "system" }
```

Key: `gobuild-theme-settings` (see `THEME_SETTINGS_STORAGE_KEY`).

Restore order:

1. Saved preference  
2. System preference (`prefers-color-scheme`)  
3. Default light  

---

## How to create a new palette / seasonal theme

1. Create `src/theme/themes/<name>.ts` with a `ThemeDefinition`.
2. Add `import "./<name>";` in `themes/index.ts`.
3. If you need a new Google font, add it in `src/app/layout.tsx` as a CSS variable and reference it from `typography.fontHeading`.
4. Refresh — Theme Switcher lists it automatically.

See `themes/water.ts` / `fire.ts` for full personality examples (Christmas, Galaxy, Cyberpunk, etc. follow the same pattern).

### Checklist

- [ ] `colors` complete
- [ ] Personality tokens set (`effects.atmosphere`, motion, radius, type)
- [ ] Side-effect import in `themes/index.ts`
- [ ] Components unchanged (no theme-id branching)
- [ ] WCAG AA contrast spot-checked for primary CTAs
- [ ] Atmosphere acceptable; editing routes stay distraction-free

---

## How to add seasonal themes

Seasonal / campaign themes are normal plugins. Examples:

| File | Id | Idea |
| --- | --- | --- |
| `themes/christmas.ts` | `christmas` | Red + evergreen |
| `themes/winter.ts` | `winter` | Ice blue + silver |
| `themes/royal.ts` | `royal` | Deep purple + gold |
| `themes/cyberpunk.ts` | `cyberpunk` | Magenta + cyan |

### Example: Christmas

```ts
// src/theme/themes/christmas.ts
import type { ThemeBrandColors } from "../theme-types";
import { defineThemePlugin } from "../theme-registry";

export default defineThemePlugin("christmas", {
  primary: "#c41e3a",
  accent: "#165b33",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  ring: "color-mix(in srgb, #c41e3a 22%, transparent)",
} satisfies ThemeBrandColors);
```

### Optional product behavior

The theme system does not auto-enable seasonal themes by date. If you want that:

```ts
// e.g. in a client effect under ThemeProvider
const { setTheme } = useTheme();
useEffect(() => {
  if (isChristmasSeason() && hasTheme("christmas")) {
    setTheme("christmas");
  }
}, [setTheme]);
```

Keep dating logic in product code — not in the plugin loader — so plugins stay dumb data modules.

### Removing a seasonal theme

Delete the theme file and remove its import from `themes/index.ts`. After rebuild/reload it disappears from the registry and switcher. Users who still have that id saved fall back via `resolvePalettePreference` to the default palette when the id is unregistered.

---

## How CSS variables are generated

### Pipeline

```
combineTheme({ palette: "water", mode: "dark" })
  → palette: ThemePalette          // brand + dark neutrals
  → derived: ThemeDerivedTokens    // glass, button, gradients, …
  → ThemeTokens
  → themeTokensToCssVariables(tokens)
  → applyThemeCssVariables(tokens) // setProperty on <html>
```

`ThemeProvider` runs `applyThemeCssVariables` whenever `tokens` change (theme, mode, or system preference).

### Base variables (concrete colors)

Set from the merged palette, for example:

| Variable | Source |
| --- | --- |
| `--background` | mode.background |
| `--surface` | mode.surface |
| `--card` | mode.card |
| `--primary` | brand.primary |
| `--accent` | brand.accent |
| `--secondary` | mode.secondary |
| `--success` / `--warning` / `--error` | brand |
| `--text` | mode.text |
| `--muted-text` / `--muted` | mode.mutedText |
| `--border` | mode.border |
| `--ring` | brand.ring |

### Derived variables (usually `var(--*)` / `color-mix`)

Built in `theme-semantic.ts` so they track bases without baking hex:

| Variable | Typical definition |
| --- | --- |
| `--glass` | translucent surface |
| `--navbar` / `--navbar-fg` | region chrome |
| `--footer` / `--footer-fg` | region chrome |
| `--input` / `--input-fg` / `--input-border` | form controls |
| `--badge` / `--badge-fg` | chips |
| `--link` | links |
| `--button` / `--button-fg` | primary button |
| `--button-secondary` / `--button-secondary-fg` | secondary button |
| `--focus-ring` | visible focus (a11y) |
| `--gradient-brand` / `--gradient-hero` / `--gradient-soft` | backgrounds |
| `--shadow-soft` / `--shadow-lift` / `--shadow-glow` / `--shadow-button` | elevation |

Also set on `<html>`:

- `data-theme` → resolved `"light"` \| `"dark"`
- `data-mode` → user preference including `"system"`
- `style.colorScheme` → resolved mode (native form controls)

### Tailwind bridge

`src/app/globals.css` maps Tailwind color tokens to the same CSS variables:

```css
@theme {
  --color-background: var(--background, #ffffff);
  --color-primary: var(--primary, #4f46e5);
  --color-text: var(--text, #0f172a);
  /* … */
}
```

So these are equivalent in spirit:

```tsx
<div className="bg-background text-text border-border" />
<div style={{ background: "var(--background)", color: "var(--text)" }} />
```

Fallbacks in `@theme` keep first paint correct before hydration.

### DOM attributes for CSS

```css
html[data-theme="dark"] { /* resolved dark */ }
html[data-mode="system"] { /* user chose system */ }
```

Prefer semantic variables over hard-coding dark overrides in components.

---

## Using tokens in components

**Do**

```tsx
<button className="bg-button text-button-fg shadow-[var(--shadow-button)] focus-visible:ring-focus-ring">
  Save
</button>

<a className="text-link underline-offset-2 hover:opacity-90">Learn more</a>

<section className="bg-card border border-border text-text">
  <p className="text-muted-text">Supporting copy</p>
</section>
```

**Don’t**

```tsx
<button className="bg-[#4f46e5] text-white">Save</button>
```

---

## UI packages

| Component | Role |
| --- | --- |
| `ThemeSwitcher` | Floating dialog: mode + palette |
| `ModeToggle` | Light / Dark / System control |
| `ThemeCard` / `ThemeCardGrid` | Palette previews; auto-lists plugins |

Accessibility notes (already wired):

- Dialog focus trap + Escape + restore focus
- Radiogroup arrow keys for mode and palette
- Strong `--focus-ring`
- `aria-live` announcements on change
- Motion ≤ 250ms; `prefers-reduced-motion` → instant

---

## Testing checklist for contributors

When adding a palette or changing tokens:

1. Switch Light / Dark / System — neutrals and brand update.
2. Confirm new id appears in Theme Switcher without editing other files.
3. Refresh — preference restores from `localStorage`.
4. Inspect `<html>` styles — `--primary`, `--background`, `--button`, etc. present.
5. Keyboard-only: open switcher, Tab, arrows, Escape.
6. Spot-check contrast (primary buttons, muted text on background).

---

## Quick reference

| Task | Action |
| --- | --- |
| Add brand theme | Create `src/theme/themes/<name>.ts` + import it in `themes/index.ts` |
| Change light/dark neutrals | Edit `modes/light.ts` or `modes/dark.ts` |
| Add derived token | Extend `ThemeDerivedTokens` + `buildDerivedTokens` + `themeTokensToCssVariables` (+ optional `@theme` alias) |
| Read active theme | `useTheme()` |
| List plugins | `listThemeIds()` |
| Force apply CSS | `applyThemeCssVariables(tokens)` |

For questions about contracts, start with `src/theme/theme-types.ts` and the `@/theme` barrel export list.
