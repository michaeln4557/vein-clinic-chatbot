import express, { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// ─── Logger Setup ───────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'vein-clinic-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// ─── Express App ────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Request ID + logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  (req as any).requestId = requestId;
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// ─── Health Check ───────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────

// TODO: Import and mount route modules once implemented
// app.use('/api/v1/conversations', conversationRoutes);
// app.use('/api/v1/playbooks', playbookRoutes);
// app.use('/api/v1/policies', policyRoutes);
// app.use('/api/v1/locations', locationRoutes);
// app.use('/api/v1/scheduling', schedulingRoutes);
// app.use('/api/v1/sliders', sliderRoutes);
// app.use('/api/v1/feedback', feedbackRoutes);
// app.use('/api/v1/audit', auditRoutes);
// app.use('/api/v1/analytics', analyticsRoutes);
// app.use('/api/v1/handoff', handoffRoutes);
// app.use('/api/v1/crm', crmRoutes);
// app.use('/api/v1/auth', authRoutes);

// Placeholder route to demonstrate orchestration flow
app.post('/api/v1/conversations/:conversationId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { content, channel } = req.body;

    // TODO: Wire up OrchestrationService
    // const orchestrationService = container.get(OrchestrationService);
    // const result = await orchestrationService.processMessage(conversationId, { content, channel });

    res.status(200).json({
      conversationId,
      message: 'Message received - orchestration service not yet wired',
      input: { content, channel },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 404 Handler ────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${_req.method} ${_req.path} does not exist`,
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any).requestId;
  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected error occurred' : err.message,
    requestId,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Vein Clinic Backend listening on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
    });
  });
}

export { app, logger };
