# Analytics Event Taxonomy

## Conversion Funnel Events

| Event | Description | Properties |
|-------|-------------|------------|
| `missed_call.detected` | Phone system detected a missed call | `phone_number`, `location_id`, `timestamp` |
| `missed_call.sms_sent` | Recovery SMS sent | `phone_number`, `template_id`, `variant_id` |
| `missed_call.sms_responded` | Patient responded to recovery SMS | `phone_number`, `response_time_seconds` |
| `missed_call.recovered` | Missed call led to active conversation | `phone_number`, `conversation_id` |
| `conversation.started` | New conversation initiated | `conversation_id`, `channel`, `source` |
| `conversation.message_sent` | Message sent by bot | `conversation_id`, `playbook`, `intent` |
| `conversation.message_received` | Message received from patient | `conversation_id`, `intent`, `length` |
| `lead.created` | New lead record created | `lead_id`, `source`, `channel` |
| `lead.qualified` | Lead has minimum required fields | `lead_id`, `fields_captured` |
| `booking.started` | Patient entered scheduling flow | `lead_id`, `location_id` |
| `booking.provisional` | Provisional appointment created | `booking_id`, `location_id`, `date` |
| `booking.confirmed` | Appointment confirmed after verification | `booking_id`, `location_id` |
| `booking.cancelled` | Appointment cancelled | `booking_id`, `reason` |
| `booking.rescheduled` | Appointment rescheduled | `booking_id`, `old_date`, `new_date` |

## Insurance Events

| Event | Description | Properties |
|-------|-------------|------------|
| `insurance.question_asked` | Patient asked about insurance | `conversation_id`, `question_type` |
| `insurance.reassurance_given` | Bot provided insurance reassurance | `conversation_id`, `playbook_step` |
| `insurance.card_uploaded` | Insurance card image uploaded | `lead_id`, `side` (front/back) |
| `insurance.info_collected` | Insurance info manually provided | `lead_id`, `provider` |
| `insurance.verification_started` | Verification process initiated | `lead_id`, `provider` |
| `insurance.verified` | Insurance verified | `lead_id`, `result` |
| `insurance.abandonment` | Patient dropped off at insurance step | `conversation_id`, `last_message` |

## Handoff Events

| Event | Description | Properties |
|-------|-------------|------------|
| `handoff.requested` | Human handoff triggered | `conversation_id`, `reason`, `type` |
| `handoff.callback_queued` | Callback request queued | `conversation_id`, `preferred_time` |
| `handoff.assigned` | Handoff assigned to agent | `handoff_id`, `agent_id` |
| `handoff.resolved` | Handoff completed | `handoff_id`, `resolution_time_seconds` |
| `escalation.triggered` | Escalation rule fired | `conversation_id`, `reason`, `severity` |

## Operational Events

| Event | Description | Properties |
|-------|-------------|------------|
| `playbook.activated` | Playbook triggered in conversation | `playbook_name`, `conversation_id` |
| `playbook.published` | Playbook version published | `playbook_id`, `version`, `user_id` |
| `playbook.rolled_back` | Playbook rolled back to previous version | `playbook_id`, `from_version`, `to_version` |
| `policy.violation` | Policy violation detected in response | `policy_id`, `category`, `severity` |
| `slider.changed` | Slider value updated | `slider_name`, `old_value`, `new_value`, `scope` |
| `preset.applied` | Slider preset applied | `preset_name`, `scope` |
| `feedback.submitted` | Operator feedback submitted | `feedback_type`, `conversation_id` |
| `feedback.applied` | Feedback applied to system | `feedback_id`, `scope` |
| `duplicate.detected` | Duplicate patient detected | `lead_id`, `matched_lead_id`, `match_type` |
| `duplicate.resolved` | Duplicate resolved | `duplicate_id`, `resolution` |
| `crm.synced` | Data synced to CRM | `lead_id`, `crm_id`, `sync_type` |
| `crm.sync_failed` | CRM sync failed | `lead_id`, `error` |

## A/B Testing Events

| Event | Description | Properties |
|-------|-------------|------------|
| `ab_test.variant_assigned` | Patient assigned to A/B test variant | `test_id`, `variant_id`, `conversation_id` |
| `ab_test.conversion` | A/B test variant led to conversion | `test_id`, `variant_id`, `conversion_type` |

## Drop-off Events

| Event | Description | Properties |
|-------|-------------|------------|
| `dropoff.initial_contact` | Patient stopped responding at initial contact | `conversation_id`, `last_intent` |
| `dropoff.insurance_step` | Patient dropped off during insurance collection | `conversation_id` |
| `dropoff.scheduling_step` | Patient dropped off during scheduling | `conversation_id` |
| `dropoff.after_hesitation` | Patient dropped off after expressing hesitation | `conversation_id` |
