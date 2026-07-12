# Forced Labour Msv2
**Module ID:** `forced-labour-msv2` · **Route:** `/forced-labour-msv2` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `AUDITORS`, `AUDIT_RECORDS`, `AUDIT_RESULTS`, `BASE_COMPANIES`, `Badge`, `COUNTRY_RISK`, `COUNTRY_TO_ISO`, `FORCED_LABOUR_API`, `GRIEVANCES`, `GRIEVANCE_SEVERITIES`, `GRIEVANCE_STATUSES`, `GRIEVANCE_TYPES`, `ILO_INDICATORS`, `INDUSTRIES`, `INDUSTRY_TO_SECTOR`, `KpiCard`, `PIE_C`, `Row`, `SOURCE_COUNTRIES`, `SUPPLY_CHAINS`, `StatusBadge`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FRAMEWORKS` | 9 | `desc`, `deadline`, `compliant` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `FORCED_LABOUR_API` | ``${API}/api/v1/forced-labour`;` |
| `riskScore` | `Math.round(20 + sr(i * 7) * 75);` |
| `uflpaCompliant` | `sr(i * 11) > 0.4;` |
| `ukMsaQuality` | `Math.round(20 + sr(i * 13) * 70);` |
| `csdddReady` | `sr(i * 17) > 0.5;` |
| `supplierCount` | `Math.round(50 + sr(i * 19) * 450);` |
| `highRiskSuppliers` | `Math.round(supplierCount * 0.05 + sr(i * 23) * supplierCount * 0.15);` |
| `auditsPassed` | `Math.round(supplierCount * 0.5 + sr(i * 29) * supplierCount * 0.4);` |
| `lastAudit` | ``202${3 + Math.floor(sr(i * 31) * 3)}-${String(1 + Math.floor(sr(i * 33) * 11)).padStart(2,'0')}-${String(1 + Math.floor(sr(i * 37) * 27)).padStart(2,'0')}`;` |
| `audFreqs` | `['Annual','Biennial','Ad-hoc'];` |
| `COUNTRY_RISK` | `SOURCE_COUNTRIES.map((c, i) => ({` |
| `csv` | `[h.join(','), ...rows.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `avgRisk` | `SUPPLY_CHAINS.length ? Math.round(SUPPLY_CHAINS.reduce((a, s) => a + s.riskScore, 0) / SUPPLY_CHAINS.length) : 0;` |
| `totalWorkers` | `SUPPLY_CHAINS.reduce((a, s) => a + s.workerCount, 0);` |
| `heatData` | `SOURCE_COUNTRIES.slice(0, 15).map((c, ci) => ({` |
| `tierDist` | `['Critical','High','Medium','Low'].map(t => ({ name: t, value: SUPPLY_CHAINS.filter(s => s.tier === t).length }));` |
| `radarData` | `sc.iloScores.map(s => ({ indicator: s.indicator.split(' ').slice(0, 2).join(' '), score: s.score }));` |
| `avgIlo` | `sc.iloScores.length ? Math.round(sc.iloScores.reduce((a, s) => a + s.score, 0) / sc.iloScores.length) : 0;` |
| `crossCompare` | `SUPPLY_CHAINS.slice(0, 20).map(s => ({` |
| `totalCompliant` | `FRAMEWORKS.reduce((a, f) => a + f.compliant, 0);` |
| `avgRate` | `FRAMEWORKS.length > 0 ? Math.round(totalCompliant / (FRAMEWORKS.length * SUPPLY_CHAINS.length) * 100) : 0;` |
| `pct` | `SUPPLY_CHAINS.length ? Math.round(f.compliant / SUPPLY_CHAINS.length * 100) : 0;` |
| `sevDist` | `GRIEVANCE_SEVERITIES.map(s => ({ name: s, value: GRIEVANCES.filter(g => g.severity === s).length }));` |
| `typeDist` | `GRIEVANCE_TYPES.map(t => ({ name: t.slice(0, 14), count: GRIEVANCES.filter(g => g.type === t).length }));` |
| `avgDaysOpen` | `filteredGrievances.length ? Math.round(filteredGrievances.reduce((a, g) => a + g.daysOpen, 0) / filteredGrievances.length) : 0;` |
| `totalWorkerAffected` | `GRIEVANCES.reduce((a, g) => a + g.workerCount, 0);` |
| `auditorPerf` | `AUDITORS.map(a => {` |
| `avgFindings` | `recs.length ? Math.round(recs.reduce((s, r) => s + r.findings, 0) / recs.length) : 0;` |
| `yearTrend` | `['2023','2024','2025','2026'].map(yr => {` |
| `topByFreq` | `Object.entries(AUDIT_RECORDS.reduce((acc, r) => { acc[r.company] = (acc[r.company] \|\| 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([company, count]) => ({ company: company.slice(0, 18), count` |
| `wageByCountry` | `SOURCE_COUNTRIES.slice(0, 20).map((c, i) => {` |
| `avgGap` | `chains.length ? Math.round(chains.reduce((a, s) => a + s.wageGap, 0) / chains.length) : 0;` |
| `workersByTier` | `['Critical','High','Medium','Low'].map(t => ({` |
| `avgWageGap` | `SUPPLY_CHAINS.length ? Math.round(SUPPLY_CHAINS.reduce((a, s) => a + s.wageGap, 0) / SUPPLY_CHAINS.length) : 0;` |
| `remByStatus` | `['Open','In Progress','Closed'].map(s => ({` |
| `top15Open` | `[...SUPPLY_CHAINS].filter(s => s.remediationStatus === 'Open').sort((a, b) => b.remediationActions - a.remediationActions).slice(0, 15).map(s => ({ name: s.company.slice(0, 18), actions: s.remediationActions, risk: s.ris` |
| `avgByIndustry` | `INDUSTRIES.map(ind => {` |
| `avgDays` | `chains.length ? Math.round(chains.reduce((a, s) => a + (s.remediationStatus === 'Closed' ? Math.round(sr(s.id * 97) * 180 + 10) : 0), 0) / Math.max(1, chains.filter(s => s.remediationStatus === 'Closed').length)) : 0;` |
| `openActions` | `SUPPLY_CHAINS.filter(s => s.remediationStatus === 'Open').reduce((a, s) => a + s.remediationActions, 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/forced-labour/ilo-screening` | `screen_ilo_indicators` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/eu-flr-assessment` | `assess_eu_flr` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/uk-msa-scoring` | `assess_uk_msa` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/compliance-programme` | `assess_compliance_programme` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/supplier-screening` | `screen_supplier_network` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/full-assessment` | `full_assessment` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/ilo-indicators` | `ref_ilo_indicators` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/country-risk` | `ref_country_risk` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/risk-levels` | `ref_risk_levels` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/uk-msa-areas` | `ref_uk_msa_areas` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/high-risk-countries` | `ref_high_risk_countries` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/high-risk-sectors` | `ref_high_risk_sectors` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/eu-flr-risk` | `eu_flr_risk` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/lksg-assessment` | `assess_lksg` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/supplier-network` | `supplier_network` | api/v1/routes/forced_labour.py |

### 2.3 Engine `forced_labour_engine` (services/forced_labour_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ForcedLabourEngine.screen_ilo_indicators` | entity_id, supplier_data | Score all 11 ILO forced labour indicators (0-10 risk each). Each indicator score MUST be supplied in ``supplier_data`` keyed by the indicator name (e.g. ``{"debt_bondage": 7.5}``). Indicators with no supplied value are recorded as "not assessed" (score ``None``) and are excluded from the weighted aggregate rather than fabricated. If no indicator is assessed, the aggregate risk score is returned as |
| `ForcedLabourEngine.assess_eu_flr` | entity_id, country_code, sector, products, audit_evidence | EU Forced Labour Regulation 2024/3015 — import risk assessment. |
| `ForcedLabourEngine.assess_uk_msa` | entity_id, disclosure_data | UK Modern Slavery Act Section 54 — disclosure scoring (0-30). Scoring reflects only affirmatively disclosed criteria: a criterion is credited only when its flag in ``disclosure_data`` is ``True``. Absent (``None``) or falsy criteria earn no point — undisclosed is not credited (never fabricated). |
| `ForcedLabourEngine.assess_compliance_programme` | entity_id, programme_data | 5-pillar compliance programme maturity assessment. Each pillar score (0-100) is read from ``programme_data``; unsupplied pillars are returned as ``None`` (not fabricated) and excluded from the weighted overall score, which is renormalised over the supplied pillars. If no pillar is supplied, ``overall_programme_score`` is ``None`` and maturity is ``"insufficient_data"``. Operational metrics (``audi |
| `ForcedLabourEngine.screen_supplier_network` | assessment_id, suppliers | Per-supplier forced labour risk screening. |
| `ForcedLabourEngine.full_assessment` | entity_id, entity_name, sector, country_code, products, audit_evidence, supplier_data, disclosure_data | Full forced labour risk assessment. |
| `ForcedLabourEngine.get_ilo_indicators` |  |  |
| `ForcedLabourEngine.get_eu_flr_country_risk` |  |  |
| `ForcedLabourEngine.get_uk_msa_areas` |  |  |
| `ForcedLabourEngine.get_lksg_prohibited_practices` |  |  |
| `ForcedLabourEngine.get_high_risk_sectors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `engine`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `AUDITORS`, `AUDIT_RESULTS`, `BASE_COMPANIES`, `FRAMEWORKS`, `GRIEVANCE_SEVERITIES`, `GRIEVANCE_STATUSES`, `GRIEVANCE_TYPES`, `ILO_INDICATORS`, `INDUSTRIES`, `PIE_C`, `SOURCE_COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/forced-labour/ref/country-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_risk'], 'n_keys': 1}`

**GET /api/v1/forced-labour/ref/high-risk-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['high_risk_countries', 'eu_flr_country_list', 'note'], 'n_keys': 3}`

**GET /api/v1/forced-labour/ref/high-risk-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['high_risk_sectors'], 'n_keys': 1}`

**GET /api/v1/forced-labour/ref/ilo-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ilo_indicators'], 'n_keys': 1}`

**GET /api/v1/forced-labour/ref/risk-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eu_flr_risk_levels'], 'n_keys': 1}`

**GET /api/v1/forced-labour/ref/uk-msa-areas** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['uk_msa_areas'], 'n_keys': 1}`

**POST /api/v1/forced-labour/compliance-programme** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/forced-labour/eu-flr-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `forced_labour_engine` — extracted transformation lines:**
```python
agg_score = aggregate / assessed_weight if assessed_weight > 0 else 0.0
coverage_pct = round(assessed_weight / total_weight * 100, 1) if total_weight > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Engine↔page disconnect.** A **rigorous backend engine** (`forced_labour_engine.py`) implements
> the real methodology — weighted ILO 11-indicator screening, EU FLR 2024/3015 risk-points, UK MSA
> Section-54 30-point scoring, 5-pillar compliance maturity — with disciplined **honest-null handling**
> (unassessed indicators return `None`, never fabricated). **The frontend page does not call it.** The
> page (`ForcedLabourPage.jsx`) generates 300 supply chains, ILO scores, country risk and grievances
> entirely from the `sr()` PRNG. So the displayed risk scores are synthetic, even though a production-
> grade scoring engine sits behind the same module ID.

### 7.1 What the backend engine computes (the real methodology)

**ILO 11-indicator screening** — weighted aggregate over supplied per-indicator scores:
```python
score_i = clamp(raw_i, 0, 10)
aggregate = Σ_i score_i · weight_i        # weights sum to ~1.0 (0.07–0.10 each)
agg_score = aggregate / Σ_assessed weight_i   # renormalised over ASSESSED indicators only
risk_level = agg_score ≥7 critical · ≥5 high · ≥3 medium · else low
```
Unassessed indicators are excluded (not zero-filled); if none are assessed, the score is `None` with
`risk_level = "insufficient_data"`.

**EU FLR risk-points** (Regulation (EU) 2024/3015):
```
country: Tier-1 +3 · Tier-2 +2
sector : very_high +3 · high +2
audit  : missing +2 (cannot demonstrate absence) · <40 +2 · <60 +1
risk = points ≥7 critical · ≥5 high · ≥3 medium · else low
art7_trigger = (risk == critical) ;  art8_match = country∈{CN,KP,BY} & high-risk sector
```

**UK MSA Section 54** — 6 areas × 5 criteria, 1 point per affirmatively-disclosed criterion (max 30);
grade A (≥25) → E (<6). **Compliance maturity** — 5 weighted pillars (DD 0.25, policy/grievance/
remediation 0.20, monitoring 0.15), renormalised over supplied pillars, banded Initial→Optimising.

### 7.2 What the frontend page computes (synthetic)

The page aggregates over 300 `sr()`-seeded supply chains:

| Field | Formula | Status |
|---|---|---|
| riskScore | `round(20 + sr(i·7)·75)` → 20–95 | synthetic (drives tier) |
| ukMsaQuality | `round(20 + sr(i·13)·70)` | synthetic |
| iloScores[j] | `round(10 + sr(i·50+j·7)·80)` | synthetic (20 pseudo-indicators) |
| supplierCount | `round(50 + sr(i·19)·450)` | synthetic |
| highRiskSuppliers | `round(supplierCount·0.05 + sr()·supplierCount·0.15)` | synthetic (5–20%) |
| wageGap | `round(5 + sr(i·59)·45)` | synthetic |
| tier | riskScore >70 Critical · >50 High · >30 Medium · else Low | derived from synthetic |

Country risk, grievances (200), and audit records are likewise seeded. The page **lists 20 ILO
indicators** vs the engine's canonical **11** — a taxonomy divergence (the page mixes ILO forced-labour
indicators with other labour-rights items).

### 7.3 Calculation walkthrough (page)

1. Generate 300 supply chains + 25 country-risk rows + 200 grievances via `sr()`.
2. Aggregate portfolio KPIs (avg risk, total workers, tier distribution, audit pass rates).
3. Radar of ILO indicator scores; heatmap of country × industry risk; grievance severity/type/status.

### 7.4 Worked example (engine ILO aggregate)

Supplier with only 3 indicators assessed: `debt_bondage 8.0 (w 0.10)`, `retention_of_wages 6.0 (w 0.10)`,
`excessive_overtime 4.0 (w 0.07)`:
```
aggregate     = 8·0.10 + 6·0.10 + 4·0.07 = 0.80 + 0.60 + 0.28 = 1.68
assessed_wt   = 0.10 + 0.10 + 0.07 = 0.27
agg_score     = 1.68 / 0.27 = 6.22 → risk_level "high"
triggered (>6): debt_bondage only  ;  completeness "partial" (3 of 11)
```
The renormalisation is the engine's key rigour: it scores 6.22/10 on the evidence available rather than
diluting to ~0.15 by dividing over all 11 weights — and flags the 3/11 coverage honestly.

### 7.5 Data provenance & limitations

- **Frontend: all 300 supply chains and their risk scores are `sr()`-seeded** — not real suppliers,
  and not produced by the backend engine.
- **Backend: no synthetic data** — every score is caller-supplied or an honest null; this is the
  reference implementation.
- The page's 20-item indicator list diverges from the engine's canonical ILO-11 taxonomy.
- The engine is unwired to the page, so the page cannot benefit from its honest-null discipline.

**Framework alignment:** ILO 11 forced-labour indicators (engine: weighted, renormalised — ILO's
indicators are qualitative flags; the engine converts them to a 0–10 weighted risk) · EU Forced Labour
Regulation 2024/3015 (Art 5–8 risk assessment, country/sector risk points) · UK Modern Slavery Act 2015
s.54 (6-area disclosure, 30-point) · German LKSG prohibited-practices mapping · SA8000 audit framework ·
CSRD ESRS S2 + CSDDD HR-01 cross-linkage. The backend is a genuinely production-grade compliance engine.

## 8 · Model Specification

**Status: specification — not yet implemented (as wired to the page).** The engine is production-grade
but the page shows `sr()`-seeded scores instead of calling it. The specification below is essentially
"wire the page to the engine and feed it real supplier data."

### 8.1 Purpose & scope
Screen a company's supply chain for forced-labour risk and regulatory compliance (EU FLR, UK MSA, LKSG,
CSDDD) at supplier level, producing auditable risk scores and prioritised remediation actions.

### 8.2 Conceptual approach
The existing engine is the model — a **multi-framework compliance screen** benchmarked against
**Sedex/SMETA**, **Verisk Maplecroft** country risk indices, and the **ILO Global Estimates** of forced
labour. Its distinguishing rigour is honest-null renormalisation (score only the assessed evidence).

### 8.3 Mathematical specification
```
ILO_risk     = Σ_i∈A score_i·w_i / Σ_i∈A w_i          A = assessed indicators (renormalised)
EU_FLR_pts   = countryTier + sectorVuln + auditGap    → banded risk level
MSA_score    = Σ_area min(maxScore, Σ criteria met)   (0–30)
Maturity     = Σ_p∈S s_p·w_p / Σ_p∈S w_p              S = supplied pillars, renormalised
ResidualRisk = max(ILO_risk_level, countryFloor)      high-risk sourcing floors at "medium"
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| w_i (ILO) | indicator weights | ILO indicator severity (0.07–0.10) |
| countryTier | EU FLR risk tier | ILO Global Estimates + EC risk assessment |
| sectorVuln | sector risk | EU FLR high-risk sector list |
| pillar weights | compliance weights | DD-heavy (0.25); expert judgement |

### 8.4 Data requirements
Per supplier: per-ILO-indicator evidence scores, sourcing country/sector, audit evidence + score,
SA8000 status, MSA disclosure flags, compliance-pillar scores. Sources: Sedex/SMETA audits, supplier
questionnaires, Verisk Maplecroft (country risk), worker-voice surveys. The engine accepts all these
today; the page must collect and pass them instead of seeding.

### 8.5 Validation & benchmarking plan
Reconcile engine risk levels against Sedex SMETA audit outcomes; benchmark country floors against ILO
Global Estimates prevalence; test honest-null behaviour (partial data → partial score, never a fabricated
number); validate MSA grades against published statutory-disclosure assessments.

### 8.6 Limitations & model risk
Supplier self-disclosure is incomplete and gameable; indicator weights are judgemental; deep-tier
suppliers are unobserved. Conservative fallback (already in the engine): treat missing audit evidence as
elevated risk and floor high-risk-country residual risk at "medium".

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its honest-null compliance engine (analytics ladder: rung 1 → 2)

**What.** §7 documents an engine↔page disconnect: `forced_labour_engine.py` is the platform's reference implementation of honest-null discipline — weighted ILO 11-indicator screening, EU FLR 2024/3015 risk-points, UK MSA Section-54 30-point scoring, 5-pillar compliance maturity, all with unassessed inputs returning `None` and being excluded from aggregates rather than fabricated — but `ForcedLabourPage.jsx` generates 300 supply chains, ILO scores, country risk, and grievances entirely from `sr()`. So a production-grade engine sits behind a page that shows synthetic risk scores. Evolution A wires the page to the engine, replacing the seeded supply-chain panel with real supplier records scored via `full_assessment`/`screen_ilo_indicators`, and reconciling the page's divergent 20-item indicator list to the engine's canonical ILO-11 taxonomy (§7.5 flags the mismatch).

**How.** (1) Persist a suppliers table; the risk dashboard reads `screen_supplier_network` output. (2) The ILO radar reads the engine's renormalised-over-assessed aggregate, showing coverage % so partial assessments are visible. (3) UK MSA and EU FLR tabs call `assess_uk_msa`/`assess_eu_flr` with disclosed evidence; unassessed criteria display as gaps, inheriting the engine's honest-null behaviour.

**Prerequisites.** The 300 seeded chains replaced (all §7-flagged synthetic); indicator taxonomy reconciled to ILO-11. **Acceptance:** a supplier's displayed risk score equals the engine's weighted aggregate for its supplied indicators, with coverage % shown; no `sr()` risk score renders; undisclosed MSA criteria appear as gaps, never credited.

### 9.2 Evolution B — Modern-slavery due-diligence copilot (LLM tier 2)

**What.** A copilot for compliance and procurement teams: "screen this Xinjiang-linked apparel supplier and tell me our UFLPA/CSDDD exposure" tool-calls `assess_eu_flr` (country/sector risk points), `screen_ilo_indicators`, and `assess_uk_msa`, and drafts the remediation action list — every risk figure engine-sourced, every unassessed indicator surfaced as a data gap rather than guessed.

**How.** Tier-2 tool-calling over the engine's endpoints; the grounding corpus is §7, which accurately encodes ILO's 11 indicators, EU FLR 2024/3015 Art 5–8, UK MSA s.54, German LKSG, SA8000, and CSRD ESRS S2/CSDDD linkage. The engine's honest-null design is the copilot's integrity backbone — it cannot fabricate a risk score because the engine returns None for unassessed inputs, so the copilot's answers degrade to explicit data-gap statements. Fabrication validator checks every score.

**Prerequisites.** Evolution A (the copilot must narrate engine output, not the seeded page); RBAC-scoped supplier data given the sensitivity. **Acceptance:** every ILO/MSA/FLR figure traces to an engine tool call; asked about an indicator with no supplied evidence, the copilot states it is not assessed and recommends the assessment, never estimating.