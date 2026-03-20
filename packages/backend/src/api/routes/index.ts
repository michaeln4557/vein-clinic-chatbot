import { Router } from 'express';

import conversationRoutes from './conversation.routes';
import extractionRoutes from './extraction.routes';
import playbookRoutes from './playbook.routes';
import schedulingRoutes from './scheduling.routes';
import insuranceRoutes from './insurance.routes';
import handoffRoutes from './handoff.routes';
import feedbackRoutes from './feedback.routes';
import sliderRoutes from './slider.routes';
import locationRoutes from './location.routes';
import auditRoutes from './audit.routes';
import testRoutes from './test.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';

const router = Router();

// ── Mount Sub-Routers ──────────────────────────────────────────────

// Conversation & messaging
router.use('/conversations', conversationRoutes);

// CRM field extraction (mounted under /conversations to share the :id param)
router.use('/conversations', extractionRoutes);

// Playbook management
router.use('/playbooks', playbookRoutes);

// Scheduling (contains both /locations/:id/slots and /scheduling/* paths)
router.use('/', schedulingRoutes);

// Insurance card upload & status
router.use('/insurance', insuranceRoutes);

// Human handoff & callback queue
router.use('/handoff', handoffRoutes);

// Inline feedback & review
router.use('/feedback', feedbackRoutes);

// Behaviour sliders
router.use('/sliders', sliderRoutes);

// Clinic locations
router.use('/locations', locationRoutes);

// Audit log
router.use('/audit', auditRoutes);

// Test / sandbox sessions
router.use('/test', testRoutes);

// Analytics dashboards
router.use('/analytics', analyticsRoutes);

// Admin settings (phrases, templates, users)
router.use('/admin', adminRoutes);

export default router;
