# EU Taxonomy Alignment
**Module ID:** `eu-taxonomy` · **Route:** `/eu-taxonomy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Taxonomy Regulation alignment engine screening investments against 6 environmental objectives. Covers substantial contribution criteria, DNSH assessment, minimum social safeguards, and green asset ratio calculation.

> **Business value:** Enables regulatory disclosure of taxonomy alignment for EU Taxonomy reporting under CSRD and Pillar 3. Identifies which assets qualify as "green" under EU law and quantifies the Green Asset Ratio required for large bank disclosures from 2024.

**How an analyst works this module:**
- Eligibility Screener applies 3-step test per asset
- Objective Breakdown shows alignment per environmental objective
- DNSH Assessment details each of 5 remaining objectives
- GAR Calculator aggregates to portfolio level

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ActivityTab`, `Badge`, `Btn`, `Card`, `Chk`, `DEFAULT_PORTFOLIO`, `EU_TAX_API`, `EntityTab`, `Inp`, `KpiCard`, `NACE_OPTIONS`, `OBJ_COLORS`, `OBJ_KEYS`, `OBJ_LABELS`, `PortfolioTab`, `ReferenceTab`, `Row`, `SECTOR_OPTIONS`, `Section`, `Sel`, `TABS`, `TSC_MAP`, `TimelineTab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NACE_OPTIONS` | 16 | `label` |
| `DEFAULT_PORTFOLIO` | 6 | `sector`, `nace`, `weight`, `revenue`, `capex`, `opex` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `EU_TAX_API` | ``${API}/api/v1/eu-taxonomy`;` |
| `seededRandom` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `ghg` | `Math.max(0, Math.min(100, parseFloat(form.ghgReduction) \|\| 0));` |
| `msScore` | `(safeguards.oecd ? 25 : 0) + (safeguards.ungp ? 25 : 0) + (safeguards.ilo ? 25 : 0) + (safeguards.csddd ? 25 : 0);` |
| `dnshEntries` | `Object.entries(api.dnsh_results \|\| {}); // {CCA:{met,score,criteria}, ...}` |
| `objScores` | `OBJ_KEYS.map((k, i) => {` |
| `code` | `['CCA', 'WTR', 'CE', 'POL', 'BIO'][i - 1];` |
| `targetIdx` | `Math.floor(r(7) * 6);` |
| `dnshResults` | `OBJ_KEYS.map((k, i) => ({` |
| `totalRev` | `activities.reduce((s, a) => s + a.revenue, 0) \|\| 1;` |
| `totalCapex` | `activities.reduce((s, a) => s + a.capex, 0) \|\| 1;` |
| `totalOpex` | `activities.reduce((s, a) => s + a.opex, 0) \|\| 1;` |
| `alignedRev` | `activities.filter(a => a.aligned).reduce((s, a) => s + a.revenue, 0);` |
| `eligibleRev` | `activities.filter(a => a.eligible).reduce((s, a) => s + a.revenue, 0);` |
| `alignedCapex` | `activities.filter(a => a.aligned).reduce((s, a) => s + a.capex, 0);` |
| `eligibleCapex` | `activities.filter(a => a.eligible).reduce((s, a) => s + a.capex, 0);` |
| `alignedOpex` | `activities.filter(a => a.aligned).reduce((s, a) => s + a.opex, 0);` |
| `eligibleOpex` | `activities.filter(a => a.eligible).reduce((s, a) => s + a.opex, 0);` |
| `updateActivity` | `(idx, k, v) => setActivities(p => p.map((a, i) => i === idx ? { ...a, [k]: v } : a));` |
| `activities_data` | `activities.map(a => ({` |
| `assessed` | `activities.map((a, i) => transformApiActivity(data.activity_assessments[i], a.name, a.nace, a.sector, a.revenue, a.capex, a.opex));` |
| `updateHolding` | `(idx, k, v) => setHoldings(p => p.map((h, i) => i === idx ? { ...h, [k]: k === 'weight' \|\| k === 'revenue' \|\| k === 'capex' \|\| k === 'opex' ? parseFloat(v) \|\| 0 : v } : h));` |
| `totalWeight` | `entities.reduce((s, e) => s + e.weight, 0) \|\| 1;` |
| `gar` | `entities.reduce((s, e) => s + (e.aligned ? e.weight * e.alignedPct / 100 : 0), 0) / Math.max(1, totalWeight);` |
| `btar` | `entities.reduce((s, e) => s + (e.eligible ? e.weight * 0.6 : 0), 0) / Math.max(1, totalWeight);` |
| `weightedAlignment` | `entities.reduce((s, e) => s + e.weight * e.alignedPct / 100, 0) / Math.max(1, totalWeight);` |
| `investees_data` | `holdings.map(h => ({` |
| `entities` | `holdings.map((h, i) => {` |
| `act` | `genActivityResult(h.name, h.nace, h.sector, String(h.revenue), String(h.capex), String(h.opex), hashStr(h.name + h.nace));` |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Climate` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEFAULT_PORTFOLIO`, `NACE_OPTIONS`, `OBJ_KEYS`, `OBJ_LABELS`, `SECTOR_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 6 Env. Objectives | — | EU Taxonomy | Climate mitigation, adaptation, water, circular economy, pollution, biodiversity |
| Green Asset Ratio | `Aligned / Total covered assets` | ESRS | KPI for banks and large corporates |
| DNSH Score | — | Delegated Act | Do No Significant Harm across all 5 remaining objectives |
- **NACE activity codes** → Eligibility screening → **Taxonomy alignment %**
- **Financial statements** → DNSH criteria check → **Green Asset Ratio**
- **Social safeguards audit** → MSS verification → **Taxonomy-aligned label**

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
**Methodology:** EU Taxonomy 3-step eligibility
**Headline formula:** `GAR = Taxonomy_aligned_assets / Total_covered_assets; Contribution = SC ∩ DNSH ∩ MSS`

3-step test: (1) Substantial Contribution to ≥1 of 6 objectives; (2) Do No Significant Harm to remaining 5; (3) Minimum Social Safeguards. GAR mandatory for credit institutions from 2024.

**Standards:** ['EU Taxonomy Regulation (EU) 2020/852', 'Delegated Acts 2021/2139']
**Reference documents:** EU Taxonomy Regulation (EU) 2020/852; Climate Delegated Act (EU) 2021/2139; EBA Pillar 3 ESG Disclosures

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
| `eu-taxonomy-engine` | engine:eu_taxonomy_engine, table:Climate |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) mismatch flag.** A **rigorous backend engine exists** —
> `eu_taxonomy_engine.py` implements the real Article 3 three-step test (Substantial Contribution vs
> quantitative/qualitative TSC thresholds → DNSH on the other 5 objectives → Minimum Safeguards),
> across 80+ NACE activities in all four Delegated Acts, with genuine GAR/BTAR/SFDR portfolio roll-up.
> **But the `EuTaxonomyPage.jsx` frontend does not call it for scoring.** It fetches only *reference*
> tables (`/ref/objectives`, `/ref/dnsh-matrix`, `/ref/nace-activities`…) and computes alignment
> **locally with a seeded PRNG** (`genActivityResult` → `seededRandom(hashStr(name+nace)+n)`). So the
> evidence the user enters (GHG reduction, EPC class, etc.) is *ignored* — alignment is deterministic
> pseudo-random. The financial KPI aggregation (turnover/capex/opex, GAR) is, however, real arithmetic.
> §7 documents the frontend as coded and §8 the backend it should call.

### 7.1 What the frontend computes

Per activity, `genActivityResult(name, nace, sector, rev, capex, opex, seed0)`:

```js
r(n) = seededRandom(seed0 + n)                          // seed0 = hashStr(name+nace)
objScores[i]      = round(r(i+1)·40 + 40)               // 40–80 per objective
targetIdx         = floor(r(7)·6)                        // "primary" objective
objScores[target] += 25 (capped 100)                    // boost
substantialContrib = objScores[target].score
dnshPass          = every non-target objective has r(10+i) > 0.25
safeguards        = {oecd:r(30)>0.2, ungp:r(31)>0.25, ilo:r(32)>0.2, csddd:r(33)>0.3}
eligible          = substantialContrib ≥ 40
aligned           = eligible AND dnshPass AND safeguardsPass
```

The **structure is faithful to Article 3** (SC ∩ DNSH ∩ MSS), but each gate is a seeded coin-flip, not
an evaluation of the entered evidence.

The **financial KPIs are real** (`genEntityData`):

```
turnoverAligned = Σ(aligned activities' revenue) / Σ(all revenue) × 100
capexAligned    = Σ(aligned capex)  / Σ(total capex)  × 100      (same for opex)
GAR (portfolio) = Σ (weight · alignedPct/100) / Σ weight
BTAR            = Σ (weight · 0.6 · eligible?) / Σ weight         (flat 0.6 proxy)
```

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| 6 objectives (`OBJ_KEYS`) | CCM/CCA/WTR/CE/POL/BIO | **Real** — Taxonomy Regulation Art. 9–15 |
| SC eligibility floor | ≥ 40 | Frontend heuristic (not a regulatory number) |
| DNSH pass prob | `r > 0.25` | **Synthetic** coin-flip per objective |
| Safeguard thresholds | `r > 0.2–0.3` | Synthetic; real safeguards are OECD MNE / UNGP / ILO core / CSDDD |
| BTAR factor | 0.6 (flat) | Placeholder proxy, not a computed banking-book ratio |
| `DEFAULT_PORTFOLIO` | 5 Indian issuers (Tata Power, L&T, HDFC, JSW, Adani Green) with NACE codes | Illustrative demo entities |
| Reference tables | fetched from API `/ref/*` | **Real** backend reference data (objectives, DNSH matrix, safeguards, NACE) |

### 7.3 Calculation walkthrough (frontend)

1. User fills activity evidence (GHG reduction, EPC, water, safeguards) — **captured but unused for
   scoring**.
2. `assess()` calls `genActivityResult` with `seed0 = hashStr(name+nace)` → deterministic objective
   scores, DNSH/safeguard flags, eligibility, alignment.
3. `genEntityData` aggregates aligned/eligible revenue, capex, opex into the three Article-8 KPIs.
4. Portfolio tab: each holding is assessed, then `gar = Σ(weight·alignedPct)/Σweight`,
   `btar = Σ(weight·0.6·eligible)/Σweight`.

### 7.4 Worked example

Activity "Solar PV Installation", NACE D35.11 → `seed0 = hashStr("Solar PV InstallationD35.11")`.
Suppose `r(7)·6` → targetIdx = 0 (CCM), and `r(1)·40+40 = 68`, boosted +25 → capped 100:

| Step | Value |
|---|---|
| substantialContrib (CCM) | 100 (68 + 25 → cap) → but boost applied to base 68 → 93 |
| DNSH (5 non-target, each r>0.25) | say all pass → dnshPass = true |
| Safeguards (oecd/ungp/ilo pass, csddd r>0.3) | if all true → safeguardsPass = true |
| eligible (93 ≥ 40) | true |
| **aligned** = eligible∧dnsh∧ms | **true** |

Entity KPI: if this activity has revenue 150 and is the only aligned one of totalRev 380 →
`turnoverAligned = 150/380 = 39.5%`. This turnover math is correct; the *alignment flag* driving it is
seeded, so re-labelling the activity changes the hash and flips alignment unpredictably.

### 7.5 Data provenance & limitations

- **Alignment is synthetic** (`seededRandom`), keyed on the activity name+NACE hash. User-entered
  evidence (emission intensity, EPC class, water efficiency) does **not** affect the result — the
  rigorous TSC comparison lives only in the unused backend.
- **Financial KPI arithmetic is genuine** (turnover/capex/opex alignment; GAR).
- **BTAR uses a flat 0.6 proxy** — not the real banking-book taxonomy-aligned ratio.
- Safeguard/DNSH thresholds are coin-flips, not OECD/UNGP/ILO/CSDDD assessments.

**Framework alignment:** Structurally faithful to **EU Taxonomy Regulation (EU) 2020/852 Article 3**
(the SC ∩ DNSH ∩ MSS test) and Article 8 turnover/capex/opex KPIs; the GAR is the **credit-institution
Green Asset Ratio** (aligned assets / covered assets) mandated from 2024. SFDR Article 6/8/9 tie-in
mirrors the backend's GAR→classification mapping. The **actual** technical-screening logic — quantitative
thresholds (e.g. 0 gCO₂/km for cars, EPC-A buildings) and qualitative evidence scoring — is implemented
in `eu_taxonomy_engine.py` but not wired to this page.

## 8 · Model Specification

**Status: specification — not yet implemented in the frontend flow (backend engine exists).** The
production model is to route the user's entered evidence through `eu_taxonomy_engine.assess_activity /
assess_entity / assess_portfolio` instead of the seeded `genActivityResult`.

**8.1 Purpose & scope.** Determine Taxonomy eligibility and alignment per economic activity and roll up
to entity Article-8 KPIs and portfolio GAR/BTAR + SFDR classification, from real reported evidence.

**8.2 Conceptual approach.** The Article 3 three-step test exactly as codified in the Delegated Acts —
the same design used by ISS ESG, MSCI, and Clarity AI taxonomy tools. Quantitative TSC compare a metric
to a regulatory threshold; qualitative TSC score documentary evidence; DNSH is evaluated on the other
five objectives; Minimum Safeguards check OECD MNE / UNGP / ILO / CSDDD compliance.

**8.3 Mathematical specification (from the backend engine).**

```
Per activity a, objective o with TSC threshold τ, unit u:
  quantitative:  met = (value ≤ τ) for emissions-type u, or (value ≥ τ) for reduction/recycled u
                 score = clip((1 − value/τ)·100, 0, 100)   (or value/τ·100 for "higher-better")
  qualitative:   score = min(100, 25·|evidence docs provided|),  met = score ≥ 50
  DNSH_o' met = evidence satisfies DNSH criteria for all o' ≠ o
  MSS met     = OECD ∧ UNGP ∧ ILO ∧ CSDDD
  aligned = SC_met ∧ (∀ DNSH met) ∧ MSS_met
Entity: turnover_aligned% = Σ(aligned activity turnover)/Σ turnover  (capex, opex analogous)
Portfolio: GAR = Σ(exposure·turnover_aligned%/100)/Σ exposure
           SFDR: GAR ≥ 70 → Art 9; ≥ 20 → Art 8; else Art 6
```

| Parameter | Source |
|---|---|
| TSC thresholds (0 gCO₂/km, EPC-A, % reductions) | Climate DA 2021/2139, Complementary DA 2022/1214, Environmental DA 2023/2486 |
| DNSH criteria matrix | Delegated Act Annexes |
| Minimum Safeguards | OECD MNE Guidelines, UNGPs, ILO core conventions, CSDDD |
| Article 8 KPI definitions | Disclosures DA 2021/2178 |

**8.4 Data requirements.** Per-activity: NACE code, target objective, evidence dict (emission
intensity, EPC class, recycled %, water efficiency, safeguard attestations), and financials (turnover,
capex, opex). Portfolio: exposure per investee. All consumed by the existing engine; the frontend need
only POST `/assess` instead of computing locally.

**8.5 Validation & benchmarking plan.** Reconcile activity alignment against published corporate
Taxonomy disclosures for the demo issuers; unit-test each TSC threshold against the DA text; benchmark
GAR against EBA Pillar-3 ESG disclosure templates.

**8.6 Limitations & model risk.** Qualitative TSC scoring by document-count (25 pts each) is a coarse
proxy — real assessment needs expert review; flag qualitative-scored activities for manual sign-off.
BTAR is simplified to equal GAR in the engine; a production BTAR must scope the banking book separately.
Conservative fallback: missing evidence → not aligned (never default to aligned).

## 9 · Future Evolution

### 9.1 Evolution A — Purge the page's seeded fallbacks and widen the TSC catalog (analytics ladder: rung 2 → 3)

**What.** The backend is a real Article 3 vertical: `EUTaxonomyEngine` implements the three-part test (TSC threshold comparison, 5-objective DNSH, weighted Article 18 minimum safeguards), entity-level turnover/capex/opex KPIs per DR 2021/2178, and portfolio GAR/BTAR with SFDR classification — 13 endpoints including an unusually complete ref-data surface. Two gaps: the page's portfolio tab still *generates* holding-level results client-side (`genActivityResult(...hashStr(h.name+h.nace))` and a seeded `targetIdx`) instead of calling `POST /assess-portfolio`, and the engine's hand-authored NACE/TSC table covers a fraction of the Climate Delegated Act's ~100+ activities, silently bounding what can be assessed.

**How.** (1) Page cleanup: the portfolio tab posts real `investees_data` to the engine and renders its GAR/BTAR — deleting `genActivityResult` and the seeded DNSH assignment; the honest-null path (NACE code not in catalog → "activity not covered") replaces silent generation. (2) Catalog expansion: ingest the EU Taxonomy Compass dataset (published machine-readable activity/TSC data) into a `taxonomy_activities` table replacing the hand-authored constants — coverage grows from curated-few to Compass-complete, with Delegated Act version tags. (3) Persist entity/portfolio assessments (org-scoped) so year-over-year GAR movement is real. (4) Rung 3: validate a handful of assessments against published issuer taxonomy reports; bench-pin the SC scoring formula and the GAR aggregation identity.

**Prerequisites.** Compass dataset ingestion and schema mapping (TSC criteria vary in structure by activity — some won't reduce to single-threshold checks; model the exceptions honestly as manual-review flags). **Acceptance:** the portfolio tab's GAR equals a direct `/assess-portfolio` call; an uncatalogued NACE returns not-covered rather than generated results; catalog count matches the Compass version cited; zero `seededRandom`/`hashStr` generation in the page.

### 9.2 Evolution B — Evidence-gathering copilot for alignment assessments (LLM tier 2)

**What.** The engine's bottleneck is its `evidence_data` input — someone must supply emission intensities, DNSH flags, and safeguards scores per activity. A tool-calling copilot that fills the evidence form from documents: given an issuer's sustainability report, it proposes evidence values with source quotes ("emission intensity 92 gCO₂e/kWh, p. 47 — below the 100g TSC threshold"), maps activities to catalog NACE codes, flags DNSH objectives with no documentary support as unconfirmed (not defaulted to true — the checkbox temptation this design removes), then submits the confirmed evidence to `POST /assess-activity` and narrates the engine's verdict with its article citations.

**How.** Tools: `search_catalog(activity_description)`, `extract_evidence(document, nace, objective)` (span-fidelity extraction per the report-parser pattern), `assess_activity(nace, objective, evidence)`, `assess_entity(...)`. The division of labor is strict: the LLM proposes evidence with quotes, the human confirms, the engine decides alignment — the copilot never renders a taxonomy verdict itself. Unconfirmed DNSH flags propagate as not-met per the regulation's conservative logic, stated in the output.

**Prerequisites (hard).** Evolution A's expanded catalog (evidence-gathering against an 8-activity list would mostly end in "not covered"); the extraction golden-set discipline from `esg-report-parser`. **Acceptance:** a golden report yields evidence proposals each carrying a verbatim quote; unconfirmed flags always assess as not-met; the final verdict matches a direct engine call on the confirmed evidence.