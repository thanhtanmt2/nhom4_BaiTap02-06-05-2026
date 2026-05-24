require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS support
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const passwordRoutes = require('./routes/password.routes');
const adminRoutes = require('./routes/admin.routes');
const configRoutes = require('./routes/configRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);

module.exports = app;
