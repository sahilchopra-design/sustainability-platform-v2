# EU Taxonomy Engine
**Module ID:** `eu-taxonomy-engine` · **Route:** `/eu-taxonomy-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Advanced EU Taxonomy calculation engine with sector-specific technical screening criteria, capex/opex/turnover splits, and enabling/transitional activity classification.

> **Business value:** Provides the granular calculation engine underpinning EU Taxonomy KPI reporting. Enables companies to move beyond eligibility to actual alignment by applying technical screening criteria to each economic activity.

**How an analyst works this module:**
- Select company and activity type
- Technical Screening Criteria tab shows sector-specific thresholds
- KPI Calculator computes Turnover/CapEx/OpEx alignment %
- Enabling vs Transitional classifier categorises activities

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `Check`, `EU_TAXONOMY`, `EU_TAX_API`, `EmptyState`, `EuTaxonomyEnginePage`, `KpiCard`, `SECTOR_MAP`, `SECTOR_TO_BACKEND_NACE`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EU_TAX_API` | `'http://localhost:8001/api/v1/eu-taxonomy';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(n, d = 1) => n == null ? '--' : Number(n).toFixed(d);` |
| `fmtPct` | `(n) => n == null ? '--' : Number(n).toFixed(1) + '%';` |
| `fmtMn` | `(n) => n == null ? '--' : '$' + Number(n).toFixed(0) + 'M';` |
| `esgScore` | `company.esg_score != null ? company.esg_score : 30 + s * 50;` |
| `ghgInt` | `company.ghg_intensity_tco2e_per_mn != null ? company.ghg_intensity_tco2e_per_mn : 50 + s * 400;` |
| `assessments` | `eligibleActivities.map((activity, idx) => {` |
| `dnsh_met` | `esgScore > 45 + s2 * 10;` |
| `safeguards_met` | `esgScore > 38 + s2 * 8;` |
| `alignedRevenuePct` | `anyAligned ? Math.min(100, (esgScore / 100) * 75 + (sbti ? 20 : 0) + s * 5) : (s > 0.7 ? s * 12 : 0);` |
| `dnshScore` | `assessments.filter(a => a.dnsh_met).length / Math.max(1, assessments.length) * 100;` |
| `safeguardsScore` | `assessments.filter(a => a.safeguards_met).length / Math.max(1, assessments.length) * 100;` |
| `baseAssessments` | `useMemo(() => portfolio.map(c => ({ c, assessment: assessTaxonomyAlignment(c) })), [portfolio]);` |
| `investees_data` | `eligible.map(({ idx, nace }) => {` |
| `revenue` | `c.revenue_usd_mn \|\| (c.revenue_inr_cr ? c.revenue_inr_cr * 0.12 : 500);` |
| `assessedHoldings` | `useMemo(() => { return baseAssessments.map(({ c, assessment: localAssessment }, idx) => { const live = portfolioLive?.get(idx);` |
| `weight` | `c.weight \|\| (1 / (portfolio.length \|\| 1)) * 100;` |
| `eligiblePct` | `(eligibleCount / total * 100).toFixed(1);` |
| `weightedAligned` | `assessedHoldings.reduce((s, h) => s + h.alignedRevenuePct * (h.weight / 100), 0);` |
| `alignedRevenueTotal` | `assessedHoldings.reduce((s, h) => s + h.alignedRevenue, 0);` |
| `eligibleActivitiesTotal` | `assessedHoldings.reduce((s, h) => s + h.eligibleActivities, 0);` |
| `avgDnsh` | `assessedHoldings.reduce((s, h) => s + (h.dnshScore \|\| 0), 0) / total;` |
| `avgSafeguards` | `assessedHoldings.reduce((s, h) => s + (h.safeguardsScore \|\| 0), 0) / total;` |
| `revenuePie` | `useMemo(() => { const aligned = assessedHoldings.filter(h => h.assessments?.some(a => a.overall_aligned)).reduce((s, h) => s + h.alignedRevenue, 0);` |
| `eligibleNotAligned` | `assessedHoldings.filter(h => h.eligible && !h.assessments?.some(a => a.overall_aligned)).reduce((s, h) => s + h.revenue, 0);` |
| `notEligible` | `assessedHoldings.filter(h => !h.eligible).reduce((s, h) => s + h.revenue, 0);` |
| `dnshMatrix` | `useMemo(() => { return assessedHoldings.slice(0, 20).map(h => { const s = seed(hashStr(h.name \|\| '') + 99);` |
| `topAligned` | `useMemo(() => { return [...assessedHoldings].sort((a, b) => b.alignedRevenuePct - a.alignedRevenuePct).slice(0, 5);` |
| `bottomAligned` | `useMemo(() => { return [...assessedHoldings].filter(h => h.eligible).sort((a, b) => a.alignedRevenuePct - b.alignedRevenuePct).slice(0, 5);` |
| `heatmapData` | `useMemo(() => { const sectors = [...new Set(assessedHoldings.map(h => h.taxSector))];` |
| `objectives` | `EU_TAXONOMY.objectives.map(o => o.id);` |
| `revenueConcentration` | `useMemo(() => { const sorted = [...assessedHoldings].sort((a, b) => b.alignedRevenue - a.alignedRevenue);` |
| `totalAligned` | `sorted.reduce((s, h) => s + h.alignedRevenue, 0);` |
| `tscTighten` | `1 - (y - 2021) * 0.03;` |
| `objectiveScores` | `useMemo(() => { return EU_TAXONOMY.objectives.map(obj => { const relevant = assessedHoldings.filter(h => h.assessments?.some(a => a.objective === obj.id));` |
| `rows` | `assessedHoldings.map(h => [h.name, h.isin \|\| '', h.gicsSector, h.taxSector, h.eligible ? 'Yes' : 'No', h.alignedRevenuePct, h.alignedRevenue, h.dnshScore, h.safeguardsScore, h.eligibleActivities, h.assessments?.some(a =>` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `data` | `{ exportDate: new Date().toISOString(), portfolio: assessedHoldings.map(h => ({ name: h.name, isin: h.isin, sector: h.gicsSector, taxonomySector: h.taxSector, eligible: h.eligible, alignedRevenuePct: h.alignedRevenuePct,` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-taxonomy/assess-activity` | `assess_activity` | api/v1/routes/eu_taxonomy.py |
| POST | `/api/v1/eu-taxonomy/assess-entity` | `assess_entity` | api/v1/routes/eu_taxonomy.py |
| POST | `/api/v1/eu-taxonomy/assess-portfolio` | `assess_portfolio` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/objectives` | `ref_objectives` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/nace-activities` | `ref_nace_activities` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/dnsh-matrix` | `ref_dnsh_matrix` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/minimum-safeguards` | `ref_minimum_safeguards` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/kpi-definitions` | `ref_kpi_definitions` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/transitional-activities` | `ref_transitional_activities` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/enabling-activities` | `ref_enabling_activities` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/financial-kpis` | `ref_financial_kpis` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/sector-thresholds` | `ref_sector_thresholds` | api/v1/routes/eu_taxonomy.py |

