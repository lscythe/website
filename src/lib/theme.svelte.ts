/**
 * Paper (light) / Night (dark) theme. The html element carries
 * theme="light" | "dark" | "system"; app.html applies the saved choice
 * before first paint.
 *
 * Switching plays out like a day turning: the sun sets (hero listens for
 * "ink:theme" with phase "set"), ink washes across the page via a view
 * transition, then the moon rises ("rise").
 */
export type Choice = "light" | "dark" | "system";

const SET_MS = 750;

export const theme = $state({ choice: "system" as Choice, dark: false });

const prefersDark = () => matchMedia("(prefers-color-scheme: dark)").matches;
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function resolve(choice: Choice) {
  return choice === "dark" || (choice === "system" && prefersDark());
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

const announce = (phase: "set" | "rise", dark: boolean) =>
  window.dispatchEvent(new CustomEvent("ink:theme", { detail: { phase, dark } }));

/** Change theme with the sunset / ink-wash / moonrise sequence. */
export async function setTheme(choice: Choice, origin?: { x: number; y: number }) {
  const toDark = resolve(choice);
  if (toDark === theme.dark || calm()) {
    apply(choice);
    return;
  }

  announce("set", toDark);
  await new Promise((done) => setTimeout(done, SET_MS));

  const root = document.documentElement;
  root.style.setProperty("--vt-x", `${origin?.x ?? innerWidth / 2}px`);
  root.style.setProperty("--vt-y", `${origin?.y ?? 0}px`);
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (doc.startViewTransition) {
    const transition = doc.startViewTransition(() => apply(choice));
    announce("rise", toDark);
    await transition.finished.catch(() => {});
  } else {
    apply(choice);
    announce("rise", toDark);
  }
}

export const toggleTheme = (origin?: { x: number; y: number }) => setTheme(theme.dark ? "light" : "dark", origin);
