# Vein Clinic Enterprise Chatbot Platform

## MANDATORY: Team Lead Orchestration
**EVERY request in this project MUST be routed through the Team Lead agent.**
Before doing ANY work — code changes, bug fixes, reviews, planning, documentation, anything — invoke `/team-lead` first. The Team Lead analyzes the request, selects the right specialist agent(s) from the 14-agent team, and dispatches them. Never work on this project without going through the Team Lead.

## Project Overview
Production-grade conversational AI platform for a 40-location vein clinic organization. Converts missed calls and inbound inquiries into booked patient appointments via SMS and web chat.

## Monorepo Structure
```
packages/shared/       - TypeScript types, Zod schemas, constants (shared across all packages)
packages/backend/      - Express API, orchestration engine, services, Prisma ORM
packages/admin-ui/     - React admin console (Vite + Tailwind)
packages/chat-widget/  - Embeddable patient-facing chat widget (React, builds as IIFE)
config/                - Playbooks, policies, phrases, templates, sliders, presets, locations
docs/                  - Implementation roadmap, role matrix, analytics taxonomy, risks
```

## Key Architecture Files
- `packages/backend/src/orchestration/engine.ts` - Core orchestration: intent classifier, policy guard, workflow controller, response composer, field extractor
- `packages/backend/prisma/schema.prisma` - 30 models, 23+ enums, full data layer
- `config/policies/` - Insurance, clinical safety, and compliance policy rules (LOCKED)
- `config/playbooks/` - 13 runtime behavior modules
- `config/system-prompt.json` - Master AI system prompt

## Non-Negotiable Rules
1. **NEVER** use prohibited insurance language: "free", "complimentary", "guaranteed", "covered", "no cost"
2. **NEVER** diagnose, suggest diagnosis, recommend treatment, or provide medical certainty
3. **NEVER** log PHI (names, phone numbers, DOB, email, addresses, SSN, insurance IDs)
4. **NEVER** weaken locked safety/compliance policies
5. **ALWAYS** run tests after code changes: `npm -w @vein-clinic/backend run test`
6. **ALWAYS** maintain type safety - update shared types when changing data structures

## Commands
- `npm run dev` - Start all packages in dev mode
- `npm -w @vein-clinic/backend run test` - Run backend tests
- `npm run build` - Build all packages
- `docker-compose up -d` - Start PostgreSQL + Redis

## Tech Stack
- TypeScript, Node.js 20+, Express, Prisma (PostgreSQL), Redis, Bull queues
- React, Vite, Tailwind CSS, Zustand, Recharts
- Twilio (SMS), WebSocket (chat), Zod (validation)
