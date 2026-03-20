import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Request / Response Schemas ─────────────────────────────────────
const CreateConversationBody = z.object({
  leadId: z.string().optional(),
  channel: z.enum(['web', 'sms', 'voice', 'missed-call']),
  playbookId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const SendMessageBody = z.object({
  content: z.string().min(1).max(4000),
  role: z.enum(['user', 'system']).default('user'),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'document']),
        url: z.string().url(),
        name: z.string().optional(),
      }),
    )
    .optional(),
});

const ConversationIdParams = z.object({
  id: z.string().uuid(),
});

const TraceQuery = z.object({
  verbose: z.coerce.boolean().default(false),
});

// ── Response Types ─────────────────────────────────────────────────
interface ConversationResponse {
  id: string;
  leadId?: string;
  channel: string;
  status: 'active' | 'completed' | 'handed_off';
  createdAt: string;
}

interface MessageResponse {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extractedFields?: Record<string, unknown>;
  sliderSnapshot?: Record<string, number>;
  createdAt: string;
}

interface OrchestrationTrace {
  conversationId: string;
  turns: Array<{
    turnId: string;
    input: string;
    policyDecisions: string[];
    sliderValues: Record<string, number>;
    playbookStep: string;
    llmPrompt: string;
    llmResponse: string;
    extractedFields: Record<string, unknown>;
    durationMs: number;
  }>;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function createConversation(
  data: z.infer<typeof CreateConversationBody>,
  _userId: string,
): Promise<ConversationResponse> {
  // TODO: wire to ConversationService
  return {
    id: crypto.randomUUID(),
    leadId: data.leadId,
    channel: data.channel,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

async function sendMessage(
  conversationId: string,
  data: z.infer<typeof SendMessageBody>,
): Promise<MessageResponse> {
  // TODO: wire to OrchestrationService
  return {
    id: crypto.randomUUID(),
    conversationId,
    role: 'assistant',
    content: '[stub] assistant response',
    createdAt: new Date().toISOString(),
  };
}

async function getConversation(
  conversationId: string,
): Promise<(ConversationResponse & { messages: MessageResponse[] }) | null> {
  // TODO: wire to ConversationService
  return null;
}

async function getTrace(
  conversationId: string,
  _verbose: boolean,
): Promise<OrchestrationTrace | null> {
  // TODO: wire to TraceService
  return null;
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// POST /conversations
router.post(
  '/',
  authenticate,
  validate({ body: CreateConversationBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const conversation = await createConversation(req.body, user.sub);
      res.status(201).json(conversation);
    } catch (err) {
      next(err);
    }
  },
);

// POST /conversations/:id/messages
router.post(
  '/:id/messages',
  authenticate,
  validate({ params: ConversationIdParams, body: SendMessageBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await sendMessage(req.params.id, req.body);
      res.status(200).json(message);
    } catch (err) {
      next(err);
    }
  },
);

// GET /conversations/:id
router.get(
  '/:id',
  authenticate,
  validate({ params: ConversationIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversation = await getConversation(req.params.id);
      if (!conversation) throw new NotFoundError('Conversation', req.params.id);
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  },
);

// GET /conversations/:id/trace
router.get(
  '/:id/trace',
  authenticate,
  validate({ params: ConversationIdParams, query: TraceQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verbose = (req.query as z.infer<typeof TraceQuery>).verbose;
      const trace = await getTrace(req.params.id, verbose);
      if (!trace) throw new NotFoundError('Trace', req.params.id);
      res.json(trace);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
