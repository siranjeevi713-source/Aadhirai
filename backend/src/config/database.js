require('dotenv').config();
const mongoose = require('mongoose');

let mongoServer = null;

async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    // Use mongodb-memory-server for zero-config development
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
    console.log('[DB] Using MongoMemoryServer (persistent mode):', uri);
  }

  await mongoose.connect(uri, {
    dbName: 'aadhirai',
  });

  console.log('[DB] MongoDB connected:', mongoose.connection.host);
}

module.exports = { connectDB };
