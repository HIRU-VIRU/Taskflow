import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('dev')); // Colorful dev format
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - Disabled in development
if (process.env.NODE_ENV === 'production') {
  app.use(rateLimiter({ windowMs: 60 * 1000, max: 100 }));
}

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
