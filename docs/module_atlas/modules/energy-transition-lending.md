# Energy Transition Lending Analytics
**Module ID:** `energy-transition-lending` · **Route:** `/energy-transition-lending` · **Tier:** A (backend vertical) · **EP code:** EP-DO4 · **Sprint:** DO

## 1 · Overview
Analyses bank lending to energy transition assets — renewable project finance, green mortgages for EV charging, energy efficiency lending, and coal exit financing. Models Paris-aligned lending portfolio, green asset ratio (GAR), and PCAF financed emissions for energy sector loans.

> **Business value:** Required for EU bank CSRD/GAR disclosure, ECB climate risk supervision expectations, and PCAF signatory reporting. Provides Paris-aligned energy lending analytics integrating PCAF financed emissions with EU Taxonomy GAR and portfolio temperature scoring.

**How an analyst works this module:**
- Segment energy loan book by technology and company
- Calculate PCAF financed emissions by energy sub-sector
- Model GAR trajectory with new renewable lending
- Apply portfolio temperature score to energy loans
- Generate EBA/ECB climate risk energy sector disclosure

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSET_CLASSES`, `KpiCard`, `LENDERS`, `LENDER_TYPES`, `MiniBar`, `RATINGS`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB'];` |
| `type` | `LENDER_TYPES[Math.floor(sr(i*7+1)*LENDER_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11+2)*REGIONS.length)];` |
| `rating` | `RATINGS[Math.floor(sr(i*13+3)*RATINGS.length)];` |
| `commitmentBn` | `parseFloat((0.2 + sr(i*17+4)*19.8).toFixed(2));` |
| `avgTenor` | `parseFloat((8 + sr(i*19+5)*17).toFixed(1));` |
| `spread` | `Math.round(80 + sr(i*23+6)*280);` |
| `assetClass` | `ASSET_CLASSES[Math.floor(sr(i*29+7)*ASSET_CLASSES.length)];` |
| `greenLoanPct` | `parseFloat((20 + sr(i*31+8)*75).toFixed(1));` |
| `refinancingRisk` | `parseFloat((5 + sr(i*37+9)*60).toFixed(0));` |
| `avgDscr` | `parseFloat((1.1 + sr(i*41+1)*1.4).toFixed(2));` |
| `llcr` | `parseFloat((1.15 + sr(i*43+2)*0.85).toFixed(2));` |
| `firstLoss` | `parseFloat((3 + sr(i*47+3)*12).toFixed(1));` |
| `subordinated` | `parseFloat((sr(i*53+4)*20).toFixed(1));` |
| `watchlist` | `sr(i*59+5) > 0.8;` |
| `totalCommitment` | `filtered.reduce((s, l) => s + l.commitmentBn, 0);` |
| `avgSpread` | `filtered.reduce((s, l) => s + l.spread, 0) / n;` |
| `avgGreenPct` | `filtered.reduce((s, l) => s + l.greenLoanPct, 0) / n;` |
| `byType` | `LENDER_TYPES.map(t => {` |
| `byAsset` | `ASSET_CLASSES.map(a => {` |
| `avgG` | `arr.length ? arr.reduce((s,l)=>s+l.greenLoanPct,0)/arr.length : 0;` |
| `avgRR` | `arr.length ? arr.reduce((s,l)=>s+l.refinancingRisk,0)/arr.length : 0;` |
| `total` | `arr.reduce((s,l)=>s+l.commitmentBn,0);` |
| `avgSpread2` | `arr.reduce((s,l)=>s+l.spread,0)/n2;` |
| `avgTenor2` | `arr.reduce((s,l)=>s+l.avgTenor,0)/n2;` |
| `avgGreen` | `arr.reduce((s,l)=>s+l.greenLoanPct,0)/n2;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/energy-transition/fleet-transition` | `fleet_transition` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/grid-ef-projection` | `grid_ef_projection` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/avoided-emissions` | `avoided_emissions` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/country-comparison` | `country_comparison` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/fuel-types` | `ref_fuel_types` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/nze-milestones` | `ref_nze_milestones` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/replacement-options` | `ref_replacement_options` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-countries` | `ref_grid_countries` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-scenarios` | `ref_grid_scenarios` | api/v1/routes/energy_transition.py |

