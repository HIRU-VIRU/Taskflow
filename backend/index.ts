import express, { Express } from 'express';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// API Routes
app.use('/api', routes);

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

// Start server
app.listen(PORT, () => {
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
║   Server running on port ${PORT}                                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}                               ║
║                                                               ║
║   API Base URL: http://localhost:${PORT}/api                      ║
║   Health Check: http://localhost:${PORT}/api/health               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
