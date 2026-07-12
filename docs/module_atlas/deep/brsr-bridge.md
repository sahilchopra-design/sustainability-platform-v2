## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *BRSR compliance
> completeness scorer* (`BRSR_score = (Core_disclosed + Leadership_disclosed) / (Core_total +
> Leadership_total) × 100`, 48 Core + 50 Leadership indicators, the 9 BRSR Core assured KPIs, and
> year-over-year disclosure tracking). **The code computes none of these.** What the page actually
> is (per its own header comment, "EP-P5 — BRSR Supabase Data Bridge") is a **data-integration
> console**: a hard-coded 10-table schema catalogue, a 17-row field-mapping register, a 9-principle
> GRI/TCFD/SFDR/EU-Taxonomy crosswalk, 10 validation rules, a simulated Supabase sync workflow, and
> 1,323 synthetic company records. There is no per-indicator completeness scoring and no BRSR Core
> assurance logic. The sections below document the code as it behaves.

### 7.1 What the module computes

Headline KPIs are simple ratios over the hard-coded metadata (`BrsrBridgePage.jsx:198-202`):

```js
totalRows         = Σ BRSR_SCHEMA.rows                    // = 12,792 across 10 tables
mappedFields      = BRSR_FIELD_MAP.filter(status==='Mapped').length   // = 10 of 17
companiesMapped   = brsrCompanies.filter(c => c.mapped_to_platform).length  // ~85% of 1,323
avgCompleteness   = Σ_tables (rows/1323 × 100) / 10       // table-level fill rate, ≈96.7%
crosswalkCoverage = 180 / (17 × 20) × 100                 // hard-coded ≈ 52.9%
```

`avgCompleteness` treats each of the 10 principle tables' row count (1,323 max; P4 1,200, P5 1,100,
P7 900, P8 1,100, P9 1,200) as a completeness proxy. `crosswalkCoverage` is an opaque constant
ratio (180 mapped cells over a nominal 17×20 grid) with no computation behind the numerator.

### 7.2 Parameterisation — the metadata registers

| Register | Rows | Content | Provenance |
|---|---|---|---|
| `BRSR_SCHEMA` | 10 | Table name, row count, principle description, field list (e.g. `brsr_principle6`: scope1/scope2 CO₂e, energy GJ, water KL, waste MT) | Mirrors SEBI BRSR's 9 NGRBC principles + company master; row counts synthetic |
| `BRSR_FIELD_MAP` | 17 | BRSR field → platform field with transform (`/1e6` tonnes→Mt, `× 0.1203` INR Cr→USD Mn) and status: 10 Mapped, 4 Pending, 3 Not Available | Authorial mapping; FX constant `INR_CR_TO_USD_MN = 0.1203` uncited |
| `CROSSWALK` | 9 | Principle → GRI series (e.g. P6→GRI 302-306), TCFD pillar, SFDR PAI numbers (P6→PAI 1-6), EU Taxonomy hook | Standard-to-standard mapping, broadly consistent with public crosswalks |
| `VALIDATION_RULES` | 10 | Field, type, min/max range (e.g. scope1 ∈ [0, 5×10⁸] t), unit, status | Plausibility bounds, authorial |

The 9 principles are the National Guidelines on Responsible Business Conduct (NGRBC) principles
that structure BRSR Section C — this mapping is faithful to the SEBI format.

### 7.3 Calculation walkthrough

1. **Company universe** — `genBrsrCompanies()` builds 1,323 records: names from
   `GLOBAL_COMPANY_MASTER` India entries (first 80) then `BRSR Company N`; sector from a 14-sector
   list; per-principle metrics all drawn from `seeded(i×prime)`; a synthetic CIN string; a
   `filing_date` in 2025; `quality_score = 50 + seeded×50`; `mapped_to_platform` (85% true).
2. **Search & drill-down** — substring search (≥2 chars) over name/sector, top 20; a detail panel
   shows the record's P1–P9 values.
3. **Sync simulation** — "Test Connection" flips a flag; per-table and bulk sync set status to
   `Syncing…` and resolve to `Synced` via `setTimeout` (1.5s / staged 3.5s). **No network call is
   made**; the Supabase URL/key inputs are persisted to localStorage but unused.
4. **Filing timeline** — buckets the 1,323 synthetic filing dates by month and averages
   `quality_score` per month.
5. **Gap views** — `completenessData` charts rows vs `1323 − rows` per table; `gapFields` lists
   the 7 non-Mapped fields; `unmappedCount = Σ fields − 17` counts schema fields without a mapping.
6. **Exports** — CSV/JSON of mappings and search results.

### 7.4 Worked example

Table-level completeness KPI, traced exactly:

| Table | rows | rows/1323 × 100 |
|---|---|---|
| companies, P1, P2, P3, P6 (5 tables) | 1,323 | 100.0 each |
| P4, P9 | 1,200 | 90.7 each |
| P5, P8 | 1,100 | 83.1 each |
| P7 | 900 | 68.0 |

`avgCompleteness = (5×100 + 2×90.7 + 2×83.1 + 68.0) / 10 = (500 + 181.4 + 166.3 + 68.0) / 10 =
91.6%`. Crosswalk KPI: `180 / (17×20) × 100 = 180/340 = 52.9%` regardless of any mapping change —
if a Pending field were promoted to Mapped, this KPI would not move.

