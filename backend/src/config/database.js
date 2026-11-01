require('dotenv').config();
const mongoose = require('mongoose');

let mongoServer = null;

async function connectDB() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aadhirai';

  try {
    await mongoose.connect(uri, {
      dbName: 'aadhirai',
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[DB] MongoDB connected successfully to real persistent database:', uri);
    return;
  } catch (err) {
    console.warn('[DB] Failed to connect to standard MongoDB URI, attempting fallback:', err.message);
  }

  // Fallback to MongoMemoryServer only if local MongoDB daemon is unreachable
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const dataDir = require('path').join(__dirname, '..', '..', 'mongo_data');
  require('fs').mkdirSync(dataDir, { recursive: true });
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'aadhirai',
      dbPath: dataDir,
    },
  });
  uri = mongoServer.getUri() + 'aadhirai';
  console.log('[DB] Using MongoMemoryServer fallback:', uri);

  await mongoose.connect(uri, {
    dbName: 'aadhirai',
  });
  console.log('[DB] MongoDB connected (fallback mode):', mongoose.connection.host);
}

module.exports = { connectDB };
