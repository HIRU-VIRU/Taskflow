import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple middleware
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`   Visit: http://localhost:${PORT}/api/health`);
  console.log(`   Test:  http://localhost:${PORT}/test`);
});