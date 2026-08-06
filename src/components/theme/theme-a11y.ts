/**
 * Lightweight a11y helpers for theme UI.
 * Does not change theme architecture — presentation / interaction only.
 */

let liveRegion: HTMLElement | null = null;

function getLiveRegion(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  if (liveRegion?.isConnected) {
    return liveRegion;
  }

  const existing = document.getElementById("theme-a11y-live");
  if (existing) {
    liveRegion = existing;
    return existing;
  }

  const region = document.createElement("div");
  region.id = "theme-a11y-live";
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.className = "sr-only";
  document.body.appendChild(region);
  liveRegion = region;
  return region;
}

/** Announce a theme/mode change to assistive technology. */
export function announceThemeChange(message: string): void {
  const region = getLiveRegion();
  if (!region) return;

  region.textContent = "";
  // Re-set on next frame so duplicate messages are still announced.
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.tabIndex !== -1,
  );
}

/**
 * Keep Tab / Shift+Tab cycling inside a dialog container.
 * Returns true when the event was handled.
 */
export function trapFocus(event: KeyboardEvent, container: HTMLElement): boolean {
  if (event.key !== "Tab") return false;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return false;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
      return true;
    }
    return false;
  }

  if (active === last) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return false;
}

export function moveRadioSelection<T extends string>(
  options: readonly T[],
  current: T,
  key: string,
): T | null {
  const index = options.indexOf(current);
  if (index < 0) return null;

  if (key === "ArrowRight" || key === "ArrowDown") {
    return options[(index + 1) % options.length] ?? null;
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    return options[(index - 1 + options.length) % options.length] ?? null;
  }

  if (key === "Home") {
    return options[0] ?? null;
  }

  if (key === "End") {
    return options[options.length - 1] ?? null;
  }

  return null;
}
