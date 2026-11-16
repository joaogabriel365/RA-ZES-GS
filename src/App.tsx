import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { About } from './pages/About';
import { Alerts } from './pages/Alerts';
import { Console } from './pages/Console';
import { Environment } from './pages/Environment';
import { Home } from './pages/Home';
import { Institutional } from './pages/Institutional';
import { MapPage } from './pages/MapPage';
import { NotFound } from './pages/NotFound';
import { OccurrenceDetail } from './pages/OccurrenceDetail';
import { Simulator } from './pages/Simulator';

export default function App() {
  const location = useLocation();
  return (
    <Layout>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/mapa" element={<MapPage />} />
            <Route path="/alertas" element={<Alerts />} />
            <Route path="/alertas/:id" element={<OccurrenceDetail />} />
            <Route path="/ambiente" element={<Environment />} />
            <Route path="/simulador" element={<Simulator />} />
            <Route path="/painel" element={<Institutional />} />
            <Route path="/console" element={<Console />} />
            <Route path="/sobre" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
