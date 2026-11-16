// Logotipo RAÍZES: uma semente que emite sinal e se ramifica em raízes conectadas (rede mesh)
interface Props {
  size?: number;
  className?: string;
  tone?: 'light' | 'dark';
  withText?: boolean;
}

export function LogoMark({ size = 36, tone = 'light', className = '' }: Omit<Props, 'withText'>) {
  const ink = tone === 'light' ? '#EDE3CF' : '#0C1922';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="img" aria-label="Símbolo RAÍZES: raízes que formam uma rede">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8.6a8.6 8.6 0 0 1 12 0" stroke="#D46C41" strokeWidth="2.4" />
        <path d="M14.4 4.8a13.8 13.8 0 0 1 19.2 0" stroke="#D46C41" strokeWidth="2.2" opacity="0.55" />
        <path d="M24 15.5v7" stroke={ink} strokeWidth="2.6" />
        <path d="M24 22.5c0 5.5-8.5 5.2-12 11.2M24 22.5c0 5.5 8.5 5.2 12 11.2M24 22.5V39.5M12 33.7c-1.6 2.6-2.8 5-3.4 8M36 33.7c1.6 2.6 2.8 5 3.4 8" stroke={ink} strokeWidth="2.4" />
        <path d="M12 33.7 24 39.5 36 33.7" stroke="#6FB38A" strokeWidth="1.6" strokeDasharray="1.6 2.8" />
      </g>
      <circle cx="24" cy="14.6" r="3.6" fill="#D46C41" />
      <g fill={ink}>
        <circle cx="12" cy="33.7" r="2.5" />
        <circle cx="36" cy="33.7" r="2.5" />
        <circle cx="24" cy="39.5" r="2.5" />
        <circle cx="8.6" cy="41.7" r="1.9" />
        <circle cx="39.4" cy="41.7" r="1.9" />
      </g>
    </svg>
  );
}

export function Logo({ size = 36, tone = 'light', withText = true, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} tone={tone} />
      {withText && (
        <span className="leading-none">
          <span className={`block font-display text-[1.35rem] font-semibold tracking-[0.06em] ${tone === 'light' ? 'text-palha-100' : 'text-jenipapo-900'}`}>
            RAÍZES
          </span>
          <span className={`mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] ${tone === 'light' ? 'text-palha-300/70' : 'text-jenipapo-500'}`}>
            Rede comunitária
          </span>
        </span>
      )}
    </span>
  );
}