### 2.3 Engine `generation_transition` (services/generation_transition.py)
| Function | Args | Purpose |
|---|---|---|
| `GenerationTransitionPlanner.plan_transition` | fleet_name, plants, target_year, replacement_tech, carbon_price_eur_t, base_year | Generate a fleet transition plan. |
| `GenerationTransitionPlanner._auto_replace` | fuel_type | Select replacement technology based on original fuel type. |
| `GenerationTransitionPlanner._interpolate_nze` | year, base_emissions, base_year | Interpolate NZE target emissions for a given year. |
| `GenerationTransitionPlanner.get_fuel_types` |  |  |
| `GenerationTransitionPlanner.get_nze_milestones` |  |  |
| `GenerationTransitionPlanner.get_replacement_options` |  |  |

**Engine `generation_transition` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `REPLACEMENT_PRIORITY` | `['solar_pv', 'wind_onshore', 'wind_offshore', 'battery', 'gas_ccgt', 'gas_ccgt_ccs', 'hydro', 'nuclear']` |

### 2.3 Engine `grid_ef_trajectory` (services/grid_ef_trajectory.py)
| Function | Args | Purpose |
|---|---|---|
| `GridEFTrajectoryEngine.project_grid_ef` | country, scenario, start_year, end_year | Project grid EF trajectory for a country under a scenario. |
| `GridEFTrajectoryEngine.avoided_emissions` | country, scenario, annual_generation_mwh, start_year, project_lifetime_years | Calculate avoided emissions for a renewable project. |
| `GridEFTrajectoryEngine.compare_countries` | countries, scenario | Compare grid EF trajectories across countries. |
| `GridEFTrajectoryEngine._interpolate_ef` | year, ef_base, scen, base_year | Interpolate grid EF for a given year using scenario target factors. |
| `GridEFTrajectoryEngine.get_countries` |  |  |
| `GridEFTrajectoryEngine.get_scenarios` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `renewable` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `LENDER_TYPES`, `RATINGS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU Bank Green Asset Ratio | — | EBA Basel IV/GAR Survey 2023 | Average EU bank green asset ratio 7% — target 50%+ for Paris-aligned transition per industry estimates |
| Energy Sector Loan Share | — | ECB Bank Lending Survey 2023 | Energy sector represents 8–15% of large bank loan portfolios — primary driver of financed emissions |
| Renewable Project Finance Market | — | BloombergNEF Project Finance 2024 | Global renewable energy project finance $580Bn in 2023 — record high, growing 25% yr-on-yr |
- **Energy sector loan tape with company/project IDs** → PCAF emissions calculation → **Financed Scope 1+2 emissions by borrower**
- **EU Taxonomy screening criteria for energy activities** → GAR calculation → **Taxonomy-aligned vs eligible energy loans**
- **IEA scenario demand for energy by fuel type** → Portfolio temperature score → **Loan-weighted temperature alignment for energy portfolio**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-transition/ref/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_subcritical', 'coal_supercritical', 'coal_usc', 'gas_ocgt', 'gas_ccgt', 'gas_ccgt_ccs', 'oil', 'biomass', 'nuclear', 'wind_onshore', 'wind_offshore', 'solar_pv', 'hydro', 'battery'], 'n_keys': 14}`

