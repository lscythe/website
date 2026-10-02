/**
 * Turns Open-Meteo's WMO weather codes into the handful of moods the site
 * can paint. Shared by the Worker (which fetches) and the page (which paints).
 */
export type Condition = "clear" | "cloudy" | "fog" | "rain" | "storm";

export interface Weather {
  condition: Condition;
  /** Short English description, e.g. "Light rain". */
  label: string;
  /** One brush character for the condition. */
  glyph: string;
  /** °C, rounded. */
  temp: number | null;
  isDay: boolean;
  /** ISO time the reading was taken (Jakarta local). */
  time: string | null;
}

export const GLYPH: Record<Condition, string> = { clear: "晴", cloudy: "云", fog: "雾", rain: "雨", storm: "雷" };

const LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

export function conditionOf(code: number): Condition {
  if (code <= 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "storm";
  // Drizzle, rain, showers; Jakarta never sees snow, so it falls as rain too.
  return "rain";
}

export function describe(code: number, temp: number | null, isDay: boolean, time: string | null): Weather {
  const condition = conditionOf(code);
  return { condition, label: LABELS[code] ?? "Unsettled", glyph: GLYPH[condition], temp, isDay, time };
}

/** A weather for a forced condition (the ?weather= override). */
export function forced(condition: Condition): Weather {
  const label = { clear: "Clear sky", cloudy: "Overcast", fog: "Haze", rain: "Rain", storm: "Thunderstorm" }[condition];
  return { condition, label, glyph: GLYPH[condition], temp: null, isDay: true, time: null };
}

export const CONDITIONS: Condition[] = ["clear", "cloudy", "fog", "rain", "storm"];
