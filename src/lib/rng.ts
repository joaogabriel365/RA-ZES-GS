// Gerador pseudoaleatório determinístico (mulberry32) — os dados simulados são estáveis entre recargas
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
export const between = (r: () => number, min: number, max: number) => min + r() * (max - min);
export const intBetween = (r: () => number, min: number, max: number) => Math.floor(between(r, min, max + 1));
