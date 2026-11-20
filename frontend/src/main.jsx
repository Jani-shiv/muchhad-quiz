import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Inject Google Analytics / Tag Manager on all pages
// Exact script from user, with ID from environment variable
if (import.meta.env.VITE_GTM_ID) {
  // First script: async GTM loader
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtm.js?id=${import.meta.env.VITE_GTM_ID}`;
  document.head.appendChild(script1);

  // Second script: dataLayer and gtag function
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  `;
  document.head.appendChild(script2);

  // Noscript fallback
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${import.meta.env.VITE_GTM_ID}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
