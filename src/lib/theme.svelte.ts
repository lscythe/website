/**
 * Paper (light) / Night (dark) theme. The html element carries
 * theme="light" | "dark" | "system"; app.html applies the saved choice
 * before first paint.
 *
 * Switching plays out like a day turning:
 *  1. "set": the sun sinks. Listeners (the hero) may push promises onto
 *     `detail.ready` to prepare for the new theme meanwhile.
 *  2. An ink wash spreads from the toggle until it covers the page. It is a
 *     transform animation, so it runs on the compositor even while the page
 *     is busy repainting underneath.
 *  3. Under full cover the theme is applied; "rise": the moon (or sun) comes
 *     up while the wash fades away.
 */
export type Choice = "light" | "dark" | "system";

export interface ThemeEvent {
  phase: "set" | "rise";
  dark: boolean;
  ready: Promise<unknown>[];
}

const SET_MS = 750;
const WASH_MS = 850;
const FADE_MS = 450;
/** Never keep the visitor waiting on preparation longer than this. */
const PATIENCE_MS = 2500;

export const theme = $state({ choice: "system" as Choice, dark: false });

const prefersDark = () => matchMedia("(prefers-color-scheme: dark)").matches;
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

function resolve(choice: Choice) {
  return choice === "dark" || (choice === "system" && prefersDark());
}

/** Whether the page is dark right now, readable before initTheme has run. */
export function isDarkNow() {
  const choice = (document.documentElement.getAttribute("theme") as Choice) || "system";
  return resolve(choice);
}

export function initTheme() {
  let saved: Choice = "system";
  try {
    saved = (localStorage.getItem("theme") as Choice) || "system";
  } catch {}
  theme.choice = saved;
  theme.dark = resolve(saved);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (theme.choice === "system") theme.dark = prefersDark();
  });
}

function apply(choice: Choice) {
  document.documentElement.setAttribute("theme", choice);
  try {
    localStorage.setItem("theme", choice);
  } catch {}
  theme.choice = choice;
  theme.dark = resolve(choice);
}

const announce = (phase: ThemeEvent["phase"], dark: boolean) => {
  const detail: ThemeEvent = { phase, dark, ready: [] };
  window.dispatchEvent(new CustomEvent("ink:theme", { detail }));
  return detail.ready;
};

/** The wash: a blot of the new paper colour, grown from `origin`. */
function wash(origin: { x: number; y: number }, dark: boolean) {
  const el = document.createElement("div");
  el.className = `ink-cover ${dark ? "to-dark" : "to-light"}`;
  el.setAttribute("aria-hidden", "true");
  const size = 520;
  el.style.cssText = `left:${origin.x - size / 2}px;top:${origin.y - size / 2}px;width:${size}px;height:${size}px`;
  document.body.append(el);
  // The blot's solid heart is ~70% of its box; grow until it covers the
  // farthest corner of the screen.
  const far = Math.max(
    Math.hypot(origin.x, origin.y),
    Math.hypot(innerWidth - origin.x, origin.y),
    Math.hypot(origin.x, innerHeight - origin.y),
    Math.hypot(innerWidth - origin.x, innerHeight - origin.y),
  );
  const scale = (far * 2) / (size * 0.7);
  const grow = el.animate(
    [
      { transform: "scale(0.02) rotate(-20deg)" },
      { transform: `scale(${scale}) rotate(0deg)` },
    ],
    { duration: WASH_MS, easing: "cubic-bezier(0.5, 0, 0.3, 1)", fill: "forwards" },
  );
  return {
    covered: grow.finished,
    fade: async () => {
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: "ease-out", fill: "forwards" }).finished;
      el.remove();
    },
  };
}

/** Change theme with the sunset / ink-wash / moonrise sequence. */
export async function setTheme(choice: Choice, origin?: { x: number; y: number }) {
  const toDark = resolve(choice);
  if (toDark === theme.dark || calm()) {
    document.documentElement.classList.add("theme-switching");
    apply(choice);
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("theme-switching")));
    announce("rise", toDark);
    return;
  }

  const ready = announce("set", toDark);
  const prepared = Promise.race([Promise.allSettled(ready), wait(PATIENCE_MS)]);
  await Promise.all([wait(SET_MS), prepared]);

  const cover = wash(origin ?? { x: innerWidth / 2, y: 0 }, toDark);
  await cover.covered;
  const root = document.documentElement;
  root.classList.add("theme-switching");
  apply(choice);
  announce("rise", toDark);
  // Let the new theme paint once under the cover before revealing it.
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  root.classList.remove("theme-switching");
  await cover.fade();
}

export const toggleTheme = (origin?: { x: number; y: number }) => setTheme(theme.dark ? "light" : "dark", origin);
