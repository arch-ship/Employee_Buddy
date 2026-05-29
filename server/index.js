// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');

require('./config/passport'); // load passport strategies

const authRoutes     = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const emailRoutes    = require('./routes/email');
const leaveRoutes    = require('./routes/leave');
const departmentRoutes = require('./routes/departments');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/employees',   employeeRoutes);
app.use('/api/email',       emailRoutes);
app.use('/api/leave',       leaveRoutes);
app.use('/api/departments', departmentRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
