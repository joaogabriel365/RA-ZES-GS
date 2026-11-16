import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { NetworkProvider } from './store/NetworkContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NetworkProvider>
        <App />
      </NetworkProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
