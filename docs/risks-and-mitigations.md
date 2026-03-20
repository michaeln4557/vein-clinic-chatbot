# Risks & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| 1 | **LLM generates prohibited insurance language** | High - compliance violation, patient mislead | Medium | Policy guard scans every response before delivery. Prohibited phrase list is locked. Blocked responses are logged and redacted. |
| 2 | **LLM provides medical advice/diagnosis** | Critical - liability, regulatory | Low-Medium | Clinical safety policy is locked, not operator-editable. Hardcoded phrase blockers. All clinical responses route through safety playbook. |
| 3 | **Patient data breach** | Critical - HIPAA violation | Low | Encrypt at rest and in transit. RBAC on all endpoints. Audit all data access. No PHI in logs. Regular security reviews. |
| 4 | **High latency in response generation** | Medium - poor patient experience | Medium | Cache playbook configs. Pre-compose common responses. Set response timeout with graceful fallback. Monitor p95 latency. |
| 5 | **Scheduling integration fails** | Medium - booking not created | Medium | Manual fallback scheduling always available. Provisional booking queue for staff processing. Retry with exponential backoff. |
| 6 | **CRM sync desynchronization** | Medium - data inconsistency | Medium | Idempotent sync operations. Sync status tracking per record. Manual retry. Reconciliation dashboard. |
| 7 | **Operator misconfigures sliders** | Low - degraded experience | Medium | Bounded slider ranges. Preview before apply. Rollback capability. Preset modes as safe defaults. |
| 8 | **Duplicate patient records** | Medium - confusion, data quality | High | Phone-based primary matching. Duplicate review queue. Never auto-merge without operator review. |
| 9 | **SMS delivery failures** | Medium - missed recovery opportunity | Low | Delivery status tracking. Retry logic. Fallback to alternate number. Alert on high failure rate. |
| 10 | **Prompt injection via patient messages** | High - system manipulation | Low | Input sanitization. LLM response validation through policy guard. Conversation context isolation. No system prompt exposure. |
| 11 | **Operator makes unapproved changes** | Medium - quality regression | Medium | Approval workflows for playbook changes. Version history with rollback. Audit trail on all changes. |
| 12 | **Twilio rate limits / outage** | Medium - SMS unavailable | Low | Queue-based SMS sending with rate limiting. Circuit breaker pattern. Status page monitoring. Fallback notification to staff. |
| 13 | **LLM provider outage** | High - chatbot offline | Low | Fallback to template-based responses. Queue messages for processing when restored. Health check monitoring. |
| 14 | **Scale issues at 40 locations** | Medium - performance degradation | Medium | Horizontal scaling architecture. Connection pooling. Redis caching. Load testing before rollout. |
| 15 | **Patient abandonment at insurance step** | High - lost bookings | High | Insurance reassurance playbook. Trained language. Follow-up nudges. A/B test messaging. Track and optimize abandon rate. |
