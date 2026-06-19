require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { corsHeaders } = require('./middleware');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
db.initDB();
db.ensureAdminExists();

// Middleware
app.use(corsHeaders);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 API available at http://localhost:${PORT}/api`);
  console.log(`💾 Database: JSON file (data.json)`);
  console.log(`\n🔑 Default Admin:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
});
