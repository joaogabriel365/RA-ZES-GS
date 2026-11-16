import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, GraduationCap, Info, LogIn, LogOut, Menu, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CENTRAL_PHRASE } from '../../data/content';
import { nodeById } from '../../lib/graph';
import { fmtAgo } from '../../lib/format';
import { useNetwork } from '../../store/NetworkContext';
import { Logo, LogoMark } from '../brand/Logo';
import { LiveDot, useNow } from '../common/ui';

const NAV = [
  { to: '/', label: 'Início', end: true },
  { to: '/mapa', label: 'Mapa da rede' },
  { to: '/alertas', label: 'Alertas' },
  { to: '/ambiente', label: 'Ambiente' },
  { to: '/simulador', label: 'Simulador' },
  { to: '/console', label: 'Console' },
  { to: '/sobre', label: 'Como funciona' },
];

export function GatewayPill({ compact = false }: { compact?: boolean }) {
  const { primaryGateway, lastSync, gatewaysDown } = useNetwork();
  const now = useNow(1000);
  const gw = nodeById[primaryGateway];
  const isFallback = gatewaysDown.size > 0;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        isFallback ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' : 'border-floresta-300/30 bg-floresta-400/10 text-floresta-100'
      }`}
      role="status"
      aria-live="polite"
    >
      <LiveDot color={isFallback ? '#E2B126' : '#3F9465'} size={8} />
      {compact ? (
        <span>{fmtAgo(lastSync[primaryGateway], now)}</span>
      ) : (
        <span>
          {isFallback ? `${gw.name.replace('Gateway ', 'Gateway ')} assumiu` : 'Gateway principal online'} · última sincronização{' '}
          <span className="font-mono tabular-nums">{fmtAgo(lastSync[primaryGateway], now)}</span>
        </span>
      )}
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { isInstitution, logout } = useNetwork();
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  return (
    <header className="sticky top-0 z-[1100] border-b border-white/10 bg-jenipapo-900/95 backdrop-blur supports-[backdrop-filter]:bg-jenipapo-900/85">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded focus:bg-urucum-500 focus:px-3 focus:py-1 focus:text-white">
        Pular para o conteúdo
      </a>
      <div className="container-r flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="RAÍZES — início" className="shrink-0">
          <Logo size={34} />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `relative rounded-full px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-palha-300/75 hover:text-white'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}
                  <span className="relative">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isInstitution ? (
            <div className="hidden items-center gap-1 sm:flex">
              <NavLink to="/painel" className="btn bg-floresta-500 px-4 py-2 text-white hover:bg-floresta-600">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Painel institucional
              </NavLink>
              <button onClick={logout} className="rounded-full p-2 text-palha-300 hover:bg-white/10 hover:text-white" aria-label="Sair do painel institucional" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <NavLink to="/painel" className="btn-ghost-dark hidden px-4 py-2 sm:inline-flex">
              <LogIn className="h-4 w-4" aria-hidden="true" /> Acesso institucional
            </NavLink>
          )}
          <button
            className="rounded-full p-2 text-palha-100 hover:bg-white/10 xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-mobile"
            aria-label="Menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 xl:hidden"
          >
            <div className="container-r grid gap-1 py-3">
              {[...NAV, { to: '/painel', label: isInstitution ? 'Painel institucional' : 'Acesso institucional', end: false }].map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-palha-300 hover:bg-white/5'}`}
                >
                  {n.label}
                </NavLink>
              ))}
              {isInstitution && (
                <button onClick={logout} className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-palha-300 hover:bg-white/5">
                  Sair do painel
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-jenipapo-950 text-palha-300">
      <div className="bg-roots-dark absolute inset-0" aria-hidden="true" />
      <div className="container-r relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={40} />
          <p className="mt-5 max-w-md font-display text-2xl italic leading-snug text-palha-100">“{CENTRAL_PHRASE}”</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-palha-300/70">
            RAÍZES — Rede Autônoma de Informação, Zeladoria e Emergência Socioambiental. O projeto não substitui a fiscalização, a presença do Estado nem os serviços públicos:
            diminui a distância entre a informação produzida pela comunidade e quem deve responder.
          </p>
        </div>
        <div>
          <p className="eyebrow text-palha-300/50">Plataforma</p>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.slice(1).map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow text-palha-300/50">Sobre este protótipo</p>
          <p className="mt-4 text-sm leading-relaxed text-palha-300/70">
            Protótipo acadêmico desenvolvido para a Global Solution FIAP · tema CitizenTech · Engenharia da Computação. Todos os territórios, nós e ocorrências são fictícios. Rede mesh inspirada no
            projeto open source Meshtastic.
          </p>
          <p className="mt-4 text-xs text-palha-300/50">Imagens de satélite: © Esri, Maxar, Earthstar Geographics</p>
        </div>
      </div>
    </footer>
  );
}

function AcademicBadge() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[1200] sm:bottom-4 sm:left-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-jenipapo-950/85 py-1.5 pl-1.5 pr-3 text-[11px] font-medium text-palha-200 shadow-lg backdrop-blur">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-urucum-500/20">
          <GraduationCap className="h-3.5 w-3.5 text-urucum-300" aria-hidden="true" />
        </span>
        <span>
          Protótipo acadêmico <span className="text-palha-300/50">·</span> Dados simulados <span className="hidden text-palha-300/50 sm:inline">·</span>{' '}
          <span className="hidden sm:inline">Global Solution FIAP</span>
        </span>
      </div>
    </div>
  );
}

function Notices() {
  const { notices, dismissNotice } = useNetwork();
  return (
    <div className="pointer-events-none fixed right-3 top-20 z-[1200] flex w-[min(380px,calc(100vw-24px))] flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {notices.map((n) => {
          const Icon = n.tone === 'warn' ? TriangleAlert : n.tone === 'ok' ? CheckCircle2 : Info;
          const c = n.tone === 'warn' ? 'text-amber-300' : n.tone === 'ok' ? 'text-floresta-300' : 'text-sky-300';
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto flex gap-3 rounded-2xl border border-white/10 bg-jenipapo-900/95 p-4 text-sm text-palha-100 shadow-2xl backdrop-blur"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${c}`} aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold">{n.title}</p>
                <p className="mt-0.5 text-palha-300/80">{n.text}</p>
              </div>
              <button onClick={() => dismissNotice(n.id)} className="self-start rounded p-1 text-palha-300/60 hover:text-white" aria-label="Fechar aviso">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const fullBleed = ['/mapa', '/simulador', '/console'].includes(loc.pathname);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="conteudo" className={`flex-1 ${fullBleed ? 'bg-jenipapo-950' : ''}`}>
        {children}
      </main>
      {!fullBleed && <Footer />}
      {fullBleed && (
        <div className="flex items-center justify-center gap-2 bg-jenipapo-950 py-3 text-[11px] text-palha-300/40">
          <LogoMark size={14} /> RAÍZES · protótipo acadêmico
        </div>
      )}
      <AcademicBadge />
      <Notices />
    </div>
  );
}
