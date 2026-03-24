import express, { Express } from 'express';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

console.log('🚀 Starting TaskFlow server...');
console.log('📍 Node environment:', process.env.NODE_ENV || 'development');
console.log('📍 Port:', process.env.PORT || 3000);

const app: Express = express();
const PORT = process.env.PORT || 3000;

console.log('✅ Express app created');

// Basic middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('✅ Basic middleware loaded');

// Simple health check that doesn't require database
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

console.log('✅ Basic health check route added');

// Test database connection before loading full routes
async function testDatabaseAndStartServer() {
  try {
    console.log('🔍 Testing database connection...');
    const { db } = await import('./config/database');

    const result = await db.raw('SELECT NOW() as time');
    console.log('✅ Database connected successfully at:', result.rows[0].time);

    // Now load the full application routes
    console.log('📚 Loading application routes...');
    const routes = await import('./routes');
    const { errorHandler } = await import('./middleware/errorHandler');
    const { rateLimiter } = await import('./middleware/rateLimiter');

    console.log('✅ Routes and middleware loaded');

    // Add rate limiting
    app.use(rateLimiter);

    // API Routes
    app.use('/api', routes.default);

    // Error handling
    app.use(errorHandler);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`,
        },
      });
    });

    console.log('✅ All middleware and routes configured');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('📋 Server will start without database features');
  }

  // Start server regardless of database status
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗  ██║
║   ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║
║      ██║   ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║
║      ██║   ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║
║      ██║   ██║  ██║███████║██║  ██╗██║     ███████╗╚██████╔╝██║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝
║                                                               ║
║   Multi-Tenant Project Management SaaS                        ║
║   with Subscription & Feature Entitlement System              ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║   ✅ Server running on port ${PORT}                              ║
║   ✅ Environment: ${process.env.NODE_ENV || 'development'}                       ║
║   ✅ Listening on: 0.0.0.0:${PORT}                               ║
║                                                               ║
║   🌐 Local:     http://localhost:${PORT}/health                 ║
║   🌐 API Base:  http://localhost:${PORT}/api/health             ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    console.log('🚀 Server startup complete!');
    console.log(`   Access the server at: http://localhost:${PORT}/health`);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
testDatabaseAndStartServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;