### 2.3 Engine `eu_taxonomy_engine` (services/eu_taxonomy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EUTaxonomyEngine._find_activity` | nace_code | Look up NACE activity by code. |
| `EUTaxonomyEngine.assess_activity` | nace_code, objective, evidence_data | Assess a single NACE activity against one environmental objective. Implements the 3-step Article 3 test: 1. Substantial Contribution (Article 10-15) 2. Do No Significant Harm (Article 17) 3. Minimum Safeguards (Article 18) Parameters: nace_code: NACE code of the activity objective: Environmental objective (CCM/CCA/WTR/CE/POL/BIO) evidence_data: Dict with keys like emission_intensity, energy_source |
| `EUTaxonomyEngine._evaluate_substantial_contribution` | activity, objective, evidence | Evaluate substantial contribution against TSC thresholds. |
| `EUTaxonomyEngine._evaluate_dnsh` | sc_objective, evidence | Evaluate DNSH for all other 5 objectives. |
| `EUTaxonomyEngine._evaluate_minimum_safeguards` | evidence | Evaluate Article 18 minimum safeguards. |
| `EUTaxonomyEngine.assess_entity` | entity_name, reporting_year, activities_data, financials | Full entity-level taxonomy alignment assessment. Calculates turnover/capex/opex KPIs per Article 8 / DR 2021/2178. Parameters: entity_name: Company name reporting_year: Fiscal year activities_data: List of dicts with keys: nace_code, objective, evidence_data, turnover_eur, capex_eur, opex_eur financials: Dict with total_turnover_eur, total_capex_eur, total_opex_eur |
| `EUTaxonomyEngine.assess_portfolio` | portfolio_id, portfolio_name, investees_data | Portfolio-level taxonomy alignment for financial institutions. Calculates GAR, BTAR, and SFDR article classification. Parameters: portfolio_id: Portfolio identifier portfolio_name: Display name investees_data: List of dicts with keys: entity_name, reporting_year, activities_data, financials, exposure_eur |
| `EUTaxonomyEngine.get_environmental_objectives` |  | 6 Environmental Objectives per Article 9. |
| `EUTaxonomyEngine.get_nace_activities` |  | All NACE activities across 4 Delegated Acts. |
| `EUTaxonomyEngine.get_tsc_for_activity` | nace_code, objective | Get Technical Screening Criteria for a specific activity/objective pair. |
| `EUTaxonomyEngine.get_dnsh_matrix` |  | 6x6 DNSH cross-check matrix. |
| `EUTaxonomyEngine.get_minimum_safeguards` |  | Article 18 Minimum Safeguards. |
| `EUTaxonomyEngine.get_kpi_definitions` |  | Turnover/CapEx/OpEx KPI definitions per DR 2021/2178. |
| `EUTaxonomyEngine.get_transitional_activities` |  | Transitional activities per Article 10(2). |
| `EUTaxonomyEngine.get_enabling_activities` |  | Enabling activities per Article 10(1). |
| `EUTaxonomyEngine.get_cross_framework_map` |  | Cross-framework mapping: Taxonomy -> CSRD/SFDR/ISSB/GRI/CDP/TCFD. |
| `EUTaxonomyEngine.get_financial_kpi_definitions` |  | GAR, BTAR, insurance and asset manager KPI definitions. |
| `EUTaxonomyEngine.get_sector_thresholds` |  | Key quantitative thresholds by sector from all Delegated Acts. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Climate` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Turnover KPI | — | Taxonomy report | Revenue from taxonomy-aligned activities |
| CapEx KPI | — | Taxonomy report | Investment in taxonomy-aligned activities |
| OpEx KPI | — | Taxonomy report | O&M expenditure on aligned assets |
- **Activity revenue data** → TSC threshold comparison → **Turnover alignment %**
- **Investment plans** → CapEx taxonomy mapping → **CapEx KPI**
- **O&M budgets** → OpEx eligibility → **OpEx KPI**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-taxonomy/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_map'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/dnsh-matrix** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dnsh_matrix'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/enabling-activities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['enabling_activities'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/financial-kpis** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_kpi_definitions'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/kpi-definitions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['kpi_definitions'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/minimum-safeguards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['minimum_safeguards'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/nace-activities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nace_activities'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/objectives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['environmental_objectives'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Technical Screening Criteria engine
**Headline formula:** `TaxonomyAlignment = Turnover_aligned% / Turnover_eligible%`

Three KPIs per activity: Turnover (revenue from aligned activities), CapEx (investment in transition/enabling), OpEx (maintenance of aligned assets). Enabling activities: make other activities sustainable. Transitional: best-in-class but no zero-carbon alternative yet.

**Standards:** ['EU Taxonomy Delegated Acts', 'Platform Verifier TSC']
**Reference documents:** EU Taxonomy Climate Delegated Act; EU Taxonomy Environmental Delegated Act

**Engine `eu_taxonomy_engine` — extracted transformation lines:**
```python
score = min(100.0, (actual_value / max(threshold, 0.001)) * 100) if threshold > 0 else (100.0 if actual_value > 0 else 0.0)
score = max(0.0, min(100.0, (1.0 - actual_value / threshold) * 100))
score = min(100.0, provided * 25.0)
area_score = (present / max(len(indicators), 1)) * 100
final_score = total_score / max(total_weight, 0.001)
result.turnover_alignment_pct = round((aligned_turnover / total_t) * 100, 2)
result.capex_alignment_pct = round((aligned_capex / total_c) * 100, 2)
result.opex_alignment_pct = round((aligned_opex / total_o) * 100, 2)
result.transitional_share_pct = round((transitional_turnover / max(aligned_turnover, 0.001)) * 100, 2) if aligned_turnover > 0 else 0.0
result.enabling_share_pct = round((enabling_turnover / max(aligned_turnover, 0.001)) * 100, 2) if aligned_turnover > 0 else 0.0
inv_aligned_share = entity_result.turnover_alignment_pct / 100.0
result.green_asset_ratio = round((aligned_exposure / total_exp) * 100, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `eu_taxonomy_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `eu-taxonomy` | engine:eu_taxonomy_engine, table:Climate |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) mismatch flag.** As with `eu-taxonomy`, a rigorous backend
> (`eu_taxonomy_engine.py`) implements the real Article-3 test with genuine TSC comparison, DNSH, MSS,
> and GAR roll-up. **This frontend, however, computes alignment locally in `assessTaxonomyAlignment`,
> partly against real TSC thresholds but partly on a seeded ESG-score heuristic.** It is a step closer
> to reality than `eu-taxonomy` (it embeds correct numeric thresholds — 100 gCO₂e/kWh, 1.331 tCO₂e/t
> steel, 0.469 t/t cement clinker, EPC-A, PUE < 1.5) but the `ghg_intensity` it tests is frequently
> synthetic (`50 + s·400`) and the headline `alignedRevenuePct` is an **ESG-score formula, not
> aligned-turnover accounting**. Documented below.

### 7.1 What the module computes

Per company, `assessTaxonomyAlignment` maps GICS→taxonomy sector, filters `EU_TAXONOMY.activities` to
that sector, and evaluates each activity's threshold against the company's GHG intensity / ESG score:

```js
h = hashStr(isin || name);  s = seed(h)
esgScore = company.esg_score ?? (30 + s·50)                    // synthetic fallback
ghgInt   = company.ghg_intensity_tco2e_per_mn ?? (50 + s·400)  // synthetic fallback
per activity:
  if threshold.ghg_per_kwh   → aligned = ghgInt < 200          // power
  if threshold.ghg_per_tonne → aligned = ghgInt < 250          // steel/cement/aluminium
  if transport thresholds    → aligned = ghgInt < 180
  if building/PUE/forest      → aligned = esgScore > 55/50/45
  else                        → aligned = seed(h+idx·137) > 0.5
  dnsh_met       = esgScore > 45 + s2·10
  safeguards_met = esgScore > 38 + s2·8
  overall_aligned = aligned ∧ dnsh_met ∧ safeguards_met
alignedRevenuePct = anyAligned ? min(100, esgScore/100·75 + (sbti?20:0) + s·5) : (s>0.7 ? s·12 : 0)
```

Portfolio KPIs then weight `alignedRevenuePct` by holding weight:
`weightedAligned = Σ(alignedRevenuePct · weight/100)`, plus per-objective and DNSH/safeguard averages.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| Activity TSC thresholds | **Real regulatory numbers**: power < 100 gCO₂e/kWh; gas transitional < 270g; steel EAF < 1.331 tCO₂e/t; cement clinker < 0.469; aluminium < 1.484; rail < 50 gCO₂/pkm; ZEV 0 tailpipe; new build 10% < NZEB; renovation 30%; EPC-A; data centre PUE < 1.5; water < 0.5 kWh/m³ | **Climate DA 2021/2139** + Complementary DA 2022/1214 |
| Alignment test cut-offs | ghgInt < 200/250/180; esgScore > 45–55 | **Frontend heuristic** — proxies the threshold, not a per-activity comparison to the exact TSC |
| `esgScore`/`ghgInt` fallback | `30+s·50` / `50+s·400` | **Synthetic** when company lacks real fields |
| DNSH criteria (5) | CCA / WMR / CE / PP / BIO | Real DNSH structure; scored via `esgScore` heuristic |
| Minimum Safeguards (4) | OECD MNE / UNGP / ILO / Intl Bill of Human Rights | Real; scored via `esgScore` heuristic |
| `SECTOR_MAP` | GICS → {Energy, Industry, Transport, Buildings, ICT, Finance, Water, Forestry} | Editorial mapping |

The **activity/threshold catalogue is genuinely accurate** — these are the exact Delegated-Act numbers.
The weakness is the *evaluation*: it applies broad `ghgInt < 200` bands rather than comparing to each
activity's specific threshold, and it substitutes ESG score for building/PUE/forest criteria.

### 7.3 Calculation walkthrough

1. Company → GICS → `taxSector` → eligible activities in that sector.
2. Each activity's threshold type routes to a comparison (GHG-intensity band or ESG-score gate).
3. `dnsh_met`, `safeguards_met` gate on ESG score; `overall_aligned` requires all three.
4. `alignedRevenuePct` = ESG-score-driven formula if any activity aligns, else a small seeded residual.
5. Portfolio: `weightedAligned`, `avgDnsh`, `avgSafeguards`, per-objective %s, GAR-style aggregation.

### 7.4 Worked example

Company with real `esg_score = 68`, `ghg_intensity = 140`, GICS "Utilities" → taxSector "Energy",
`sbti_committed = true`, `s = seed(hash) ≈ 0.6`:

| Activity | Threshold | Test | Aligned? |
|---|---|---|---|
| Solar PV (ghg_per_kwh) | ghgInt < 200 | 140 < 200 | yes |
| Wind (ghg_per_kwh) | ghgInt < 200 | 140 < 200 | yes |
| Gas < 270g (ghg_per_kwh) | ghgInt < 200 | 140 < 200 | yes (but should test 270 band) |
| dnsh_met | esg > 45 + s2·10 (~51) | 68 > 51 | yes |
| safeguards_met | esg > 38 + s2·8 (~43) | 68 > 43 | yes |

anyAligned = true → `alignedRevenuePct = min(100, 68/100·75 + 20 + 0.6·5) = 51 + 20 + 3 = 74.0%`.
So the company reports **74% taxonomy-aligned turnover** — but this number is `f(ESG score, SBTi)`,
**not** the sum of aligned activities' actual revenue. A utility with 68 ESG and SBTi always lands near
74% regardless of its real green-revenue split.

### 7.5 Data provenance & limitations

- **TSC catalogue is real and accurate**; the *alignment evaluation* is coarse (intensity bands) and
  falls back to ESG-score gates for non-emission criteria.
- **`alignedRevenuePct` is an ESG-score heuristic**, not aligned-turnover accounting — the core
  Article-8 KPI is fabricated from ratings, not financials.
- **GHG intensity is synthetic** (`50 + s·400`) whenever the company lacks a real value.
- DNSH and Minimum Safeguards are `esgScore` thresholds, not evidence assessments.
- The rigorous engine (`eu_taxonomy_engine.py`) that does real TSC comparison and turnover-based GAR is
  not invoked for scoring; only `/ref/*` reference data is fetched.

**Framework alignment:** Faithful to **EU Taxonomy Regulation (EU) 2020/852** and the **Climate
Delegated Act 2021/2139** threshold set (the embedded gCO₂/kWh and tCO₂e/tonne numbers are correct),
and structurally to Article-3 (SC ∩ DNSH ∩ MSS) and Article-8 turnover/capex/opex KPIs. But it
approximates alignment via ratings rather than the technical-screening comparison the framework
defines. The genuine implementation lives in the backend engine.

## 8 · Model Specification

**Status: specification — not yet wired into the frontend (backend engine exists).** Replace the
ESG-score heuristic with per-activity TSC evaluation and turnover-based alignment via
`eu_taxonomy_engine.assess_entity`.

**8.1 Purpose & scope.** Compute activity-level alignment against exact TSC, then entity turnover/capex/
opex alignment and portfolio GAR — from reported activity revenues and evidence, not ratings.

**8.2 Conceptual approach.** The Article-3 three-step test with per-activity threshold comparison, as
in ISS ESG / MSCI / Clarity AI taxonomy engines and the platform's own `eu_taxonomy_engine.py`. Each
activity's revenue is classified eligible/aligned/non-eligible, then aggregated by financial weight.

**8.3 Mathematical specification.**

```
Per company activity a with reported metric m_a, threshold τ_a, revenue R_a:
  SC_met_a = (m_a ≤ τ_a) for emission thresholds, or (m_a ≥ τ_a) for reduction/EPC thresholds
  aligned_a = SC_met_a ∧ DNSH_a ∧ MSS   (DNSH/MSS from attested evidence, not ESG proxy)
  turnover_aligned% = Σ_a (aligned_a · R_a) / Σ_a R_a
  turnover_eligible% = Σ_a (eligible_a · R_a) / Σ_a R_a    (capex, opex analogous)
Portfolio: GAR = Σ_i (exposure_i · turnover_aligned%_i) / Σ_i exposure_i
Per objective: aligned%_o = Σ_i exposure_i · aligned_turnover_for_o / Σ exposure
```

| Parameter | Source |
|---|---|
| Per-activity τ (100 gCO₂/kWh, 1.331 t/t steel, 0.469 cement, EPC-A, PUE 1.5) | Climate DA 2021/2139 (already in the catalogue) |
| DNSH criteria | DA Annexes |
| Minimum Safeguards | OECD MNE / UNGP / ILO / Intl Bill of Human Rights |
| Activity revenues | Company segment reporting / Taxonomy disclosures |

**8.4 Data requirements.** Per-activity revenue and the specific TSC metric (life-cycle gCO₂/kWh,
tCO₂e/tonne, EPC class, PUE, % below NZEB), plus DNSH/MSS attestations. Platform holds
`GLOBAL_COMPANY_MASTER` (GHG intensity, ESG) and the backend engine; needs activity-level revenue
splits (segment data) to replace the ESG-score proxy.

**8.5 Validation & benchmarking plan.** Reconcile computed turnover-aligned% against issuers' published
Taxonomy disclosures; unit-test each threshold comparison; benchmark portfolio GAR against EBA Pillar-3
templates and a vendor (ISS/MSCI) taxonomy dataset.

**8.6 Limitations & model risk.** Activity-level revenue splits are scarce for non-EU issuers — where
absent, mark eligible-not-aligned rather than proxying alignment from ESG. Transitional/enabling
activities need special handling (gas < 270g, nuclear conditions). Conservative fallback: no evidence →
not aligned.

## 9 · Future Evolution

### 9.1 Evolution A — Retire the page's shadow assessor; make this the KPI calculator over one engine (analytics ladder: rung 2 → 3)

**What.** This module shares the real `EUTaxonomyEngine` backend (13 endpoints) with the sibling `eu-taxonomy` page — but its frontend runs a *shadow assessment* alongside the live calls: a local `assessTaxonomyAlignment` whose `dnsh_met = esgScore > 45 + s2·10`, `alignedRevenuePct = esgScore/100·75 + (sbti ? 20 : 0) + s·5`, seeded fallbacks for missing ESG/GHG fields, a seeded DNSH matrix, and a `tscTighten = 1 − (y−2021)·0.03` timeline heuristic. Where live results exist they're merged with local ones (`portfolioLive?.get(idx)` fallback), so users cannot tell engine verdicts from heuristics. Evolution A resolves the two-page, two-assessor situation.

**How.** (1) Delete the local assessor: every holding's alignment comes from `POST /assess-portfolio`, with the engine's honest not-covered path for uncatalogued NACE codes — no ESG-score-as-alignment-proxy, which is methodologically wrong (alignment is activity-level TSC compliance, not entity ESG quality). (2) Differentiate the two pages by role, not engine: `eu-taxonomy` owns activity/entity assessment and evidence; this page owns the *KPI calculator* — turnover/capex/opex splits per Article 8 / DR 2021/2178 templates, enabling/transitional classification (`ref/transitional-activities` exists and is underused), and the year-on-year TSC-tightening view rebuilt from actual Delegated Act version data instead of the 3%/yr heuristic. (3) Persist entity KPI reports (org-scoped). (4) Rung 3: the Article 8 template arithmetic bench-pinned; a published issuer's disclosed KPIs reproduced as validation.

**Prerequisites.** The shared catalog expansion from `eu-taxonomy`'s Evolution A; missing company-master ESG/GHG fields handled as honest nulls, never seeded. **Acceptance:** grep finds no local alignment computation; a holding's displayed alignment equals the engine response; enabling/transitional tags come from ref data; the Article 8 template totals reconcile.

### 9.2 Evolution B — Article 8 disclosure-pack drafter (LLM tier 2)

**What.** The regulation this module serves ends in a specific artifact: the Article 8 / DR 2021/2178 KPI tables plus accompanying narrative. A tool-calling drafter assembles it — pulls the entity's persisted KPI report (aligned/eligible/total by turnover, capex, opex), the per-activity assessment details with enabling/transitional flags, and drafts the disclosure: the mandated templates populated exactly, plus the contextual narrative (which activities drive alignment, what changed year-over-year, which TSC revisions bind next year from the versioned catalog) — every number from engine output.

**How.** Tools: `get_entity_kpis(entity, year)`, `get_activity_assessments(entity)`, `compare_years(entity, y1, y2)`, `get_upcoming_tsc_changes(activities)`. Grounding corpus = this Atlas record plus `ref/kpi-definitions` and `ref/financial-kpis` (the engine ships the definitions — the drafter must use its wording, since Article 8 terminology is prescribed). Template population is structural (typed output schema mapping to the DR's template rows); narrative claims about drivers must cite specific activity rows. Renders through report-studio; the iXBRL path via the cockpit's export engine.

**Prerequisites (hard).** Evolution A — drafting a regulated disclosure from the current merged live/heuristic assessments would put shadow-assessor numbers into an Article 8 filing. **Acceptance:** a golden entity's populated template matches the KPI endpoint cell-for-cell; year-over-year narrative cites real deltas; activities pending TSC revision are flagged with the catalog version that changes them.