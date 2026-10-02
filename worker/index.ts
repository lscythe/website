/**
 * The site's Worker. Everything is a static asset except /api/weather, which
 * reads Jakarta's current weather from Open-Meteo on the server, so visitors'
 * browsers never contact a third party. Answers are cached for ten minutes.
 */
import { describe } from "../src/lib/weather-codes";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

interface Context {
  waitUntil(promise: Promise<unknown>): void;
}

const JAKARTA = { latitude: -6.2088, longitude: 106.8456 };
const TTL = 600;

const upstream =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${JAKARTA.latitude}&longitude=${JAKARTA.longitude}` +
  "&current=temperature_2m,weather_code,is_day&timezone=Asia%2FJakarta";

async function weather(request: Request, ctx: Context): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(new URL("/api/weather", request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  let body: string;
  try {
    const res = await fetch(upstream, { headers: { "user-agent": "lscythe.dev weather" } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = (await res.json()) as {
      current?: { weather_code?: number; temperature_2m?: number; is_day?: number; time?: string };
    };
    const now = data.current;
    if (!now || typeof now.weather_code !== "number") throw new Error("open-meteo: no current weather");
    body = JSON.stringify(
      describe(now.weather_code, typeof now.temperature_2m === "number" ? Math.round(now.temperature_2m) : null, now.is_day !== 0, now.time ?? null),
    );
  } catch (error) {
    // The page falls back to a clear sky; don't cache the failure for long.
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 502,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const response = new Response(body, {
    headers: { "content-type": "application/json", "cache-control": `public, max-age=${TTL}` },
  });
  ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}

export default {
  async fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/weather") return weather(request, ctx);
    return env.ASSETS.fetch(request);
  },
};
