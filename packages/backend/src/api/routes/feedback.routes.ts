import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const SubmitFeedbackBody = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  rating: z.enum(['positive', 'negative']),
  category: z
    .enum([
      'incorrect_info',
      'tone_issue',
      'missed_intent',
      'policy_violation',
      'good_response',
      'other',
    ])
    .optional(),
  comment: z.string().max(2000).optional(),
  suggestedResponse: z.string().max(4000).optional(),
});

const ReviewQueueQuery = z.object({
  status: z.enum(['pending', 'reviewed', 'actioned']).optional(),
  rating: z.enum(['positive', 'negative']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const FeedbackIdParams = z.object({
  id: z.string().uuid(),
});

const ProcessFeedbackBody = z.object({
  action: z.enum(['dismiss', 'add_to_training', 'update_playbook', 'create_policy']),
  notes: z.string().max(2000).optional(),
});

// ── Response Types ─────────────────────────────────────────────────
interface FeedbackItem {
  id: string;
  conversationId: string;
  messageId: string;
  rating: 'positive' | 'negative';
  category?: string;
  comment?: string;
  status: 'pending' | 'reviewed' | 'actioned';
  processedBy?: string;
  createdAt: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function submitFeedback(
  _data: z.infer<typeof SubmitFeedbackBody>,
): Promise<FeedbackItem> {
  return {
    id: crypto.randomUUID(),
    conversationId: _data.conversationId,
    messageId: _data.messageId,
    rating: _data.rating,
    category: _data.category,
    comment: _data.comment,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

async function getReviewQueue(
  _filters: z.infer<typeof ReviewQueueQuery>,
): Promise<{ items: FeedbackItem[]; total: number }> {
  return { items: [], total: 0 };
}

async function processFeedback(
  _id: string,
  _data: z.infer<typeof ProcessFeedbackBody>,
  _userId: string,
): Promise<FeedbackItem | null> {
  return null;
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// POST /feedback
router.post(
  '/',
  authenticate,
  validate({ body: SubmitFeedbackBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await submitFeedback(req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

// GET /feedback/review-queue
router.get(
  '/review-queue',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ query: ReviewQueueQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getReviewQueue(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /feedback/:id/process
router.put(
  '/:id/process',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: FeedbackIdParams, body: ProcessFeedbackBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await processFeedback(req.params.id, req.body, user.sub);
      if (!item) throw new NotFoundError('Feedback', req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
