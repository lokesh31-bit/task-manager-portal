require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for Authorization header
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Base route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: require('./config/db').db.dbType() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message, err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Initialize DB and start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server due to database initialization failure:', err.message);
    process.exit(1);
  }
}

// Support direct execution or testing imports
if (require.main === module) {
  startServer();
}

module.exports = app; // Export for unit tests
