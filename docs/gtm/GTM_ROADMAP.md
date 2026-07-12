# Go-To-Market Roadmap — Energy Developers · Financial Institutions · Compliance

*Drafted 2026-07-07. Grounded in `TOP25_BUSINESS_CASES.md` (BC-01…BC-25, module-id
validated), `PRODUCTIZATION_ROADMAP.md` (P0–P3 phases, desk SKUs, LLM tiers), and
`CRITICAL_REVIEW_UAT_AUDIT.md` (honest readiness). Rule inherited from the platform:
nothing is demoed, claimed, or sold that isn't engine-computed and provenance-traceable.*

---

## 1 · Positioning

**Category:** climate-and-sustainability *calculation* platform — against three
incumbent alternatives, each with a distinct wedge:

| Against | Their weakness | Our wedge |
|---|---|---|
| Big-4 / boutique consultants | $300k+ engagements, static spreadsheet deliverables, no reuse | The 25 cases run as living software: same analysis, re-runnable daily, at a fraction of cost |
| ESG data vendors (MSCI/S&P/Moody's climate) | Black-box scores, no methodology transparency | Every number traces to a documented formula (Module Atlas §7/§8) + named public source; lineage on demand |
| Point solutions (PPA tools, CSRD tools, PCAF tools) | One workflow each; integration burden | 25 cases on one data spine (GLEIF entities, NGFS scenarios, hazard digital twin, refdata backbone) |

**One-line per segment:**
- *Energy developers:* "Price, structure, and de-risk projects with the same engines the
  banks use to underwrite you."
- *Financial institutions:* "Regulatory-grade climate analytics whose formulas you can
  read — bench-verified against hand calculations, lineage-traceable to source."
- *Compliance:* "The obligation-to-disclosure pipeline: 12 frameworks tracked, datapoints
  mapped, statements computed — with honest nulls where your data is thin, never
  invented values."

**Proof asset unique to us:** the Module Atlas (999 documented modules, methodology +
model spec + roadmap per module) doubles as the model-risk-management documentation
regulated buyers must produce anyway — a sales artifact competitors cannot match quickly.

## 2 · Ideal customer profiles

| Segment | ICP (initial) | Entry buyer | Expansion path |
|---|---|---|---|
| Energy Developers | Mid-market IPP/developer, 0.5–5 GW pipeline, US/EU/India, lean analytics team | Head of Origination / PF Director | BC-01/02 → BC-03/04/07 → whole Energy Desk |
| Financial Institutions | Tier-2 banks, asset managers ($5–100B AUM), specialty insurers — big enough to face supervision, too small for a 20-person climate quant team | Head of Climate Risk / CRO office | BC-10/12 → BC-11/13/14 → whole FI Desk |
| Compliance | EU-scoped corporates (CSRD waves) + fund managers (SFDR); India (BRSR) as fast-follow | Head of Sustainability Reporting / CCO | BC-24 (calendar, cheap land) → BC-19/20/21 → full Compliance Desk |

## 3 · Packaging & pricing architecture

Aligned to PRODUCTIZATION_ROADMAP desk SKUs — the business cases ARE the packaging:

- **Desk SKUs** (annual platform subscription): Energy & Infrastructure Desk (BC-01…09),
  Financial Risk Desk (BC-10…18), Compliance Desk (BC-19…25). Each = its modules +
  guided mode + support. Anchor pricing to the alternative: a desk should cost ~25–40%
  of one consultant engagement it replaces per year.
- **Copilot add-on** (usage-metered): the Tier-1/2 module LLM layer once P1 ships —
  metering via the `llm_traces` tables specced in the productization roadmap.
- **Enterprise tier**: multi-desk + Entity-360 spine + SSO/RBAC (already built) + audit
  exports.
- **Design-partner tier** (Phase G0 only): heavily discounted annual in exchange for
  named case study, weekly feedback, and data-sharing for calibration.

## 4 · GTM phases with gates

| Phase | When | Motion | Gate to next |
|---|---|---|---|
| **G0 · Credibility base** | Wks 0–6 (tracks P0) | No outbound. Clear the 8 named pre-GTM fixes (see §6). Deploy to Railway. Produce the 3 flagship demo environments with seeded realistic books. Publish 2 methodology whitepapers from Atlas deep-dives | All BC 🟢-cases demo clean end-to-end on the deployed URL; zero fabrication-guardrail hits; DEPLOYMENT blockers cleared |
| **G1 · Design partners** | Wks 6–20 | 2 partners per segment (6 total), sourced from founder network + the 4 persona UAT scripts run WITH them as structured pilots. Weekly cadence. Convert pilot friction directly into the implementation-plan backlog | ≥4 of 6 partners running ≥2 business cases weekly; ≥2 referenceable quotes; pilot→paid conversion ≥50% |
| **G2 · Lighthouse & repeatability** | Wks 20–40 | First paid lighthouse per segment. Publish case studies. Begin content engine (§5) at full cadence. Copilot add-on beta (P1 LLM tier lands here). Hire first AE/SE pair | 3 paying lighthouses; sales cycle documented; CAC/payback measured on ≥5 deals; copilot fabrication-eval = 0 failures |
| **G3 · Scale motion** | Wks 40+ | Segment-specialized outbound; partner channel (mid-tier advisories reselling desks they currently hand-deliver); India/BRSR entry via existing India modules; marketplace of desk SKUs | Pipeline coverage ≥3× target; NRR >110% on desk expansion |

## 5 · Channels & motion by segment

- **Energy developers** — where they already are: project-finance conferences
  (Infocast/SFIndustry), PPA marketplaces, tax-equity brokers as referrers. Content wedge:
  the BC-02 NGFS-integrated PF model vs a named public deal's disclosed assumptions.
  Land fast with BC-07 site screening (real USGS/NOAA data, visually strong, 🟢).
- **Financial institutions** — regulator-driven timing: sell into stress-test season and
  disclosure deadlines (the `regulatory-calendar` IS the campaign calendar — BC-24 as
  its own lead magnet). Channel: risk-management associations (GARP/PRMIA), supervisory
  consultation responses as thought leadership. Proof wedge: bench_quant hand-verification
  — "here is our VaR vs the hand calculation, error shown" is a conversation no
  black-box vendor can have.
- **Compliance** — content-led inbound: the ESRS/SFDR/Taxonomy explainer series
  auto-generated from Atlas deep-dives (§7 sections are already written); free
  regulatory-calendar tier as the top-of-funnel hook; audit-firm alliances (they need
  tooling for CSRD assurance, we need their client access).

## 6 · Pre-GTM engineering dependencies (blocking, from the review docs)

These 8 items gate G0→G1 — each is a named, scoped fix, not a project:

1. Wire E104 page to its engine (B1 #3) — blocks BC-10 demos.
2. GLEIF bulk ingest run (`entity_lei` 3 → ≥100k) — blocks BC-14 credibility.
3. Seed realistic demo books: 200–500-holding portfolio, carbon book (B2c) — blocks BC-10/11/12 demo depth.
4. Fix valuation Decimal×float + null bugs (B1 #6–7) — blocks BC-18.
5. Fix `virtual-power-plant` 144× annualisation — blocks BC-04's fourth module (or demo without it).
6. EUDR empty-reference disclosure made un-missable OR BC-25 held back from demos (WDPA license decision) — blocks BC-25.
7. `severity.length` + `climate-var-engine` interaction-term fixes — blocks BC-11 full-suite.
8. Commit/push + Railway deploy + fresh `SECRET_KEY` (DEPLOYMENT.md blockers) — blocks everything customer-facing.

## 7 · KPIs

- **G0:** 8/8 dependencies closed · 25/25 cases graded, all demoed cases 🟢
- **G1:** weekly-active design partners · cases-run-per-partner-week · pilot→paid ≥50%
- **G2:** 3 lighthouses · time-to-first-value <14 days from contract · copilot deflection & 0 fabrication failures
- **G3:** pipeline coverage 3× · NRR >110% · desk-expansion rate · CAC payback <18mo
- **Always:** the no-fabrication eval stays at zero — a single fabricated number in front
  of a regulated buyer ends the segment; this KPI outranks all growth KPIs.

## 8 · Risks

| Risk | Mitigation |
|---|---|
| Demoing a 🟡/🔴 case too early burns credibility with exactly the buyers who value our honesty positioning | Readiness grades in TOP25 are binding: sales may only demo 🟢; 🟡 shown as "roadmap, engine ready" with the gap stated |
| Single-founder capacity across 3 segments | G1 limited to 6 partners; segments staggered 2-week starts; implementation plan sequences one segment's fixes at a time |
| Incumbent data vendors bundle "good enough" climate scores into existing contracts | Lead with cases vendors structurally can't do (BC-02 PF modeling, BC-03 tax equity, BC-22 CBAM cost curves) rather than score-adjacent ones |
| Regulatory drift (ESRS simplification, SSP scenario updates) invalidates content | Content is generated from the Atlas; regulation changes → atlas update → regenerate — same pipeline as the Notion push |
| LLM copilot ships before eval harness matures | Copilot is G2, not G1; `bench_llm` gate is a hard prerequisite per PRODUCTIZATION_ROADMAP P1 |
