# Supply Chain Carbon Tracker
**Module ID:** `supply-chain-carbon` · **Route:** `/supply-chain-carbon` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tier 1/2/3 supplier GHG mapping using spend-based and supplier-specific methodologies. Covers Scope 3 Category 1/2 hot spots, supplier engagement, and data collection cascade.

> **Business value:** Supply chain emissions (Scope 3 Category 1) are typically the largest emissions source for manufacturing and retail companies, often 5-10x Scope 1+2 combined. This module enables systematic supplier engagement and data collection to upgrade from estimates to measured Scope 3 Cat 1.

**How an analyst works this module:**
- Supplier Map shows Tier 1/2/3 with emissions intensity
- Hotspot Analysis identifies top 20% spend driving 80% of S3 Cat 1
- Engagement Tracker monitors CDP response rate and data quality
- Reduction Target shows supplier-specific improvement targets
- Data Collection Campaign sends and tracks supplier surveys

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITY_CATEGORIES`, `ChartTooltip`, `PIE_COLORS`, `TIER_COLORS`, `TIER_MULTIPLIERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ACTIVITY_CATEGORIES` | 9 | `tier`, `pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tier1Est` | `companyTotal * mult.tier1;` |
| `tier2Est` | `companyTotal * mult.tier2;` |
| `tier3Est` | `companyTotal * mult.tier3;` |
| `grandTotal` | `companyTotal + tier1Est + tier2Est + tier3Est;` |
| `_ILO_MAP` | `Object.fromEntries(ILO_LABOR_INDICATORS.map(l => [l.country, l]));` |
| `fmt` | `(v, d = 0) => v == null ? '-' : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });` |
| `fmtM` | `(v) => { if (v == null) return '-'; const a = Math.abs(v); if (a >= 1e9) return (v / 1e9).toFixed(2) + ' Bt'; if (a >= 1e6) return (v / 1e6).toFixed(2) + ' Mt'; if (a >= 1e3) return (v / 1e3).toFixed(1) + ' kt'; return f` |
| `pct` | `(v) => v == null ? '-' : (v * 100).toFixed(1) + '%';` |
| `sBadge` | `(bg, fg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color: fg, letterSpacing: 0.3 });` |
| `portfolioNames` | `useMemo(() => Object.keys(portData.portfolios \|\| {}), [portData]);  /* ── Supply chain analysis for selected company ── */ const selectedCompany = useMemo(() => portfolio[selectedCompanyIdx]?.company \|\| null, [portfolio, selectedCompanyIdx]);` |
| `scData` | `useMemo(() => selectedCompany ? computeSupplyChainCarbon(selectedCompany) : null, [selectedCompany]);  /* ── Scenario adjustments ── */ const scenarioData = useMemo(() => { if (!scData) return null;` |
| `adjTier1` | `scData.tier1.estimated * (1 - tier1Reduction / 100);` |
| `adjTier2` | `scData.tier2.estimated * (1 - tier2Reduction / 100);` |
| `adjScope2` | `scData.company.scope2 * (1 - renewableSwitch / 100);` |
| `adjCompany` | `scData.company.scope1 + adjScope2;` |
| `adjTotal` | `adjCompany + adjTier1 + adjTier2 + scData.tier3.estimated;` |
| `sectorAvg` | `1 + mult.tier1 + mult.tier2 + mult.tier3;` |
| `emissions` | `tierEmissions * ac.pct;` |
| `rev` | `(selectedCompany.revenue_usd_mn \|\| 1) * 1e6;` |
| `compInt` | `scData.company.total / rev * 1e6;` |
| `t1Int` | `scData.tier1.estimated / rev * 1e6;` |
| `t2Int` | `scData.tier2.estimated / rev * 1e6;` |
| `t3Int` | `scData.tier3.estimated / rev * 1e6;` |
| `rows` | `portfolio.map(h => {` |
| `headers` | `['Company','Sector','Scope 1+2 (t)','Tier 1 (t)','Tier 2 (t)','Tier 3 (t)','Total SC (t)','Multiplier','Intensity (tCO2e/$M)','Weight %'];` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `sectorBreakdown` | `Object.values(sectorMap).sort((a, b) => (b.company + b.tier1 + b.tier2 + b.tier3) - (a.company + a.tier1 + a.tier2 + a.tier3));` |
| `total` | `1 + mult.tier1 + mult.tier2 + mult.tier3;` |
| `pctOfPortTotal` | `portfolioAgg.grandTotal > 0 ? (r.total * (r.weight / 100)) / portfolioAgg.grandTotal * 100 : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain/scope3/calculate` | `calculate_scope3` | api/v1/routes/supply_chain.py |
| POST | `/api/v1/supply-chain/scope3/sbti-target` | `calculate_sbti_target` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/emission-factors` | `list_emission_factors` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments` | `list_scope3_assessments` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments/{assessment_id}` | `get_scope3_assessment` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets` | `list_sbti_targets` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets/{target_id}` | `get_sbti_target` | api/v1/routes/supply_chain.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `base` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `emission_factor_library` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sbti_targets` *(shared)*, `sbti_trajectories` *(shared)*, `scope3_activities` *(shared)*, `scope3_assessments` *(shared)*, `sqlalchemy` *(shared)*, `this` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACTIVITY_CATEGORIES`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Tier 1 Suppliers | — | Typical portfolio | Direct suppliers receiving primary engagement |
| Data Collection Rate | — | CDP benchmark | Tier 1 suppliers providing actual emissions data |
| EEIO Emission Factors | — | Method | Spend-based proxy for Tier 2+ suppliers |
- **Supplier spend data** → EEIO factor application → **Tier 2/3 estimated emissions**
- **CDP/primary survey** → Supplier actual data → **Tier 1 measured emissions**
- **Full S3 inventory** → Hotspot identification → **Engagement priority list**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain/emission-factors** — status `passed`, provenance ['real-db'], source tables: `emission_factor_library`
Output: `{'type': 'object', 'keys': ['total_count', 'filters_applied', 'factors', 'validation_summary'], 'n_keys': 4}`

**GET /api/v1/supply-chain/scope3/assessments** — status `passed`, provenance ['real-db'], source tables: `scope3_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `scope3_assessments`
Output: `None`

**GET /api/v1/supply-chain/scope3/sbti-targets** — status `passed`, provenance ['real-db'], source tables: `sbti_targets`
Output: `{'type': 'object', 'keys': ['targets', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/sbti-targets/{target_id}** — status `failed`, provenance ['db-empty'], source tables: `sbti_targets`
Output: `None`

**POST /api/v1/supply-chain/scope3/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/supply-chain/scope3/sbti-target** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier emissions mapping
**Headline formula:** `S3Cat1 = Σ(spend_ij × EF_sector_j); Primary_data = supplier_reported_tCO2e`

Tier 1: direct supplier emissions via CDP or primary survey. Tier 2/3: spend-based approach using environmentally extended input-output (EEIO) emission factors by sector. Hotspot analysis: 20% of spend typically represents 80% of Scope 3 Cat 1.

**Standards:** ['GHG Protocol Scope 3 Standard', 'PCAF', 'CDP Supply Chain']
**Reference documents:** GHG Protocol Scope 3 Standard; CDP Supply Chain Report; PCAF Scope 3 Attribution Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-esg-hub` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-labor-climate` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-map` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-resilience` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-contagion` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-emissions-mapper` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-network-viz` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (methodology substitution, not fabrication).** The guide's formula is a
> genuine spend-based EEIO calculation: `S3Cat1 = Σ(spend_ij × EF_sector_j)`. **The code does not use
> spend data or EEIO emission factors at all.** Instead it applies a **"supply-chain multiplier"**
> approach: each company's Tier 1/2/3 upstream emissions are estimated as a fixed sector-specific
> multiple of that company's *own* Scope 1+2 footprint (`tier1Est = companyTotal × mult.tier1`, etc.),
> not `Σ(spend×EF)`. This is a real, commonly used simplified Scope 3 estimation technique in
> practice (used when granular spend data is unavailable) — just a different real methodology than
> the one named in the guide, not a fabricated number.

### 7.1 What the module computes

Unlike most modules in this batch, this file contains **no `sr()` PRNG at all** — all numeric inputs
come from `GLOBAL_COMPANY_MASTER` (real company Scope 1/2 data where available, with a documented
synthetic fallback estimator *inside the shared data module*, not this page, for companies lacking
reported figures).

```
companyTotal = scope1_mt×1e6 + scope2_mt×1e6                    // company's own footprint, tCO2e
mult         = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials']
tier1Est     = companyTotal × mult.tier1
tier2Est     = companyTotal × mult.tier2
tier3Est     = companyTotal × mult.tier3
grandTotal   = companyTotal + tier1Est + tier2Est + tier3Est
multiplier   = grandTotal / companyTotal                          // total supply-chain amplification factor
intensityPerRev = grandTotal / (revenue_usd_mn × 1e6) × 1e6        // tCO2e per $M revenue
```

### 7.2 Parameterisation

| Sector | Tier 1 | Tier 2 | Tier 3 | Total multiplier | Real-world plausibility |
|---|---|---|---|---|---|
| Consumer Staples | 2.0 | 2.8 | 2.0 | **7.8×** (highest) | Plausible — large agricultural/packaging supply chains genuinely dwarf direct operations for this sector |
| Energy | 1.8 | 2.5 | 1.2 | 6.5× | Plausible |
| Financials | 0.3 | 0.2 | 0.1 | 0.6× (lowest) | Plausible — financial institutions' *physical* supply chain is genuinely small relative to their own operations (their large footprint is financed emissions, a different accounting category entirely, correctly out of scope here) |
| Communication Services | 0.5 | 0.3 | 0.2 | 1.0× | Plausible |

12 sectors are covered (including an `IT`/`Information Technology` alias pair), with `Industrials`
as the fallback for any unmatched sector string.

### 7.3 Calculation walkthrough

1. **Per-company estimate** — `computeSupplyChainCarbon(company)` as above, tagged with a
   **confidence label per tier** (`tier1: Medium`, `tier2: Low`, `tier3: Very Low`) and a **methods
   note** per tier (`tier1: "Spend-based + sector EFs"`, `tier2: "EEIO model + sector averages"`,
   `tier3: "Sector extrapolation"`) — these confidence/methodology labels describe an EEIO approach
   in their text even though the actual formula used is the sector-multiplier approach above, a
   minor internal labelling inconsistency worth flagging alongside the guide mismatch.
2. **Portfolio aggregation** — for each holding, `computeSupplyChainCarbon` runs and results are
   summed into `sectorBreakdown` and `pctOfPortTotal`.
3. **Scenario sliders** — `tier1Reduction`/`tier2Reduction`/`renewableSwitch` let a user model
   reduction pathways: `adjTier1 = tier1.estimated×(1−tier1Reduction/100)`,
   `adjScope2 = scope2×(1−renewableSwitch/100)`, recombined into `adjTotal`.
4. **Intensity view** — per-tier intensity (`tCO2e/$M revenue`) computed by dividing each tier's
   estimate by company revenue — a genuinely useful normalisation for cross-company comparison.
5. **Hotspot analysis** — `ACTIVITY_CATEGORIES` (8 named activities, e.g. "Raw Materials Extraction"
   tagged `tier3` at 35% of that tier, "Direct Supplier Processing" tagged `tier1` at 40%) apply
   fixed percentage splits within each tier to approximate activity-level hotspots — illustrative
   decomposition, not itself derived from any activity-level data.
6. **ILO labour indicator overlay** — `_ILO_MAP` joins real `ILO_LABOR_INDICATORS` by country,
   letting the page cross-reference supply-chain carbon concentration with labour-rights context for
   the same sourcing countries — a genuine (if separate) real-data integration.

### 7.4 Worked example (illustrative figures)

An Energy-sector holding with `scope1_mt=5.0`, `scope2_mt=1.0`, `revenue_usd_mn=$8,000`:

```
companyTotal = (5.0+1.0)×1e6 = 6,000,000 tCO2e
mult = {tier1:1.8, tier2:2.5, tier3:1.2}     (Energy)
tier1Est = 6,000,000×1.8 = 10,800,000 t
tier2Est = 6,000,000×2.5 = 15,000,000 t
tier3Est = 6,000,000×1.2 = 7,200,000 t
grandTotal = 6,000,000+10,800,000+15,000,000+7,200,000 = 39,000,000 t
multiplier = 39,000,000/6,000,000 = 6.5×
intensityPerRev = 39,000,000/(8,000×1e6)×1e6 = 4,875 tCO2e/$M
```

The 6.5× multiplier means this company's *reported* Scope 1+2 footprint captures only ~15% of its
estimated total supply-chain carbon footprint — directionally consistent with the guide's own cited
statistic that Scope 3 is "typically 5–10× Scope 1+2 combined" for the relevant sectors.

### 7.5 Companion analytics

- **Sector-average multiplier** — `sectorAvg = 1 + mult.tier1+tier2+tier3`, used to benchmark an
  individual company's actual multiplier against its sector norm.
- **Portfolio-level hotspot table** — aggregates the 8 activity categories across all portfolio
  holdings' tier estimates.

### 7.6 Data provenance & limitations

- Sector multipliers are hand-calibrated, directionally sensible, and not fabricated by PRNG, but
  are not cited to a specific published sector-multiplier study (e.g. a named CDP or EXIOBASE
  sector-ratio table) — a reader cannot independently verify the exact 1.8/2.5/1.2-style figures.
- The confidence/methodology labels attached to each tier describe an EEIO/spend-based approach that
  differs from the actual multiplier-of-own-footprint formula used — worth correcting for
  internal consistency.
- `ACTIVITY_CATEGORIES` percentage splits are illustrative constants applied uniformly across all
  companies in a tier, regardless of actual sector or activity mix.

**Framework alignment:** GHG Protocol Scope 3 Standard (Category 1 framing, real) · PCAF Scope 3
attribution guidance (named, methodology labels reference it, formula does not implement it) · CDP
Supply Chain data (named as context, not ingested) — the sector-multiplier approach itself is a
recognised simplified alternative to full EEIO modelling, used in practice by several real ESG data
providers when granular spend data is unavailable.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the failing calculate routes and reconcile the multiplier vs EEIO methodology (analytics ladder: rung 2 → 3)

**What.** This module runs on real data (no `sr()` — inputs from `GLOBAL_COMPANY_MASTER`) and its backend has genuine assets: the `emission_factor_library`, `scope3_assessments`, and `sbti_targets` GET routes pass against real DB tables. But two problems: the lineage sweep records both compute routes — `POST /scope3/calculate` and `/sbti-target` — as **failed**, and the individual-record GET routes fail with `db-empty`; and §7 flags a methodology mismatch — the guide describes a spend-based EEIO calc (`Σ(spend × EF_sector)`) but the frontend uses a "supply-chain multiplier" approach (`tier1Est = companyTotal × mult.tier1`), estimating upstream tiers as a fixed multiple of the company's own Scope 1+2. The multiplier method is a legitimate real-world simplification, but the confidence/methodology labels claim EEIO, and the multipliers are uncited. Blast radius is 81 — this is foundational supply-chain infrastructure.

**How.** (1) Triage the two failing compute routes and seed the empty `scope3_assessments`/`sbti_targets` tables (the D1 write-side activation item) so the individual-record GETs resolve. (2) Reconcile methodology: either implement the true EEIO `Σ(spend × EF)` using the real `emission_factor_library` (which the GET route confirms is populated) as the primary method, keeping the multiplier as a documented fallback when spend data is unavailable — and fix the confidence labels to describe the method actually used. (3) Cite the sector multipliers to a named source (EXIOBASE sector ratios or a CDP study). (4) Bench-pin the Scope 3 calculation.

**Prerequisites.** The two route failures and empty tables are the gate; EEIO factors are already in the DB; multiplier citation needs a source. **Acceptance:** both compute routes pass; the EEIO method uses the real emission-factor library with spend data; methodology labels match the formula used; multipliers cite a source.

### 9.2 Evolution B — Scope 3 supplier-engagement analyst (LLM tier 2)

**What.** A tool-calling analyst for the workflow the module describes: "calculate our Scope 3 Cat 1 for this spend profile", "which 20% of suppliers drive 80% of emissions?", "set an SBTi-aligned supplier reduction target" — calling `POST /scope3/calculate` and `/scope3/sbti-target`, reading the emission-factor library, and narrating the hotspot analysis and SBTi trajectory, never inventing emissions.

**How.** Tool schemas from the module's OpenAPI operations (2 POST compute + 5 GET including the real-DB emission-factors and assessments); grounding = this Atlas record. Hotspot answers narrate the Pareto analysis over the computed supplier emissions; SBTi answers cite the `calculate_sbti_target` trajectory. The no-fabrication validator checks every tCO₂e against tool output; PCAF data-quality scores are surfaced per the standard.

**Prerequisites (hard).** Evolution A — the compute endpoints fail, so there is nothing to call; and the methodology-label mismatch would mislabel the method in narration. **Acceptance:** every emissions figure traces to a `/scope3/calculate` response; the hotspot Pareto matches the computed supplier data; an SBTi target cites the engine's trajectory, not an estimate.