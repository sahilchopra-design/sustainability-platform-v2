# Geothermal Project Finance
**Module ID:** `geothermal-project-finance` · **Route:** `/geothermal-project-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DV2 · **Sprint:** DV

## 1 · Overview
Project finance structuring for geothermal developments covering exploration-development-production CAPEX phases, well productivity uncertainty, resource risk insurance, IFC GGSP concessional support and country IRR benchmarks.

> **Business value:** Geothermal project finance requires phased capital structures separating exploration risk (GGSP grants) from development debt; 30–50% drilling contingency and P10/P50/P90 productivity scenarios drive lender sizing and IRR outcomes.

**How an analyst works this module:**
- Phase project into exploration (risk capital), development (project finance) and production (refinancing)
- Model P10/P50/P90 well productivity scenarios for capacity sizing
- Assess IFC GGSP, World Bank ESMAP and KfW concessional finance availability
- Structure drilling cost contingency reserve and resource risk insurance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FINANCING_STRUCTURES`, `KpiCard`, `RISK_CATEGORIES`, `Slider`, `TABS`, `WELL_RISK_FACTORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `WELL_RISK_FACTORS` | 6 | `weight`, `base`, `desc` |
| `RISK_CATEGORIES` | 7 | `prob`, `impact`, `color` |
| `FINANCING_STRUCTURES` | 5 | `debtPct`, `debtRate`, `tenor`, `minDscr`, `moody`, `typical` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `revenueMyr` | `annMwh * ppa / 1e6;` |
| `debtM` | `capexM * debtPct / 100;` |
| `equityM` | `capexM - debtM;` |
| `annDebtService` | `debtM * 1e6 * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor)) / 1e6;` |
| `ebitda` | `revenueMyr - opexMyr;` |
| `equityCashflows` | `useMemo(() => { const arr = [-equityM];` |
| `equityIrr` | `useMemo(() => irr(equityCashflows), [equityCashflows]); const projectNpv = useMemo(() => npv([-capexM, ...Array(30).fill(ebitda)], wacc), [capexM, ebitda, wacc]);` |
| `successProb` | `useMemo(() => { const composite = WELL_RISK_FACTORS.reduce((s, f) => s + f.base * f.weight, 0) / 100;` |
| `mcPaths` | `useMemo(() => { return Array.from({ length: 200 }, (_, i) => { const capexVar  = capexM * (0.85 + sr(i * 3) * 0.3);` |
| `revenueVar` | `revenueMyr * (0.8 + sr(i * 7) * 0.4);` |
| `opexVar` | `opexMyr * (0.9 + sr(i * 11) * 0.2);` |
| `debtVar` | `capexVar * debtPct / 100;` |
| `equityVar` | `capexVar - debtVar;` |
| `dsVar` | `debtVar * 1e6 * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor)) / 1e6;` |
| `cf2` | `[-equityVar, ...Array(30).fill(Math.max(0, revenueVar - opexVar - dsVar))];` |
| `sorted` | `[...mcPaths].sort((a, b) => a - b);` |
| `mcHistogram` | `useMemo(() => { const bins = Array.from({ length: 20 }, (_, i) => ({ irr: -10 + i * 3, count: 0 }));` |
| `idx` | `Math.min(19, Math.max(0, Math.floor((r + 10) / 3)));` |
| `dsWaterfall` | `useMemo(() => Array.from({ length: Math.min(tenor, 20) }, (_, y) => ({` |
| `adj` | `+(f.base * (wellSucc / 75)).toFixed(3);` |
| `contrib` | `+(adj * f.weight / 100 * 100).toFixed(1);` |
| `expectedDryCost` | `capexM * 0.55 * (1 - p / 100) * 0.4;` |
| `adjDebt` | `capexM * s.debtPct / 100;` |
| `adjEquity` | `capexM - adjDebt;` |
| `adjDS` | `adjDebt * 1e6 * (s.debtRate / 100) / (1 - Math.pow(1 + s.debtRate / 100, -s.tenor)) / 1e6;` |
| `adjCfs` | `[-adjEquity, ...Array(30).fill(Math.max(0, revenueMyr - opexMyr - adjDS))];` |
| `adjIrr` | `irr(adjCfs) * 100;` |
| `rev` | `revenueMyr * (0.7 + i * 0.06);` |
| `cfs` | `[-equityM, ...Array(30).fill(Math.max(0, rev - opexMyr - annDebtService))];` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FINANCING_STRUCTURES`, `RISK_CATEGORIES`, `TABS`, `WELL_RISK_FACTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Drilling Cost Contingency | `Contingency = Base Drilling Cost × Contingency Factor` | World Bank ESMAP 2012 | Reflects geological uncertainty; EGS and frontier areas require higher contingency than proven hydrothermal fields. |
| Well Productivity P10/P50/P90 | `Productivity Distribution = Resource Assessment Monte Carlo` | GeothermEx / GNS Science | P-value spread drives project capacity uncertainty and lender sizing of debt. |
| IFC GGSP Grant Size | `GGSP Grant = Well Cost × Coverage Ratio` | IFC Global Geothermal Support Program | Concessional risk-sharing for exploration wells reducing private sector exposure. |
- **ESMAP geothermal benchmarks + IFC GGSP terms** → Phase-gate CAPEX model → IRR sensitivity → **Geothermal project finance term sheet dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_twh', 'plant_co2_intensity_gco2_kwh', 'annual_emissions_tco2', 'annual_avoided_e`

## 5 · Intermediate Transformation Logic
**Methodology:** Geothermal IRR Model
**Headline formula:** `Project IRR = f(Resource Risk, Drilling CAPEX, PPA Price, CF, Concessional Debt Share)`

Risk-adjusted IRR framework separating exploration, development and production phases.

**Standards:** ['World Bank ESMAP — Geothermal Handbook 2012', 'IFC — Scaling Geothermal 2013']
**Reference documents:** World Bank ESMAP — Geothermal Handbook: Planning and Finance (2012); IFC — Scaling Geothermal Energy in Developing Countries (2013); KfW Development Bank — Geothermal Finance Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-lcoe-economics` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-market-intelligence` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-market-intelligence` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |

## 7 · Methodology Deep Dive

Geothermal Project Finance (EP-DV2) structures a phased debt/equity project-finance model: debt
sizing, DSCR, equity IRR, a well-success probability composite, a 200-path Monte-Carlo IRR
distribution, and a dry-well contingency. The financial engineering is genuine; the Monte-Carlo
input variability uses the `sr()` PRNG. No guide↔code mismatch.

### 7.1 What the module computes

```js
annMwh         = powerMw * cf/100 * 8760;
revenueMyr     = annMwh * ppa / 1e6;
debtM          = capexM * debtPct/100;   equityM = capexM - debtM;
annDebtService = debtM*1e6*(debtRate/100)/(1 - (1+debtRate/100)^-tenor) / 1e6;  // level annuity
ebitda         = revenueMyr - opexMyr;
equityCashflows= [-equityM, ...30×(revenueMyr - opexMyr - annDebtService)];
equityIrr      = irr(equityCashflows);          // Newton-Raphson
projectNpv     = npv([-capexM, ...30×ebitda], wacc);
```

**Well-success probability** (composite of weighted risk factors):
```js
successProb = WELL_RISK_FACTORS.reduce((s,f) => s + f.base*f.weight, 0) / 100;
adj         = f.base * (wellSucc/75);           // rescale to slider success rate
expectedDryCost = capexM * 0.55 * (1 - p/100) * 0.4;   // dry-well write-off (55% is drilling share)
```

**Monte-Carlo** (200 paths):
```js
capexVar   = capexM   * (0.85 + sr(i*3)*0.30);   // ±15% capex
revenueVar = revenueMyr * (0.80 + sr(i*7)*0.40); // ±20% revenue
opexVar    = opexMyr  * (0.90 + sr(i*11)*0.20);  // ±10% opex
cf2        = [-equityVar, ...30×max(0, revenueVar - opexVar - dsVar)];
// distribution → sorted → P10/P50/P90 IRR + histogram (20 bins, −10% to +50%)
```

### 7.2 Parameterisation

| Dataset / constant | Value | Provenance |
|---|---|---|
| `WELL_RISK_FACTORS` | 6 rows (`weight, base, desc`) | Resource, drilling, permitting… composite |
| `FINANCING_STRUCTURES` | 5 rows (`debtPct, debtRate, tenor, minDscr, moody`) | Merchant/PPA/concessional term sheets |
| `RISK_CATEGORIES` | 7 rows (`prob, impact, color`) | Risk-register heat map |
| Drilling share of capex | 0.55 | ~55% of geothermal capex is wells (ESMAP) |
| Dry-cost multiplier | 0.4 | Fraction of drilling cost lost per dry well |
| MC capex band | ±15% | synthetic (`sr()`) |
| MC revenue band | ±20% | synthetic (`sr()`) |
| MC opex band | ±10% | synthetic (`sr()`) |
| Success-rate anchor | 75% | slider baseline well-success |

### 7.3 Calculation walkthrough

1. Sliders set capex, MW, CF, PPA, opex, debt %, debt rate, tenor, WACC, well-success.
2. Debt sized as capex × debt% ; level-payment annuity → annual debt service.
3. Equity cashflows = −equity then 30 years of (revenue − opex − debt service) → equity IRR.
4. `successProb` aggregates `WELL_RISK_FACTORS` (base × weight) → drilling-programme success.
5. `dsWaterfall` shows year-by-year debt service; `mcPaths` runs 200 stochastic scenarios →
   `mcHistogram` (20 bins) and P10/P50/P90 equity IRR.
6. Financing-structure comparison re-runs IRR under each term sheet (`adjIrr`).

### 7.4 Worked example (base case)

capexM $400M, 50 MW, CF 90%, PPA $80/MWh, opexM $18M, debt 65%, debtRate 7%, tenor 15, WACC 9%.

| Step | Computation | Result |
|---|---|---|
| Annual MWh | 50×0.90×8760 | 394,200 |
| Revenue | 394,200×80/1e6 | **$31.5M** |
| Debt | 400×0.65 | $260M |
| Equity | 400−260 | $140M |
| Debt service | 260·0.07/(1−1.07⁻¹⁵) | 260×0.10979 = **$28.5M/yr** |
| EBITDA | 31.5 − 18 | $13.5M |
| Equity CF (yr 1–15) | 31.5 − 18 − 28.5 | **−$15.0M** (negative — over-levered) |

This base case is over-leveraged (debt service exceeds EBITDA), so equity IRR would be deeply
negative — exactly the sizing tension the module surfaces: at $80 PPA and $18M opex the project
cannot support 65% debt at 7%. Lowering debt% or raising PPA restores positive equity cashflow. The
Monte-Carlo then shows the IRR distribution's downside (P10) driven by the ±20% revenue band.

### 7.5 Data provenance & limitations

- **Financial formulas (debt annuity, IRR, NPV, DSCR) are correct**; the term-sheet and risk-factor
  tables are curated benchmarks (ESMAP/IFC), not project-specific.
- **Monte-Carlo input variability is `sr()`-seeded** (±15/20/10% uniform bands), so the IRR
  distribution is a stylised uncertainty envelope, not a calibrated risk model.
- Well-success probability is a weighted-average composite, not a geostatistical resource assessment
  (no P10/P50/P90 flow-rate distribution as the guide's GeothermEx reference implies).
- Dry-well cost is a flat 0.55×0.4 heuristic, not a stochastic drilling-programme simulation.

**Framework alignment:** *World Bank ESMAP Geothermal Handbook* — phased exploration/development/
production capital structure and 30–50% drilling contingency. *IFC Scaling Geothermal / GGSP* —
concessional risk-sharing for exploration wells. *DSCR / project-finance annuity* — standard
level-payment debt sizing with `minDscr` covenant. *Moody's project-finance ratings* — the
`FINANCING_STRUCTURES` credit tiers reference Moody's-style bands.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The Monte-Carlo uses uniform `sr()` bands
and the success probability is a weighted average, so a production resource-and-finance risk model is
specified.

**8.1 Purpose & scope.** Size debt and quantify equity-IRR distribution for a geothermal project
conditioned on drilling/resource risk, to support lender DSCR covenants and GGSP grant sizing.

**8.2 Conceptual approach.** Two-stage: (i) geostatistical **resource Monte-Carlo** yielding a
P10/P50/P90 productive-capacity distribution (per GeothermEx/GNS practice); (ii) **project-finance
cashflow Monte-Carlo** conditioned on that capacity. Benchmarked against **World Bank ESMAP**
geothermal risk-mitigation frameworks and standard **project-finance DSCR** debt-sizing (Moody's
infrastructure methodology).

**8.3 Mathematical specification.**

```
FlowRate_w ~ Lognormal(μ,σ)                      (per-well productivity, P10=2, P50=8, P90=20 kg/s)
Capacity   = Σ_w f(FlowRate_w, enthalpy)          (aggregate MW from successful wells)
p_dry      = Beta(a,b)                            (dry-well probability, frontier 0.3–0.5)
Revenue_t  = Capacity·CF·8760·PPA_t
DebtSize   = min( LTV·Capex, PV(EBITDA)/minDSCR ) (DSCR-constrained sizing)
DebtService_t = annuity(DebtSize, r, tenor)
DSCR_t     = (Revenue_t − Opex_t) / DebtService_t   (covenant: ≥ minDSCR)
EquityIRR  = IRR( −Equity, {Revenue_t−Opex_t−DebtService_t} )
```

| Parameter | Calibration source |
|---|---|
| μ,σ (flow rate) | GeothermEx/GNS Science resource assessments |
| p_dry Beta | ESMAP dry-well statistics (30–50% frontier) |
| drilling share | 0.55 of capex (ESMAP) |
| minDSCR | 1.3–1.5 (Moody's geothermal PF) |
| GGSP grant | up to $1.5M/exploration well (IFC) |

**8.4 Data requirements.** Well test flow rates + enthalpy (project data); regional dry-well
frequencies (ESMAP); PPA price path (platform power-markets); WACC/debt terms. Platform holds IRENA
geothermal reference data.

**8.5 Validation & benchmarking.** Reconcile capacity P50 against as-built plant output; backtest DSCR
against realised project defaults; compare grant-adjusted IRR to IFC-supported project returns.

**8.6 Limitations & model risk.** Resource distributions are thin-data (few wells) — widen σ and flag;
dry-well events are correlated within a field (not independent); PPA and carbon-price paths dominate
long-dated equity value.

## 9 · Future Evolution

### 9.1 Evolution A — Geostatistical well-success and calibrated Monte Carlo (analytics ladder: rung 2 → 4)

**What.** §7 credits this tier-A module with genuine project-finance engineering: phased debt sizing, DSCR, Newton-Raphson equity IRR, project NPV, a well-success probability composite, a 200-path Monte-Carlo IRR distribution, and a dry-well contingency — no guide↔code mismatch. Its flagged weaknesses are the path to predictive rigour: the Monte-Carlo input variability is `sr()`-seeded (±15/20/10% uniform bands, a stylised envelope not a calibrated risk model), well-success is a weighted-average composite rather than a geostatistical P10/P50/P90 flow-rate distribution (the guide's GeothermEx reference implies the latter), and dry-well cost is a flat 0.55×0.4 heuristic. Evolution A upgrades the risk core: a resource-productivity distribution (P10/P50/P90 flow rates) driving the IRR Monte Carlo, and a stochastic drilling-programme simulation for dry-well cost — replacing the seeded uniform bands with calibrated, resource-grounded distributions.

**How.** (1) Replace the `sr()` uniform input bands with a productivity distribution parameterised from temperature-gradient/permeability inputs (P10/P50/P90), run through a deterministic QMC (Halton, per platform convention) instead of PRNG. (2) A drilling-programme simulation: sequential wells with per-well success probability, accumulating dry-well write-offs stochastically. (3) The IRR distribution and DSCR then reflect resource uncertainty, moving the module toward rung-4 predictive risk.

**Prerequisites.** Resource-productivity distribution parameters (ESMAP/IFC benchmarks acceptable, documented per §8); the `sr()` Monte-Carlo replaced by QMC to satisfy the platform's no-fabricated-random guardrail. **Acceptance:** the IRR distribution responds to P10/P50/P90 productivity inputs; dry-well cost emerges from a simulated drilling programme; bench_quant pins a reference case.

### 9.2 Evolution B — Geothermal financing-structure copilot (LLM tier 2)

**What.** A copilot for project-finance and DFI structuring teams: "size senior debt for a $300M geothermal project at 1.35× min DSCR, then show the equity-IRR distribution under P50 resource risk" tool-calls the debt-sizing, DSCR, and Monte-Carlo endpoints and narrates the ESMAP-phased capital structure and dry-well contingency.

**How.** Tier-2 tool-calling over the project-finance endpoints (debt sizing, IRR, Monte Carlo are natural tool surfaces); the grounding corpus is §5/§7 (World Bank ESMAP handbook, IFC GGSP concessional risk-sharing, Moody's-style credit tiers in `FINANCING_STRUCTURES`). The copilot's value is translating resource risk into financing terms — how dry-well probability drives the required contingency and concessional-finance need. Every DSCR, IRR, and percentile figure validated against tool output.

**Prerequisites.** Evolution A for resource-grounded IRR distributions (the current `sr()` envelope shouldn't back financing advice); RBAC-scoped deal data. **Acceptance:** every DSCR and IRR-percentile figure in a copilot answer traces to a tool call; asked for a bankable P90 IRR pre-Evolution-A, the copilot flags the current distribution as a stylised envelope, not a calibrated risk model.