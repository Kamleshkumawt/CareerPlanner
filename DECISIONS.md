# Architecture Decisions

## 1. Scope — What I built vs skipped

**Built:**
- JWT auth (register/login)
- Deterministic eligibility, salary shortfall, and timeline conflict checks
- LLM integration (Gemini free tier) for narrative-only generation with fallback
- Full plan save/load/list/delete
- Two fully differentiated scenarios (Germany/Senior BE + UK/PM)
- All three edge cases: timeline conflict, salary shortfall, missing data

**Skipped:**
- Email verification — not required for this scope
- Full test suite — manual tested edge cases
- Multi-country/role data — added two destinations; adding new ones requires only a JSON edit

---

## 2. AI vs Deterministic Logic — The boundary

**Deterministic (never LLM):**
- Salary vs threshold comparison — a wrong answer harms the user
- Timeline vs processing time conflict — binary, not subjective
- Eligibility route filtering
- Feasibility score calculation

**LLM (Gemini/fallback):**
- Narrative paragraph summarising the plan in plain English
- Personalised action steps

If LLM fails, the system returns a rule-based narrative — the deterministic result is always shown regardless.

---

## 3. Data confidence flow

Each field in `destinations.json` carries a `data_confidence` enum: `verified | estimated | placeholder`.
The deterministic service reads these and bubbles them up into `data_confidence_summary` in the API response.
The frontend displays them at the bottom of every result so the user can assess reliability.

---

## 4. LLM choice

**gemini-3-flash-preview** — free tier, no credit card required, fast enough (~3-8s).
Constraint: rate-limited. Mitigation: added graceful fallback to rule-based narrative so the app works even with no API key.

---

## 5. Scale assumption that breaks under load

The LLM call is awaited synchronously in the request handler. At 50 concurrent users, 50 × up to 10s = potential timeouts and exhausted Node.js event loop.

**Partial mitigation here:** 15-minute rate limiter (100 req/window).

**Full fix for production:** Push LLM generation to a job queue (BullMQ + Redis). Return a jobId immediately, poll `/plans/status/:jobId`. This decouples response time from LLM latency entirely.

---

## 6. Hindsight

I would extract the data layer into a proper seed-from-JSON MongoDB seeder from day one, rather than reading the JSON at runtime. This makes the "adding a new destination requires only a data edit, not code" guarantee cleaner and testable.