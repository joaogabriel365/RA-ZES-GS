// Camada imperativa de pacotes: anima marcadores com requestAnimationFrame direto no Leaflet.
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { latlngOf } from '../../lib/graph';
import type { MapPacket } from '../../store/NetworkContext';

interface Live {
  p: MapPacket;
  dot: L.Marker;
  trail: L.Polyline;
  pts: L.LatLng[];
  lastHop: number;
  done: boolean;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function PacketLayer({ packets, big = false, showTrail = true }: { packets: MapPacket[]; big?: boolean; showTrail?: boolean }) {
  const map = useMap();
  const live = useRef(new Map<string, Live>());

  const ripple = (ll: L.LatLng, color: string) => {
    const m = L.marker(ll, {
      interactive: false,
      icon: L.divIcon({ className: '', html: `<div class="rz-ripple" style="--c:${color}"></div>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
    }).addTo(map);
    window.setTimeout(() => m.remove(), 950);
  };

  // sincroniza a lista de pacotes com as camadas
  useEffect(() => {
    const ids = new Set(packets.map((p) => p.id));
    for (const p of packets) {
      if (live.current.has(p.id)) continue;
      const pts = p.path.map((id) => L.latLng(latlngOf(id)));
      const dot = L.marker(pts[0], {
        interactive: false,
        zIndexOffset: 1000,
        icon: L.divIcon({ className: '', html: `<div class="rz-packet ${big ? 'big' : ''}" style="--c:${p.color}"></div>`, iconSize: big ? [16, 16] : [12, 12], iconAnchor: big ? [8, 8] : [6, 6] }),
      }).addTo(map);
      const trail = L.polyline([pts[0]], { color: p.color, weight: big ? 4 : 2.5, opacity: showTrail ? 0.85 : 0, interactive: false, lineCap: 'round' }).addTo(map);
      live.current.set(p.id, { p, dot, trail, pts, lastHop: 0, done: false });
      if (big) ripple(pts[0], p.color);
    }
    for (const [id, l] of live.current) {
      if (!ids.has(id)) {
        l.dot.remove();
        l.trail.remove();
        live.current.delete(id);
      }
    }
  }, [packets, map, big, showTrail]);

  // loop de animação
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      for (const l of live.current.values()) {
        const { p, pts } = l;
        const hops = pts.length - 1;
        if (hops <= 0) continue;
        const elapsed = now - p.startAt;
        if (elapsed < 0) continue;
        const hopF = Math.min(hops, elapsed / p.hopMs);
        const seg = Math.min(hops - 1, Math.floor(hopF));
        const local = ease(Math.min(1, hopF - seg));
        const a = pts[seg];
        const b = pts[seg + 1];
        const cur = L.latLng(a.lat + (b.lat - a.lat) * local, a.lng + (b.lng - a.lng) * local);
        l.dot.setLatLng(cur);
        l.trail.setLatLngs([...pts.slice(0, seg + 1), cur]);
        const reached = Math.floor(hopF);
        if (reached > l.lastHop) {
          l.lastHop = reached;
          ripple(pts[reached], p.color);
        }
        if (hopF >= hops && !l.done) {
          l.done = true;
          const el = l.dot.getElement();
          if (el) {
            el.style.transition = 'opacity .8s';
            el.style.opacity = '0';
          }
          l.trail.setStyle({ opacity: showTrail ? 0.35 : 0 });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [map, showTrail]);

  // limpeza ao desmontar
  useEffect(
    () => () => {
      for (const l of live.current.values()) {
        l.dot.remove();
        l.trail.remove();
      }
      live.current.clear();
    },
    [],
  );

  return null;
}
