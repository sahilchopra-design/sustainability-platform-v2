# Gap Prioritization & Decision Memo — A2 Intelligence
## Portfolio-Level Roadmap
### Date: 2026-03-16

---

## Scoring Methodology

Each gap scored 1-10 on weighted criteria:
- Regulatory/Compliance Urgency (25%)
- Customer Pain Severity (20%)
- Revenue Expansion Potential (15%)
- Strategic Differentiation (10%)
- Implementation Complexity (inverse, 10%)
- Platform Dependency Risk (10%)
- Auditability Impact (10%)

---

## Top 10 Critical Gaps

| # | Gap | Weighted Score | Priority |
|---|-----|---------------|----------|
| 1 | **Zero test coverage** — 110,936 lines, no tests | 9.2 | P0 |
| 2 | **CORS allow_origins=["*"]** — production security hole | 9.0 | P0 |
| 3 | **Auth enforcement audit** — verify all routes require auth | 8.8 | P0 |
| 4 | **.env credentials in repo** — credential leak risk | 8.5 | P0 |
| 5 | **No data import (CSV/Excel)** — users can't load real data | 8.3 | P1 |
| 6 | **CSRD report generation** — disclosure document output | 8.1 | P1 |
| 7 | **Frontend-backend wiring** — many pages show seed data | 7.8 | P1 |
| 8 | **Multi-tenancy** — blocks SaaS model | 7.5 | P1 |
| 9 | **Workflow state machine** — blocks approval processes | 7.2 | P1 |
| 10 | **CI/CD pipeline** — no automated build/deploy/test | 7.0 | P1 |

## Top 10 Enhancement Opportunities

| # | Opportunity | Weighted Score | Priority |
|---|------------|---------------|----------|
| 1 | **CSRD end-to-end automation** — data collection to XBRL filing | 9.5 | P0 |
| 2 | **DME velocity + sentiment dashboard** — unique market positioning | 8.2 | P1 |
| 3 | **Climate credit decisioning workflow** — bank core process | 8.0 | P1 |
| 4 | **SFDR disclosure templates** — Annex II/III generation | 7.8 | P1 |
| 5 | **Portfolio import + batch processing** — enterprise scale | 7.5 | P1 |
| 6 | **Regulatory deadline tracker** — cross-framework calendar | 7.2 | P2 |
| 7 | **Entity 360° profile** — unified view from all modules | 7.0 | P2 |
| 8 | **Peer benchmark rankings** — competitive intelligence | 6.8 | P2 |
| 9 | **Real-time data feeds** — GDELT, CDP, Bloomberg | 6.5 | P2 |
| 10 | **Mobile-responsive dashboard** — executive access | 6.0 | P3 |

---

## Roadmap

### P0 — Immediate (Next 2 Weeks)
**Theme: Production Readiness**

| Item | Type | Effort | Owner |
|------|------|--------|-------|
| CORS whitelist (replace `*` with specific origins) | Security | 1 hour | Backend |
| .env → environment-only (remove from repo) | Security | 2 hours | DevOps |
| Auth enforcement audit (grep all routes for missing auth) | Security | 4 hours | Backend |
| Pytest suite for ECL + CSRD + Portfolio engines | Quality | 3 days | Backend |
| GitHub Actions CI pipeline (lint + test) | DevOps | 4 hours | DevOps |

### P1 — Current Quarter (Weeks 3-12)
**Theme: First Customer Readiness**

| Item | Type | Effort | Owner |
|------|------|--------|-------|
| CSV/Excel portfolio import | Feature | 3 days | Backend + Frontend |
| CSRD data collection wizard (top 50 DPs) | Feature | 5 days | Frontend |
| CSRD disclosure report generation (PDF) | Feature | 5 days | Backend |
| Frontend-backend wiring for top 10 pages | Integration | 5 days | Frontend |
| Workflow state machine (draft→review→approved) | Platform | 3 days | Backend |
| Multi-tenancy (org_id + RLS basics) | Platform | 5 days | Backend |
| SFDR Annex II/III templates | Feature | 3 days | Backend |
| DME real-data pipeline integration | Feature | 5 days | Backend |

