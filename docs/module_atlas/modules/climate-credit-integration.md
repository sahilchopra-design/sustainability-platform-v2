# Climate Credit Integration Engine
**Module ID:** `climate-credit-integration` · **Route:** `/climate-credit-integration` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integration layer connecting carbon credit positions from the CarbonCreditContext data bus with portfolio-level climate analytics. Maps credit retirements to Scope 1/2/3 offset claims, validates additionality, and adjusts portfolio temperature score and financed emissions.

> **Business value:** Net FE = gross FE minus quality-adjusted credit retirements. VCMI Gold tier requires 100% of residual emissions covered by CCP-eligible credits and near-term SBTi target in place.

**How an analyst works this module:**
- Link to CarbonCreditContext to import retired credit positions
- Quality Screening tab applies ICVCM CCP filter
- Offset Mapping tab allocates retired credits to emission scopes
- Adjusted Metrics tab shows net FE and adjusted ITR
- VCMI Claims tab determines permissible claim tier

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `HAZARDS`, `HAZARD_MATRIX`, `LINK_COLOR`, `MODULE_LINKS`, `OBLIGORS_CC`, `SCENARIOS_CC`, `SECTORS_CC`, `SECTOR_TRANSITION`, `STAGE_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS_CC` | 6 | `name`, `temp`, `pdMultiplier`, `lgdMultiplier`, `color` |
| `MODULE_LINKS` | 13 | `code`, `linkType`, `vars`, `direction`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS_CC` | `['Power','Steel','Cement','Oil & Gas','Transport','Buildings','Agri-Food','Financial','Real Estate','Retail'];` |
| `pd_base` | `0.005 + sr(i * 3) * 0.04;` |
| `lgd_base` | `0.25 + sr(i * 3 + 1) * 0.45;` |
| `ead` | `50 + sr(i * 3 + 2) * 950;` |
| `carbonInt` | `80 + sr(i * 5) * 1200;         // tCO₂/$M revenue` |
| `physScore` | `10 + sr(i * 5 + 1) * 80;` |
| `transScore` | `10 + sr(i * 5 + 2) * 80;` |
| `scenarios_adj` | `SCENARIOS_CC.map(sc => {` |
| `carbonFactor` | `1 + (sc.pdMultiplier - 1) * (carbonInt / 800);` |
| `physFactor` | `1 + (sc.pdMultiplier - 1) * (physScore / 80) * 0.3;` |
| `pd_adj` | `Math.min(1, pd_base * carbonFactor * physFactor);` |
| `lgd_adj` | `lgd_base * sc.lgdMultiplier;` |
| `ecl_base` | `pd_base * lgd_base * ead;` |
| `ecl_adj` | `pd_adj  * lgd_adj  * ead;` |
| `uplift_pct` | `((ecl_adj - ecl_base) / ecl_base * 100);` |
| `sicr_z_adj` | `(pd_adj - pd_base) / (pd_base * 0.3 + 0.001);` |
| `HAZARD_MATRIX` | `SECTORS_CC.map((sector, si) => {` |
| `SECTOR_TRANSITION` | `SECTORS_CC.map((s, i) => ({` |
| `safeScIdx` | `scIdx >= 0 ? scIdx : 0; // guard: invalid activeScenario → fall back to first scenario` |
| `eclBase` | `obs.reduce((s, o) => s + o.scenarios_adj[0].ecl_base, 0);` |
| `eclAdj` | `obs.reduce((s, o) => s + o.scenarios_adj[si].ecl_adj, 0);` |
| `avg` | `Math.round(HAZARDS.reduce((s,h)=>s+r[h],0)/ Math.max(1, HAZARDS.length));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `HAZARDS`, `MODULE_LINKS`, `SCENARIOS_CC`, `SECTORS_CC`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Gross Financed Emissions | `PCAF Scope 1+2 attribution` | PCAF Standard v2 | Portfolio emissions before carbon credit offset adjustment |
| Offset Quality Factor | `ICVCM CCP score / 100` | ICVCM assessment | Credit quality discount; 1.0 for CCP-eligible, lower for non-eligible |
| Net Financed Emissions | `GrossFE – Σ(Credits × QF)` | Model output | Portfolio emissions after quality-adjusted credit retirements |
| VCMI Claims Tier | `VCMI assessment` | VCMI Claims Code 2023 | Permissible voluntary claim tier based on credit quality and abatement coverage |
- **CarbonCreditContext bus** → Retired credit registry data → offset pool → **Available offsets by quality tier**
- **PCAF FE model** → Gross FE – QF-weighted retirements → net FE → **Adjusted financed emissions**

## 5 · Intermediate Transformation Logic
**Methodology:** Credit retirement offset adjustment to portfolio emissions
**Headline formula:** `AdjustedFE = GrossFE – Σ(RetiredCredits_i × QualityFactor_i); AdjustedITR = f(AdjustedFE)`

Gross financed emissions (FE) from PCAF methodology. Retired carbon credits offset FE only if they meet quality criteria: ICVCM CCP score ≥60 and additionality verified. Quality factor (0–1) discounts low-integrity credits. Adjusted ITR recalculated from adjusted FE using portfolio temperature model. VCMI Claims Code governs permissible claims (Gold/Silver/Bronze tier based on credit quality and scope coverage).

**Standards:** ['GHG Protocol Corporate Standard', 'VCMI Claims Code of Practice 2023', 'SBTi Net-Zero Standard v1.2', 'ISO 14064-3']
**Reference documents:** VCMI Claims Code of Practice 2023; GHG Protocol Corporate Standard Ch.9 Offsets; SBTi Corporate Net-Zero Standard v1.2; ICVCM Core Carbon Principles 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry for this route describes a *carbon-credit
> offset integration* workflow (ICVCM CCP quality screening, VCMI claims tiers, net financed
> emissions). **None of that logic exists in this module's code.** What the page actually implements
> is **climate-conditioned IFRS 9 credit risk**: NGFS-scenario PD/LGD adjustment, ECL uplift, SICR
> staging, a hazard × sector matrix, and sector transition-cost projections. The ICVCM/VCMI
> methodology genuinely lives in the carbon-credit family (`vcm-integrity`, `credit-integrity-dd`,
> `cc-*` modules, `carbon-credit-quality` engine). The guide entry should be rewritten; the sections
> below document the code as it actually behaves.

### 7.1 What the module computes

For 40 synthetic obligors across 10 sectors, the module conditions a standard one-year IFRS 9
expected-credit-loss model on 5 NGFS climate scenarios:

```
ECL = PD × LGD × EAD                       (unconditional, per IFRS 9 §5.5.17)
ECL_climate = PD_adj × LGD_adj × EAD       (scenario-conditioned)
Uplift % = (ECL_climate − ECL_base) / ECL_base × 100
```

Each obligor carries six risk primitives: `pd_base` (0.5%–4.5%), `lgd_base` (25%–70%), `ead`
($50–1,000M), `carbonInt` (80–1,280 tCO₂e/$M revenue), `physScore` and `transScore` (10–90 on the
platform's 0–100 physical/transition risk scales).

### 7.2 Scenario parameterisation (NGFS Phase-consistent multipliers)

| NGFS scenario | Temp pathway | PD multiplier (ceiling) | LGD multiplier | Economic reading |
|---|---|---|---|---|
| Net Zero 2050 | 1.5 °C | 1.08 | 1.05 | Orderly: early carbon price, modest credit stress |
| Below 2 °C | 1.8 °C | 1.12 | 1.07 | Orderly but slower; slightly higher terminal stress |
| Delayed Transition | 1.8 °C | 1.22 | 1.12 | Disorderly: late abrupt policy → sharper repricing |
| NDC Policies | 2.5 °C | 1.35 | 1.18 | Hot-house drift: physical risk starts to dominate |
| Current Policies | 2.7 °C | 1.58 | 1.28 | Worst credit outcome: chronic + acute physical loss |

The multiplier is a **ceiling**, not a flat scalar — it only applies in full to an obligor at the
maximum carbon intensity (see §7.3). Ordering follows the NGFS logic that *disorderly and hot-house
scenarios are worse for credit than orderly ones*, which is why Current Policies (2.7 °C) carries
the largest PD stress (×1.58), not the 1.5 °C scenario.

### 7.3 Transmission channels — how climate risk enters PD

Two channels scale the scenario multiplier to each obligor before it touches PD:

```js
carbonFactor = 1 + (pdMultiplier − 1) × (carbonInt / 800)          // transition channel
physFactor   = 1 + (pdMultiplier − 1) × (physScore / 80) × 0.3     // physical channel
PD_adj       = min(1, PD_base × carbonFactor × physFactor)
LGD_adj      = LGD_base × lgdMultiplier
```

- **Transition normalisation (÷800):** carbon intensity is normalised against 800 tCO₂e/GWh — the
  supercritical-coal carbon-intensity ceiling (IEA *Electricity 2023*, Table 3.1, ≈820 gCO₂/kWh).
  An obligor at coal-plant intensity absorbs the full scenario PD multiplier; an obligor at half
  that intensity absorbs half the excess. This makes the stress *linear in carbon intensity*, the
  same first-order treatment used in NGFS bank stress-test guidance.
- **Physical normalisation (÷80, ×0.3):** the physical score is normalised to the platform's
  maximum observed score (80) and down-weighted to 30% of the transition channel — encoding the
  assumption that, at a 1-year ECL horizon, transition repricing dominates acute physical damage.
- **PD cap:** `min(1, ·)` keeps the adjusted PD a valid probability.
- LGD takes the scenario multiplier directly (collateral haircuts are portfolio-wide, not
  obligor-carbon-specific).

### 7.4 Worked example (Current Policies, one obligor)

Take an obligor with `PD_base = 0.90%`, `LGD_base = 40%`, `EAD = $500M`, `carbonInt = 400`,
`physScore = 40`, under **Current Policies** (PD ×1.58, LGD ×1.28):

| Step | Computation | Result |
|---|---|---|
| Transition factor | 1 + 0.58 × (400/800) | 1.290 |
| Physical factor | 1 + 0.58 × (40/80) × 0.3 | 1.087 |
| PD adjusted | 0.009 × 1.290 × 1.087 | **1.262%** |
| LGD adjusted | 0.40 × 1.28 | **51.2%** |
| ECL base | 0.009 × 0.40 × 500 | **$1.80M** |
| ECL climate | 0.01262 × 0.512 × 500 | **$3.23M** |
| ECL uplift | (3.23 − 1.80) / 1.80 | **+79.5%** |
| SICR z | (0.01262 − 0.009) / (0.009 × 0.3 + 0.001) | **0.98** |
| Stage | PD_adj 1.26% > 1% threshold | **1 → 2 migration** |

The obligor crosses the Stage-2 boundary purely from climate conditioning — exactly the SICR
mechanic (significant increase in credit risk since origination) that IFRS 9 §5.5.9 requires
institutions to evidence.

### 7.5 Staging & SICR rubric

| Rule | Threshold | Basis |
|---|---|---|
| Stage 1 → 2 | adjusted PD > 1% | Simplified low-credit-risk exemption boundary |
| Stage 2 → 3 | adjusted PD > 3% | Proxy for credit-impairment onset |
| SICR z-score | `ΔPD / (0.3 × PD_base + 0.1bp)` | Materiality scaled to 30% relative PD growth; z ≥ 1 ≈ SICR |

The z denominator makes the trigger *relative*: a 40bp PD rise is significant for a 90bp obligor
(z≈1) but immaterial for a 4% obligor (z≈0.03). The +0.1bp floor guards division for near-zero PDs.
Portfolio KPIs aggregate: total ECL base vs adjusted per scenario, uplift %, and the count of
stage migrations (the chart series `portfolioStats`).

### 7.6 Companion analytics on the page

- **Hazard × Sector matrix** — 7 hazards (Flood, Wildfire, Heat Stress, Drought, Carbon Price,
  Policy Shock, Stranded Asset) × 10 sectors, scored 10–95; drives the radar view. Sector filter
  swaps portfolio-mean scores for the selected sector's row.
- **Sector transition risk** — per-sector carbon cost projections for 2030/2050 under Net Zero
  ($50–1,000M by 2030; $200–4,000M by 2050) vs Current Policies (roughly 10× smaller), plus
  stranded-asset percentages (NZ 5–65% vs CP 0.5–8.5%) — the NZ/CP gap *is* the transition-risk
  wedge.
- **Intermodular map** — 12 documented live links: this module feeds `pd_climate_adj`/`lgd_climate_adj`/
  `ecl_uplift_pct` to DME Financial Risk (EP-BE1) and Credit Risk Analytics (EP-BI1), scenario
  parameters to the Stress Tester (EP-G2), and exchanges WACI/EVIC bidirectionally with PCAF
  Financed Emissions (EP-AJ1). Schema anchor: migration 088 (`climate_scenarios`,
  `climate_scenario_variables`, `asset_climate_risk`).

### 7.7 Data provenance & limitations

- **All obligor data is synthetic demo data**, generated by the platform's seeded PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)` — stable across renders, but not real counterparties.
  Scenario multipliers and the 800 tCO₂e/GWh anchor are the only externally sourced constants.
