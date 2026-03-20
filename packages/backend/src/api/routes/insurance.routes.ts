import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError, AppError } from '../../middleware/error.middleware';

// ── Multer Config ──────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, `Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ── Schemas ────────────────────────────────────────────────────────
const UploadQuery = z.object({
  conversationId: z.string().uuid(),
  side: z.enum(['front', 'back']),
});

const LeadIdParams = z.object({
  leadId: z.string().uuid(),
});

// ── Response Types ─────────────────────────────────────────────────
interface InsuranceUploadResult {
  id: string;
  conversationId: string;
  side: 'front' | 'back';
  ocrStatus: 'processing' | 'completed' | 'failed';
  extractedFields?: {
    provider?: string;
    memberId?: string;
    groupNumber?: string;
    planType?: string;
  };
  uploadedAt: string;
}

interface InsuranceIntakeStatus {
  leadId: string;
  frontCard: { uploaded: boolean; ocrStatus: string } | null;
  backCard: { uploaded: boolean; ocrStatus: string } | null;
  verificationStatus: 'pending' | 'verified' | 'denied' | 'needs_review';
  extractedData: Record<string, unknown>;
  updatedAt: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function processInsuranceUpload(
  _file: Express.Multer.File,
  _conversationId: string,
  _side: 'front' | 'back',
): Promise<InsuranceUploadResult> {
  return {
    id: crypto.randomUUID(),
    conversationId: _conversationId,
    side: _side,
    ocrStatus: 'processing',
    uploadedAt: new Date().toISOString(),
  };
}

async function getInsuranceStatus(_leadId: string): Promise<InsuranceIntakeStatus | null> {
  return null;
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// POST /insurance/upload
router.post(
  '/upload',
  authenticate,
  upload.single('card'),
  validate({ query: UploadQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded. Field name must be "card".');
      }
      const { conversationId, side } = req.query as unknown as z.infer<typeof UploadQuery>;
      const result = await processInsuranceUpload(req.file, conversationId, side);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /insurance/:leadId
router.get(
  '/:leadId',
  authenticate,
  validate({ params: LeadIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await getInsuranceStatus(req.params.leadId);
      if (!status) throw new NotFoundError('InsuranceIntake', req.params.leadId);
      res.json(status);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