**GET /api/v1/energy-transition/ref/grid-ef-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['DE', 'FR', 'NL', 'PL', 'ES', 'IT', 'GB', 'SE', 'US', 'CN', 'IN', 'JP', 'AU', 'BR', 'ZA', 'KR', 'CA', 'MX', 'ID', 'SA', 'AE', 'NG', 'EG', 'TH', 'VN'], 'n_keys': 25}`

**GET /api/v1/energy-transition/ref/grid-ef-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['current_policies', 'stated_policies', 'nze_2050', 'ngfs_orderly', 'ngfs_disorderly', 'ngfs_hot_house'], 'n_keys': 6}`

**GET /api/v1/energy-transition/ref/nze-milestones** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [2025, 2030, 2035, 2040, 2050], 'n_keys': 5}`

**GET /api/v1/energy-transition/ref/replacement-options** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

**POST /api/v1/energy-transition/avoided-emissions** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/country-comparison** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/fleet-transition** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Energy Transition Lending Portfolio
**Headline formula:** `GreenAssetRatio = GreenLoans / TotalLoans; PCAF_energy = Σ [(Loan_i/EnterpriseValue_i) × Scope1_i + (Loan_j/PropertyValue_j) × EnergyUse_j × EF_j]; ParisAlignment = Σ [Loan_weight_i × TemperatureScore_i]`

GAR measures EU Taxonomy aligned lending share; PCAF financed emissions covers corporate loans (Part A), project finance (Part B), and mortgages (Part C); portfolio temperature score from loan-level ITR

**Standards:** ['EU Taxonomy Green Asset Ratio (GAR) Disclosure', 'PCAF Standard Part A+B+C 2022', 'EBA Climate Risk — Green Lending Guidance 2023', 'Partnership for Paris Aligned Finance Energy Sector Guidelines']
**Reference documents:** EU Taxonomy Technical Screening Criteria — Energy Sector; PCAF Global GHG Accounting Standard Parts A and B (2022); EBA Report on Credit Risk and Climate Change — Energy Sector; Partnership for Paris Aligned Finance — Energy Sector Guidelines 2023

**Engine `generation_transition` — extracted transformation lines:**
```python
p.annual_generation_mwh = p.capacity_mw * 8760 * p.capacity_factor_pct / 100
years_available = target_year - base_year
retire_year = base_year + int((i + 1) * years_available / num_fossil) if num_fossil > 0 else base_year
age = retire_year - plant.commissioning_year
co2_avoided = plant.annual_generation_mwh * ef
remaining_life = max(0, plant.commissioning_year + expected_life - retire_year)
stranded_frac = remaining_life / expected_life if expected_life > 0 else 0
stranded_value = plant.book_value_eur * stranded_frac
rep_cap = plant.capacity_mw * multiplier
yr_emissions = current_emissions - cumulative_saved
frac = (year - y0) / (y1 - y0) if y1 > y0 else 0
ef_yr = ef0 + (ef1 - ef0) * frac
```

**Engine `grid_ef_trajectory` — extracted transformation lines:**
```python
reduction = (1 - ef_2050 / ef_base) * 100 if ef_base > 0 else 0
yr = start_year + i
avoided = annual_generation_mwh * ef
avg_ef = ef_sum / project_lifetime_years if project_lifetime_years > 0 else 0
frac = (year - base_year) / (2030 - base_year) if 2030 > base_year else 0
factor = 1 + (f_2030 - 1) * frac
frac = (year - 2030) / 20
factor = f_2030 + (f_2050 - f_2030) * frac
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).
**Shared engines (edits propagate!):** `generation_transition` (used by 4 modules), `grid_ef_trajectory` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `energy-transition-dashboard` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-credit-portal` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-analytics` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide promises three quantitative engines — **Green Asset Ratio**
> (`GreenLoans/TotalLoans`), **PCAF energy financed emissions** (`Σ(Loan/EV × Scope1 + Loan/PropVal ×
> EnergyUse × EF)`), and a **portfolio temperature score** (`Σ Loan_weight × TemperatureScore`).
> **None is implemented.** The page generates 55 lenders whose every attribute — commitment, spread,
> DSCR, LLCR, green-loan %, refinancing risk — is an **independent `sr()` random draw**; there is no
> loan tape, no EVIC, no investee emissions, no ITR. The KPIs are portfolio averages of those draws.
> Documented below as written; §8 specifies the PCAF/GAR lending model.