- Single-period (1-year) ECL only; no lifetime ECL term structure for Stage-2 assets, no
  discounting, no PD term-structure conditioning (a production implementation would condition the
  full PD curve per NGFS macro paths).
- Physical channel is a scalar down-weight (0.3), not hazard-specific damage functions — the
  hazard matrix is descriptive, not yet wired into PD.

**Framework alignment:** IFRS 9 §5.5 (ECL, SICR, staging) · NGFS Phase IV scenario set ·
BCBS *Principles for the effective management and supervision of climate-related financial risks*
(2022) · EBA/ECB climate stress-testing practice for the multiplier-on-PD design.

## 9 · Future Evolution

### 9.1 Evolution A — Resolve the identity crisis, then deepen the IFRS 9 engine (analytics ladder: rung 2 → 3)

**What.** §7's finding is unusual: the guide describes carbon-credit offset
integration (ICVCM screening, VCMI tiers, net financed emissions) but the code is a
different — and genuinely decent — module: climate-conditioned IFRS 9 credit risk with
NGFS PD/LGD multipliers, ECL uplift (`ECL = PD×LGD×EAD`), SICR staging, a hazard ×
sector matrix, and transition-cost projections over 40 synthetic obligors. The
offset methodology properly lives in the cc-* family. Evolution A therefore has a
mandatory step zero — rewrite the guide to describe the IFRS 9 module that exists
(the §7 flag says exactly this) — then deepens it: the scenario PD/LGD multipliers in
`SCENARIOS_CC` are currently asserted constants; calibrate them against the published
ECB climate stress-test results and NGFS-vintage transition paths so the
scenario-conditioned ECL uplift carries a citable basis.

