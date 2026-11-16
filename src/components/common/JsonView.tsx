import { motion } from 'framer-motion';

/** JSON compacto com realce de sintaxe; `animateLines` revela linha a linha. */
export function JsonView({ data, animateLines = false, className = '' }: { data: Record<string, unknown>; animateLines?: boolean; className?: string }) {
  const entries = Object.entries(data);
  return (
    <pre className={`scroll-thin overflow-x-auto rounded-xl bg-jenipapo-950 p-3 font-mono text-[12px] leading-[1.6] text-palha-200 ring-1 ring-inset ring-white/10 ${className}`}>
      <span className="text-palha-300/60">{'{'}</span>
      {entries.map(([k, v], i) => {
        const val =
          typeof v === 'string' ? (
            <span className="text-floresta-200">"{v}"</span>
          ) : typeof v === 'number' ? (
            <span className="text-amber-300">{v}</span>
          ) : (
            <span className="text-sky-300">{JSON.stringify(v)}</span>
          );
        const line = (
          <>
            {'  '}
            <span className="text-urucum-300">"{k}"</span>
            <span className="text-palha-300/60">: </span>
            {val}
            {i < entries.length - 1 && <span className="text-palha-300/60">,</span>}
          </>
        );
        return animateLines ? (
          <motion.div key={k} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09 }} className="whitespace-pre-wrap break-all">
            {line}
          </motion.div>
        ) : (
          <div key={k} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        );
      })}
      <span className="text-palha-300/60">{'}'}</span>
    </pre>
  );
}
