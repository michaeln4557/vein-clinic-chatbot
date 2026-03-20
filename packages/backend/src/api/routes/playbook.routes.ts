import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const PlaybookIdParams = z.object({
  id: z.string().uuid(),
});

const ListPlaybooksQuery = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const CreatePlaybookBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  channel: z.enum(['web', 'sms', 'voice', 'missed-call']),
  steps: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['greeting', 'question', 'branch', 'handoff', 'closing']),
      content: z.string(),
      nextStepId: z.string().optional(),
      branches: z
        .array(
          z.object({
            condition: z.string(),
            nextStepId: z.string(),
          }),
        )
        .optional(),
    }),
  ),
  sliderDefaults: z.record(z.number().min(0).max(100)).optional(),
});

const UpdatePlaybookBody = CreatePlaybookBody.partial();

const RollbackBody = z.object({
  revisionId: z.string().uuid(),
});

// ── Response Types ─────────────────────────────────────────────────
interface Playbook {
  id: string;
  name: string;
  description?: string;
  channel: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  steps: unknown[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface PlaybookRevision {
  id: string;
  playbookId: string;
  version: number;
  changedBy: string;
  changeDescription: string;
  createdAt: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function listPlaybooks(
  _filters: z.infer<typeof ListPlaybooksQuery>,
): Promise<{ items: Playbook[]; total: number }> {
  return { items: [], total: 0 };
}

async function getPlaybook(_id: string): Promise<Playbook | null> {
  return null;
}

async function createPlaybook(
  _data: z.infer<typeof CreatePlaybookBody>,
  _userId: string,
): Promise<Playbook> {
  return {
    id: crypto.randomUUID(),
    name: _data.name,
    channel: _data.channel,
    status: 'draft',
    version: 1,
    steps: _data.steps,
    createdBy: _userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function updatePlaybook(
  _id: string,
  _data: z.infer<typeof UpdatePlaybookBody>,
  _userId: string,
): Promise<Playbook | null> {
  return null;
}

async function publishPlaybook(_id: string, _userId: string): Promise<Playbook | null> {
  return null;
}

async function rollbackPlaybook(
  _id: string,
  _revisionId: string,
  _userId: string,
): Promise<Playbook | null> {
  return null;
}

async function getRevisions(_id: string): Promise<PlaybookRevision[]> {
  return [];
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// GET /playbooks
router.get(
  '/',
  authenticate,
  validate({ query: ListPlaybooksQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listPlaybooks(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /playbooks/:id
router.get(
  '/:id',
  authenticate,
  validate({ params: PlaybookIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const playbook = await getPlaybook(req.params.id);
      if (!playbook) throw new NotFoundError('Playbook', req.params.id);
      res.json(playbook);
    } catch (err) {
      next(err);
    }
  },
);

// POST /playbooks
router.post(
  '/',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ body: CreatePlaybookBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const playbook = await createPlaybook(req.body, user.sub);
      res.status(201).json(playbook);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /playbooks/:id
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: PlaybookIdParams, body: UpdatePlaybookBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const playbook = await updatePlaybook(req.params.id, req.body, user.sub);
      if (!playbook) throw new NotFoundError('Playbook', req.params.id);
      res.json(playbook);
    } catch (err) {
      next(err);
    }
  },
);

// POST /playbooks/:id/publish
router.post(
  '/:id/publish',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: PlaybookIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const playbook = await publishPlaybook(req.params.id, user.sub);
      if (!playbook) throw new NotFoundError('Playbook', req.params.id);
      res.json(playbook);
    } catch (err) {
      next(err);
    }
  },
);

// POST /playbooks/:id/rollback
router.post(
  '/:id/rollback',
  authenticate,
  requireRole('admin'),
  validate({ params: PlaybookIdParams, body: RollbackBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const playbook = await rollbackPlaybook(req.params.id, req.body.revisionId, user.sub);
      if (!playbook) throw new NotFoundError('Playbook', req.params.id);
      res.json(playbook);
    } catch (err) {
      next(err);
    }
  },
);

// GET /playbooks/:id/revisions
router.get(
  '/:id/revisions',
  authenticate,
  validate({ params: PlaybookIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const revisions = await getRevisions(req.params.id);
      res.json({ playbookId: req.params.id, revisions });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
