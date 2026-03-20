import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const ConversationIdParams = z.object({
  id: z.string().uuid(),
});

const FieldOverrideParams = z.object({
  id: z.string().uuid(),
  fieldName: z.string().min(1),
});

const FieldOverrideBody = z.object({
  value: z.unknown(),
  reason: z.string().min(1).max(500),
});

// ── Response Types ─────────────────────────────────────────────────
interface ExtractedField {
  fieldName: string;
  value: unknown;
  confidence: number;
  source: 'llm' | 'manual_override' | 'ocr';
  extractedAt: string;
  overriddenBy?: string;
}

interface CrmPayload {
  conversationId: string;
  fields: Record<string, unknown>;
  readiness: number;
  missingRequired: string[];
  generatedAt: string;
}

interface CrmReadyState {
  conversationId: string;
  ready: boolean;
  completeness: number;
  missingFields: string[];
  warnings: string[];
}

interface CrmSyncResult {
  conversationId: string;
  crmRecordId: string;
  syncedAt: string;
  fieldsWritten: number;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function getExtractedFields(_convId: string): Promise<ExtractedField[] | null> {
  return null;
}

async function overrideField(
  _convId: string,
  _fieldName: string,
  _value: unknown,
  _reason: string,
  _userId: string,
): Promise<ExtractedField | null> {
  return null;
}

async function getCrmPayload(_convId: string): Promise<CrmPayload | null> {
  return null;
}

async function getCrmReadyState(_convId: string): Promise<CrmReadyState | null> {
  return null;
}

async function syncToCrm(_convId: string, _userId: string): Promise<CrmSyncResult> {
  return {
    conversationId: _convId,
    crmRecordId: crypto.randomUUID(),
    syncedAt: new Date().toISOString(),
    fieldsWritten: 0,
  };
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// GET /conversations/:id/fields
router.get(
  '/:id/fields',
  authenticate,
  validate({ params: ConversationIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fields = await getExtractedFields(req.params.id);
      if (!fields) throw new NotFoundError('Conversation', req.params.id);
      res.json({ conversationId: req.params.id, fields });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /conversations/:id/fields/:fieldName
router.put(
  '/:id/fields/:fieldName',
  authenticate,
  requireRole('admin', 'manager', 'agent'),
  validate({ params: FieldOverrideParams, body: FieldOverrideBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { value, reason } = req.body as z.infer<typeof FieldOverrideBody>;
      const field = await overrideField(
        req.params.id,
        req.params.fieldName,
        value,
        reason,
        (req as any).user.sub,
      );
      if (!field) throw new NotFoundError('Field', req.params.fieldName);
      res.json(field);
    } catch (err) {
      next(err);
    }
  },
);

// GET /conversations/:id/crm-payload
router.get(
  '/:id/crm-payload',
  authenticate,
  validate({ params: ConversationIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = await getCrmPayload(req.params.id);
      if (!payload) throw new NotFoundError('Conversation', req.params.id);
      res.json(payload);
    } catch (err) {
      next(err);
    }
  },
);

// GET /conversations/:id/crm-ready-state
router.get(
  '/:id/crm-ready-state',
  authenticate,
  validate({ params: ConversationIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = await getCrmReadyState(req.params.id);
      if (!state) throw new NotFoundError('Conversation', req.params.id);
      res.json(state);
    } catch (err) {
      next(err);
    }
  },
);

// POST /conversations/:id/sync-crm
router.post(
  '/:id/sync-crm',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: ConversationIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await syncToCrm(req.params.id, (req as any).user.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
