/**
 * What it is: Backend server entry point (starts Express API + connects DB).
 * Non-tech note: This is the “engine” that powers the website’s data.
 */

import './config/env.js'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import apiRoutes from './routes/api.js'

// Connect to database
connectDB()

const app = express()
 
// Middleware 
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://blufinsaquatics.netlify.app',
  'https://bluefins.netlify.app',
  'https://bluefins-aquatic-solutions.netlify.app',
  'https://bluefinsaquaticsolutions.com',
  'https://www.bluefinsaquaticsolutions.com',
]

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Capture raw body (needed for Razorpay webhook signature verification)
app.use(
  express.json({
    // Stores the raw request body for Razorpay webhook signature verification
    verify: (req, res, buf) => {
      req.rawBody = buf
    },
  })
)

// Health check endpoint
// Returns a status message confirming the Bluefins API is running
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bluefins Aquatic Solutions API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Health check endpoint for deployment monitors (Netlify/Vercel)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() })
})

// Routes
app.use('/api', apiRoutes)

// 404 handler
// Catches any unmatched routes and returns 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Error handler
// Global error handler — hides stack traces in production
app.use((err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
})

const PORT = process.env.PORT || 8000

// Start the server and log the API URL
app.listen(PORT,
() => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  console.log(`📍 API available at http://localhost:${PORT}/api`)

  // Start expiry notification scheduler (safely skips if WhatsApp not connected)
  import('./utils/expiryNotifier.js').then(({ startExpiryNotifier }) => {
    startExpiryNotifier();
  }).catch(err => {
    console.error('⚠️ Expiry notifier failed to load (non-blocking):', err.message);
  });

  // NOTE: WhatsApp is NOT auto-started to stay within Render's 512MB RAM limit.
  // Admin must click "Connect WhatsApp" button in the admin panel to start it.
})