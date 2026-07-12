# Avoided Emissions Portfolio
**Module ID:** `avoided-emissions-portfolio` · **Route:** `/avoided-emissions-portfolio` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 4 avoided emissions tracking engine following GHG Protocol Land Sector and Removal Guidance and WBCSD Avoided Emissions Framework. Quantifies emissions displaced by portfolio clean energy, efficient transport, and land-restoration investments against a counterfactual baseline. Supports green bond and sustainability-linked instrument impact reporting.

> **Business value:** Scope 4 avoided emissions provide institutional investors with a positive impact metric that complements the carbon footprint narrative. For green bond issuers, credible avoided emissions calculations backed by GHG Protocol methodology are increasingly required by investors as part of use-of-proceeds substantiation and annual impact reporting.

**How an analyst works this module:**
- Upload investment portfolio with clean energy / efficiency / land-use holdings
- Baseline Definition tab selects counterfactual scenario per investment type
- Avoided Emissions Calculation applies attribution factors and aggregates portfolio total
- Additionality Assessment scores each project on financial, regulatory, and common practice tests
- Impact Report generates green bond use-of-proceeds avoided emissions disclosure
- Comparison tab benchmarks avoided emissions against Scope 1+2+3 footprint

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_COLORS`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `CREDIBILITY_TIERS`, `CTooltip`, `HOLDINGS`, `QUARTERS`, `SDG_MAP`, `SECTORS`, `SECTOR_COLORS`, `SOLUTION_CATS`, `TABS`, `Tab1PortfolioClimateImpact`, `Tab2ClimateSolutionExposure`, `Tab3ImpactAttribution`, `Tab4InvestmentImpactReport`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS` | `['Clean Energy','Energy Efficiency','Electric Transport','Sustainable Agriculture','Waste Management','Water Solutions','Nature-Based Solutions','Digital Climate Tech','Industrial Decarbonisation','Green Buildings','Hydr` |
| `CREDIBILITY_TIERS` | `['High','Medium-High','Medium','Medium-Low','Low'];` |
| `fmt` | `n=>{if(Math.abs(n)>=1e9) return (n/1e9).toFixed(1)+'B';if(Math.abs(n)>=1e6) return (n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1e3) return (n/1e3).toFixed(1)+'K';return n.toFixed(1);};` |
| `fmtPct` | `n=>(n*100).toFixed(1)+'%';` |
| `sector` | `SECTORS[Math.floor(s * SECTORS.length)];` |
| `prefix` | `COMPANY_PREFIXES[Math.floor(s2 * COMPANY_PREFIXES.length)];` |
| `suffix` | `COMPANY_SUFFIXES[Math.floor(s3 * COMPANY_SUFFIXES.length)];` |
| `aumWeight` | `0.2 + s4 * 2.8;` |
| `emitted` | `800 + s5 * 24000;` |
| `avoidedRatio` | `0.05 + solutionRevPct * 1.8 + s7 * 0.3;` |
| `avoided` | `emitted * avoidedRatio;` |
| `net` | `emitted - avoided;` |
| `tier` | `CREDIBILITY_TIERS[Math.floor(sr(i * 47 + 71) * CREDIBILITY_TIERS.length)];` |
| `evic` | `500 + sr(i * 53 + 83) * 9500;` |
| `outstanding` | `evic * (0.01 + sr(i * 59 + 89) * 0.08);` |
| `attrFactor` | `outstanding / evic;` |
| `solutionCat` | `SOLUTION_CATS[Math.floor(sr(i * 61 + 97) * SOLUTION_CATS.length)];` |
| `qTrend` | `QUARTERS.map((q, qi) => {` |
| `base` | `emitted * (0.85 + sr(i * 67 + qi * 11) * 0.3);` |
| `avBase` | `avoided * (0.7 + sr(i * 71 + qi * 13) * 0.6);` |
| `tierColor` | `t => ({ 'High': T.green, 'Medium-High': T.sage, 'Medium': T.gold, 'Medium-Low': T.amber, 'Low': T.red }[t] \|\| T.textMut);` |
| `pageData` | `useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);` |
| `totalPages` | `Math.ceil(filtered.length / perPage);` |
| `kpis` | `useMemo(() => { const tot = filtered.reduce((a, h) => ({ emitted: a.emitted + h.emitted, avoided: a.avoided + h.avoided, net: a.net + h.net, solRev: a.solRev + h.solutionRevPct * h.aumWeight, weight: a.weight + h.aumWeight }), { emitted: 0, avoided: 0, net: 0, solRev: 0, weight: 0 });` |
| `ratio` | `d.emitted > 0 ? d.avoided / d.emitted : 0;` |
| `pct` | `filtered.length > 0 ? count / filtered.length : 0;` |
| `contrib` | `sr(h.id * 97 + ci * 11) * (cat === h.solutionCat ? 0.5 : 0.12) * w;` |
| `total` | `Object.values(map).reduce((a, b) => a + b, 0);` |
| `quarterTrend` | `useMemo(() => { return QUARTERS.map((q, qi) => { const row = { quarter: q };` |
| `benchmarkData` | `useMemo(() => { return SOLUTION_CATS.map((cat, ci) => { const portVal = exposureByCategory[ci].value;` |
| `screened` | `useMemo(() => { return HOLDINGS.filter(h => h.solutionRevPct >= minSolRev / 100) .sort((a, b) => b.solutionRevPct - a.solutionRevPct);` |
| `top20PurePlay` | `useMemo(() => { return [...HOLDINGS].sort((a, b) => b.solutionRevPct - a.solutionRevPct).slice(0, 20);` |
| `totalExposure` | `useMemo(() => { const totalW = HOLDINGS.reduce((a, h) => a + h.aumWeight, 0);` |
| `solW` | `HOLDINGS.reduce((a, h) => a + h.aumWeight * h.solutionRevPct, 0);` |
| `attribution` | `useMemo(() => { const sensMultiplier = 1 + sensitivity / 100;` |
| `factor` | `(attrFactors[h.id] \|\| h.attrFactor) * sensMultiplier;` |
| `methodFactor` | `methodology === 'PCAF' ? factor : factor * (0.85 + sr(h.id * 101) * 0.3);` |
| `attributable` | `h.avoided * methodFactor;` |
| `dblCount` | `attributable * (0.05 + sr(h.id * 103) * 0.1);` |
| `netAttributable` | `totalAttributable - doubleCounting;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/avoided-emissions/calculate-activity` | `calculate_activity` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/additionality-check` | `additionality_check` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/article6-eligibility` | `article6_eligibility` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/bvcm-check` | `bvcm_check` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/portfolio-aggregate` | `portfolio_aggregate` | api/v1/routes/avoided_emissions.py |
| POST | `/api/v1/avoided-emissions/full-assessment` | `full_assessment` | api/v1/routes/avoided_emissions.py |
| GET | `/api/v1/avoided-emissions/ref/categories` | `ref_categories` | api/v1/routes/avoided_emissions.py |
| GET | `/api/v1/avoided-emissions/ref/baseline-factors` | `ref_baseline_factors` | api/v1/routes/avoided_emissions.py |
| GET | `/api/v1/avoided-emissions/ref/article6-criteria` | `ref_article6_criteria` | api/v1/routes/avoided_emissions.py |

