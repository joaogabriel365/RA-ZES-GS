export const pad = (n: number) => String(n).padStart(2, '0');

export function fmtTime(t: number, withSeconds = true) {
  const d = new Date(t);
  return withSeconds ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDate(t: number) {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function fmtDateTime(t: number) {
  return `${fmtDate(t)} ${fmtTime(t, false)}`;
}

/** Faixa de horário aproximada (visão pública não expõe o horário exato de relatos). */
export function fmtPeriod(t: number) {
  const d = new Date(t);
  const h = d.getHours();
  const p = h < 6 ? 'madrugada' : h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite';
  const today = new Date();
  const diffDays = Math.floor((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  const day = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'ontem' : fmtDate(t);
  return `${day}, ${p}`;
}

export function fmtDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${s % 60 && m < 10 ? ` ${s % 60} s` : ''}`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h${m % 60 ? ` ${m % 60} min` : ''}`;
  return `${Math.floor(h / 24)} dias`;
}

export function fmtAgo(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 5) return 'agora';
  if (s < 60) return `há ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export const nf = new Intl.NumberFormat('pt-BR');
export const fmtNum = (n: number, decimals = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function bytesOf(obj: unknown) {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}