**How.** (1) Guide rewrite + atlas regeneration so RAG corpora stop describing
phantom VCMI logic. (2) `ref_scenario_pd_multipliers(scenario, sector, multiplier,
source, vintage)` replacing hard-coded values; sector granularity added (a utilities
obligor and a tech obligor should not share one multiplier). (3) The 40 synthetic
obligors kept as clearly-labelled fixtures, or linked to real obligors via the GLEIF
spine where portfolio data exists.

**Prerequisites (hard).** The guide↔code identity mismatch is the platform's worst
RAG hazard on this page and blocks everything downstream. **Acceptance:** the guide
describes the implemented module; scenario multipliers cite calibration sources; a
fixture obligor's ECL uplift decomposes into PD and LGD channels reproducibly.

### 9.2 Evolution B — IFRS 9 climate-overlay copilot (LLM tier 1 → 2)

**What.** A copilot for credit officers: "why did this obligor migrate to Stage 2
under Disorderly?" (SICR trigger narration from the staging logic), "decompose the
ECL uplift into PD and LGD channels", "which sector-hazard cells drive our matrix?" —
grounded in the (corrected) atlas record and page state. Tier-2 what-ifs re-run the
scenario conditioning with LLM-proposed carbon-price/scenario inputs as client-side
tool calls over the ECL functions.

**How.** Tier 1 after the guide rewrite: §5/§7 corpus plus the live obligor table;
staging explanations must follow the coded SICR triggers, not IFRS 9 generalities.
Tier 2: tool schemas over the ECL/staging functions; validator ties every ECL and
uplift figure to invocations. Offset/VCMI questions get routed to the cc-* modules'
copilots per the interconnection graph — this module must decline them.

**Prerequisites (hard).** Guide rewrite first; without it the copilot would be
grounded on a description of a module that doesn't exist. **Acceptance:** a staging
explanation cites the specific trigger that fired; a VCMI claims question is
redirected to the correct module rather than answered here.