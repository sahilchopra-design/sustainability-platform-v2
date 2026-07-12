# Blended Finance Structuring Analytics
**Module ID:** `blended-finance-structuring` · **Route:** `/blended-finance-structuring` · **Tier:** A (backend vertical) · **EP code:** EP-DI1 · **Sprint:** DI

## 1 · Overview
Blended finance structuring analytics covering first-loss tranche sizing, concessional capital catalytic ratio, DFI/MDB co-investment structures, and OECD DAC blended finance taxonomy. Quantifies the leverage ratio of private capital mobilised per unit of public/concessional capital deployed.

> **Business value:** Quantifies private capital leverage, optimal tranche sizing, and OECD DAC taxonomy classification for blended finance structures targeting emerging-market climate and SDG investments.

**How an analyst works this module:**
- Define blended finance objective (SDG/climate alignment, sector, geography)
- Size concessional/first-loss tranches using expected loss and stress scenarios
- Model private capital leverage ratio under base, optimistic, and stress assumptions
- Apply OECD DAC taxonomy classification and generate term sheet summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DFI_PROVIDERS`, `GUARANTEE_STRUCTURES`, `MOBILIZATION_DATA`, `OECD_PRINCIPLES`, `TABS`, `TRANCHE_TYPES`, `USE_CASES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DFI_PROVIDERS` | 9 | `type`, `focus`, `firstLossCapacity`, `guaranteePct`, `mobilizationRatio`, `regions`, `instruments` |
| `TRANCHE_TYPES` | 5 | `position`, `returnTarget`, `riskAbsorbed`, `provider`, `typical`, `purpose` |
| `USE_CASES` | 7 | `region`, `sector`, `dealM`, `firstLossM`, `seniorM`, `mezM`, `taM`, `mobilization`, `carbonAvoid`, `irr`, `dfiProvider` |
| `GUARANTEE_STRUCTURES` | 6 | `coverage`, `trigger`, `pricing`, `mobilization`, `bestFor` |
| `MOBILIZATION_DATA` | 11 | `total`, `publicConcession`, `dfiGuarantee`, `blendedFunds` |
| `OECD_PRINCIPLES` | 6 | `description`, `implication` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seniorPct` | `100 - firstLossPct - mezzPct;` |
| `firstLossM` | `totalM * firstLossPct / 100;` |
| `mezzM` | `totalM * mezzPct / 100;` |
| `seniorM` | `totalM * seniorPct / 100;` |
| `guaranteeM` | `totalM * dfiGuaranteePct / 100;` |
| `concessionalRate` | `(marketRate - concRateBps / 100) / 100;` |
| `blendedCost` | `(firstLossM * 0.04 + mezzM * (marketRate / 100) * 0.85 + seniorM * (marketRate / 100)) / totalM;` |
| `mobilizationRatio` | `seniorM / (firstLossM + guaranteeM * 0.15);` |
| `concessionality` | `(marketRate / 100 - blendedCost) * totalM;` |
| `structure` | `useMemo(() => calcBlendedStructure({ totalM, firstLossPct, mezzPct, dfiGuaranteePct, concRateBps, marketRate, wacc: 8 }), [totalM, firstLossPct, mezzPct, dfiGuaranteePct, concRateBps, marketRate]);  const trancheViz = useMemo(() => [ { name: 'Senior / Commercial', value: parseFloat(structure.seniorPct), color: T.navy, m: parseFloat(struct` |
| `mobHistory` | `useMemo(() => MOBILIZATION_DATA, []);  const dfiChart = useMemo(() => DFI_PROVIDERS.map((d, i) => ({ name: d.name.split('(')[0].trim(), capacity: d.firstLossCapacity / 1000, ratio: d.mobilizationRatio, })), []);` |
| `concPricingData` | `useMemo(() => [0, 50, 100, 150, 200, 250, 300, 350, 400, 500].map(conc => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/blended-finance/structure` | `post_blended_structure` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/dfi-standards` | `post_dfi_standards` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/concessional-layers` | `post_concessional_layers` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/mobilisation-metrics` | `post_mobilisation_metrics` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/portfolio` | `post_blended_portfolio` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/mdb-profiles` | `get_mdb_profiles` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/instruments` | `get_instruments` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/dac-sectors` | `get_dac_sectors` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/convergence-benchmarks` | `get_convergence_benchmarks` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/ep-categories` | `get_ep_categories` | api/v1/routes/blended_finance.py |

### 2.3 Engine `blended_finance_engine` (services/blended_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_mid` | rng_tuple | Midpoint of a documented model-config range (structuring assumption). |
| `_score_ifc_ps` | project_category, sector, reported_scores | Score the 8 IFC Performance Standards. IFC PS scores are entity-assessed E&S compliance figures. They are NOT modelled here: when the caller supplies ``reported_scores`` (a mapping of PS id -> 0-100 score from a real E&S assessment) the weighted average is computed deterministically; otherwise every score is returned as ``None`` with an ``insufficient_data`` status and no weighted average is fabri |
| `_es_risk_tier` | ifc_score, sector | E&S risk tier (EP4 A/B/C). Sector alone forces Category A; otherwise a real IFC score is required — returns None when the score is unavailable. |
| `_country_income_group` | country, reported_income_group | Resolve World Bank / UN income classification for ODA eligibility. Uses the caller-supplied ``reported_income_group`` when provided, else a real reference table (:data:`COUNTRY_INCOME_GROUPS`). Returns ``None`` for countries not in the table so ODA eligibility is not fabricated. |
| `assess_blended_structure` | entity_id, instrument_type, project_size_usd, sector, country, concessional_pct, first_loss_share_of_concessional, guarantee_coverage_pct | Assess a blended finance structure. Returns concessional layer sizing, MDB partner match, IFC PS compliance, mobilisation ratio benchmarks, OECD DAC ODA eligibility, SDG alignment. Structuring inputs (``concessional_pct``, ``first_loss_share_of_concessional``, ``guarantee_coverage_pct``, ``mobilisation_ratio``, ``return_enhancement_bps``) are DEAL-SPECIFIC: when omitted they are returned as ``None |
| `analyse_dfi_standards` | entity_id, dfi_partner, project_category, reported_ps_scores, grievance_score, grievance_channels, edge_energy_saving_pct, edge_water_saving_pct | Analyse DFI E&S standards compliance across 8 IFC PS categories. Returns IFC PS scores, E&S risk tier, EDGE criteria and DFI partner profile. All figures here are entity-assessed E&S metrics, not model outputs: IFC PS scores, the grievance-mechanism score/channels and EDGE savings percentages are only returned when supplied by the caller. When absent they are reported as ``None`` / ``insufficient_ |
| `model_concessional_layers` | entity_id, total_size_usd, sectors, tranche_shares, tranche_return_targets, tranche_ratings | Model tranche waterfall: senior / mezzanine / first-loss / grant. Returns return targets per tier, investor type mapping, blended IRR. The capital-stack shares and per-tranche return targets are structuring parameters. When ``tranche_shares`` / ``tranche_return_targets`` are supplied (keys: ``senior``/``mezzanine``/``first_loss``/``grant``) they drive the model directly; otherwise the midpoint of  |
| `calculate_mobilisation_metrics` | entity_id, public_finance_usd, private_co_finance_usd, sector, financial_additionality, es_additionality, knowledge_additionality, crowding_in_score | Calculate MDB mobilisation metrics, additionality and crowding assessment. Benchmarks per Convergence 2023; methodology per MDB Harmonised Framework. The direct mobilisation ratio and OECD DAC public share are computed directly from the supplied finance amounts. The achieved ratio is compared against each Convergence 2023 sector benchmark using the *actual* ratio (no per-sector figure is fabricate |
| `generate_blended_portfolio` | entity_id, instruments | Aggregate blended finance instruments into portfolio-level analytics. Returns risk-return frontier, SDG alignment, impact metrics, sector exposures and Convergence-style portfolio analytics. Portfolio totals (concessional layer, private mobilised, mobilisation ratio, sector exposures, average deal size) are computed directly from the supplied ``instruments``. Per-instrument concessional share and  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Convergence` *(shared)*, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `portfolio` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DFI_PROVIDERS`, `GUARANTEE_STRUCTURES`, `MOBILIZATION_DATA`, `OECD_PRINCIPLES`, `TABS`, `TIER_COLORS`, `TRANCHE_TYPES`, `USE_CASES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Catalytic Leverage Ratio | `Private capital mobilised / concessional capital deployed` | OECD DAC blended finance dataset | Higher ratios indicate greater mobilisation efficiency; OECD target >3x for emerging markets |
| First-Loss Tranche Size | `Expected portfolio loss × stress multiplier / total facility size` | DFI structuring guidelines | Absorbs initial losses protecting senior private investors; typically 8-20% of facility |
| Concessional Capital Share | `DFI/MDB concessional tranche / total capital stack` | CONVERGENCE database | Share above 25% may crowd out private capital; below 10% may be insufficient to de-risk |
- **CONVERGENCE Blended Finance Database** → Historical deal terms → leverage ratio benchmarks by sector and region → **Peer comparison for tranche sizing**
- **DFI/MDB term sheets** → Concessional pricing, tenor, grace period → waterfall model inputs → **First-loss and mezzanine tranche calibration**
- **OECD DAC taxonomy** → Activity classification codes → concessional finance eligibility flags → **ODA attribution and reporting output**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/blended-finance/ref/convergence-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['convergence_benchmarks'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/dac-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dac_sector_codes'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/ep-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ep4_categories', 'note'], 'n_keys': 2}`

**GET /api/v1/blended-finance/ref/instruments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['instruments'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/mdb-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mdb_profiles'], 'n_keys': 1}`

**POST /api/v1/blended-finance/concessional-layers** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/blended-finance/dfi-standards** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/blended-finance/mobilisation-metrics** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Catalytic Capital Leverage Modelling
**Headline formula:** `Leverage Ratio = Private Capital Mobilised / Concessional Capital Deployed; First-Loss Buffer = Expected Loss × (1 + Stress Factor)`

Measures private capital catalysed per dollar of concessional/public capital using tranche waterfall and expected loss allocation

**Standards:** ['OECD DAC Blended Finance Taxonomy', 'G20 MDB Capital Adequacy Framework', 'CONVERGENCE Blended Finance Database']
**Reference documents:** OECD (2023) Blended Finance Principles for Unlocking Commercial Finance for the SDGs; CONVERGENCE (2023) State of Blended Finance Report; G20 Sustainable Finance Working Group — MDB Capital Adequacy Framework 2022; World Bank (2023) Maximising Finance for Development — Cascade Approach

**Engine `blended_finance_engine` — extracted transformation lines:**
```python
weighted = round(weighted_num / weight_den, 1) if weight_den > 0 else None
concessional_usd = round(project_size_usd * conc_pct, 0) if conc_pct is not None else None
first_loss_pct = (conc_pct * fl_share) if (conc_pct is not None and fl_share is not None) else None
first_loss_usd = round(project_size_usd * first_loss_pct, 0) if first_loss_pct is not None else None
private_co_finance = (round(concessional_usd * mob_ratio, 0)
senior_pct = max(0.35, 1.0 - grant_pct - first_loss_pct - mezzanine_pct)
total_pct = grant_pct + first_loss_pct + mezzanine_pct + senior_pct
total = public_finance_usd + private_co_finance_usd
direct_ratio = private_co_finance_usd / public_finance_usd if public_finance_usd > 0 else 0.0
conc_usd = size * conc_pct
priv_mob = conc_usd * mob_ratio
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **55** other module(s).
**Shared engines (edits propagate!):** `blended_finance_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `blended-finance` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
| `blended-finance-structurer` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The richest of the three blended-finance pages. `calcBlendedStructure` turns a
capital-stack slider mix into blended cost, mobilisation ratio and concessionality:

```js
seniorPct       = 100 − firstLossPct − mezzPct
firstLossM      = totalM × firstLossPct/100
mezzM           = totalM × mezzPct/100
seniorM         = totalM × seniorPct/100
guaranteeM      = totalM × dfiGuaranteePct/100
blendedCost     = (firstLossM×0.04 + mezzM×(marketRate/100)×0.85 + seniorM×(marketRate/100)) / totalM
mobilizationRatio = seniorM / (firstLossM + guaranteeM×0.15)
concessionality = (marketRate/100 − blendedCost) × totalM
```

The cost model assigns fixed spreads to each layer: **first-loss 4% flat, mezzanine
85% of market rate, senior full market rate**; the mobilisation ratio treats
guarantees as 15% loss-equivalent capital.

### 7.2 Parameterisation

`DFI_PROVIDERS` (9 rows) carry real institutional first-loss capacity ($M) and
mobilisation ratios:

| DFI | First-loss capacity $M | Mobilisation ratio |
|---|---|---|
| EIB | 9,200 | 5.2× |
| IFC | 8,500 | 4.8× |
| OPIC/MIGA | 2,200 | 6.5× |
| EBRD | 5,600 | 4.1× |
| ADB | 4,200 | 4.2× |
| US DFC | 3,800 | 3.2× |
| AfDB | 3,100 | 3.5× |
| AIIB | 2,800 | 3.8× |

`MOBILIZATION_DATA` is a real-shaped 2015–2024 market series (total $48B→$224B, split
public-concession / DFI-guarantee / blended-funds). `TRANCHE_TYPES`, `USE_CASES`
(6 named deals with deal/first-loss/senior $M, mobilisation, carbon avoided Mt, IRR),
`GUARANTEE_STRUCTURES` and `OECD_PRINCIPLES` are descriptive tables. Sliders default:
`totalM=200`, `firstLossPct=12`.

### 7.3 Calculation walkthrough

1. Sliders set total facility, first-loss %, mezzanine %, DFI-guarantee %,
   concessional-rate discount (bps) and market rate.
2. `calcBlendedStructure` derives tranche $ amounts, blended cost %, mobilisation
   ratio and concessionality ($ subsidy value).
3. `concPricingData` sweeps concessional discount 0→500 bps to show its effect.
4. `dfiChart` plots each provider's first-loss capacity and mobilisation ratio.

### 7.4 Worked example

`totalM = 200`, `firstLossPct = 12`, `mezzPct = 20`, `dfiGuaranteePct = 10`,
`marketRate = 8%`:

| Step | Computation | Result |
|---|---|---|
| Senior % | 100 − 12 − 20 | 68% |
| First-loss $ | 200 × 0.12 | $24M |
| Mezzanine $ | 200 × 0.20 | $40M |
| Senior $ | 200 × 0.68 | $136M |
| Guarantee $ | 200 × 0.10 | $20M |
| Blended cost | (24×0.04 + 40×0.08×0.85 + 136×0.08)/200 | **6.3%** |
| Mobilisation ratio | 136 / (24 + 20×0.15) | **5.04×** |
| Concessionality | (0.08 − 0.063) × 200 | **$3.4M** |

The 12% first-loss plus a partial guarantee mobilises $136M senior at 5.0× — above
the OECD >3× target — while cutting the effective cost from 8.0% to 6.3%, a 170 bp
concessionality worth $3.4M.

### 7.5 Data provenance & limitations

- `DFI_PROVIDERS` capacities/ratios and `MOBILIZATION_DATA` are real-shaped
  reference data; `USE_CASES` are illustrative. `calcBlendedStructure` is deterministic
  (no PRNG on outputs).
- The blended-cost spreads (first-loss 4%, mezz ×0.85, guarantee ×0.15) are **fixed
  heuristics**, not risk-priced; mobilisation-ratio denominator counts only first-loss
  + 15% of guarantees, ignoring mezzanine's loss absorption.
- No expected-loss simulation, no first-loss *sizing to a hurdle* (it is an input, not
  solved), and the page does not call the backend engine's `model_concessional_layers`.

**Framework alignment:** OECD DAC Blended Finance Principles (`OECD_PRINCIPLES`
table) · Convergence / DFI leverage benchmarks (the 3–8× mobilisation band) · G20 MDB
Capital Adequacy Framework · the engine's IFC PS and MDB Harmonised additionality
scoring are available via the shared `/ref/*` endpoints but not surfaced here.

## 8 · Model Specification

**Status: specification — not yet implemented in code** (the page's cost/mobilisation
formulas are heuristics; the production model is the engine-backed structuring model).

**8.1 Purpose & scope.** Price a blended capital stack from a real expected-loss
distribution, size first-loss to a target senior rating/IRR, and report mobilisation
and concessionality — for MDB/DFI structuring teams.

**8.2 Conceptual approach.** Tranche-waterfall credit model with **loss-allocation
by seniority** and **first-loss sizing to a rating attachment point** (as in CLO/ABS
structuring and the DFI cascade), benchmarked against **Convergence 2023** leverage
and **G20 MDB CAF** capital treatment.

**8.3 Mathematical specification.**
```
Loss ~ portfolio credit model (e.g. Vasicek single-factor): P(L>x)
Attachment_senior = VaR_{α}(L)   → FirstLoss+Mezz must cover up to α (e.g. 99%)
Tranche_cost_i    = risk-free + credit_spread_i(PD_tranche_i, LGD)
BlendedCost       = Σ_i cost_i · size_i / total
Mobilisation      = senior_commercial / concessional_deployed
Concessionality   = (market_all_in − blended_all_in) · total   (grant-equivalent)
```

| Parameter | Source |
|---|---|
| Asset PD/LGD/correlation | Deal credit analysis; Moody's/S&P EM defaults |
| Rating attachment | Rating-agency CLO/ABS criteria |
| Market spreads | Comparable EM senior debt (Bloomberg/ICE) |
| DFI leverage benchmark | Convergence 2023 (engine) |

**8.4 Data requirements.** Underlying asset PD/LGD/EAD & correlation, target senior
rating, market spread curve, DFI capacity, guarantee terms. Engine
`model_concessional_layers` already ingests tranche shares/return targets; the credit
model (Vasicek loss distribution) is the addition.

**8.5 Validation & benchmarking.** Reconcile attachment points against rating-agency
tranche criteria; back-test blended cost against comparable closed deals; verify
mobilisation ratio matches Convergence sector medians; sensitivity on asset
correlation (dominant driver of tail loss).

**8.6 Limitations & model risk.** EM correlation and PD are data-poor and procyclical;
guarantees have basis risk vs cash first-loss. Conservative fallback: stress
correlation upward, size first-loss to the 99.5% loss VaR, and disclose the
grant-equivalent concessionality explicitly.

## 9 · Future Evolution

### 9.1 Evolution A — Route the local waterfall math to the shared engine and benchmark leverage (analytics ladder: rung 1 → 2)

**What.** This is the third module over the shared honest `blended_finance_engine`. Its frontend has real client-side structuring math (`calcBlendedStructure`: tranche sizing, `blendedCost`, `mobilizationRatio = seniorM / (firstLossM + guaranteeM×0.15)`, concessionality value) and a distinctive angle — DFI/guarantee structures and OECD DAC taxonomy classification — but the seven seed tables (`DFI_PROVIDERS`, `GUARANTEE_STRUCTURES`, `MOBILIZATION_DATA`, `USE_CASES`) are static and the engine's POSTs are uncalled. Its specialisation versus the two siblings is the guarantee-structure and DAC-taxonomy dimension. Evolution A wires that specialisation to the engine and benchmarks leverage against real data.

**How.** (1) Move the tranche/leverage math server-side via `assess_blended_structure` and `calculate_mobilisation_metrics`, so the catalytic-leverage ratio is engine-computed and benchmarked against the real Convergence 2023 sector figures (the `/ref/convergence-benchmarks` and `/ref/dac-sectors` GETs already pass). (2) The OECD DAC taxonomy classification the module uniquely emphasises maps to the engine's `_country_income_group` ODA-eligibility logic (which honestly returns `None` for unlisted countries) and the `/ref/dac-sectors` codes. (3) Guarantee structures (`guarantee_coverage_pct` is a real engine input) drive `assess_blended_structure`, replacing the seeded `GUARANTEE_STRUCTURES`. (4) Triage the skipped POSTs. Rung 2: the concessional-pricing sweep (`concPricingData` over 0–500 bps) becomes an engine what-if rather than a local recompute.

**Prerequisites.** POST triage (shared across the three blended-finance modules); a clear specialisation split so the trio don't duplicate. **Acceptance:** the leverage ratio matches `/mobilisation-metrics` and compares against the real Convergence benchmark; DAC/ODA classification uses the engine's income-group table with `None` for unlisted countries; POSTs pass the harness.

### 9.2 Evolution B — Guarantee-and-taxonomy structuring copilot (LLM tier 2)

**What.** Scoped to this module's niche: "what guarantee coverage mobilises 4× private capital for a $150M facility in a lower-middle-income country, and how is it classified under OECD DAC?" The copilot runs `assess_blended_structure` (with the guarantee input) and `calculate_mobilisation_metrics`, reports the achieved leverage against the Convergence benchmark, and states the DAC sector code and ODA eligibility from the engine — every figure tool-traced, ODA eligibility reported as `None` where the country isn't in the reference table.

**How.** Tool schemas over the shared engine routes; grounding corpus is this Atlas record plus the `OECD_PRINCIPLES` table and DAC taxonomy reference. Because three modules share one engine, the tool layer is the single blended-finance tool set the Financial/Development desk orchestrator routes to — this module's copilot specialises the *prompt* (guarantee structuring, DAC classification) not the tools. The engine's honest-null contract carries through: unsupplied structuring parameters return `None`, and the copilot requests them.

**Prerequisites (hard).** Evolution A's engine wiring; the seeded `USE_CASES`/`MOBILIZATION_DATA` are not tool-callable. **Acceptance:** every leverage ratio and DAC classification traces to an engine response; ODA eligibility for an unlisted country is reported as insufficient data; guarantee-coverage what-ifs state the assumed coverage.