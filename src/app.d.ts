// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {}

  /** Chosen once per build in vite.config.ts. */
  const __BUILD_SEED__: number;
}

export {};
