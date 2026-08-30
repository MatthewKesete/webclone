const express = require('express');
const cors = require('cors');
const db = require('./db');

const studentsRouter = require('./routes/students');
const classesRouter = require('./routes/classes');
const schedulesRouter = require('./routes/schedules');
const attendanceRouter = require('./routes/attendance');
const employeesRouter = require('./routes/employees');
const transcriptsRouter = require('./routes/transcripts');

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.NETLIFY ? '' : '/api';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbEngine: db.mode
  });
});

// API Routes
app.use(`${API_PREFIX}/students`, studentsRouter);
app.use(`${API_PREFIX}/classes`, classesRouter);
app.use(`${API_PREFIX}/schedules`, schedulesRouter);
app.use(`${API_PREFIX}/attendance`, attendanceRouter);
app.use(`${API_PREFIX}/employees`, employeesRouter);
app.use(`${API_PREFIX}/transcripts`, transcriptsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error', details: err.message });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[API Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
