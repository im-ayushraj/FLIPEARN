import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import 'express-async-errors';
import connectDB from './lib/db.js';

import userRoutes from './routes/user.routes.js';
import listingRoutes from './routes/listing.routes.js';
import orderRoutes from './routes/order.routes.js';
import withdrawalRoutes from './routes/withdrawal.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Raw body must be registered before express.json() for Clerk webhook signatures.
app.use('/api/user/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: {
      state: mongoose.connection.readyState,
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/user', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err);

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Record already exists' });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`FlipEarn server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        await mongoose.connection.close(false);
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Server failed to start because the database connection failed.');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

export default app;
