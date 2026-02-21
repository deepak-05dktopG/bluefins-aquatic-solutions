import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bluefins'
    const conn = await mongoose.connect(mongoUri)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    console.log(`📊 Database: ${conn.connection.name}`)

    // Auto-fix legacy indexes in development.
    // Some older DBs have a unique index on `members.email` which breaks inserts when email is missing (null).
    if (process.env.NODE_ENV !== 'production') {
      try {
        const members = conn.connection.db.collection('members')
        const indexes = await members.indexes()
        const emailIndex = indexes.find((i) => i?.name === 'email_1')
        if (emailIndex?.unique && emailIndex?.sparse !== true) {
          await members.dropIndex('email_1')
          console.log('🧹 Dropped legacy unique index members.email_1 (non-sparse)')
        }
      } catch (e) {
        // Ignore if collection/index doesn't exist or permissions disallow it.
        console.log(`ℹ️ Index check skipped: ${e.message}`)
      }
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    console.error('💡 Tip: Start local MongoDB and ensure it is listening on 127.0.0.1:27017')
    process.exit(1)
  }
}

export default connectDB