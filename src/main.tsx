import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/dm-mono/300.css';
import '@fontsource/dm-mono/500.css';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';
import { StoreProvider } from './data/store';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>,
);
