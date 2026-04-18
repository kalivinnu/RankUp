import './prism-init'; // Loads Prism and sets window.Prism before anything else
import React from 'react'
import ReactDOM from 'react-dom/client'

// Global Error Catch for Debugging
window.onerror = function(message, source, lineno, colno, error) {
  const errText = `❌ APP CRASH: ${message}\nAt: ${source}:${lineno}:${colno}\nStack: ${error?.stack}`;
  console.error(errText);
  
  // Create a visible error overlay if the app crashes entirely
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100vw';
  errorDiv.style.height = '100vh';
  errorDiv.style.background = '#0f172a';
  errorDiv.style.color = '#ef4444';
  errorDiv.style.padding = '2rem';
  errorDiv.style.zIndex = '99999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.overflow = 'auto';
  errorDiv.innerHTML = `
    <h1 style="color: #ef4444">Application Error</h1>
    <p>The application has encountered a critical error and could not load.</p>
    <pre style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(239,68,68,0.3)">${errText}</pre>
    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.8rem 1.5rem; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
  `;
  document.body.appendChild(errorDiv);
};

import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
