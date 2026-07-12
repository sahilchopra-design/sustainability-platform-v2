# Sovereign Wealth Fund ESG
**Module ID:** `sovereign-swf` · **Route:** `/sovereign-swf` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SWF ESG governance, sustainability mandate tracking, and portfolio ESG analytics for sovereign wealth funds including policy alignment, exclusion frameworks and impact mandates.

> **Business value:** Assesses sovereign wealth fund ESG governance, sustainability mandates and portfolio integration against IFSWF and UNPRI best practices.

**How an analyst works this module:**
- Assess SWF ESG policy framework: exclusion list, ESG integration mandate, net-zero commitment.
- Analyse portfolio ESG scores by asset class: public equity, fixed income, private markets.
- Evaluate transparency: annual ESG report, TCFD disclosure, UNPRI reporting quality.
- Score overall ESG mandate strength and benchmark against IFSWF best practices.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DIVESTMENT_COMMITMENTS`, `EXCLUSION_POLICIES`, `FUND_TYPES`, `FUND_TYPE_COLORS`, `GAPP_PRINCIPLES`, `KpiCard`, `REGIONS`, `REGION_COLORS`, `SWFS`, `SWF_COUNTRIES`, `SWF_NAMES`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GAPP_PRINCIPLES` | 25 | `title`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sanScore` | `Math.round(40 + sr(i * 19 + 7) * 60);` |
| `esgScore` | `Math.round(30 + sr(i * 23 + 11) * 70);` |
| `climateScore` | `Math.round(25 + sr(i * 29 + 13) * 75);` |
| `fossilFuel` | `parseFloat((5 + sr(i * 31 + 17) * 45).toFixed(1));` |
| `greenAlloc` | `parseFloat((2 + sr(i * 37 + 19) * 28).toFixed(1));` |
| `portTemp` | `parseFloat((1.6 + sr(i * 41 + 23) * 2.4).toFixed(2));` |
| `transScore` | `Math.round(35 + sr(i * 43 + 29) * 65);` |
| `govScore` | `Math.round(40 + sr(i * 47 + 31) * 60);` |
| `nztRaw` | `sr(i * 53 + 37);` |
| `fund` | `SWFS[Math.floor(sr(i * 83 + 7) * 75)].name;` |
| `totalAUM` | `useMemo(() => filteredSWFs.reduce((s, f) => s + f.aum, 0), [filteredSWFs]);` |
| `avgESG` | `useMemo(() => filteredSWFs.length ? (filteredSWFs.reduce((s, f) => s + f.esgScore, 0) / filteredSWFs.length).toFixed(1) : '0.0', [filteredSWFs]);` |
| `avgTemp` | `useMemo(() => filteredSWFs.length ? (filteredSWFs.reduce((s, f) => s + f.portfolioTemp, 0) / filteredSWFs.length).toFixed(2) : '0.00', [filteredSWFs]);` |
| `aumByRegion` | `useMemo(() => REGIONS.map(r => ({` |
| `fundTypeData` | `useMemo(() => FUND_TYPES.map(t => ({` |
| `selectedFundObj` | `useMemo(() => SWFS.find(f => f.name === selectedFund) \|\| SWFS[0], [selectedFund]);  const gappData = useMemo(() => GAPP_PRINCIPLES.map((p, i) => ({ principle: `GAPP ${p.id}`, title: p.title, score: Math.round(selectedFundObj.santiagoScore * (0.7 + sr(selectedFundObj.id * 109 + i * 13) * 0.6)), })), [selectedFundObj]);` |
| `santiagoRanking` | `useMemo(() => [...SWFS].sort((a, b) => b.santiagoScore - a.santiagoScore).slice(0, 20), []);` |
| `exclusionAdoption` | `useMemo(() => EXCLUSION_POLICIES.map((p, pi) => ({` |
| `esgByRegion` | `useMemo(() => REGIONS.map(r => {` |
| `topESG` | `useMemo(() => [...SWFS].sort((a, b) => b.esgScore - a.esgScore).slice(0, 10), []);` |
| `bottomESG` | `useMemo(() => [...SWFS].sort((a, b) => a.esgScore - b.esgScore).slice(0, 10), []);` |
| `greenTop20` | `useMemo(() => [...SWFS].sort((a, b) => b.greenAllocation - a.greenAllocation).slice(0, 20), []);` |
| `fossilDesc` | `useMemo(() => [...SWFS].sort((a, b) => b.fossilFuelExposure - a.fossilFuelExposure).slice(0, 20), []);` |
| `tempByType` | `useMemo(() => FUND_TYPES.map(t => {` |
| `ngfsAlignment` | `useMemo(() => { const thresholds = [ { scenario: '1.5C Aligned', min: 0, max: 1.75, color: T.green }, { scenario: '2C Aligned', min: 1.75, max: 2.5, color: T.teal }, { scenario: '3C Aligned', min: 2.5, max: 3.5, color: T.amber }, { scenario: '4C+', min: 3.5, max: 99, color: T.red }, ];` |
| `whatIfTemp` | `useMemo(() => { const base = SWFS.reduce((s, f) => s + f.portfolioTemp, 0) / Math.max(1, SWFS.length);` |
| `reduction` | `(divRateSlider / 100) * 0.8;` |
| `commitByStatus` | `useMemo(() => ['Announced','In Progress','Complete'].map(s => ({` |
| `cumulativeDivest` | `useMemo(() => { const years = Array.from({ length: 10 }, (_, i) => 2025 + i);` |
| `govScatter` | `useMemo(() => SWFS.map(f => ({ name: f.name, gov: f.governanceScore, aum: f.aum, region: f.region })), []);` |
| `transTop20` | `useMemo(() => [...SWFS].sort((a, b) => b.transparencyScore - a.transparencyScore).slice(0, 20), []);` |
| `radarByRegion` | `useMemo(() => REGIONS.map(r => {` |
| `avg` | `key => g.length ? +(g.reduce((s, f) => s + f[key], 0) / g.length).toFixed(1) : 0;` |
| `co2Scatter` | `useMemo(() => SWFS.map(f => ({` |
| `leadershipIndex` | `useMemo(() => [...SWFS].map(f => ({` |
| `totalUniverseAUM` | `SWFS.reduce((s, f) => s + f.aum, 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sovereign-swf/exclusion-screen` | `exclusion_screen_endpoint` | api/v1/routes/sovereign_swf.py |
| POST | `/api/v1/sovereign-swf/intergenerational-equity` | `intergenerational_equity_endpoint` | api/v1/routes/sovereign_swf.py |
| GET | `/api/v1/sovereign-swf/ref/swf-profiles` | `get_swf_profiles` | api/v1/routes/sovereign_swf.py |
| GET | `/api/v1/sovereign-swf/ref/gpfg-exclusion-criteria` | `get_gpfg_exclusion_criteria` | api/v1/routes/sovereign_swf.py |
| GET | `/api/v1/sovereign-swf/ref/divestment-pathways` | `get_divestment_pathways` | api/v1/routes/sovereign_swf.py |

### 2.3 Engine `sovereign_swf_engine` (services/sovereign_swf_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_principle` | principle, fund_data | Score a single GAPP principle 0-1 based on fund data. |
| `_tier_from_score` | total_score, max_score |  |
| `assess_swf_esg` | fund_name, aum_usd_bn, exclusion_data, climate_data, governance_data | Full IWG-SWF ESG assessment for a sovereign wealth fund. Parameters ---------- fund_name : str Name or identifier of the fund (checked against SWF_PROFILES if available) aum_usd_bn : float AUM in USD billions exclusion_data : dict Keys: has_exclusion_policy (bool), coal_excluded (bool), tobacco_excluded (bool), weapons_excluded (bool), exclusion_list_public (bool) climate_data : dict Keys: has_net |
| `apply_gpfg_exclusion_screen` | holdings_list | Apply the Norwegian GPFG exclusion model to a holdings list. Each holding dict should have: company (str), country (str), revenue_coal_pct (float), revenue_tobacco_pct (float), produces_weapons (bool), produces_cluster_munitions (bool), produces_nuclear_weapons (bool), environmental_controversy (str/None). Returns excluded, observation, and cleared lists. |
| `calculate_portfolio_temperature` | holdings, sovereign_bond_allocations | Calculate portfolio implied temperature rise using MSCI PACTA proxy methodology. Each holding: company (str), sector (str), weight_pct (float), company_temp_c (float, estimated 1.5–4.5) Each sovereign bond: country (str), weight_pct (float), country_temp_c (float) Returns portfolio-weighted implied temperature and sector breakdown. |
| `model_divestment_pathway` | fund_name, aum_usd_bn, fossil_fuel_exposure_pct, pathway_type | Model a fossil fuel divestment pathway with annual schedule and NPV impact. Parameters ---------- fund_name : str aum_usd_bn : float fossil_fuel_exposure_pct : float Current portfolio allocation to fossil fuels (%) pathway_type : str One of: immediate, phase_out_2030, phase_out_2050, engagement_first |
| `assess_intergenerational_equity` | fund_name, aum_usd_bn, annual_withdrawal_pct, resource_revenue_dependency | Assess intergenerational equity compliance using Hartwick Rule + GPFG 4%-rule. Parameters ---------- fund_name : str aum_usd_bn : float annual_withdrawal_pct : float Annual withdrawal as % of fund AUM resource_revenue_dependency : float % of government revenue from resource extraction (0-100) |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `NDC`, `PACTA`, `__future__` *(shared)*, `coal`, `exc` *(shared)*, `fastapi` *(shared)*, `flag`, `pydantic` *(shared)*, `resource`, `sector` *(shared)*, `services` *(shared)*, `tobacco`, `typing` *(shared)*
**Frontend seed datasets:** `EXCLUSION_POLICIES`, `FUND_TYPES`, `GAPP_PRINCIPLES`, `REGIONS`, `SWF_COUNTRIES`, `SWF_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SWFs Assessed | — | IFSWF database | Sovereign wealth funds with active ESG mandate and portfolio analytics. |
| UNPRI Signatories | — | UNPRI | Share of assessed SWFs with UNPRI signatory status. |
| Avg Portfolio ESG Score | — | MSCI/Sustainalytics | Mean portfolio-weighted ESG score across all assessed SWF investment portfolios. |
- **IFSWF fund profiles, SWF annual ESG reports, UNPRI reporting data** → Policy scoring, portfolio ESG aggregation, transparency assessment → **SWF ESG mandate scores, portfolio ESG dashboards, IFSWF benchmark comparisons**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sovereign-swf/ref/divestment-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'pathways', 'npv_methodology_note'], 'n_keys': 4}`

**GET /api/v1/sovereign-swf/ref/gpfg-exclusion-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'exclusion_criteria', 'sample_excluded_companies', 'process'], 'n_keys': 4}`

**GET /api/v1/sovereign-swf/ref/santiago-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'pillars', 'principles', 'scoring_methodology'], 'n_keys': 5}`

**GET /api/v1/sovereign-swf/ref/swf-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'profiles', 'climate_commitment_tiers'], 'n_keys': 4}`

**POST /api/v1/sovereign-swf/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sovereign-swf/divestment-pathway** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sovereign-swf/exclusion-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sovereign-swf/intergenerational-equity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** SWF ESG Mandate Score
**Headline formula:** `(Policy Strength × 0.35) + (Portfolio ESG × 0.35) + (Transparency × 0.30)`

Composite score assessing SWF ESG mandate strength across policy framework, portfolio integration and transparency disclosure.

**Standards:** ['IFSWF Santiago Principles', 'UNPRI SWF Assessment', 'TCFD SWF Guidance']
**Reference documents:** IFSWF Santiago Principles 2008 (updated 2022); UNPRI Sovereign Wealth Fund ESG Guidance; TCFD Guidance for Asset Owners 2020; OECD SWF Governance Principles

**Engine `sovereign_swf_engine` — extracted transformation lines:**
```python
pct = total_score / max_score
overall_pct = iwg_score_24 / 24.0
portfolio_temp = weighted_temp / max(total_weight, 1e-9)
sec_t = sum(p[0] * p[1] for p in pairs) / max(sec_w, 1e-9)
fossil_value_usd_bn = aum_usd_bn * fossil_fuel_exposure_pct / 100.0
divest_this_year_bn = fossil_value_usd_bn * pct / 100.0
net_proceeds_bn = divest_this_year_bn * (1.0 - price_discount)
discount_factor = 1.0 / (1.0 + 0.05) ** (i + 1)
remaining_bn = max(0.0, remaining_bn - divest_this_year_bn)
avoided_stranded_asset_loss_bn = fossil_value_usd_bn * 0.20
net_npv_impact_bn = avoided_stranded_asset_loss_bn - npv_loss_bn
green_bond_market_annual_issuance_bn = 600  # global green bond market ~$600bn/yr
absorption_capacity_pct = min(100.0, (cumulative_divested_bn / green_bond_market_annual_issuance_bn) * 100)
optimal_depletion_rate_pct = (rho + theta * g) * 100  # ~6%
fiscal_gap = max(0.0, annual_withdrawal_pct - gpfg_real_return_pct)
sustainability_score = max(0.0, 100.0 - fiscal_gap * 20.0 - resource_revenue_dependency * 0.5)
sdg17_contribution_usd_bn = aum_usd_bn * max(0.0, min(0.05, (sustainability_score / 100.0) * 0.05))
fiscal_cover_years = aum_usd_bn / max(aum_usd_bn * annual_withdrawal_pct / 100.0, 1e-9)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **48** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |
| `climate-underwriting-workbench` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — frontend/backend disconnect, not a missing model.** This module
> is unusual among the sovereign family: a genuinely well-built backend engine exists
> (`backend/services/sovereign_swf_engine.py`, 1,279 lines — real 24-principle GAPP/Santiago
> Principles scoring, a faithful Norwegian GPFG exclusion screen, a PACTA-style portfolio
> temperature calculator, and a Hartwick-Rule intergenerational-equity assessment, all built on 25
> real, named, hand-curated SWF profiles with plausible AUM/ESG figures). **The frontend page never
> calls it.** `SovereignSWFPage.jsx` contains no `axios`/`fetch` call anywhere in the file; instead it
> independently regenerates a **75-fund synthetic universe** with `sr()`-seeded scores for every
> metric the backend already computes properly (Santiago score, ESG score, climate score, fossil-fuel
> exposure, portfolio temperature). The `trace_labels` API routes recorded in this module's registry
> are real, working endpoints — they are simply unused by the page that is supposed to consume them.
> Sections 7.1–7.4 document what the frontend actually renders; §7.5 documents the real (but
> disconnected) backend methodology.

### 7.1 What the frontend computes

`SWFS` is a 75-entry array; the first 5 real-sounding fund names (`SWF_NAMES[0..4]` = GPFG, ADIA,
CIC, KIA, HKMA) get **hardcoded plausible AUM values** (1380/993/1240/750/580 $Bn), the next 5 get a
scaled random AUM, and the remaining 65 get a smaller random AUM. Every other metric — for **all 75
funds, including the 5 real-named ones** — is `sr()`-generated independent of the real data:

```
santiagoScore   = round(40 + sr(i×19+7)×60)     // 40–100 (backend's real score is 0–24)
esgScore        = round(30 + sr(i×23+11)×70)     // 30–100
climateScore    = round(25 + sr(i×29+13)×75)     // 25–100
fossilFuelExposure = 5 + sr(i×31+17)×45           // 5–50%
greenAllocation = 2 + sr(i×37+19)×28              // 2–30%
portfolioTemp   = 1.6 + sr(i×41+23)×2.4           // 1.6–4.0°C
transparencyScore = round(35+sr(i×43+29)×65); governanceScore = round(40+sr(i×47+31)×60)
netZeroTarget   = null | 2050 | 2040 | 2060 (categorical via sr() threshold)
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| AUM (first 5 funds) | Hardcoded real-ish values | Real (approximate published AUM) |
| AUM (remaining 70) | Synthetic | `sr()`-seeded |
| Santiago/ESG/climate/transparency/governance scores | Synthetic 0–100 scales | Not derived from GAPP principles or any documented rubric |
| `region`/`fundType` | Categorical, hand-mapped for first ~10 real funds, `sr()`-assigned for the rest | Mixed |
| GAPP Principles list (`GAPP_PRINCIPLES`, 25 rows) | Real 24-principle titles/descriptions | Reproduced in a seed table, not scored against the actual fund |

### 7.3 Calculation walkthrough (frontend)

1. **Fund generation** — 75 funds, `SWFS`, as above.
2. **Aggregates** — `totalAUM`, `avgESG`, `avgTemp` (all guarded with `filteredSWFs.length ? … : 0`),
   `aumByRegion`, `fundTypeData`, `esgByRegion`.
3. **Santiago principle detail (GAPP)** — for a *selected* fund, `gappData` scores each of the 25
   `GAPP_PRINCIPLES` as `round(selectedFundObj.santiagoScore × (0.7 + sr()×0.6))` — i.e. it fans the
   fund's **already-synthetic** headline Santiago score out into 25 pseudo-principle-level scores
   with ±30% noise, rather than genuinely evaluating each principle (contrast with the backend's
   `_score_principle`, which checks real fund attributes per criterion).
4. **NGFS/Paris alignment bucket** — `ngfsAlignment` buckets funds by `portfolioTemp` into
   `1.5°C / 2°C / 3°C / 4°C+` tiers using fixed thresholds `[0,1.75), [1.75,2.5), [2.5,3.5), [3.5,∞)`
   — thresholds are reasonable NGFS-style bucket boundaries, applied to synthetic data.
5. **What-if divestment slider** — `whatIfTemp` reduces the fleet-average `portfolioTemp` by
   `(divRateSlider/100)×0.8°C` — an assumed linear, uncalibrated sensitivity (0.8°C max reduction at
   100% divestment rate), not derived from the PACTA sector-temperature methodology the backend
   actually implements.
6. **Divestment/exclusion tabs** — `exclusionAdoption`, `commitByStatus`, `cumulativeDivest` — all
   further aggregates over the same 75-fund synthetic table.

### 7.4 Worked example — GPFG (Norway), frontend vs. backend for the same fund

| Metric | Frontend (`SWFS[0]`, synthetic) | Backend (`SWF_PROFILES["GPFG"]`, real/curated) |
|---|---|---|
| AUM | $1,380Bn (hardcoded, plausible) | $1,700Bn |
| Santiago/GAPP score | 75 *(on an ad-hoc 40–100 scale)* | 22 **/24** (≈91.7%) |
| Fossil fuel exposure | **10.7%** | **4.2%** |
| Green bond allocation | 14.7% | $28Bn ÷ $1,700Bn ≈ 1.6% |
| Portfolio implied temp | 2.12°C | 2.1°C |

`sanScore=round(40+sr(7)×60)=75`, `fossilFuel=round(5+sr(24)×45,1)=10.7`,
`portTemp=round(1.6+sr(30)×2.4,2)=2.12` (computed via `sr(s)=frac(sin(s+1)×10⁴)`). The portfolio
temperature happens to land close to the real GPFG figure by coincidence of the random draw; fossil
fuel exposure is off by more than 2× — demonstrating that even for the platform's flagship,
real-name-carrying fund, the frontend numbers are not sourced from the accurate backend profile.

### 7.5 The real (disconnected) backend methodology

`backend/services/sovereign_swf_engine.py` implements four genuine, well-specified functions that
the frontend does not call:

- **`assess_swf_esg`** — scores 24 real IWG-SWF Santiago/GAPP principles (3 pillars: Legal Framework
  GAPP 1-8, Institutional Governance GAPP 9-15, Investment Policies GAPP 16-24) via
  `_score_principle`, which checks each principle's specific compliance criteria against the fund's
  actual attributes (e.g. `coal_exclusion_applied` requires `fossil_fuel_exposure_pct<5.0`;
  `paris_alignment_tracked` requires `portfolio_temp_c<2.5`). Tiers: `leader ≥85%`, `advanced ≥65%`,
  `developing ≥40%`, else `laggard`.
- **`apply_gpfg_exclusion_screen`** — a faithful replica of Norway's NBIM exclusion criteria:
  coal revenue >30% → excluded; any tobacco revenue → excluded; cluster munitions/nuclear
  weapons outside NPT/anti-personnel mines → excluded; severe environmental/systematic human-rights
  controversies → excluded; coal revenue 10–30% or moderate controversies → observation list.
- **`calculate_portfolio_temperature`** — genuine PACTA/MSCI-proxy weighted-average temperature:
  `portfolio_temp = Σ(weight×company_temp) / Σweight` across equities and sovereign bonds, with a
  real 18-sector benchmark table (coal 4.5°C, oil&gas 3.8°C, renewables utilities 1.6°C, tech 1.7°C
  …) and Paris-alignment bucketing (`≤1.65°C` Paris-1.5, `≤2.0` below-2°C, `≤3.0` above-2-below-3,
  else above-3°C).
- **`assess_intergenerational_equity`** — real Hartwick Rule (1977) + Hotelling Rule (1931)
  economics: `hartwick_compliant = annual_withdrawal_pct ≤ 4.0%` (GPFG's actual fiscal rule);
  `optimal_depletion_rate = (ρ + θ×g)×100 = (0.03+1.5×0.02)×100 = 6.0%`; sustainability score
  `= max(0, 100 − fiscal_gap×20 − resource_dependency×0.5)`.

These are exactly the kind of formulas a §8 "Model Specification" section would normally have to
design from scratch for a purely-synthetic module — here they already exist in production Python and
simply need to be wired to the frontend via the 8 documented `trace_labels` routes.

### 7.6 Data provenance & limitations

- **Frontend:** all 75 funds' scores and 70/75 funds' AUM are `sr()`-synthetic; only 5 funds get a
  hardcoded, plausibly-real AUM figure and no other real attribute.
- **Backend:** 25 real, named SWF profiles with plausible AUM/ESG/climate figures (data appears
  hand-curated to public disclosures circa 2023/24, not live-refreshed — no source URL or vintage
  tag is recorded in the file).
- No code path joins the two — a genuine remediation item is wiring `SovereignSWFPage.jsx` to the
  8 existing `/api/v1/sovereign-swf/*` routes rather than building any new model.

**Framework alignment:** IFSWF Santiago Principles / GAPP (real 24-principle criteria genuinely
implemented in the backend, not surfaced in the UI) · Norwegian GPFG exclusion model (faithfully
replicated in the backend's `apply_gpfg_exclusion_screen`) · PACTA / MSCI portfolio-temperature
methodology (real sector-benchmark table in the backend) · Hartwick Rule (1977) / Hotelling Rule
(1931) intergenerational-equity economics (correctly formulated in the backend).

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own well-built engine and fix the failing endpoints (analytics ladder: rung 1 → 3)

**What.** This is the sovereign family's starkest frontend/backend disconnect: a genuinely excellent 1,279-line backend engine (`sovereign_swf_engine`, blast radius 48) implements real 24-principle GAPP/Santiago scoring, a faithful Norwegian GPFG exclusion screen, a PACTA-style portfolio-temperature calculator, and a Hartwick-Rule intergenerational-equity assessment over 25 real hand-curated SWF profiles — and **the frontend never calls it** (`SovereignSWFPage.jsx` has no fetch/axios anywhere), instead regenerating a 75-fund `sr()`-synthetic universe where even the 5 real-named funds (GPFG, ADIA, CIC) get fabricated Santiago/ESG/climate scores. On top of that, the lineage sweep records `POST /assess` and `/exclusion-screen` as **failed**. So the good model sits unused and partly broken while users see fabricated numbers. Evolution A is pure remediation: fix the endpoints, wire the page.

**How.** (1) Triage the failing `/assess` and `/exclusion-screen` routes (deployment-prep methodology). (2) Replace `buildData()`/the 75-fund synthetic array with calls to the 8 real `/api/v1/sovereign-swf/*` routes — the page's Santiago, ESG, climate, fossil-exposure, and portfolio-temperature displays all come from the engine that already computes them properly. (3) Surface the backend's unique assets the UI currently hides: the GPFG exclusion screen, the divestment-pathway calculator, and the Hartwick intergenerational-equity view. (4) Add source vintages to the 25 hand-curated SWF profiles (currently untagged).

**Prerequisites.** The `/assess` and `/exclusion-screen` failures are the gate; because blast radius is 48, engine-touching fixes need the shared-engine regression check. **Acceptance:** the page's SWF scores come from `/assess`, not `sr()`; GPFG's exclusion screen and portfolio temperature render from the engine; both failing routes pass the sweep.

### 9.2 Evolution B — SWF ESG-mandate analyst (LLM tier 2)

**What.** A tool-calling analyst over the (repaired) engine: "score this fund against the Santiago Principles", "run the GPFG exclusion screen on this holding", "assess intergenerational equity under the Hartwick Rule", "what's this SWF's portfolio temperature?" — each a call to a real endpoint, narrating the 24-principle GAPP breakdown, the exclusion verdict, or the PACTA-style temperature, never inventing scores.

**How.** Tool schemas from the module's OpenAPI operations (the POST assess/exclusion/intergenerational/divestment routes plus the GET reference endpoints for GPFG criteria and Santiago principles); grounding corpus = this Atlas record plus the reference payloads. The exclusion-screen narrative cites the specific GPFG criterion triggered; the no-fabrication validator checks every score against tool output.

**Prerequisites (hard).** Evolution A — the compute endpoints currently fail and the page shows synthetic scores, so there is no consistent, working surface to narrate. **Acceptance:** every Santiago/ESG/temperature figure traces to an engine call; exclusion verdicts cite the GPFG criterion; a fund outside the 25 profiles returns "not covered," not a fabricated score.