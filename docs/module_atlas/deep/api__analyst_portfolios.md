## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is written directly from
`api/v1/routes/analyst_portfolios.py` (1,900 lines, no separate service module). No guide↔code
mismatch to report.)*

### 7.1 What the domain computes

Four endpoints serving **10 pre-built demo analyst portfolios** with disclosure gap assessments:

| Endpoint | Output |
|---|---|
| `GET /` | 10 portfolio summaries (exposure, CSRD coverage, avg peer score) |
| `GET /{portfolio_id}` | full definition + membership summary (NZBA/PCAF/CSRD counts) |
| `GET /{portfolio_id}/gap-assessment` | per-entity and exposure-weighted portfolio framework coverage |
| `POST /seed` | materialises the demo portfolios into `portfolios_pg` / `assets_pg` |

The foundation is a **hand-curated `ENTITY_MASTER`** of 55+ real institutions with real LEIs
(e.g. ING `ZMHGNT7ZPKZ3UFZ8NM98`, BNP Paribas `R0MUWSFPU8MPRO8K5P83`), sector/region, balance-sheet
size (€bn), NZBA/PCAF membership, SBTi status, a `peer_score` from the platform's
peer-benchmark engine, and `has_csrd_report` for the **8 entities whose CSRD annual reports were
actually processed** into the platform's `csrd_entity_registry` (ING, Rabobank, BNP Paribas,
ABN AMRO, Ørsted, RWE, ENGIE, EDP).

### 7.2 Parameterisation — framework gap rubric

**`FRAMEWORK_GAP_CATEGORIES` (18 categories)** define the coverage denominators
(`required_dps` = required data points):

| Group | Categories (required dps) |
|---|---|
| TCFD | Governance (4) · Strategy (6) · Risk Mgmt (4) · Metrics & Targets (8) |
| ISSB | S1 General (10) · S2 Climate (18) |
| ESRS | E1 Climate (40) · E2–E5 Environment (24) · Social (20) · Governance (12) · Double Materiality (8) |
| PCAF / Emissions | PCAF Financed Emissions (25) · Scope 3 Cat 15 (12) · Paris Alignment (10) |
| Strategy | Transition Plan (15) · Physical Risk (10) · Scenario Analysis (12) |
| Nature | TNFD Nature Risk (16) |

The TCFD 4/6/4/8 split mirrors the framework's 11 recommended disclosures (with metrics
sub-items); ESRS E1's 40 dps reflects its status as the heaviest ESRS standard. Per-entity
coverage percentages live in **`_ENTITY_COVERAGE_BASELINE`** — hand-estimated per the code
comment "derived from real extracted CSRD KPIs (for 8 reports) and peer benchmark engine scores".
They encode plausible, differentiated profiles (Ørsted: paris_alignment 95, tnfd 55; SMBC:
esrs_e2_e5 15) — expert-curated static estimates, not live extraction at request time.

RAG rubric: `≥ 75 GREEN · ≥ 50 AMBER · < 50 RED`.

### 7.3 Calculation walkthrough

1. **Entity gap assessment** (`_gap_assessment_for_entity`) — for each of the 18 categories:
   ```
   disclosed_dps = round(coverage_pct/100 × required_dps)
   missing_dps   = required_dps − disclosed_dps
   rag           = RAG(coverage_pct)
   ```
   entity `weighted_avg` = simple mean of the 18 coverage percentages (equal-weighted despite the
   name); `top_gaps` = 3 lowest-coverage categories. `data_source` is labelled
   "CSRD Annual Report (extracted)" vs "Peer benchmark estimate" from `has_csrd_report`.
2. **Portfolio aggregation** (`/gap-assessment`) — the endpoint first *attempts a live DB pull*
   of real CSRD coverage for processed-report entities, then falls back to the baseline. The
   portfolio roll-up **is** exposure-weighted:
   `coverage_cat = Σ(score_i × exposure_i) / Σ exposure_i` per category, and the overall score is
   the mean over categories.
3. **Portfolio list/detail** — sums `exposure_eur_mn` per entity, averages `peer_score`, counts
   NZBA/PCAF members and processed CSRD reports.
4. **Seeding** — `POST /seed` writes the 10 portfolios and their entity exposures into the real
   `portfolios_pg`/`assets_pg` tables so downstream engines (PCAF, stress testing …) can consume
   them as ordinary portfolios.

### 7.4 Worked example (ING within a portfolio)

ING baseline, category **ESRS E1 Climate** (required 40 dps, coverage 85 %):

| Step | Computation | Result |
|---|---|---|
| Disclosed dps | round(0.85 × 40) | **34** |
| Missing dps | 40 − 34 | **6** |
| RAG | 85 ≥ 75 | **GREEN** |
| Entity weighted_avg | mean of ING's 18 values (88, 85, 82, 88, 70, 72, 85, 45, 68, 72, 88, 92, 78, 85, 82, 65, 80, 42) | **74.8 → AMBER** (just under the 75 GREEN line, dragged by ESRS E2–E5 45 and TNFD 42) |
| Top gaps | 3 lowest | TNFD Nature (42), ESRS E2–E5 (45), Physical Risk (65) |

Portfolio level: if ING (€500m exposure, 85 %) sits with ABN AMRO (€250m, 72 %) in a category,
the exposure-weighted coverage is `(85×500 + 72×250)/750 = 80.7 %`.

### 7.5 Data provenance & limitations

- **Hybrid provenance, honestly labelled**: entity identities, LEIs, memberships and balance-sheet
  sizes are real; the 8 CSRD-report entities' coverage estimates trace to actually processed
  reports; the remaining entities carry analyst *estimates*, and every category row carries its
  `data_source` label. No PRNG anywhere in the file.
- Coverage baselines are frozen snapshots — they do not refresh when new reports are processed
  unless the DB-pull path finds newer data.
- `weighted_avg` at entity level is *unweighted* across categories (a 4-dp TCFD category counts
  the same as 40-dp ESRS E1); only the portfolio roll-up weights (by exposure, not by dps).
- `required_dps` counts are the platform's own decomposition of each framework, not official
  datapoint counts (e.g. EFRAG's ESRS E1 IG3 lists ~200 granular datapoints; 40 here represents
  a materiality-filtered subset).
- Demo portfolios are static definitions; user edits happen only after seeding into the real
  portfolio tables.

### 7.6 Framework alignment

- **CSRD / ESRS** — coverage categories map to ESRS topical standards (E1, E2–E5, S, G) plus the
  double-materiality assessment that CSRD Art. 19a requires; the gap assessment operationalises
  "disclosure readiness" as datapoint coverage.
- **TCFD** — the four-pillar structure (Governance, Strategy, Risk Management, Metrics & Targets)
  with its 11 recommended disclosures is the oldest and most widely-mapped framework here; ISSB
  S2 subsumes it.
- **ISSB S1/S2** — S1 general sustainability disclosures (10 dps here) and S2 climate (18 dps)
  reflect the IFRS sustainability baseline effective 2024.
- **PCAF** — the 25-dp financed-emissions category reflects PCAF's asset-class methods and data
  quality scoring (1–5) that banks in the master (all `pcaf_member: true` banks) report under.
- **NZBA / SBTi** — membership and target-status flags contextualise commitment vs disclosure:
  an NZBA bank with low transition-plan coverage is precisely the engagement case these
  portfolios are built to surface.
- **TNFD** — the 16-dp nature category tracks the LEAP-based disclosure recommendations; its
  consistently lowest coverage across entities mirrors real-world early adoption.
