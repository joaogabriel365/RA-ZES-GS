import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { nodes, territories } from '../../data/network';
import { links, nodeById, staticDown } from '../../lib/graph';
import { useLivePackets, useNetwork, type MapPacket } from '../../store/NetworkContext';
import { nodeIcon, territoryLabel } from './icons';
import { PacketLayer } from './PacketLayer';

const ALL_BOUNDS = L.latLngBounds(nodes.map((n) => [n.lat, n.lng] as [number, number])).pad(0.08);

interface Props {
  className?: string;
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  highlightRoute?: string[] | null;
  routeColor?: string;
  packets?: MapPacket[]; // se omitido, usa os pacotes ao vivo da rede
  bigPackets?: boolean;
  showTerritories?: boolean;
  fitTo?: string[] | null;
  dimOthers?: boolean;
  children?: ReactNode;
  ariaLabel?: string;
  hideNodes?: string[];
  fitPad?: number;
  fitMaxZoom?: number;
}

function Fit({ ids, pad = 0.35, maxZoom = 12 }: { ids?: string[] | null; pad?: number; maxZoom?: number }) {
  const map = useMap();
  useEffect(() => {
    const target = ids && ids.length > 1 ? L.latLngBounds(ids.map((id) => [nodeById[id].lat, nodeById[id].lng] as [number, number])).pad(pad) : ALL_BOUNDS;
    map.fitBounds(target, { animate: true, duration: 0.8, maxZoom });
  }, [ids?.join(','), map, pad, maxZoom]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export function NetworkMap({
  className = 'h-[520px]',
  interactive = true,
  selectedId,
  onSelect,
  highlightRoute,
  routeColor = '#E8742A',
  packets,
  bigPackets = false,
  showTerritories = true,
  fitTo,
  dimOthers = false,
  children,
  fitPad,
  fitMaxZoom,
  ariaLabel = 'Mapa da rede comunitária RAÍZES',
  hideNodes,
}: Props) {
  const livePackets = useLivePackets();
  const { gatewaysDown } = useNetwork();
  const routeSet = useMemo(() => new Set(highlightRoute ?? []), [highlightRoute]);
  const routeLines = useMemo(() => {
    if (!highlightRoute || highlightRoute.length < 2) return [];
    return highlightRoute.map((id) => [nodeById[id].lat, nodeById[id].lng] as [number, number]);
  }, [highlightRoute]);
  const hidden = useMemo(() => new Set(hideNodes ?? []), [hideNodes]);

  return (
    <div className={`relative overflow-hidden ${className}`} role="region" aria-label={ariaLabel}>
      <MapContainer
        bounds={ALL_BOUNDS}
        className="h-full w-full"
        zoomSnap={0.25}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl
        keyboard={interactive}
        minZoom={6}
        maxZoom={13}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Imagens &copy; Esri, Maxar, Earthstar Geographics'
          className="rz-tiles"
          maxNativeZoom={17}
        />
        <Fit ids={fitTo} pad={fitPad} maxZoom={fitMaxZoom} />

        {showTerritories &&
          territories.map((t) => (
            <Circle
              key={t.id}
              center={t.center}
              radius={13000}
              pathOptions={{ color: '#EDE3CF', weight: 1, opacity: 0.18, dashArray: '2 6', fillColor: '#3F9465', fillOpacity: 0.05 }}
              interactive={false}
            />
          ))}
        {showTerritories && territories.map((t) => <Marker key={`l${t.id}`} position={[t.center[0] + 0.115, t.center[1]]} icon={territoryLabel(t.short)} interactive={false} />)}

        {links.map((l) => {
          const off = staticDown.has(l.a) || staticDown.has(l.b) || gatewaysDown.has(l.a) || gatewaysDown.has(l.b);
          const onRoute = routeSet.has(l.a) && routeSet.has(l.b);
          if (onRoute) return null;
          return (
            <Polyline
              key={`${l.a}-${l.b}`}
              positions={[
                [nodeById[l.a].lat, nodeById[l.a].lng],
                [nodeById[l.b].lat, nodeById[l.b].lng],
              ]}
              pathOptions={{
                color: off ? '#C2512E' : '#8FA7B3',
                weight: 1,
                opacity: off ? 0.15 : dimOthers && highlightRoute ? 0.12 : 0.32,
                dashArray: '3 6',
              }}
              interactive={false}
            />
          );
        })}

        {routeLines.length > 1 && (
          <>
            <Polyline positions={routeLines} pathOptions={{ color: routeColor, weight: 7, opacity: 0.18, lineCap: 'round' }} interactive={false} />
            <Polyline positions={routeLines} pathOptions={{ color: routeColor, weight: 2.5, opacity: 0.95, className: 'rz-link-anim' }} interactive={false} />
          </>
        )}

        {nodes
          .filter((n) => !hidden.has(n.id))
          .map((n) => (
            <Marker
              key={n.id}
              position={[n.lat, n.lng]}
              icon={nodeIcon(n, {
                selected: selectedId === n.id,
                dim: dimOthers && !!highlightRoute && !routeSet.has(n.id),
                gatewayDown: gatewaysDown.has(n.id),
              })}
              keyboard={interactive && !!onSelect}
              title={`${n.name} (${n.id})`}
              alt={`${n.name}, ${n.type}`}
              eventHandlers={onSelect ? { click: () => onSelect(n.id) } : undefined}
              zIndexOffset={n.type === 'gateway' ? 600 : n.type === 'estacao' ? 300 : 0}
            >
              {interactive && (
                <Tooltip direction="top" offset={[0, -10]} className="rz-tip">
                  <strong>{n.name}</strong> · {n.id}
                </Tooltip>
              )}
            </Marker>
          ))}

        <PacketLayer packets={packets ?? livePackets} big={bigPackets} />
        {children}
      </MapContainer>
    </div>
  );
}

export function MapLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-jenipapo-950/85 p-3 text-xs text-palha-200 backdrop-blur ${className}`}>
      <p className="eyebrow mb-2 text-palha-300/70">Legenda</p>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="#EDE3CF" stroke="#3F9465" strokeWidth="2.6" /><circle cx="8" cy="8" r="2" fill="#0C1922" /></svg>
          Dispositivo comunitário
        </li>
        <li className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1 13 7 7 13 1 7z" fill="#12242F" stroke="#3F9465" strokeWidth="2" /></svg>
          Repetidor solar
        </li>
        <li className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8 21 7v10l-9 5.2L3 17V7z" fill="#1F6141" stroke="#FCF9F3" strokeWidth="1.8" /></svg>
          Estação IA + sensores
        </li>
        <li className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 30 30" aria-hidden="true"><rect x="2" y="2" width="26" height="26" rx="8" fill="#C2512E" stroke="#FCF9F3" strokeWidth="2" /></svg>
          Gateway (internet)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-px w-4 border-t border-dashed border-jenipapo-300" aria-hidden="true" />
          Enlace LoRa
        </li>
        <li className="flex items-center gap-2 text-palha-300/80">
          <span className="inline-block h-2 w-2 rounded-full bg-[#3F9465]" />online
          <span className="inline-block h-2 w-2 rounded-full bg-[#E2B126]" />instável
          <span className="inline-block h-2 w-2 rounded-full bg-[#5F7C8B]" />offline
        </li>
      </ul>
    </div>
  );
}
