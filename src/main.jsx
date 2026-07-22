import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'
import { errorMetadata, logger, safePath } from './lib/logger.js'

window.addEventListener('error', (event) => {
  logger.error('window_error', 'Unhandled browser error', {
    ...errorMetadata(event.error),
    source_path: safePath(event.filename),
    line_number: event.lineno,
    column_number: event.colno,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  logger.error('unhandled_rejection', 'Unhandled promise rejection', {
    ...errorMetadata(event.reason),
  })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