### P2 — Next 2 Quarters (Months 4-9)
**Theme: Differentiation & Scale**

| Item | Type | Effort |
|------|------|--------|
| Batch processing for large portfolios (1000+ exposures) | Scale | 2 weeks |
| PostGIS for nature risk spatial queries | Platform | 1 week |
| Real-time data feeds (GDELT, CDP) | Integration | 2 weeks |
| Entity 360° unified profile page | Feature | 1 week |
| Regulatory deadline calendar | Feature | 3 days |
| Export templates (Excel/PDF per regulation) | Feature | 2 weeks |
| Notification/alert delivery system | Platform | 1 week |
| API documentation + developer portal | Platform | 1 week |

### P3 — Long-Term (Months 10+)
**Theme: Enterprise Scale & Market Expansion**

| Item | Type | Effort |
|------|------|--------|
| Neo4j integration for contagion network | Platform | 2 weeks |
| TimescaleDB for velocity timeseries | Platform | 1 week |
| Mobile-responsive executive dashboard | Feature | 2 weeks |
| White-label / custom branding | Platform | 1 week |
| API marketplace (third-party integrations) | Platform | 3 weeks |
| SOC 2 compliance preparation | Compliance | 4 weeks |

---

## Quick Wins (Next 4 Weeks)

1. **CORS fix** — 1 hour, eliminates critical security vulnerability
2. **.env cleanup** — 2 hours, eliminates credential exposure
3. **Auth audit** — 4 hours, verify auth enforcement across routes
4. **"Demo Data" labels** — 2 hours, add clear labels to pages using seed data
5. **Pytest for ECL engine** — 1 day, protect highest-value calculation

---

## What to Reject or Defer

| Item | Reason |
|------|--------|
| More regulatory modules (e.g., MiFID, Solvency II extensions) | Already have 73 modules — depth before breadth |
| Kafka event streaming | Monolith architecture doesn't need it; adds operational complexity |
| Neo4j graph database | NetworkX fallback works; premature optimization |
| Mobile app | Web-first; mobile adds maintenance burden |
| AI chatbot for the platform | Nice-to-have but doesn't solve core workflow problems |
| Blockchain/DLT integration | Hype-driven, not user-need-driven |

---

## Where the Platform Is Strongest Today

1. **Regulatory breadth**: 12+ frameworks, 330 ESRS DPs, 56 CDM methodologies, 627 DME factors — no competitor has this range in one codebase
2. **Mathematical rigor**: ECL (1,303 LOC), Basel (1,688 LOC), Hawkes process contagion, CUSUM greenwashing detection — real quantitative engines, not wrappers
3. **Cross-module integration**: 229 lineage edges, entity resolution via LEI, factor overlay across all modules — genuine platform effect
4. **Infrastructure**: 5-layer middleware stack (CORS, rate limit, logging, auth, audit), RBAC with 6 role levels — enterprise-grade foundation
5. **DME differentiation**: Velocity/acceleration regime detection, Hawkes process contagion, CUSUM greenwashing — unique in the market

## Where the Platform Is Most Vulnerable Today

1. **Zero tests**: Any change can break anything silently
2. **CORS wide open**: Security vulnerability in deployed state
3. **Seed data confusion**: Users may confuse demo data with real analysis
4. **No data import**: Users can't bring their own data easily
5. **Single developer**: Bus factor = 1, no code review process

## Single Strategic Theme for the Roadmap

> **"Depth over breadth: Make 3 modules production-perfect rather than 73 modules demo-ready."**

The platform has extraordinary breadth. The strategic imperative is now to pick the 3 highest-value workflows (CSRD reporting, climate credit decisioning, SFDR disclosure) and make them genuinely end-to-end with real data, full audit trail, and exportable regulatory reports. Everything else is a demo that impresses — these 3 must actually work.
