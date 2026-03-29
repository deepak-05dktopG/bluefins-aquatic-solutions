/**
 * What it is: Database connector (MongoDB).
 * Non-tech note: This connects the server to the database where data is stored.
 */

import mongoose from 'mongoose'

// Connects to MongoDB and logs the connection status. Retries every 5s on failure.
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bluefins'

  const tryConnect = async () => {
    try {
      const conn = await mongoose.connect(mongoUri)
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
      console.log(`📊 Database: ${conn.connection.name}`)

      // Auto-fix legacy indexes in development.
      if (process.env.NODE_ENV !== 'production') {
        try {
          const members = conn.connection.db.collection('members')
          const indexes = await members.indexes()
          const emailIndex = indexes.find(i => i?.name === 'email_1')
          if (emailIndex?.unique && emailIndex?.sparse !== true) {
            await members.dropIndex('email_1')
            console.log('🧹 Dropped legacy unique index members.email_1 (non-sparse)')
          }
        } catch (e) {
          console.log(`ℹ️ Index check skipped: ${e.message}`)
        }
      }
    } catch (error) {
      console.error(`❌ MongoDB Connection Error: ${error.message}`)
      console.log('🔄 Retrying MongoDB connection in 5 seconds...')
      setTimeout(tryConnect, 5000) // Retry instead of crashing
    }
  };

  tryConnect();
};

export default connectDB