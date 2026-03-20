import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { NotFoundError } from '../../middleware/error.middleware';

// ── Schemas ────────────────────────────────────────────────────────
const LocationIdParams = z.object({
  id: z.string().uuid(),
});

const SlotsQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  procedureType: z.string().optional(),
  insuranceAccepted: z.coerce.boolean().optional(),
});

const SchedulingRequestBody = z.object({
  conversationId: z.string().uuid(),
  locationId: z.string().uuid(),
  slotId: z.string().uuid(),
  patientName: z.string().min(1),
  patientPhone: z.string().min(10),
  patientEmail: z.string().email().optional(),
  procedureType: z.string(),
  insuranceProvider: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

const BookingIdParams = z.object({
  bookingId: z.string().uuid(),
});

// ── Response Types ─────────────────────────────────────────────────
interface TimeSlot {
  id: string;
  locationId: string;
  startTime: string;
  endTime: string;
  providerName: string;
  procedureTypes: string[];
  available: boolean;
}

interface BookingResponse {
  id: string;
  conversationId: string;
  locationId: string;
  slotId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  patientName: string;
  scheduledAt: string;
  createdAt: string;
}

// ── Service Stubs ──────────────────────────────────────────────────
async function getAvailableSlots(
  _locationId: string,
  _filters: z.infer<typeof SlotsQuery>,
): Promise<TimeSlot[]> {
  return [];
}

async function submitSchedulingRequest(
  _data: z.infer<typeof SchedulingRequestBody>,
): Promise<BookingResponse> {
  return {
    id: crypto.randomUUID(),
    conversationId: _data.conversationId,
    locationId: _data.locationId,
    slotId: _data.slotId,
    status: 'pending',
    patientName: _data.patientName,
    scheduledAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

async function confirmBooking(_bookingId: string): Promise<BookingResponse | null> {
  return null;
}

async function cancelBooking(_bookingId: string): Promise<BookingResponse | null> {
  return null;
}

// ── Router ─────────────────────────────────────────────────────────
const router = Router();

// GET /locations/:id/slots
router.get(
  '/locations/:id/slots',
  authenticate,
  validate({ params: LocationIdParams, query: SlotsQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slots = await getAvailableSlots(req.params.id, req.query as any);
      res.json({ locationId: req.params.id, slots });
    } catch (err) {
      next(err);
    }
  },
);

// POST /scheduling/request
router.post(
  '/scheduling/request',
  authenticate,
  validate({ body: SchedulingRequestBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await submitSchedulingRequest(req.body);
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  },
);

// POST /scheduling/confirm/:bookingId
router.post(
  '/scheduling/confirm/:bookingId',
  authenticate,
  validate({ params: BookingIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await confirmBooking(req.params.bookingId);
      if (!booking) throw new NotFoundError('Booking', req.params.bookingId);
      res.json(booking);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /scheduling/:bookingId
router.delete(
  '/scheduling/:bookingId',
  authenticate,
  validate({ params: BookingIdParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await cancelBooking(req.params.bookingId);
      if (!booking) throw new NotFoundError('Booking', req.params.bookingId);
      res.json(booking);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
