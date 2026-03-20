# Implementation Roadmap

## Phase 1: Core Platform (Weeks 1-8)

### Sprint 1-2: Foundation
**Build first:**
- Database schema and migrations (Prisma)
- Shared types package
- Backend Express app skeleton with auth middleware
- Orchestration engine core (intent classification, workflow controller)
- Policy guard with insurance + clinical safety rules

**Can be manual at first:**
- Insurance verification (staff does this manually)
- CRM sync (export JSON, manual import)
- Scheduling (staff confirms via phone)

### Sprint 3-4: Conversation Flow
**Build:**
- SMS integration (Twilio) - missed call recovery flow
- Web chat widget (embeddable)
- Playbook loader and router
- Response composer with slider influence
- Field extraction service
- Lead creation and management
- Duplicate detection (phone-based)
- Human handoff queue

### Sprint 5-6: Admin Console
**Build:**
- Admin UI shell with auth and navigation
- Playbook editor with version history
- Slider controls page with presets
- Location management
- SMS template editor
- Test/QA tab with transcript + trace + CRM panels

### Sprint 7-8: Quality & Launch
**Build:**
- Operator feedback system (inline review)
- Audit logging
- Review queue
- Approved/prohibited phrase management
- Basic analytics dashboard
- CRM extraction panel with field status

**Should remain configurable:**
- All playbook content and behavior parameters
- Slider settings and presets
- SMS templates
- Location details
- Approved/prohibited phrases

**Should NOT be overengineered early:**
- OCR for insurance cards (use upload + manual entry)
- Advanced A/B testing framework (just template variants)
- Multi-language support
- Voice channel integration
- Advanced duplicate detection (name fuzzy match, etc.)

---

## Phase 2: Integration & Intelligence (Weeks 9-16)

### Sprint 9-10: Scheduling Integration
- Direct scheduling API adapter (Athenahealth/DrChrono/etc.)
- Real-time slot availability
- Automated provisional booking
- Confirmation workflow after insurance verification

### Sprint 11-12: Insurance & Duplicate Enhancement
- Insurance card OCR (upload → parse → autopopulate)
- Enhanced duplicate detection (name + DOB fuzzy matching)
- Insurance verification workflow automation
- Stronger field extraction with LLM-powered parsing

### Sprint 13-14: Analytics & A/B Testing
- Full analytics dashboard with all metrics
- Conversion funnel visualization
- Drop-off analysis by workflow step
- A/B testing framework for SMS templates and reassurance language
- Phrase performance tracking
- Slider setting performance correlation

### Sprint 15-16: Approval & Governance
- Playbook approval workflows (draft → review → publish)
- Channel-level slider overrides
- Playbook-level slider overrides
- Diff viewer for version comparison
- Rollback with approval gates
- Enhanced audit trail with entity-level history

---

## Phase 3: Scale & Optimize (Weeks 17-24)

### Sprint 17-18: Multi-State Optimization
- State-specific insurance messaging rules
- State-specific compliance rules
- Location group management
- Regional performance comparison

### Sprint 19-20: Intelligence & Recommendations
- Operator recommendation engine (suggested slider adjustments based on performance)
- Auto-suggested phrase improvements based on feedback patterns
- Conversation quality scoring
- Predictive drop-off alerts

### Sprint 21-22: Advanced A/B & Multilingual
- Multi-variant A/B testing with statistical significance
- Automated winner selection
- Spanish language support
- Bilingual conversation detection and routing

### Sprint 23-24: Voice Readiness & Polish
- Voice channel architecture planning
- IVR integration design
- Telephony adapter interface
- Performance optimization and load testing
- Security audit and penetration testing
- Documentation and operator training materials

---

## Key Decision Points

| Decision | When | Options | Recommended |
|----------|------|---------|-------------|
| LLM Provider | Phase 1 Sprint 1 | Anthropic Claude / OpenAI GPT-4 | Claude (better safety, instruction following) |
| Database | Phase 1 Sprint 1 | PostgreSQL / MySQL | PostgreSQL (JSON support, robust) |
| Hosting | Phase 1 Sprint 7 | AWS / GCP / Azure | AWS (ECS + RDS + ElastiCache) |
| Scheduling Provider | Phase 2 Sprint 9 | Build adapter for client's EHR | Start with manual, build adapter when EHR confirmed |
| CRM Provider | Phase 2 Sprint 9 | Salesforce / HubSpot / Custom | Build generic adapter, specialize when CRM confirmed |
| OCR Provider | Phase 2 Sprint 11 | AWS Textract / Google Vision / Custom | AWS Textract (HIPAA eligible) |
