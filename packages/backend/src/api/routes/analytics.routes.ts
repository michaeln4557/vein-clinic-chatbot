import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const DateRangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  locationId: z.string().uuid().optional(),
  channel: z.enum(['web', 'sms', 'voice', 'missed-call']).optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

const AbTestParams = z.object({
  testId: z.string().uuid(),
});

// ── Response Types ─────────────────────────────────────────────────
interface MissedCallRecoveryStats {
  totalMissedCalls: number;
  smsOutreachSent: number;
  conversationsStarted: number;
  appointmentsBooked: number;
  recoveryRate: number;
  avgResponseTimeMinutes: number;
  timeSeries: Array<{ date: string; recovered: number; total: number }>;
}

interface ConversionStats {
  totalConversations: number;
  leadsGenerated: number;
  appointmentsScheduled: number;
  conversionRate: number;
  avgTurnsToConversion: number;
  byChannel: Record<string, { conversations: number; conversions: number; rate: number }>;
  timeSeries: Array<{ date: string; conversations: number; conversions: number }>;
}

interface DropOffStats {
  totalSessions: number;
  dropOffs: number;
  dropOffRate: number;
  byStep: Array<{ step: string; dropOffs: number; percentage: number }>;
  commonExitMessages: Array<{ message: string; count: number }>;
}

interface AbTestResult {
  testId: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  variants: Array<{
    id: string;
    name: string;
    trafficPercent: number;
    conversions: number;
    conversations: number;
    conversionRate: number;
    avgSatisfaction: number;
  }>;
  winner?: string;
  confidence: number;
  startedAt: string;
  endedAt?: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function getMissedCallRecoveryStats(
  _filters: z.infer<typeof DateRangeQuery>,
): Promise<MissedCallRecoveryStats> {
  return {
    totalMissedCalls: 0,
    smsOutreachSent: 0,
    conversationsStarted: 0,
    appointmentsBooked: 0,
    recoveryRate: 0,
    avgResponseTimeMinutes: 0,
    timeSeries: [],
  };
}

async function getConversionStats(
  _filters: z.infer<typeof DateRangeQuery>,
): Promise<ConversionStats> {
  return {
    totalConversations: 0,
    leadsGenerated: 0,
    appointmentsScheduled: 0,
    conversionRate: 0,
    avgTurnsToConversion: 0,
    byChannel: {},
    timeSeries: [],
  };
}

async function getDropOffStats(
  _filters: z.infer<typeof DateRangeQuery>,
): Promise<DropOffStats> {
  return {
    totalSessions: 0,
    dropOffs: 0,
    dropOffRate: 0,
    byStep: [],
    commonExitMessages: [],
  };
}

async function getAbTestResults(_testId: string): Promise<AbTestResult | null> {
  return null;
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// GET /analytics/missed-call-recovery
router.get(
  '/missed-call-recovery',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ query: DateRangeQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await getMissedCallRecoveryStats(req.query as any);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
);

// GET /analytics/conversion
router.get(
  '/conversion',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ query: DateRangeQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await getConversionStats(req.query as any);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
);

// GET /analytics/drop-off
router.get(
  '/drop-off',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ query: DateRangeQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await getDropOffStats(req.query as any);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
);

// GET /analytics/ab-tests/:testId
router.get(
  '/ab-tests/:testId',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: AbTestParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getAbTestResults(req.params.testId);
      if (!result) {
        res.status(404).json({ error: 'A/B test not found' });
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
