import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import productRoutes from './routes/products.js';
import scanRoutes from './routes/scan.js';
import analyticsRoutes from './routes/analytics.js';
import couponsRoutes from './routes/coupons.js';
import feedbackRoutes from './routes/feedback.js';
import downloadRoute from './routes/download.js';
import eventRoutes from './routes/events.js';
import authRoutes from './routes/auth.js';
import visitorRoutes from './routes/visitors.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/scan',      scanRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/coupons',   couponsRoutes);
app.use('/api/feedback',  feedbackRoutes);
app.use('/api/download',  downloadRoute);
app.use('/api/events',    eventRoutes);
app.use('/api/visitors',  visitorRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'smart-mall-server' });
});

// Global error handler — catches async throws from any route
app.use((err, _req, res, _next) => {
  const status = err.response?.status || err.status || 500;
  const message = err.response?.data?.detail || err.message || 'Internal server error';
  console.error(`[ERROR] ${status} —`, message);
  res.status(status).json({ success: false, error: message });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
