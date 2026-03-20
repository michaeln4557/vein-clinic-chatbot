import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const CreateTestSessionBody = z.object({
  playbookId: z.string().uuid(),
  sliderOverrides: z.record(z.number().min(0).max(100)).optional(),
  channel: z.enum(['web', 'sms', 'voice', 'missed-call']).default('web'),
  description: z.string().max(500).optional(),
});

const TestSessionIdParams = z.object({
  id: z.string().uuid(),
});

const TestMessageBody = z.object({
  content: z.string().min(1).max(4000),
  simulateDelay: z.coerce.boolean().default(false),
});

// ── Response Types ─────────────────────────────────────────────────
interface TestSession {
  id: string;
  playbookId: string;
  channel: string;
  status: 'active' | 'completed';
  description?: string;
  sliderOverrides?: Record<string, number>;
  messages: TestMessage[];
  trace: TestTurnTrace[];
  createdAt: string;
}

interface TestMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface TestTurnTrace {
  turnId: string;
  policyDecisions: string[];
  playbookStep: string;
  extractedFields: Record<string, unknown>;
  sliderValues: Record<string, number>;
  llmLatencyMs: number;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function createTestSession(
  _data: z.infer<typeof CreateTestSessionBody>,
  _userId: string,
): Promise<TestSession> {
  return {
    id: crypto.randomUUID(),
    playbookId: _data.playbookId,
    channel: _data.channel,
    status: 'active',
    description: _data.description,
    sliderOverrides: _data.sliderOverrides,
    messages: [],
    trace: [],
    createdAt: new Date().toISOString(),
  };
}

async function getTestSession(_id: string): Promise<TestSession | null> {
  return null;
}

async function sendTestMessage(
  _sessionId: string,
  _data: z.infer<typeof TestMessageBody>,
): Promise<{ message: TestMessage; trace: TestTurnTrace }> {
  const turnId = crypto.randomUUID();
  return {
    message: {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '[stub] test response',
      timestamp: new Date().toISOString(),
    },
    trace: {
      turnId,
      policyDecisions: [],
      playbookStep: 'greeting',
      extractedFields: {},
      sliderValues: {},
      llmLatencyMs: 0,
    },
  };
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// POST /test/sessions
router.post(
  '/sessions',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ body: CreateTestSessionBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await createTestSession(req.body, (req as any).user.sub);
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  },
);

// GET /test/sessions/:id
router.get(
  '/sessions/:id',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: TestSessionIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await getTestSession(req.params.id);
      if (!session) throw new NotFoundError('TestSession', req.params.id);
      res.json(session);
    } catch (err) {
      next(err);
    }
  },
);

// POST /test/sessions/:id/messages
router.post(
  '/sessions/:id/messages',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: TestSessionIdParams, body: TestMessageBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sendTestMessage(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
