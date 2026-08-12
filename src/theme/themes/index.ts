/**
 * Theme plugins — each file self-registers via `defineThemePlugin`.
 *
 * SAPfinder palettes are named after the SAP ecosystem (BTP, S/4HANA, etc.).
 * The Theme Switcher reads `listThemeIds()` — no UI changes needed when adding themes.
 */

import "./btp";
import "./s4hana";
import "./analytics";
import "./fiori";
