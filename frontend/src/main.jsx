import React from 'react'
import ReactDOM from 'react-dom/client'

// Global Error Catch for Debugging
window.onerror = function(message, source, lineno, colno, error) {
  const errText = `❌ APP CRASH: ${message}\nAt: ${source}:${lineno}:${colno}\nStack: ${error?.stack}`;
  console.error(errText);
  // Show alert ONLY in production if it's a blank screen
  if (window.location.hostname !== 'localhost') {
    alert(errText);
  }
};
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
