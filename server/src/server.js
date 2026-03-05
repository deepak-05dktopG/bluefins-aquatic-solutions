/**
 * What it is: Backend server entry point (starts Express API + connects DB).
 * Non-tech note: This is the “engine” that powers the website’s data.
 */

import './config/env.js'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import apiRoutes from './routes/api.js'
import { startWhatsAppExpiryReminderCron } from '../services/whatsappReminder.js'

// Connect to database
connectDB()

// Daily WhatsApp expiry reminders (Meta WhatsApp Cloud API)
startWhatsAppExpiryReminderCron()

const app = express()

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://blufinsaquatics.netlify.app',
  'https://bluefins.netlify.app',
  'https://bluefins-aquatic-solutions.netlify.app',
  "https://bluefinsaquaticsolutions.com"
]

app.use(cors({
  /**
   * Purpose: Helper callback used inside a larger operation
   * Plain English: What this function is used for.
   */
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Capture raw body (needed for Razorpay webhook signature verification)
app.use(
  express.json({
    /**
     * Purpose: Do Verify
     * Plain English: What this function is used for.
     */
    verify: (req, res, buf) => {
      req.rawBody = buf
    },
  })
)

// Health check endpoint
app.get('/', /**
 * Purpose: Helper callback used inside a larger operation
 * Plain English: What this function is used for.
 */
(req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bluefins Aquatic Solutions API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/health', /**
 * Purpose: Helper callback used inside a larger operation
 * Plain English: What this function is used for.
 */
(req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() })
})

// Routes
app.use('/api', apiRoutes)

// 404 handler
app.use('*', /**
 * Purpose: Helper callback used inside a larger operation
 * Plain English: What this function is used for.
 */
(req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Error handler
app.use(/**
 * Purpose: Helper callback used inside a larger operation
 * Plain English: What this function is used for.
 */
(err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
})

const PORT = process.env.PORT || 8000

app.listen(PORT, /**
 * Purpose: Helper callback used inside a larger operation
 * Plain English: What this function is used for.
 */
() => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  console.log(`📍 API available at http://localhost:${PORT}/api`)
})