import L from 'leaflet';
import type { MeshNode, NodeStatus } from '../../lib/types';

const statusColor: Record<NodeStatus, string> = { online: '#3F9465', instavel: '#E2B126', offline: '#5F7C8B' };
const cache = new Map<string, L.DivIcon>();

export function nodeIcon(n: MeshNode, opts: { selected?: boolean; dim?: boolean; gatewayDown?: boolean; pulse?: boolean } = {}) {
  const isRelay = n.type === 'dispositivo' && n.name.startsWith('Repetidor');
  const status: NodeStatus = opts.gatewayDown ? 'offline' : n.status;
  const key = `${n.type}|${isRelay}|${status}|${opts.selected}|${opts.dim}|${opts.pulse}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sc = statusColor[status];
  let size = 16;
  let svg = '';
  let pulseColor = '';
  if (n.type === 'gateway') {
    size = 30;
    const fill = status === 'offline' ? '#3A5868' : '#C2512E';
    pulseColor = status === 'offline' ? '' : '#D46C41';
    svg = `<svg width="30" height="30" viewBox="0 0 30 30"><rect x="2" y="2" width="26" height="26" rx="8" fill="${fill}" stroke="#FCF9F3" stroke-width="2"/>
      ${
        status === 'offline'
          ? '<path d="M10 10l10 10M20 10L10 20" stroke="#FCF9F3" stroke-width="2.4" stroke-linecap="round"/>'
          : '<g fill="none" stroke="#FCF9F3" stroke-width="1.8" stroke-linecap="round"><path d="M11.5 12.5a5 5 0 0 1 7 0"/><path d="M9 10a8.5 8.5 0 0 1 12 0"/></g><path d="M15 15v7" stroke="#FCF9F3" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="15" r="2" fill="#FCF9F3"/>'
      }</svg>`;
  } else if (n.type === 'estacao') {
    size = 24;
    pulseColor = status === 'online' ? '#6FB38A' : '';
    svg = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 1.8 21 7v10l-9 5.2L3 17V7z" fill="#1F6141" stroke="#FCF9F3" stroke-width="1.8"/>
      <circle cx="12" cy="12" r="3.2" fill="${sc === '#3F9465' ? '#A6D1B5' : sc}"/><path d="M7.6 9.6a5.4 5.4 0 0 0 0 4.8M16.4 9.6a5.4 5.4 0 0 1 0 4.8" stroke="#A6D1B5" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`;
  } else if (isRelay) {
    size = 14;
    svg = `<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 13 7 7 13 1 7z" fill="#12242F" stroke="${sc}" stroke-width="2"/></svg>`;
  } else {
    size = 16;
    svg = `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.2" fill="#EDE3CF" stroke="${sc}" stroke-width="2.6"/><circle cx="8" cy="8" r="2" fill="#0C1922"/></svg>`;
  }
  const pulse = opts.pulse !== false && pulseColor ? `<span class="pulse" style="background:${pulseColor}"></span>` : '';
  const icon = L.divIcon({
    className: '',
    html: `<div class="rz-node ${opts.selected ? 'selected' : ''} ${opts.dim ? 'dim' : ''}" style="width:${size}px;height:${size}px">${pulse}${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  cache.set(key, icon);
  return icon;
}

export function territoryLabel(name: string) {
  return L.divIcon({
    className: '',
    html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:rgba(237,227,207,.62);text-shadow:0 1px 6px #070F15">${name}</div>`,
    iconSize: [0, 0],
  });
}
