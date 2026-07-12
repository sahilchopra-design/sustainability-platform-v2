# Climate Insurance Analytics
**Module ID:** `climate-insurance` · **Route:** `/climate-insurance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses climate insurance product design, actuarial pricing under physical risk scenarios, and quantifies the protection gap between economic and insured losses.

> **Business value:** Equips insurers, reinsurers, and supervisors with actuarially grounded climate pricing tools and protection gap diagnostics to support product innovation and market development.

**How an analyst works this module:**
- Load physical hazard exposure data by peril (flood, windstorm, wildfire, drought)
- Apply climate scenario multipliers (RCP 2.6 / 4.5 / 8.5) to loss distributions
- Calculate pure risk premium and loading factors by product line
- Quantify protection gap by region and peril; identify underinsured segments

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `Badge`, `CAT_EVENTS`, `COLORS`, `ClimateInsurancePage`, `Grid`, `INSURERS`, `INSURER_NAMES`, `KpiCard`, `LITIGATION_CASES`, `PERILS`, `PORTFOLIOS`, `REGULATORY`, `SCENARIOS`, `Section`, `TABS`, `Tbl`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PERILS` | 13 | `avgAnnualLoss_mn`, `trend_pct`, `modelConfidence`, `reinsurance_coverage_pct`, `return_period_100yr` |
| `SCENARIOS` | 7 | `claimsImpact_pct`, `investmentImpact_pct`, `capitalImpact_pct` |
| `REGULATORY` | 13 | `area`, `description`, `status` |
| `CAT_EVENTS` | 21 | `year`, `country`, `peril`, `insured_loss_bn`, `economic_loss_bn`, `fatalities`, `climate_attribution_pct` |
| `LITIGATION_CASES` | 21 | `year`, `jurisdiction`, `type`, `status`, `exposure_mn`, `insurer_relevance` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INSURERS` | `INSURER_NAMES.map(([name,type,country],i) => ({` |
| `PORTFOLIOS` | `INSURERS.map((ins,i) => {` |
| `raw` | `ASSET_CLASSES.map((_,j) => 5 + sr(i*100+j*13)*40);` |
| `tot` | `raw.reduce((a,b)=>a+b,0);` |
| `countries` | `useMemo(() => [...new Set(INSURERS.map(x=>x.country))].sort(), []);` |
| `types` | `useMemo(() => [...new Set(INSURERS.map(x=>x.type))].sort(), []);` |
| `totalGwp` | `filteredInsurers.reduce((a,b) => a+b.gwp_usd_mn, 0);` |
| `avgSolvency` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+b.solvencyRatio_pct,0)/filteredInsurers.length).toFixed(0) : '0';` |
| `avgClimateExp` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.climateExposure_pct),0)/filteredInsurers.length).toFixed(1) : '0.0';` |
| `avgPhysical` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.physicalRisk),0)/filteredInsurers.length).toFixed(1) : '0.0';` |
| `avgTransition` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.transitionRisk),0)/filteredInsurers.length).toFixed(1) : '0.0';` |
| `tcfdFull` | `filteredInsurers.length ? (filteredInsurers.filter(x=>x.tcfdStatus==='Full').length / filteredInsurers.length * 100).toFixed(0) : '0';` |
| `scenarioData` | `useMemo(() => SCENARIOS.find(s=>s.name===selScenario) \|\| SCENARIOS[0], [selScenario]);  /* ── Controls bar ── */ const Controls = () => (` |
| `typeDistribution` | `types.map(t => ({` |
| `top10` | `[...filteredInsurers].sort((a,b)=>b.gwp_usd_mn-a.gwp_usd_mn).slice(0,10);` |
| `claimsFreq` | `filteredPerils.map((p,i) => ({` |
| `rpCurve` | `[10,25,50,100,200,250,500,1000].map(rp => {` |
| `totalLoss` | `filteredPerils.reduce((a,p) => {` |
| `scale` | `Math.log10(rp)/Math.log10(100);` |
| `byAC` | `ASSET_CLASSES.map(ac => {` |
| `fossilPct` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a + parseFloat(b.transitionRisk)*0.3, 0) / filteredInsurers.length).toFixed(1) : '0.0';` |
| `greenBondPct` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a + parseFloat(b.esgScore)*0.15, 0) / filteredInsurers.length).toFixed(1) : '0.0';` |
| `strandedPct` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a + parseFloat(b.transitionRisk)*0.2, 0) / filteredInsurers.length).toFixed(1) : '0.0';` |
| `scenarioImpact` | `SCENARIOS.map(s => ({` |
| `getAlloc` | `ac => { const r = pRows.find(p=>p.assetClass===ac); return r ? r.allocation_pct+'%' : '-'; };` |
| `trajectory` | `[2022,2023,2024,2025,2026,2027,2028,2030].map((yr,i) => ({` |
| `solvencyDist` | `filteredInsurers.map(x => ({` |
| `capitalBuffer` | `filteredInsurers.map(x => {` |
| `baseScr` | `x.assets_usd_bn * 0.08;` |
| `climateAdj` | `baseScr * (1 + Math.abs(scenarioData.capitalImpact_pct)/100);` |
| `carbonImpact` | `[25,50,75,100,150,200,250].map(cp => ({` |
| `ngfsCapital` | `SCENARIOS.map(s => ({` |
| `stressed` | `Math.max(100, Math.round(x.solvencyRatio_pct * (1 - Math.abs(scenarioData.capitalImpact_pct)/100) - carbonPrice*0.015));` |
| `sortedEvents` | `[...CAT_EVENTS].sort((a,b) => b.insured_loss_bn - a.insured_loss_bn);` |
| `lossTrend` | `[2005,2010,2015,2017,2018,2019,2020,2021,2022,2023].map(yr => {` |
| `perilBreakdown` | `[...new Set(CAT_EVENTS.map(e=>e.peril))].map(p => {` |
| `avgAttribution` | `CAT_EVENTS.length ? (CAT_EVENTS.reduce((a,b)=>a+b.climate_attribution_pct,0)/CAT_EVENTS.length).toFixed(0) : 0;` |
| `freqSev` | `CAT_EVENTS.map(e => ({` |
| `pmlCurve` | `[10,25,50,100,200,250,500].map(rp => ({` |
| `complianceByInsurer` | `filteredInsurers.map(x => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `climate_insurance_engine` (services/climate_insurance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateInsuranceEngine.assess_iais_compliance` | portfolio_input | 4-pillar IAIS supervisory assessment: governance, strategy, risk management, disclosure. Uses provided scores or defaults to partial (0.5) for each item. Thresholds: amber 60%, red 40%. |
| `ClimateInsuranceEngine.design_parametric_product` | p | Design a parametric insurance product. Calculates AAL, premium, payout structure, trigger/exit levels, and basis risk score. |
| `ClimateInsuranceEngine.model_natcat_loss` | n | NatCat loss modelling for a single country/peril combination. Returns AAL, PML at 100yr and 250yr, climate-adjusted losses under RCP scenario, and premium loading recommendation. |
| `ClimateInsuranceEngine.calculate_climate_var` | portfolio_input | Calculate climate VaR across three risk channels: 1. Physical risk (P&C NatCat) 2. Transition risk (investment portfolio) 3. Life/health risk (mortality, morbidity) |
| `ClimateInsuranceEngine.orsa_climate_stress` | portfolio_input | Solvency II Art 45a ORSA climate stress test across 4 NGFS scenarios. Returns SCR uplift, post-stress solvency ratio, and 12-item ORSA checklist. |
| `ClimateInsuranceEngine.assess_casualty_liability` | portfolio_input | Assess casualty climate liability risk: D&O (greenwashing), E&O, Pollution. Returns liability reserve estimates and exposure trend per line. |
| `ClimateInsuranceEngine.analyse_protection_gap` | country_code, peril | Analyse the insurance protection gap for a country/peril combination. Returns current gap, economic/insured loss split, and climate projection to 2030/2040. |
| `ClimateInsuranceEngine.full_assessment` | portfolio_input | Run all E79 sub-modules and return a consolidated ClimateInsuranceResult. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `CAT_EVENTS`, `COLORS`, `INSURER_NAMES`, `LITIGATION_CASES`, `PERILS`, `REGULATORY`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Protection Gap | — | Swiss Re Sigma 2024 | Annual uninsured natural catastrophe losses globally, representing underinsurance relative to economic damage. |
| Climate Loss Multiplier (2050) | — | IPCC AR6 WG2 | Projected increase in insured losses by 2050 relative to 2020 baseline under RCP 4.5–8.5. |
- **NatCat loss databases, policy exposure data, reinsurance treaty terms** → Hazard intensity mapping, frequency-severity modelling, climate loading → **Protection gap metrics, re/insurance pricing outputs, product design recommendations**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-insurance/ref/iais-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'total_items', 'total_pillars', 'reference', 'scoring_guide', 'supervisory_thresholds'], 'n_keys': 6}`

**GET /api/v1/climate-insurance/ref/natcat-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries', 'total_countries', 'perils', 'sources', 'climate_loading_note'], 'n_keys': 5}`

**GET /api/v1/climate-insurance/ref/parametric-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['trigger_types', 'total_types', 'reference_frameworks', 'basis_risk_guidance'], 'n_keys': 4}`

**GET /api/v1/climate-insurance/ref/protection-gap** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['protection_gap_data', 'source', 'supplementary_sources', 'note'], 'n_keys': 4}`

**POST /api/v1/climate-insurance/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['insurer_name', 'reporting_year', 'overall_climate_risk_score', 'supervisory_flags', 'iais_compliance', 'parametric_design', 'natcat_loss', 'climate_var', 'orsa_stress', 'casualty_liability', 'protection_gap'], 'n_keys': 11}`

**POST /api/v1/climate-insurance/casualty-liability** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-insurance/climate-var** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-insurance/iais-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Protection Gap Ratio
**Headline formula:** `PGR = 1 – (Insured Loss / Economic Loss)`

Divides total insured catastrophe losses by total economic losses to derive uninsured fraction.

**Standards:** ['Swiss Re Sigma', 'Munich Re NatCatSERVICE']
**Reference documents:** Swiss Re Sigma No. 1/2024; Munich Re NatCatSERVICE Annual Report; IAIS Application Paper on Climate Risk 2021; IPCC AR6 Chapter 16 Key Risks

**Engine `climate_insurance_engine` — extracted transformation lines:**
```python
pillar_avg = sum(item_scores) / len(item_scores) if item_scores else 0.0
overall_pct = overall * 100.0
aal_usd_m = p.exposure_value_usd_m * aal_pct
climate_adj = 1.0 + (rcp85_loading_pct / 100.0) * (years_to_horizon / 26.0)
climate_adj_aal = aal_usd_m * climate_adj
gross_premium = pure_premium * (1 + p.premium_loading_pct / 100.0)
max_payout = p.max_payout_usd_m or p.exposure_value_usd_m * 0.80
basis_risk = (float(parts[0]) + float(parts[1])) / 2
years_factor = max(0, n.horizon_year - 2024) / 26.0  # linear to 2050
climate_loading = 1.0 + loading_rcp85 * rcp_mult * years_factor
aal = n.insured_exposure_usd_m * aal_pct
aal_climate = aal * climate_loading
pml_100 = n.insured_exposure_usd_m * pml_100_pct
pml_100_climate = pml_100 * climate_loading
pml_250 = n.insured_exposure_usd_m * pml_250_pct
pml_250_climate = pml_250 * climate_loading
premium_loading_add_pct = round((climate_loading - 1.0) * 100, 1)
pc = portfolio_input.pc_exposure_usd_m or total * 0.60
life = portfolio_input.life_exposure_usd_m or total * 0.25
inv = portfolio_input.investment_portfolio_usd_m or total * 0.50
high_carbon_pct = (portfolio_input.high_carbon_investment_pct or 15) / 100.0
pml_100yr_ratio = portfolio_input.portfolio_pml_100yr_pct / 100.0
pml_100yr_ratio = (sum(_all_pml) / len(_all_pml) / 100.0) if _all_pml else 0.012
physical_var = pc * pml_100yr_ratio * natcat_uplift   # 1-in-100yr PML × climate loading
physical_var_pct = physical_var / total * 100
transition_var = inv * (
transition_var_pct = transition_var / total * 100
liability_var_pct = liability_var / total * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).

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

> **Frontend↔backend disconnect note.** This is a tier-A module with a genuine backend engine
> (`backend/services/climate_insurance_engine.py`, E79) exposing 8 endpoints under
> `/api/v1/climate-insurance/*` — but the page (`ClimateInsurancePage.jsx`) imports no HTTP client
> and never calls them. Everything rendered in the 10 tabs is computed client-side from seeded and
> hand-coded data. The guide's methodology (Protection Gap Ratio, RCP loss multipliers, pure-risk
> premium) **is implemented** — the PGR on the Cat Modelling tab and the full RCP/premium machinery
> in the engine — so no guide↔code mismatch flag is raised; the gap is wiring, not methodology.

### 7.1 What the module computes

**Frontend (10 tabs, 30 insurers × 6 asset classes × 12 perils × 6 NGFS scenarios):**

```
PGR            = (1 − Σ insured_loss_bn / max(Σ economic_loss_bn, 1)) × 100      // Cat Modelling KPI
scr_stressed   = max(100, solvencyRatio × (1 − capitalImpact_pct/100))           // Solvency tab
baseScr        = assets_usd_bn × 0.08
climateScr     = baseScr × (1 + |capitalImpact_pct|/100)
buffer         = assets_usd_bn × solvencyRatio/100 − climateScr
ORSA stressed  = max(100, round(solvencyRatio × (1 − |capitalImpact_pct|/100) − carbonPrice × 0.015))
PML(rp)        = return_period_100yr × log10(rp)/log10(100) × (0.9 + sr(...)×0.2)
premium(rp)    = AAL × log10(rp)/log10(100) × 0.015 × (1 + sr(rp×7)×0.3)
```

**Backend engine (E79) — the production-shaped logic:**

```
IAIS overall     = Σ_pillar avg(item scores 0/0.5/1) × weight_pillar            // ×100 → %
Parametric prem  = AAL × climate_adj × (1 + loading%);  climate_adj = 1 + rcp85_loading × (yrs/26)
NatCat           = exposure × aal_pct;  climate_loading = 1 + loading_rcp85 × rcp_mult × (horizon−2024)/26
Climate VaR      = physical (PC × PML₁₀₀ ratio × natcat_uplift) + transition + liability + life
                   − 15% diversification benefit
ORSA SCR uplift  = total×0.10×natcat_uplift + inv×|equity_shock|×0.40 + total×0.05×liab_uplift
Post-stress SR   = 185% × SCR_base / (SCR_base + uplift)
```

### 7.2 Parameterisation

| Frontend NGFS scenario | claimsImpact % | investmentImpact % | capitalImpact % |
|---|---|---|---|
| Orderly | +8 | −3 | −5 |
| Disorderly | +15 | −12 | −18 |
| Hot House | +35 | −8 | −25 |
| Net Zero 2050 | +5 | +2 | −2 |
| Delayed Transition | +20 | −18 | −22 |
| Current Policies | +30 | −6 | −20 |

Ordering follows NGFS logic (hot-house worst for claims; disorderly worst for investments), but the
values are synthetic demo constants, not published NGFS output. Backend equivalents
(`NGFS_SCENARIOS`): equity shock −10…−30%, bond spread +40…180 bps (duration 5 applied), real-estate
−8…−20%, NatCat uplift +12…35%, liability reserve uplift +5…20%.

| Backend constant | Value | Provenance |
|---|---|---|
| IAIS pillar weights | Gov 0.25 / Strategy 0.25 / Risk Mgmt 0.30 / Disclosure 0.20 | Engine-authored, mapped to ICP 7/8/9/16/20 |
| IAIS RAG thresholds | green ≥80%, amber ≥60%, red <40% | Engine convention |
| RCP multipliers | rcp26 0.30 · rcp45 0.55 · rcp85 1.00 | Scales the country RCP8.5-2050 loading |
| Country AAL / PML₁₀₀ / PML₂₅₀ | 20-country table, e.g. India flood AAL 0.40%, PML₁₀₀ 2.0% | "Swiss Re sigma NatCat 2023 + EIOPA profiles" (per docstring; hand-coded) |
| Protection gap (global 2022) | $275bn economic / $125bn insured → 54.5% | Swiss Re sigma No 1/2023 (cited in-code) |
| Parametric premium loading | 35% | "standard loading for expenses + profit" |
| SCR baseline / solvency baseline | 15% of exposure / 185% | Engine assumptions |
| Casualty: D&O exposure, reserve, loading | 8% of P&C × 3% × 1.20; growth 25%/yr | Lloyd's 2022 report cited; values heuristic |

### 7.3 Calculation walkthrough

Frontend: `INSURERS` (17 Indian + 13 global names) get all risk primitives from
`sr(i×7+k)`-seeded draws (GWP $0.5–30bn, solvency 140–300%, physical 10–70, transition 5–60).
Filters (insurer/type/country) recompute KPI means with division guards; the scenario select swaps
one of six impact rows into every stressed-SCR/buffer formula; the carbon-price slider feeds pure
scaling heuristics (`carbonPrice×0.032` SCR uplift, `×0.018` solvency pts, `×0.045` $B loss).
Backend: `full_assessment()` chains IAIS → climate VaR → ORSA → casualty → NatCat (largest country/
peril exposure) → parametric design → protection gap, then blends an overall score
`0.35×IAIS + 0.35×max(0, 1 − VaR%/20) + 0.30×ORSA-checklist`.

### 7.4 Worked example (backend NatCat: India flood, $1,000M insured, RCP4.5, 2040)

| Step | Computation | Result |
|---|---|---|
| Base AAL | 1,000 × 0.40% | **$4.00M** |
| Years factor | (2040 − 2024) / 26 | 0.6154 |
| Climate loading | 1 + 0.35 × 0.55 × 0.6154 | **1.118** |
| Climate-adjusted AAL | 4.00 × 1.118 | **$4.47M** |
| PML 1-in-100 (base → adj) | 1,000 × 2.0% → × 1.118 | $20.0M → **$22.37M** |
| Premium loading recommendation | (1.118 − 1) × 100 | **+11.8%** |

Frontend cross-check (Cat Modelling KPI, deterministic hand-coded events): Σ insured = $397.4B,
Σ economic = $1,097.7B → protection gap = (1 − 397.4/1097.7) × 100 = **64%** — consistent with
Swiss Re sigma's reported 54–62% multi-year global gap range.

### 7.5 Climate VaR channel decomposition (engine)

`physical = PC × PML₁₀₀-ratio × (1 + natcat_uplift)` — the code comments explicitly note the prior
AAL×10 heuristic was replaced so the 99th-percentile figure is grounded in the loss-exceedance
curve. `transition = inv × (hc×equity×0.5 + hc×spread·dur×0.3 + 0.10×re×0.2)`;
`liability = PC × 0.002 × (1 + uplift/200)`; `life = life_exposure × 0.0015 (hot-house) or 0.0008`.
Aggregation subtracts a flat 15% diversification benefit.

### 7.6 Companion analytics on the page

Reinsurance & ILS tab (seeded cat-bond market series 2018–24, hand-coded 8-bond table with real
sponsor names, spreads 320–580 bps); Realistic Disaster Scenarios table (8 RDS with gross/net/
recovery splits, Lloyd's-RDS style); IAIS & Regulatory tab (12 hand-coded framework rows with
`sr`-seeded compliance %); Climate Litigation tab (20 hand-coded real cases — Milieudefensie v
Shell, KlimaSeniorinnen, Held v Montana — with exposure $M and insurer-relevance tags).

### 7.7 Data provenance & limitations

- **All 30 insurer profiles, portfolios and trend series are synthetic**, generated by the platform
  PRNG `sr(seed) = frac(sin(seed+1)×10⁴)` — deterministic across renders, not real company data.
  Insurer names are real; their numbers are not.
- PERILS, CAT_EVENTS and LITIGATION_CASES are hand-coded but broadly faithful to public records
  (Katrina $82B insured, Ian $60B, European floods 2021 $13B; attribution % values are plausible
  but not sourced to specific WWA studies).
- What-if outputs (carbon price → SCR/premium/stranded) are single-coefficient heuristics with no
  model behind them; the return-period curves use a log₁₀ interpolation, not a fitted EP curve.
- The backend engine is deterministic and reference-anchored but uses fixed baselines (SCR 15%,
  solvency 185%) rather than reported figures, and the page never consumes it.

**Framework alignment:** IAIS Application Paper on climate risk supervision (2021) — the engine
scores 20 items full/partial/absent (1/0.5/0) across the four ICP-mapped pillars and weights them,
mirroring how IAIS members structure supervisory self-assessments · Solvency II Art 45a — ORSA
climate stress produces post-stress SCR coverage with 100%/150% breach tests, the actual Pillar-2
mechanic · NGFS scenarios (both layers, parameterised not simulated) · TCFD — four-pillar
disclosure status feeds the compliance score · PCAF Part B insurance-associated emissions and
Swiss Re sigma protection-gap data are cited as anchors in the engine's reference tables.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace the page's heuristic stress numbers with a climate-conditioned
NatCat pricing and solvency model supporting (i) technical premium adequacy by peril/geography and
(ii) ORSA-grade post-stress solvency for a multi-insurer book. Coverage: P&C and reinsurance
portfolios with location-level or country-level exposure.

**8.2 Conceptual approach.** Event-set frequency–severity simulation with climate-conditioned
hazard frequencies, in the style of **Moody's RMS Climate Change Models** and **Verisk (AIR)
climate-conditioned catalogs**, feeding the **Solvency II standard-formula NatCat sub-module**
(SCR_cat) and an NGFS-conditioned market-risk shock per **EIOPA 2022 climate stress-test**
parameters. Premium adequacy follows Swiss Re sigma / actuarial pure-premium practice.

**8.3 Mathematical specification.**

```
N_p(t)  ~ Poisson(λ_p × m_p(s, t))                      // events of peril p, scenario s
X_p     ~ LogNormal(μ_p, σ_p)  truncated at exposure    // severity per event
L       = Σ_p Σ_{i≤N_p} min(X_p,i × V_p, PML cap)       // annual portfolio loss
AAL     = E[L];   PML_rp = quantile(L, 1 − 1/rp)
PurePrem= AAL_climate;  GrossPrem = PurePrem × (1 + expense + capital charge + profit)
SCR_cat = PML_200 − AAL   (1-in-200 VaR net of expected, per Solvency II calibration)
SR_post = OwnFunds − ΔMV(NGFS s) − ΔReserves(s) ) / (SCR_base + ΔSCR_cat(s))
```

| Parameter | Description | Calibration source |
|---|---|---|
| λ_p | Baseline annual event frequency by peril | EM-DAT 1980–2023; Swiss Re sigma catalogues |
| m_p(s,t) | Climate frequency multiplier | IPCC AR6 WG1 Ch.11 scaling; NGFS Phase IV acute-risk add-ons |
| μ_p, σ_p | Severity distribution | Fitted to Swiss Re sigma insured-loss history, CPI/exposure-trended |
| Equity/spread/RE shocks | Transition market shocks | EIOPA 2022 climate stress parameters; NGFS Phase IV (NiGEM outputs) |
| Duration, hc share | Bond repricing inputs | Portfolio data; EIOPA QRT S.06.02 asset templates |
| Expense/profit loading | Premium loadings | Historical combined-ratio decomposition (company SFCRs) |

**8.4 Data requirements.** Exposure by country×peril (exists: engine `country_exposures` /
`peril_exposures` inputs); insured/economic loss history (partially exists: `PROTECTION_GAP_DATA`,
platform EM-DAT seeds); asset allocation and duration (page `PORTFOLIOS` schema, needs real data —
vendor: EIOPA QRTs, S&P Capital IQ; free: SFCR filings); NGFS Phase IV scenario variables (free,
already used elsewhere in the platform's reference-data layer).

**8.5 Validation & benchmarking.** Backtest modelled AAL/PML against 10 years of sigma insured
losses per region (target: modelled AAL within ±25% of trended empirical mean); reconcile SCR_cat
against the Solvency II standard-formula factor grid and against published EIOPA 2022 stress
results for matched portfolios; sensitivity: ±20% on λ climate multipliers must move PML₂₀₀
sub-linearly (concavity check); stability: seed-invariance of Monte Carlo at 100k years (<1% s.e.).

**8.6 Limitations & model risk.** Poisson–lognormal ignores clustering (serial hurricanes) —
mitigate with negative-binomial frequency as conservative fallback; climate multipliers are
scenario-conditional trends applied to a stationary catalogue, not dynamical downscaling; market
and NatCat shocks are combined without estimated dependence (assume perfect correlation as the
conservative bound); litigation/casualty channel remains expert-judgement scaled and should be
capped at reserve-adequacy materiality until a liability model (see litigation modules) exists.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the 10 tabs to the E79 engine (analytics ladder: rung 2 → 3)

**What.** §7's verdict is that this tier-A module's gap is wiring, not methodology:
the backend engine (E79) genuinely implements the guide — climate-loaded AAL
(`climate_adj = 1 + rcp85_loading×(years/26)`), PML-100/250 with climate loading,
gross premium build-up, IAIS pillar scoring, parametric basis-risk guidance — behind
8 endpoints with 4 passing ref GETs, while the page imports no HTTP client and
recomputes everything client-side from seeded data (30 insurers, hand-coded perils).
Evolution A connects them: the Cat Modelling, Solvency, and pricing tabs become
clients of the engine's endpoints, the frontend's duplicate formulas are deleted
(two implementations of one methodology is a drift bug waiting to happen), and the
peril/NatCat inputs come from the engine's `ref/natcat-profiles` payload —
which already carries real country profiles and sources.

**How.** (1) Fetch layer + response binding per tab; the client-side PGR/SCR math
retired in favour of engine responses, with a regression pin proving parity first.
(2) Lineage fixtures so the four POST paths move to `passed`. (3) One genuine
deepening: the engine's protection-gap ref data joined with the platform's OpenFEMA/
IBTrACS ingested history so the PGR trend is observable per peril-region, not a
static ratio.

**Prerequisites.** REQUIRE_AUTH posture for POSTs; the 30 seeded insurers relabelled
as fixtures (real insurer names with seeded solvency ratios is the
fabrication-on-real-names pattern). **Acceptance:** every premium/AAL/PML figure on
the page matches an engine response; deleting the frontend formula duplicates changes
nothing rendered (parity proven); lineage shows POSTs passed.

### 9.2 Evolution B — Underwriting and supervision analyst (LLM tier 2)

**What.** With 8 real endpoints, this module is tier-2-ready at the API level today:
an assistant that prices coverage conversationally ("pure premium for $500M coastal
exposure, RCP8.5, 2040 horizon, 20% loading"), explains the climate loading's linear
horizon mechanics (the `/26.0` to-2050 factor from §5's extracted lines), runs IAIS
pillar assessments, and answers protection-gap questions from the ref data — every
number a tool response, mirroring the physical-risk-pricing exemplar module's copilot
pattern one domain over.

**How.** Tool schemas from the module's OpenAPI routes; per-module system prompt from
this atlas page (§5 formulas + §7 engine description); the no-fabrication validator
on all premiums, AALs, and solvency figures; basis-risk explanations for parametric
products grounded in the `ref/parametric-triggers` taxonomy.

**Prerequisites.** Evolution A's wiring so the copilot and the page describe the same
numbers (pre-wiring, the page shows client-side values the engine never produced —
exactly the narration hazard the exemplar flags). **Acceptance:** a quoted premium
reproduces via direct endpoint call; the copilot refuses casualty/life pricing
outside the engine's P&C scope.