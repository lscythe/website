import { CONDITIONS, forced, type Condition, type Weather } from "./weather-codes";

/**
 * Jakarta's weather, as the page should paint it. Starts clear (nothing
 * happens), then asks the site's Worker. `?weather=rain` (or clear, cloudy,
 * fog, storm) forces a condition, handy for seeing each mood.
 */
export const weather = $state<{ now: Weather | null }>({ now: null });

const REFRESH_MS = 15 * 60 * 1000;

async function load() {
  try {
    const res = await fetch("/api/weather", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return;
    const data = (await res.json()) as Weather;
    if (data && CONDITIONS.includes(data.condition)) weather.now = data;
  } catch {
    // Offline, local dev or upstream down: keep whatever we had.
  }
}

export function initWeather() {
  const override = new URL(location.href).searchParams.get("weather") as Condition | null;
  if (override && CONDITIONS.includes(override)) {
    weather.now = forced(override);
    return () => {};
  }
  load();
  const timer = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
  return () => clearInterval(timer);
}

export const condition = (): Condition => weather.now?.condition ?? "clear";
