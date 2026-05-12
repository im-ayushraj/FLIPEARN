import mongoose from 'mongoose';

const redactMongoUri = (uri = '') =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i, '$1$2:***@');

const isMongoUri = (uri) => /^mongodb(?:\+srv)?:\/\//i.test(uri || '');

export const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MongoDB URI missing. Set MONGODB_URI in server/.env.');
  }

  if (!isMongoUri(uri)) {
    throw new Error(
      `Invalid MongoDB URI protocol. Expected mongodb:// or mongodb+srv://, received ${redactMongoUri(uri)}`
    );
  }

  return uri;
};

const connectWithUri = (uri) => mongoose.connect(uri, {
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 20,
  family: 4,
  retryWrites: false,
});

const connectDB = async () => {
  const uri = getMongoUri();
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;
  const localDevUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/flipearn';
  const shouldPreferLocal =
    process.env.NODE_ENV !== 'production' &&
    process.env.MONGODB_PREFER_LOCAL === 'true' &&
    isMongoUri(localDevUri);

  try {
    await connectWithUri(shouldPreferLocal ? localDevUri : uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    const isSrvResolutionError =
      typeof error?.message === 'string' &&
      (error.message.includes('querySrv ECONNREFUSED') ||
        error.message.includes('querySrv ENOTFOUND') ||
        error.message.includes('querySrv ETIMEOUT'));

    if (isSrvResolutionError && fallbackUri && isMongoUri(fallbackUri)) {
      try {
        console.warn('MongoDB SRV lookup failed. Retrying with MONGODB_URI_FALLBACK.');
        await connectWithUri(fallbackUri);
        console.log(`MongoDB connected with fallback: ${mongoose.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`MongoDB fallback error: ${fallbackError.message}`);
      }
    }

    if (process.env.NODE_ENV !== 'production' && localDevUri && isMongoUri(localDevUri)) {
      try {
        console.warn('Remote MongoDB unavailable. Retrying with local development MongoDB.');
        await connectWithUri(localDevUri);
        console.log(`MongoDB connected locally: ${mongoose.connection.host}`);
        return;
      } catch (localError) {
        console.error(`Local MongoDB fallback error: ${localError.message}`);
      }
    }

    console.error(`MongoDB connection error: ${error.message}`);

    if (error?.message?.includes('Could not connect to any servers in your MongoDB Atlas cluster')) {
      console.error('MongoDB Atlas troubleshooting checklist:');
      console.error('1) Atlas Network Access: add your current public IP (or 0.0.0.0/0 for development).');
      console.error('2) Atlas Database Access: verify DB user/password and role permissions.');
      console.error('3) Atlas Cluster status: ensure cluster is not paused.');
      console.error('4) URI check: confirm the URI points to your active cluster and database.');
      console.error(`5) URI in use: ${redactMongoUri(uri)}`);
    }

    throw error;
  }
};

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

export default connectDB;
