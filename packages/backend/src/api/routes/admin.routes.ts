import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthenticatedRequest, UserRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const AddPhraseBody = z.object({
  phrase: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
});

const TemplateIdParams = z.object({
  id: z.string().uuid(),
});

const UpdateTemplateBody = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(1600).optional(), // SMS length constraint
  channel: z.enum(['sms', 'email']).optional(),
  triggerEvent: z.string().optional(),
  active: z.boolean().optional(),
});

const UserIdParams = z.object({
  id: z.string().uuid(),
});

const UpdateRoleBody = z.object({
  role: z.enum(['admin', 'manager', 'agent', 'viewer'] as const),
});

// ── Response Types ─────────────────────────────────────────────────
interface Phrase {
  id: string;
  phrase: string;
  type: 'approved' | 'prohibited';
  category?: string;
  notes?: string;
  addedBy: string;
  createdAt: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  channel: string;
  triggerEvent: string;
  active: boolean;
  updatedAt: string;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lastLogin?: string;
  createdAt: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function listPhrases(
  _type: 'approved' | 'prohibited',
  _filters: z.infer<typeof PaginationQuery>,
): Promise<{ items: Phrase[]; total: number }> {
  return { items: [], total: 0 };
}

async function addPhrase(
  _type: 'approved' | 'prohibited',
  _data: z.infer<typeof AddPhraseBody>,
  _userId: string,
): Promise<Phrase> {
  return {
    id: crypto.randomUUID(),
    phrase: _data.phrase,
    type: _type,
    category: _data.category,
    notes: _data.notes,
    addedBy: _userId,
    createdAt: new Date().toISOString(),
  };
}

async function listTemplates(): Promise<SmsTemplate[]> {
  return [];
}

async function updateTemplate(
  _id: string,
  _data: z.infer<typeof UpdateTemplateBody>,
): Promise<SmsTemplate | null> {
  return null;
}

async function listUsers(
  _filters: z.infer<typeof PaginationQuery>,
): Promise<{ items: UserRecord[]; total: number }> {
  return { items: [], total: 0 };
}

async function updateUserRole(
  _id: string,
  _role: UserRole,
): Promise<UserRecord | null> {
  return null;
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// ── Approved Phrases ───────────────────────────────────────────────

// GET /admin/phrases/approved
router.get(
  '/phrases/approved',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ query: PaginationQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listPhrases('approved', req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /admin/phrases/approved
router.post(
  '/phrases/approved',
  authenticate,
  requireRole('admin'),
  validate({ body: AddPhraseBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const phrase = await addPhrase('approved', req.body, user.sub);
      res.status(201).json(phrase);
    } catch (err) {
      next(err);
    }
  },
);

// ── Prohibited Phrases ─────────────────────────────────────────────

// GET /admin/phrases/prohibited
router.get(
  '/phrases/prohibited',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ query: PaginationQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listPhrases('prohibited', req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /admin/phrases/prohibited
router.post(
  '/phrases/prohibited',
  authenticate,
  requireRole('admin'),
  validate({ body: AddPhraseBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const phrase = await addPhrase('prohibited', req.body, user.sub);
      res.status(201).json(phrase);
    } catch (err) {
      next(err);
    }
  },
);

// ── SMS Templates ──────────────────────────────────────────────────

// GET /admin/templates
router.get(
  '/templates',
  authenticate,
  requireRole('admin', 'manager'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await listTemplates();
      res.json({ templates });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /admin/templates/:id
router.put(
  '/templates/:id',
  authenticate,
  requireRole('admin'),
  validate({ params: TemplateIdParams, body: UpdateTemplateBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await updateTemplate(req.params.id, req.body);
      if (!template) throw new NotFoundError('Template', req.params.id);
      res.json(template);
    } catch (err) {
      next(err);
    }
  },
);

// ── User Management ────────────────────────────────────────────────

// GET /admin/users
router.get(
  '/users',
  authenticate,
  requireRole('admin'),
  validate({ query: PaginationQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listUsers(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /admin/users/:id/role
router.put(
  '/users/:id/role',
  authenticate,
  requireRole('admin'),
  validate({ params: UserIdParams, body: UpdateRoleBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await updateUserRole(req.params.id, req.body.role);
      if (!user) throw new NotFoundError('User', req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
