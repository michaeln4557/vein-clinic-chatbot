import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const CallbackBody = z.object({
  conversationId: z.string().uuid(),
  patientName: z.string().min(1),
  phoneNumber: z.string().min(10),
  preferredTime: z.string().optional(),
  reason: z.string().max(500).optional(),
});

const EscalateBody = z.object({
  conversationId: z.string().uuid(),
  reason: z.enum([
    'complex_medical',
    'billing_dispute',
    'complaint',
    'insurance_issue',
    'patient_request',
    'bot_failure',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  notes: z.string().max(2000).optional(),
});

const QueueTypeParams = z.object({
  type: z.enum(['callback', 'escalation']),
});

const QueueQuery = z.object({
  status: z.enum(['pending', 'assigned', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const HandoffIdParams = z.object({
  id: z.string().uuid(),
});

const AssignBody = z.object({
  agentId: z.string().uuid(),
});

const ResolveBody = z.object({
  resolution: z.string().min(1).max(2000),
  outcome: z.enum(['resolved', 'escalated_further', 'no_action_needed']),
});

// ── Response Types ─────────────────────────────────────────────────
interface HandoffItem {
  id: string;
  type: 'callback' | 'escalation';
  conversationId: string;
  status: 'pending' | 'assigned' | 'resolved';
  priority: string;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function requestCallback(_data: z.infer<typeof CallbackBody>): Promise<HandoffItem> {
  return {
    id: crypto.randomUUID(),
    type: 'callback',
    conversationId: _data.conversationId,
    status: 'pending',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  };
}

async function escalateToHuman(_data: z.infer<typeof EscalateBody>): Promise<HandoffItem> {
  return {
    id: crypto.randomUUID(),
    type: 'escalation',
    conversationId: _data.conversationId,
    status: 'pending',
    priority: _data.priority,
    createdAt: new Date().toISOString(),
  };
}

async function getHandoffQueue(
  _type: string,
  _filters: z.infer<typeof QueueQuery>,
): Promise<{ items: HandoffItem[]; total: number }> {
  return { items: [], total: 0 };
}

async function assignAgent(_id: string, _agentId: string): Promise<HandoffItem | null> {
  return null;
}

async function resolveHandoff(
  _id: string,
  _data: z.infer<typeof ResolveBody>,
  _userId: string,
): Promise<HandoffItem | null> {
  return null;
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// POST /handoff/callback
router.post(
  '/callback',
  authenticate,
  validate({ body: CallbackBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await requestCallback(req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

// POST /handoff/escalate
router.post(
  '/escalate',
  authenticate,
  validate({ body: EscalateBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await escalateToHuman(req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

// GET /handoff/queue/:type
router.get(
  '/queue/:type',
  authenticate,
  requireRole('admin', 'manager', 'agent'),
  validate({ params: QueueTypeParams, query: QueueQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getHandoffQueue(req.params.type, req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /handoff/:id/assign
router.put(
  '/:id/assign',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: HandoffIdParams, body: AssignBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await assignAgent(req.params.id, req.body.agentId);
      if (!item) throw new NotFoundError('Handoff', req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /handoff/:id/resolve
router.put(
  '/:id/resolve',
  authenticate,
  requireRole('admin', 'manager', 'agent'),
  validate({ params: HandoffIdParams, body: ResolveBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await resolveHandoff(req.params.id, req.body, user.sub);
      if (!item) throw new NotFoundError('Handoff', req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