### 7.1 What the module computes

55 synthetic lenders (`sr(s)=frac(sin(s+1)×10⁴)`), each drawn independently:

```js
commitmentBn   = 0.2 + sr(i·17+4)·19.8     // $0.2–20B
avgTenor       = 8   + sr(i·19+5)·17        // 8–25 yr
spread         = 80  + sr(i·23+6)·280       // 80–360 bps
greenLoanPct   = 20  + sr(i·31+8)·75        // 20–95%
refinancingRisk= 5   + sr(i·37+9)·60        // 5–65
avgDscr        = 1.1 + sr(i·41+1)·1.4       // 1.10–2.50×
llcr           = 1.15+ sr(i·43+2)·0.85      // 1.15–2.00×
firstLoss      = 3   + sr(i·47+3)·12        // 3–15%
subordinated   = sr(i·53+4)·20              // 0–20%
watchlist      = sr(i·59+5) > 0.8           // ~20% flagged
```

Portfolio KPIs are simple guarded averages (`n = max(1, filtered.length)`):
```js
totalCommitment = Σ commitmentBn
avgSpread = Σ spread / n ;  avgTenor = Σ tenor / n ;  avgGreenPct = Σ greenLoanPct / n
watchlistCount = count(watchlist) ;  highRefRisk = count(refinancingRisk > 40)
```

### 7.2 Parameterisation / scoring rubric

| Field | Range | Provenance |
|---|---|---|
| `LENDER_TYPES` | Commercial Bank, DFI, ECA, Green Bank, Infra Fund, Multilateral | Lender taxonomy |
| `ASSET_CLASSES` | Solar/Wind/Battery/H₂/Transmission/Offshore-wind PF | Project-finance categories |
| `RATINGS` | AAA…BBB | Ratings ladder (drawn, not modelled) |
| `avgDscr` 1.10–2.50× | synthetic | Debt-service coverage — realistic band, random |
| `llcr` 1.15–2.00× | synthetic | Loan-life coverage ratio — random |
| `spread` 80–360 bps | synthetic | Credit spread — not risk-derived |
| `greenLoanPct` 20–95% | synthetic | Proxy for GAR — **not a taxonomy screen** |
| Refinancing-risk flag | `>40` | High-risk threshold |

DSCR and LLCR are genuine project-finance credit ratios by *name*, but here they are random draws, not
computed from cash-flow projections.

### 7.3 Calculation walkthrough

Generate 55 lenders → filter by type/asset-class/region → aggregate averages → the eight tabs render:
overview KPIs, lender table (sortable), green-loan structuring (first-loss/subordinated tranches),
tenor matching, refinancing-risk screen, asset-class rollups, regulatory-capital view, and market
intelligence. Every displayed metric is either a raw draw or a mean of draws.

### 7.4 Worked example

Lender **i = 3**. `commitmentBn = 0.2 + sr(55)·19.8`. `sr(55)=frac(sin(56)×10⁴)`: sin(56 rad) ≈
−0.5216, ×10⁴ = −5215.9, frac → 0.41 → `commitmentBn = 0.2 + 0.41·19.8 ≈ $8.3B`.
`greenLoanPct = 20 + sr(96)·75`; if `sr(96) ≈ 0.53` → `≈ 60%`. `avgDscr = 1.1 + sr(124)·1.4`; if
`sr(124) ≈ 0.30` → `1.52×`. These three attributes are drawn from *unrelated* seeds, so a lender with
a 1.52× DSCR can carry any spread — coverage and pricing are uncorrelated, which no real credit book
would exhibit. (Digits depend on JS float; the point is the independence.)

