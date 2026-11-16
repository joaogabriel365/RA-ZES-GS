import { Link } from 'react-router-dom';
import { LogoMark } from '../components/brand/Logo';

export function NotFound() {
  return (
    <div className="container-r grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <LogoMark size={64} tone="dark" className="mx-auto" />
        <h1 className="mt-6 font-display text-4xl font-semibold">Este caminho não chegou ao gateway</h1>
        <p className="mt-3 text-jenipapo-600">A página que você procura não existe neste protótipo.</p>
        <Link to="/" className="btn-primary mt-8">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
