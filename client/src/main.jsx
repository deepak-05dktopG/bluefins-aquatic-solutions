/**
 * What it is: Frontend entry point (starts the React website in the browser).
 * Non-tech note: This is the “start button” for the website UI.
 */

import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/custom.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>
)