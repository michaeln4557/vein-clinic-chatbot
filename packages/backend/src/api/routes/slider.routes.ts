import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const SliderIdParams = z.object({
  id: z.string(),
});

const UpdateSliderBody = z.object({
  value: z.number().min(0).max(100),
  label: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

const PresetNameParams = z.object({
  name: z.string().min(1),
});

const PreviewBody = z.object({
  sliders: z.record(z.number().min(0).max(100)),
  sampleInput: z.string().min(1).max(2000),
  playbookId: z.string().uuid().optional(),
});

// ── Response Types ─────────────────────────────────────────────────
interface SliderSetting {
  id: string;
  name: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  category: 'tone' | 'compliance' | 'conversion' | 'medical';
  updatedAt: string;
  updatedBy?: string;
}

interface SliderPreset {
  name: string;
  label: string;
  description: string;
  sliders: Record<string, number>;
}

interface PreviewResult {
  inputMessage: string;
  generatedResponse: string;
  sliderValues: Record<string, number>;
  policyFlags: string[];
  toneAnalysis: {
    empathy: number;
    urgency: number;
    formality: number;
  };
}

// ── Service Stubs ──────────────────────────────────────────────────
async function getSliders(): Promise<SliderSetting[]> {
  return [];
}

async function updateSlider(
  _id: string,
  _data: z.infer<typeof UpdateSliderBody>,
  _userId: string,
): Promise<SliderSetting | null> {
  return null;
}

async function getPresets(): Promise<SliderPreset[]> {
  return [];
}

async function applyPreset(_name: string, _userId: string): Promise<SliderSetting[]> {
  return [];
}

async function previewSliderImpact(
  _data: z.infer<typeof PreviewBody>,
): Promise<PreviewResult> {
  return {
    inputMessage: _data.sampleInput,
    generatedResponse: '[stub] preview response',
    sliderValues: _data.sliders,
    policyFlags: [],
    toneAnalysis: { empathy: 50, urgency: 50, formality: 50 },
  };
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// GET /sliders
router.get(
  '/',
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const sliders = await getSliders();
      res.json({ sliders });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /sliders/:id
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: SliderIdParams, body: UpdateSliderBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const slider = await updateSlider(req.params.id, req.body, user.sub);
      if (!slider) throw new NotFoundError('Slider', req.params.id);
      res.json(slider);
    } catch (err) {
      next(err);
    }
  },
);

// GET /sliders/presets
router.get(
  '/presets',
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const presets = await getPresets();
      res.json({ presets });
    } catch (err) {
      next(err);
    }
  },
);

// POST /sliders/presets/:name/apply
router.post(
  '/presets/:name/apply',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: PresetNameParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const sliders = await applyPreset(req.params.name, user.sub);
      res.json({ sliders });
    } catch (err) {
      next(err);
    }
  },
);

// POST /sliders/preview
router.post(
  '/preview',
  authenticate,
  validate({ body: PreviewBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await previewSliderImpact(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