### 7.5 Data provenance & limitations

- **All 1,323 company records are synthetic**, from the platform PRNG `seeded(s) =
  frac(sin(s+1)×10⁴)`; emissions, workforce, CSR and complaint figures are uniform draws with no
  sectoral shaping (a bank can draw 5 MtCO₂e Scope 1). Only the first ≤80 names are real Indian
  issuers from the company master.
- The sync workflow is **theatre**: timers, not I/O. The page never reads the real Supabase BRSR
  tables it advertises (the platform does hold BRSR reference data elsewhere — see
  `reference_data` layer notes).
- `avgCompleteness` is table-row completeness, not indicator completeness — a company present in
  `brsr_principle6` with 1 of 6 fields populated still counts as complete.
- `quality_score` is random and drives the timeline's "avg quality" line — no scoring rubric exists.
- The crosswalk is directionally correct but coarse (principle-level, not the indicator-level
  mapping the guide describes).

### 7.6 Framework alignment

- **SEBI BRSR (Circular May 2021)** — mandatory for the top 1,000 listed companies from FY2022-23;
  structured by the 9 NGRBC principles with Essential (mandatory) and Leadership (voluntary)
  indicators. The module's 10-table schema mirrors the 9 principles; the guide's "48 Core / 50
  Leadership" counts and "top 150" applicability refer to the BRSR Core assurance phase-in and are
  not encoded anywhere in code.
- **SEBI BRSR Core (July 2023)** — 9 KPI groups requiring reasonable assurance, phased from the
  top 150 (FY2023-24) to top 1,000 (FY2026-27). Not implemented; `quality_score` is unrelated.
- **GRI Universal Standards 2021 / TCFD / SFDR PAIs / EU Taxonomy** — represented only through the
  9-row crosswalk table (e.g. P6 → GRI 302-306, PAI 1-6), which is a reasonable high-level map.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score BRSR disclosure completeness and assurance-readiness for the ~1,000 BRSR-obligated Indian
issuers, supporting (a) investor screening of Indian holdings and (b) issuer gap analysis ahead of
BRSR Core assurance deadlines. Replaces the random `quality_score`.

### 8.2 Conceptual approach
Indicator-level completeness scoring with assurance weighting — modelled on (1) **CDP scoring
methodology** (disclosure → awareness → management bands from question-level points) and (2)
**S&P Global CSA / Bloomberg ESG disclosure scores** (field-level disclosure ratios weighted by
materiality), applied to the SEBI-published indicator inventory.

### 8.3 Mathematical specification

```
Essential_score  = Σ_e a_e·d_e / Σ_e a_e            d_e ∈ {1 disclosed, 0.5 partial, 0 absent}
Leadership_score = Σ_l d_l / N_L
Core_readiness   = Σ_{k=1..9} r_k / 9               r_k = 1 if KPI group k disclosed with
                                                     prior-year comparative AND assurable evidence
BRSR_score = 0.60·Essential + 0.15·Leadership + 0.25·Core_readiness, ×100
```

| Parameter | Value | Calibration source |
|---|---|---|
| Essential indicator inventory | per SEBI BRSR format (Annexure I) — count fixed by the circular in force | SEBI Circular SEBI/HO/CFD/CMD-2/P/CIR/2021/562 |
| BRSR Core KPI groups | 9 (GHG intensity, water, waste, energy, employee wellbeing/safety, gender wage, POSH, cyber, openness of business) | SEBI BRSR Core Circular (July 2023) |
| Materiality weights a_e | sector-normalised via SASB/GRI sector standards | GRI 13/11 sector standards; SASB SICS |
| Partial-credit rule | numeric field present without methodology note → 0.5 | CDP scoring convention |
| Component weights | 0.60/0.15/0.25, sensitivity-reported | Documented model choice |

Peer percentile: rank BRSR_score within NIFTY sector index. Data-quality overlay: flag any value
breaching the validation ranges already defined in `VALIDATION_RULES` (retain, extend to all
Essential numeric fields), and cross-year jump test `|Δ| > 3σ_sector`.

### 8.4 Data requirements
Machine-readable BRSR filings (NSE/BSE XBRL, free), SEBI indicator inventory (free), sector
classification (NIFTY/AMFI). Platform assets already present: the field-mapping register and
crosswalk in this module; India company master; the `reference_data` ingestion layer (extend with a
`brsr_filings` table); the transforms (`INR Cr → USD Mn` should source a dated RBI reference rate,
not the fixed 0.1203).

### 8.5 Validation & benchmarking plan
Reconcile completeness scores against a hand-scored 30-company sample (target agreement ≥90% at
indicator level); compare score distribution vs NSE's published BRSR adoption statistics; verify
Core_readiness flags against issuers' published assurance statements; regression-test transforms
(unit conversions) on known filings.

### 8.6 Limitations & model risk
XBRL tagging quality varies across filers (fallback: PDF extraction with human review for
low-confidence parses); "disclosed" ≠ "accurate" — completeness scores must not be presented as
quality ratings; the SEBI format is amended periodically (version the indicator inventory per FY);
FX conversion introduces comparability noise (report INR natively, convert only for display).
