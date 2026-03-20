import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const LocationIdParams = z.object({
  id: z.string().uuid(),
});

const ZipParams = z.object({
  zip: z.string().regex(/^\d{5}$/, 'Must be a 5-digit ZIP code'),
});

const ListLocationsQuery = z.object({
  active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const UpdateLocationBody = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string().length(2),
      zip: z.string().regex(/^\d{5}$/),
    })
    .optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  operatingHours: z
    .record(
      z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/),
        close: z.string().regex(/^\d{2}:\d{2}$/),
        closed: z.boolean().optional(),
      }),
    )
    .optional(),
  providers: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        specialties: z.array(z.string()),
      }),
    )
    .optional(),
  insuranceAccepted: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

// ── Response Types ─────────────────────────────────────────────────
interface Location {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function listLocations(
  _filters: z.infer<typeof ListLocationsQuery>,
): Promise<{ items: Location[]; total: number }> {
  return { items: [], total: 0 };
}

async function getLocation(_id: string): Promise<Location | null> {
  return null;
}

async function updateLocation(
  _id: string,
  _data: z.infer<typeof UpdateLocationBody>,
  _userId: string,
): Promise<Location | null> {
  return null;
}

async function findByZip(_zip: string): Promise<Location[]> {
  return [];
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// GET /locations
router.get(
  '/',
  authenticate,
  validate({ query: ListLocationsQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listLocations(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /locations/by-zip/:zip  (must come before /:id to avoid conflict)
router.get(
  '/by-zip/:zip',
  authenticate,
  validate({ params: ZipParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locations = await findByZip(req.params.zip);
      res.json({ zip: req.params.zip, locations });
    } catch (err) {
      next(err);
    }
  },
);

// GET /locations/:id
router.get(
  '/:id',
  authenticate,
  validate({ params: LocationIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const location = await getLocation(req.params.id);
      if (!location) throw new NotFoundError('Location', req.params.id);
      res.json(location);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /locations/:id
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'manager'),
  validate({ params: LocationIdParams, body: UpdateLocationBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const location = await updateLocation(req.params.id, req.body, user.sub);
      if (!location) throw new NotFoundError('Location', req.params.id);
      res.json(location);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
