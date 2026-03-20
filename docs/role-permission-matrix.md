# Role & Permission Matrix

## Roles

| Role | Description |
|------|-------------|
| `frontline_operator` | Day-to-day agents handling patient interactions |
| `manager` | Team leads who oversee operators and review quality |
| `admin` | System administrators with broad configuration access |
| `engineering` | Developers with full system access |
| `compliance_reviewer` | Restricted role for safety/compliance policy review |

## Permission Matrix

| Resource | Action | Frontline | Manager | Admin | Engineering | Compliance |
|----------|--------|-----------|---------|-------|-------------|------------|
| **Conversations** | View own | Yes | Yes | Yes | Yes | Yes |
| | View all | No | Yes | Yes | Yes | Yes |
| | Take over (handoff) | Yes | Yes | Yes | No | No |
| | Override fields | No | Yes | Yes | Yes | No |
| **Playbooks** | View | Yes | Yes | Yes | Yes | Yes |
| | Edit content | No | No | Yes | Yes | No |
| | Edit operator settings | No | Yes | Yes | Yes | No |
| | Publish | No | No | Yes | Yes | No |
| | Rollback | No | No | Yes | Yes | No |
| **Policies** | View | Yes | Yes | Yes | Yes | Yes |
| | Edit (non-locked) | No | No | No | Yes | Yes |
| | Edit (locked safety) | No | No | No | No | Yes |
| **Phrases** | View | Yes | Yes | Yes | Yes | Yes |
| | Add approved | No | Yes | Yes | Yes | No |
| | Add prohibited | No | No | Yes | Yes | Yes |
| | Remove | No | No | Yes | Yes | Yes |
| **Sliders** | View | Yes | Yes | Yes | Yes | No |
| | Adjust (within bounds) | No | Yes | Yes | Yes | No |
| | Change bounds | No | No | No | Yes | No |
| | Apply presets | No | Yes | Yes | Yes | No |
| **Locations** | View | Yes | Yes | Yes | Yes | No |
| | Edit details | No | No | Yes | Yes | No |
| | Add/remove | No | No | Yes | Yes | No |
| **SMS Templates** | View | Yes | Yes | Yes | Yes | No |
| | Edit | No | Yes | Yes | Yes | No |
| | Create variant | No | No | Yes | Yes | No |
| **Feedback** | Submit | Yes | Yes | Yes | Yes | Yes |
| | View queue | No | Yes | Yes | Yes | Yes |
| | Process/approve | No | Yes | Yes | Yes | No |
| **Test/QA** | Run tests | Yes | Yes | Yes | Yes | Yes |
| | View traces | No | Yes | Yes | Yes | Yes |
| **Audit Log** | View own | Yes | Yes | Yes | Yes | Yes |
| | View all | No | No | Yes | Yes | Yes |
| | Export | No | No | Yes | Yes | Yes |
| **Analytics** | View basic | Yes | Yes | Yes | Yes | No |
| | View advanced | No | Yes | Yes | Yes | No |
| | Configure A/B tests | No | No | Yes | Yes | No |
| **CRM Sync** | View status | Yes | Yes | Yes | Yes | No |
| | Trigger sync | No | Yes | Yes | Yes | No |
| | Override fields | No | Yes | Yes | Yes | No |
| **Users/Permissions** | View | No | No | Yes | Yes | No |
| | Manage roles | No | No | Yes | Yes | No |
| | Create users | No | No | Yes | Yes | No |
