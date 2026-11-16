// Grafo da rede mesh: enlaces por alcance e rota até o gateway mais próximo (BFS)
import { HOP_LIMIT, LORA_RANGE_KM, nodes } from '../data/network';
import type { MeshNode } from './types';

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR;
  const dLng = (b.lng - a.lng) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const nodeById: Record<string, MeshNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));

export interface Link {
  a: string;
  b: string;
  km: number;
}

export const links: Link[] = (() => {
  const out: Link[] = [];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const d = distanceKm(nodes[i], nodes[j]);
      if (d <= LORA_RANGE_KM) out.push({ a: nodes[i].id, b: nodes[j].id, km: d });
    }
  return out;
})();

export const neighbors: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = Object.fromEntries(nodes.map((n) => [n.id, [] as string[]]));
  for (const l of links) {
    m[l.a].push(l.b);
    m[l.b].push(l.a);
  }
  return m;
})();

/**
 * Menor rota (em saltos) de `src` até qualquer gateway online.
 * `down` = nós indisponíveis (gateways derrubados, nós offline).
 */
export function routeToGateway(src: string, down: Set<string>): string[] | null {
  const prev = new Map<string, string | null>([[src, null]]);
  const queue = [src];
  while (queue.length) {
    const u = queue.shift()!;
    if (u !== src && nodeById[u].type === 'gateway') {
      const path: string[] = [];
      let c: string | null = u;
      while (c) {
        path.unshift(c);
        c = prev.get(c) ?? null;
      }
      return path.length - 1 <= HOP_LIMIT ? path : null;
    }
    for (const v of neighbors[u]) {
      if (prev.has(v) || down.has(v)) continue;
      prev.set(v, u);
      queue.push(v);
    }
  }
  return null;
}

/** Rota até um gateway específico (para respostas descendo pela rede). */
export function routeBetween(src: string, dst: string, down: Set<string>): string[] | null {
  const prev = new Map<string, string | null>([[src, null]]);
  const queue = [src];
  while (queue.length) {
    const u = queue.shift()!;
    if (u === dst) {
      const path: string[] = [];
      let c: string | null = u;
      while (c) {
        path.unshift(c);
        c = prev.get(c) ?? null;
      }
      return path;
    }
    for (const v of neighbors[u]) {
      if (prev.has(v) || (down.has(v) && v !== dst)) continue;
      prev.set(v, u);
      queue.push(v);
    }
  }
  return null;
}

export const latlngOf = (id: string): [number, number] => [nodeById[id].lat, nodeById[id].lng];

/** Nós offline por padrão (não roteiam). */
export const staticDown = new Set(nodes.filter((n) => n.status === 'offline').map((n) => n.id));