### 7.5 Companion analytics

- **Green-loan structuring:** first-loss and subordinated tranche percentages per lender (blended-finance
  layering) — random, illustrative of credit-enhancement structures.
- **Tenor matching / refinancing risk:** distribution of tenors and the `refinancingRisk>40` screen.
- **Asset-class analysis:** commitment and green-% rollups by project-finance category.
- **Regulatory capital / market intelligence:** display scaffolds framed around GAR/EBA context but
  not computing capital charges.

### 7.6 Data provenance & limitations

- **All lender data is synthetic**, seeded by `sr()`; attributes are mutually independent draws.
- The guide's GAR, PCAF financed emissions and portfolio temperature score are **not computed** — no
  loan tape, no EVIC/property value, no investee emissions, no ITR exists.
- DSCR/LLCR are named but not derived from cash flows; `greenLoanPct` is a random proxy, not a taxonomy
  alignment.

**Framework alignment:** **EU Taxonomy Green Asset Ratio (GAR)** — taxonomy-aligned loans / total
covered assets, a mandatory CSRD bank disclosure (the guide's headline; not computed here). **PCAF
Standard Parts A/B/C** — financed emissions for corporate loans (Outstanding/EVIC × Scope 1+2),
project finance, and mortgages. **Partnership for Paris-Aligned Finance / SBTi FI** — the portfolio
temperature-score basis. **EBA climate-risk / green-lending guidance** — the regulatory-capital context.
The module names all of these but implements only average-of-draws aggregation.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Turn a real energy-sector loan tape into the three disclosures the guide advertises: GAR, PCAF
financed emissions, and a loan-weighted portfolio temperature score. Coverage: corporate loans,
project finance (renewables), and green mortgages.

### 8.2 Conceptual approach
Combine the **EU Taxonomy GAR methodology** (Del. Reg 2021/2178 disclosure templates), the **PCAF
Global Standard (2022)** attribution, and the **SBTi/PACTA temperature-alignment** approach. Benchmarks:
**PCAF** member-bank implementations, **2DII PACTA for Banks**, **EBA GAR pilot**.

### 8.3 Mathematical specification
```
GAR   = Σ_i TaxonomyAligned_i · Exposure_i / Σ_i CoveredAssets_i
FE_i  = (Outstanding_i / EVIC_i) · (Scope1_i + Scope2_i)          (corporate)
      = (Outstanding_j / TotalProjectCost_j) · ProjectEmissions_j (project finance, Part B)
      = (Loan_k / PropertyValue_k) · EnergyUse_k · EF_k            (mortgages, Part C)
ITR_portfolio = Σ_i w_i · TempScore_i,   w_i = Exposure_i / Σ Exposure
DSCR = CFADS_t / DebtService_t ;  LLCR = NPV(CFADS_{t..maturity}) / DebtOutstanding
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Taxonomy alignment flag | `TaxonomyAligned` | EU Taxonomy TSC screen |
| EVIC | `EVIC` | Bloomberg/Refinitiv |
| Investee Scope 1+2 | `Scope1,2` | CDP/Trucost/proxy |
| Project emissions | `ProjectEmissions` | grid displacement × generation (avoided) or plant EF |
| Borrower temperature score | `TempScore` | SBTi / PACTA sector pathway |
| Grid/energy EF | `EF` | IEA grid factors |

### 8.4 Data requirements
Loan-level: outstanding, borrower ID, sector, EVIC or project cost, property value + energy use
(mortgages), taxonomy-eligibility/alignment flags, and cash-flow projections (for DSCR/LLCR). Sources:
internal loan tape, CDP/Trucost, IEA EF, SBTi target database. Platform already has
`pcaf-financed-emissions` and grid-EF engines to reuse.

### 8.5 Validation & benchmarking plan
Reconcile FE against the platform's PCAF engine on the same tape; reconcile GAR against the issuer's
published CSRD GAR; benchmark ITR against a PACTA-for-Banks run. DSCR/LLCR back-tested against realised
project performance. Sensitivity: EVIC period-end vs average.

### 8.6 Limitations & model risk
GAR numerator depends on scarce taxonomy-alignment data (often defaulting to eligibility only, BTAR);
EVIC volatility destabilises attribution. Conservative fallback: unscreened exposures count as
non-aligned in GAR and carry sector-proxy emissions at PCAF DQ 5 — data gaps never reduce the reported
footprint or inflate GAR.

## 9 · Future Evolution

### 9.1 Evolution A — A real energy loan book with computed GAR, PCAF, and temperature score (analytics ladder: rung 1 → 2)

**What.** The overview promises the EU bank disclosure triad — green asset ratio, PCAF financed emissions, portfolio temperature score — but none is computed: the page's 40 lenders are entirely `sr()`-seeded (commitments, spreads, DSCR/LLCR, watchlist flags), and while the module nominally shares the real `generation_transition`/`grid_ef_trajectory` engines, the page never uses them for anything lending-specific. Evolution A builds the loan-book vertical the module's name and EP-DO4 charter describe.

**How.** (1) `et_loan_book` table (borrower via `entity_lei`, technology/asset class, commitment, tenor, spread, covenants), replacing the seeded generator; DSCR/LLCR become entered or fed metrics, not draws. (2) Compute the triad by composition, not reimplementation: GAR numerator via the taxonomy screening from `energy-sector-taxonomy`/`eu-taxonomy-engine` applied to each loan's activity; PCAF financed emissions via `enablement-methodology`'s Evolution-A engine with loan-appropriate attribution (outstanding/total-capital for project finance); temperature score from borrower NDC/SBTi alignment data. (3) Use the engines this page already imports for what they're for: coal-exit loan analysis calls `POST /fleet-transition` on the borrower's fleet; renewable-loan avoided emissions call `/avoided-emissions` with the loan's country and generation. (4) Rung 2: GAR-trajectory what-ifs ("€2B new renewable lending by 2027") over the real book.

**Prerequisites.** The two upstream engines' Evolutions A (taxonomy screening on real assets, PCAF engine); a demo loan book fixture. **Acceptance:** GAR reproduces as taxonomy-aligned exposure ÷ total covered assets for the fixture book; PCAF per sub-sector reconciles to the shared engine; zero `sr()` in the book path.

### 9.2 Evolution B — ECB/EBA disclosure-pack analyst for the energy book (LLM tier 2)

**What.** The workflow ends at "generate EBA/ECB climate risk energy sector disclosure" — a templated, high-stakes deliverable. A tool-calling analyst assembles it: pulls the computed GAR, PCAF by sub-sector, and temperature score from Evolution A's endpoints, populates the EBA Pillar 3 ESG templates' energy rows, and drafts the qualitative sections (concentration commentary, coal-exit progress citing actual fleet-transition plan outputs) — every figure tool-traced, every gap disclosed.

**How.** Tools: `get_loan_book(filters)`, `compute_gar(book)`, `compute_pcaf(book)`, `get_fleet_plan(borrower)`, plus the EBA template structure as a typed output schema so the draft lands in the right rows rather than free prose. Grounding corpus = this Atlas record plus the EBA Pillar 3 ESG ITS references. The temperature score's methodology limitations (coverage, proxy use) are auto-included from the engine's own metadata — supervisors read the caveats first. Validator on all €, %, and tCO₂e figures.

**Prerequisites (hard).** Evolution A end-to-end — an EBA disclosure pack generated from seeded DSCRs and invented commitments is the exact regulatory-fabrication scenario the platform's guardrails exist to prevent. **Acceptance:** a golden book's template rows match scripted endpoint outputs; qualitative claims about coal-exit progress cite fleet-transition responses; missing borrower emissions data appears as PCAF data-quality disclosure, not imputation.