### 2.3 Engine `avoided_emissions_engine` (services/avoided_emissions_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AvoidedEmissionsEngine.calculate_avoided_per_activity` | entity_id, activity_type, baseline_factor, solution_factor, quantity, attribution_factor | Calculate avoided emissions for a single activity. avoided_per_unit = baseline_factor - solution_factor (kgCO2e/unit) total_avoided = avoided_per_unit x quantity x attribution_factor (tCO2e) |
| `AvoidedEmissionsEngine.assess_additionality` | entity_id, activity_type, activity_data | Score additionality across five criteria (0-100 each, averaged). Each criterion is scored only when the caller supplies a ``{criterion}_score`` value in ``activity_data``. Criteria without supplied data are reported as unscored (honest null) rather than filled with a fabricated value, and are excluded from the average. |
| `AvoidedEmissionsEngine.check_article6_eligibility` | entity_id, activity_data | Check Paris Agreement Article 6 ITMO eligibility. Each criterion is treated as met only when the caller explicitly confirms it in ``activity_data``; unconfirmed criteria default to False (conservative — Article 6 requires all criteria). ITMO potential is computed only when a real ``annual_avoided_tco2e`` is supplied, otherwise it is reported as None (insufficient data). |
| `AvoidedEmissionsEngine.check_bvcm_eligibility` | entity_id, activity_data | Check SBTi Beyond Value Chain Mitigation (BVCM) eligibility. Each requirement is treated as met only when the caller explicitly confirms it in ``activity_data``; unconfirmed requirements default to False (conservative — an unproven requirement is not a met one). |
| `AvoidedEmissionsEngine.aggregate_portfolio` | entity_id, activities, own_emissions_tco2e | Aggregate avoided emissions across all activities. Returns total by category, net benefit vs own Scope 1+2+3. ``own_emissions_tco2e`` is an entity-level figure that must be supplied by the caller (the entity's own Scope 1+2+3). When it is not provided, ``net_benefit_tco2e`` and ``avoidance_ratio`` are reported as None (insufficient data) rather than fabricated. Activities without a computed ``tota |
| `AvoidedEmissionsEngine.full_assessment` | entity_id, entity_name, assessment_type, reporting_year, activities_data, own_emissions_tco2e, reporting_quality_score | Comprehensive Scope 4 avoided emissions assessment. ``own_emissions_tco2e`` (entity Scope 1+2+3) and ``reporting_quality_score`` are entity-level inputs. When not supplied here they are read from ``activities_data``; if still absent they are reported as None (insufficient data) rather than fabricated. Net benefit / avoidance ratio require own emissions. |
| `AvoidedEmissionsEngine.get_avoided_emission_categories` |  |  |
| `AvoidedEmissionsEngine.get_baseline_factors` |  |  |
| `AvoidedEmissionsEngine.get_article6_criteria` |  |  |
| `AvoidedEmissionsEngine.get_bvcm_requirements` |  |  |
| `AvoidedEmissionsEngine.get_solution_factors` |  |  |

**Engine `avoided_emissions_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `AVOIDED_EMISSION_CATEGORIES` | `{'enabled': {'description': 'Products/services that enable others to reduce emissions', 'examples': ['solar_panels', 'EVs', 'insulation', 'efficiency_software', 'smart_meters'], 'additionality_standard': 'Technology comparison method — compare to best available alternative', 'attribution': 'Economic` |
| `BASELINE_FACTORS` | `{'coal_electricity_kwh': 0.82, 'grid_average_eu_kwh': 0.276, 'grid_average_us_kwh': 0.386, 'natural_gas_m3': 2.204, 'diesel_litre': 2.64, 'petrol_litre': 2.31, 'steel_tonne_bof': 2.2, 'cement_tonne_opc': 0.83, 'aluminium_tonne_primary': 11.5, 'beef_kg': 27.0, 'chicken_kg': 5.7, 'plastic_pet_kg': 3.4` |
| `ARTICLE6_CRITERIA` | `{'corresponding_adjustment': 'Host country must apply corresponding adjustment', 'authorization': 'Host country authorization of activity required', 'participation': 'Voluntary cooperation between parties', 'sustainable_development': 'Contribution to SD in host country', 'real_permanent_additional':` |
| `BVCM_REQUIREMENTS` | `{'science_based': 'Mitigation must be science-aligned and verified', 'beyond_value_chain': 'Activity outside company value chain boundary', 'not_double_count': 'No double counting with Scope 1/2/3 reductions', 'high_quality': 'ICVCM Core Carbon Principles compliance preferred', 'transparent': 'Separ` |
| `SOLUTION_FACTORS` | `{'solar_kwh': 0.04, 'wind_kwh': 0.011, 'ev_km': 0.05, 'heat_pump_kwh': 0.06, 'green_steel_tonne': 0.4, 'low_carbon_cement_t': 0.5, 'plant_based_protein_kg': 2.0, 'recycled_aluminium_t': 0.6, 'led_kwh_saved': 0.0, 'energy_efficiency_kwh': 0.0}` |
| `ADDITIONALITY_CRITERIA` | `['regulatory_surplus', 'investment_additionality', 'technological_additionality', 'temporal_additionality', 'geographical_additionality']` |
| `REPORTING_QUALITY_TIERS` | `[(80, 'verified'), (60, 'assured'), (40, 'reported'), (0, 'estimated')]` |
| `CROSS_FRAMEWORK_MAP` | `{'GHG_Protocol_Part_C': 'GHG Protocol Corporate Value Chain (Scope 3) Standard Part C provides Scope 4 guidance', 'ISSB_S2_29': 'ISSB S2 section 29 permits disclosure of beyond-value-chain mitigation activities', 'CSRD_ESRS_E1': 'ESRS E1-4 requires disclosure of GHG reduction targets and actions, en` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `CREDIBILITY_TIERS`, `PEERS`, `QUARTERS`, `SECTORS`, `SOLUTION_CATS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Avoided Emissions | `Baseline – Project_scenario` | WBCSD framework | Total annual emissions displaced by portfolio investments vs BAU counterfactual |
| Attribution Factor | `Investment / Total_capex` | GHG Protocol | Fraction of avoided emissions attributed to investor based on ownership/financing share |
| Additionality Score | `Multi-criteria assessment` | ICVCM CCP | Likelihood that avoided emissions would not have occurred without the investment |
- **Portfolio investment data (type, capex, location)** → Select BAU counterfactual; apply emission factors; compute avoided emissions with attribution → **Per-investment avoided emissions attributed to portfolio with additionality flags**
- **Grid emission factor databases (IEA, EPA eGRID)** → Match project location to grid emission factor for counterfactual baseline → **Counterfactual emission baselines for clean energy and efficiency investments**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/avoided-emissions/ref/article6-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['corresponding_adjustment', 'authorization', 'participation', 'sustainable_development', 'real_permanent_additional'], 'n_keys': 5}`

**GET /api/v1/avoided-emissions/ref/baseline-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_electricity_kwh', 'grid_average_eu_kwh', 'grid_average_us_kwh', 'natural_gas_m3', 'diesel_litre', 'petrol_litre', 'steel_tonne_bof', 'cement_tonne_opc', 'aluminium_tonne_primary', 'beef_kg', 'chicken_kg', 'plastic_pet_kg', 'paper_tonne', 'aviation_pkm', 'car_petrol_`

**GET /api/v1/avoided-emissions/ref/categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['enabled', 'substitution', 'facilitated'], 'n_keys': 3}`

**POST /api/v1/avoided-emissions/additionality-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/avoided-emissions/article6-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/avoided-emissions/bvcm-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/avoided-emissions/calculate-activity** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/avoided-emissions/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** GHG Protocol counterfactual avoided emissions
**Headline formula:** `Avoided_emissions = Baseline_scenario_emissions – Project_scenario_emissions; Baseline = BAU counterfactual without investment`

Avoided emissions are not included in Scope 1/2/3 inventory but quantify displacement impact. Baseline is the most credible BAU counterfactual (e.g., grid average emission factor vs solar project). Additionality test ensures project would not have happened without investment. Attribution factor = investment / total project capex.

**Standards:** ['GHG Protocol Scope 4 Draft', 'WBCSD Avoided Emissions Framework', 'ICVCM Core Carbon Principles']
**Reference documents:** GHG Protocol Scope 4 and Land Sector Guidance (Draft); WBCSD Avoided Emissions Framework 2023; ICVCM Core Carbon Principles v4; EU Green Bond Standard Delegated Act

**Engine `avoided_emissions_engine` — extracted transformation lines:**
```python
avoided_per_unit = baseline_factor - solution_factor (kgCO2e/unit)
avoided_per_unit_kgco2e = max(0.0, baseline_factor - solution_factor)
total_avoided_tco2e = round(avoided_per_unit_kgco2e * quantity * attribution_factor / 1000, 4)
itmo_potential_units = round(float(annual_avoided_raw) * attribution_factor, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `avoided_emissions_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `avoided-emissions-hub` | engine:avoided_emissions_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The overall shape matches the guide — counterfactual
> avoided emissions with investor attribution — but three specifics diverge: (1) the guide defines
> `Attribution Factor = Investment / Total_capex` (project-finance convention), while the code uses
> the **PCAF listed-equity convention `outstanding / EVIC`**; (2) the guide's "Additionality
> Assessment" tab (financial/regulatory/common-practice tests, ICVCM CCP scoring) **does not exist
> on this page** — additionality logic lives only in the backend engine
> (`avoided_emissions_engine.py`), which this page never calls (no fetch/axios); (3) there is no
> portfolio upload or grid-EF database lookup — all 150 holdings are synthetic. The attribution
> waterfall, methodology comparison and double-count adjustment described below are real code.

### 7.1 What the module computes

For 150 synthetic climate-solution holdings across 15 sectors, the page computes portfolio avoided
emissions, an attribution waterfall, and screening analytics. Holding generation (per holding `i`):

```js
aumWeight      = 0.2 + s4 × 2.8                     // 0.2–3.0 %
emitted        = 800 + s5 × 24,000                  // tCO2e
solutionRevPct = s6 × 0.85                          // 0–85 % climate-solution revenue
avoidedRatio   = 0.05 + solutionRevPct × 1.8 + s7 × 0.3
avoided        = emitted × avoidedRatio             // correlated with solution revenue
net            = emitted − avoided
evic           = 500 + sr(·) × 9,500                // $M
outstanding    = evic × (0.01 + sr(·) × 0.08)       // 1–9 % of EVIC held
attrFactor     = outstanding / evic                 // PCAF attribution
```

Unlike the sibling `avoided-emissions-hub`, **avoided is structurally linked to solution
revenue** (slope 1.8), so pure-play companies show avoided ≫ emitted by construction.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Attribution factor | `outstanding / EVIC` (1–9%) | PCAF Standard convention (financed-emissions attribution) |
| Methodology toggle | PCAF = factor as-is; "proprietary" = factor × (0.85 + sr×0.3) | synthetic ±15% method dispersion |
| Double-count haircut | attributable × (0.05 + sr×0.1) → 5–15% | synthetic demo value |
| Sensitivity slider | factor × (1 + sensitivity/100), ±20% grid | UI parameter |
| Credibility tiers | High / Medium-High / Medium / Medium-Low / Low (uniform random) | synthetic |
| Pure-play screen | `solutionRevPct ≥ minSolRev/100` slider; top-20 ranking | screening rubric |
| Quarterly trend | emitted × (0.85–1.15), avoided × (0.7–1.3) noise per quarter | synthetic |
| SDG tags | always 7 & 13; 9/11/15 probabilistic | synthetic |

### 7.3 Calculation walkthrough

1. **Portfolio KPIs** — over the filtered set: Σ emitted, Σ avoided, Σ net,
   `ratio = avoided/emitted` (guarded), and the AUM-weighted mean solution revenue
   `Σ(solutionRevPct × aumWeight) / Σ aumWeight`.
2. **Attribution engine** (`attribution` memo) —

```js
factor        = (userOverride || attrFactor) × (1 + sensitivity/100)
methodFactor  = methodology === 'PCAF' ? factor : factor × (0.85 + sr(id×101)×0.3)
attributable  = avoided × methodFactor
dblCount      = attributable × (0.05 + sr(id×103)×0.1)
netAttributable = Σ attributable − Σ dblCount
```

   rendered as a waterfall: Gross Avoided → −(gross − attributable) attribution loss →
   −double-count adjustment → Net Attributable, with per-sector roll-ups and per-holding
   editable attribution factors.
3. **Methodology comparison** — first 30 holdings, PCAF vs proprietary attributable and delta,
   sorted by |delta|.
4. **Sensitivity strip** — total attributable at −20%…+20% factor adjustments in 5% steps.
5. **Screens** — sector heat cards (ratio > 0.8 green / > 0.4 gold / else red), pure-play screen,
   top-20 pure-plays, exposure by solution category (8 categories, weight-based with a seeded
   cross-category contribution `sr(id×97+ci×11) × (own-cat 0.5 | other 0.12) × weight`).

### 7.4 Worked example — one holding through attribution

Take a holding with `emitted = 12,000 tCO₂e`, `solutionRevPct = 0.50`, `s7 = 0.2`,
`evic = $4,000M`, `outstanding = $200M`, PCAF methodology, sensitivity 0, seeded dblCount draw 0.10:

| Step | Computation | Result |
|---|---|---|
| Avoided ratio | 0.05 + 0.50×1.8 + 0.2×0.3 | 1.01 |
| Avoided | 12,000 × 1.01 | 12,120 tCO₂e |
| Net | 12,000 − 12,120 | −120 t (net positive impact) |
| Attribution factor | 200 / 4,000 | 0.05 |
| Attributable | 12,120 × 0.05 | 606 tCO₂e |
| Double-count haircut | 606 × 0.10 | 60.6 t |
| Net attributable | 606 − 60.6 | **545.4 tCO₂e** |

Under the "proprietary" method with dispersion draw 1.10, attributable becomes
606 × 1.10 = 666.6 t — the method-comparison tab visualises exactly this PCAF-vs-proprietary
spread per holding.

### 7.5 Companion analytics

12-quarter per-holding trends (drill-down panel with EVIC and SDG badges), sector emitted-vs-
avoided chart, benchmark comparison by solution category, and a paginated, sortable holdings table
(15 per page, 7-page windowed pagination).

### 7.6 Data provenance & limitations

- **All 150 holdings are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); company names are
  generated prefix+suffix combinations. No portfolio upload, no grid-EF database (IEA/eGRID per
  the guide) is consulted.
- The avoided-emissions figure per holding is *assumed* (ratio driven by solution revenue), not
  computed from a baseline-vs-project comparison; the platform's real counterfactual math
  (`max(0, baseline_EF − solution_EF) × quantity × attribution`) sits unused in the backend
  engine for this page.
- The double-count adjustment is a random 5–15% haircut, not an overlap detection between value-
  chain claims.
- The "proprietary methodology" is PCAF ± seeded noise — a placeholder for genuine method variants
  (e.g. revenue-share or physical-causation allocation).
- Additionality, Article 6 and BVCM checks (guide's ICVCM-scored additionality) are backend-only.

### 7.7 Framework alignment

- **PCAF (Global GHG Accounting Standard)** — attribution = investor share of financing:
  `outstanding / EVIC` for listed equity/bonds. The code implements this exactly (including
  user-overridable factors), then extends it by analogy to avoided emissions — a common but
  non-canonical practice sometimes called "financed avoided emissions".
- **WBCSD Avoided Emissions Framework (2023)** — requires a credible reference scenario,
  attribution transparency and separation from inventory accounting; the page's waterfall
  (gross → attributed → double-count-adjusted) mirrors the framework's reporting decomposition
  even though the gross figure is synthetic.
- **GHG Protocol Scope 4 draft (guide reference)** — comparative/consequential accounting; not
  computed here (see §7.6).
- **ICVCM Core Carbon Principles (guide reference)** — the ICVCM derives CCP labels by assessing
  carbon-crediting *programs* (governance, registry, no double counting) and *methodology
  categories* (additionality, baselines, permanence, quantification) against 10 principles; on
  this page "credibility tier" is a uniform-random label, not a CCP assessment.
- **EU Green Bond Standard (guide reference)** — use-of-proceeds impact reporting is the intended
  downstream use of net-attributable figures; no EuGB template is generated in code.

## 9 · Future Evolution

### 9.1 Evolution A — Real holdings, PCAF attribution, and a computed double-count screen (analytics ladder: rung 1 → 3)

**What.** This module shares the honest backend engine with `avoided-emissions-hub` (9 routes; unscored-rather-than-fabricated additionality, conservative Article 6/BVCM checks), but its own frontend is fully synthetic: PRNG-composed company names, `avoided = emitted × (0.05 + solutionRevPct×1.8 + noise)`, attribution factors from random EVIC/outstanding draws, a "methodology" toggle where non-PCAF applies a *random* 0.85–1.15 factor, and — most problematic for the module's stated purpose — a double-counting deduction that is literally a random 5–15% of attributable emissions (`dblCount = attributable × (0.05 + sr(·)×0.1)`). Evolution A makes the portfolio dimension real, distinct from the hub's per-claim focus.

**How.** (1) Holdings come from `portfolios_pg`; attribution follows PCAF properly — `outstanding / EVIC` per holding from real position data, flowing into the engine's `aggregate_portfolio` with each issuer's activities. (2) The double-count screen becomes a computation: flag pairs of holdings where one company's avoided-emissions claim overlaps another's value chain (supplier/customer links from the platform's supply-chain tables), and flag claims overlapping the portfolio's own financed-emissions Scope 3 — replacing the random haircut with named overlaps. (3) The credibility tier derives from the engine's `REPORTING_QUALITY_TIERS` and additionality scores instead of a uniform random draw over five labels. (4) Green-bond impact reporting reads engine output per use-of-proceeds category.

**Prerequisites.** A seeded demo portfolio with holdings-level EVIC/outstanding (roadmap D0 names this gap); issuer→activities data model shared with the hub's Evolution A; supply-chain linkage coverage will be partial — unscreenable pairs must say so. **Acceptance:** attribution factors reconcile to position data; the double-count tab lists specific overlapping claim pairs or "no linkage data" — never an unexplained percentage; switching methodology changes results deterministically.

### 9.2 Evolution B — Green-bond impact-report drafter (LLM tier 2)

**What.** The module's stated business purpose — use-of-proceeds substantiation and annual impact reporting — is a document-generation workflow, which is exactly where a tool-calling LLM adds value without inventing numbers. The copilot assembles an ICMA Harmonised-Framework-style avoided-emissions impact report: per-category avoided tonnes from `/portfolio-aggregate`, attribution methodology narrative from the actual PCAF factors used, additionality caveats from `/additionality-check` verdicts, and the double-count screen's findings — every figure from engine responses, every caveat from real unscored criteria.

**How.** Tool schemas over the shared engine routes plus Evolution A's portfolio endpoints; output composes into the platform's report-studio render layer per the Tier-3 pattern. Grounding corpus: this Atlas record plus the engine's `CROSS_FRAMEWORK_MAP` (GHG Protocol Part C, ISSB S2 ¶29, ESRS E1) so disclosure-placement advice cites the mapped framework text. The drafting contract mirrors the engine's honest-null doctrine: where `avoidance_ratio` is None (no own-emissions supplied), the report section states the data gap rather than omitting or estimating — an impact report's credibility lives in its stated limitations.

**Prerequisites (hard).** Evolution A — drafting investor-facing impact reports from PRNG holdings and random double-count haircuts would be the exact "methodology inconsistency" failure the module exists to prevent. **Acceptance:** every tonnage, ratio, and attribution factor in a drafted report traces to a tool response; sections for unscreened double-count pairs disclose the linkage gap; the report reproduces byte-identically when re-run on unchanged data.