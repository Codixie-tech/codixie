import './renderer/src/styles/globals.css';
import './renderer/src/styles/hljs.css';
import './renderer/src/styles/triple-toggler.css';
import 'remixicon/fonts/remixicon.css';
import '@fontsource/inter/100.css';
import '@fontsource/inter/200.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './renderer/src/App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
