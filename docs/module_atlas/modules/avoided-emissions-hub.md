# Avoided Emissions Hub
**Module ID:** `avoided-emissions-hub` · **Route:** `/avoided-emissions-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scope 4 / avoided emissions quantification methodology. Covers enabled emissions reductions from sold products vs reference scenarios, PACT methodology alignment, and positive impact accounting.

> **Business value:** Avoided emissions are central to the value proposition of clean tech companies. They are also controversial due to double-counting and methodology inconsistency. This module applies the emerging PACT framework to ensure credible, auditable Scope 4 claims that withstand investor scrutiny.

**How an analyst works this module:**
- Product Impact shows avoided emissions per product category vs reference
- Portfolio Aggregation sums across product portfolio
- Methodology Audit checks for PACT framework compliance
- Double-Count Screen identifies potential overlaps with supply chain claims
- Ratio Analysis shows avoided emissions vs corporate Scope 1+2+3

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOARD_SECTIONS`, `COMPANY_NAMES`, `CRED_METHODS`, `INITIAL_ALERTS`, `KPI_DEFS`, `PERIODS`, `QUARTERS`, `SECTORS`, `SECTOR_COLORS`, `SUB_MODULES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `KPI_DEFS` | 13 | `id`, `label`, `unit`, `fmt` |
| `INITIAL_ALERTS` | 21 | `id`, `level`, `text`, `module`, `ts` |
| `BOARD_SECTIONS` | 9 | `id`, `label`, `icon` |
| `SUB_MODULES` | 6 | `id`, `name`, `desc`, `stat`, `statLabel` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genCompanies` | `()=>COMPANY_NAMES.slice(0,150).map((name,i)=>{` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `emitted` | `Math.round(50+s2*500);` |
| `avoided` | `Math.round(20+s3*800);` |
| `net` | `avoided-emitted;` |
| `credScore` | `Math.round(40+s4*55);` |
| `handprint` | `Math.round(10+sr(i*19+2)*90);` |
| `enablement` | `Math.round(5+sr(i*23+4)*85);` |
| `solutionRev` | `Math.round(10+sr(i*29+6)*80);` |
| `taxonomyPct` | `Math.round(5+sr(i*31+8)*70);` |
| `purePlay` | `sr(i*37+9)>0.55;` |
| `dqScore` | `Math.round(50+sr(i*41+10)*45);` |
| `totalAvoided` | `companies.reduce((a,c)=>a+c.avoided,0)*pMul/1000;` |
| `totalEmitted` | `companies.reduce((a,c)=>a+c.emitted,0)*pMul/1000;` |
| `avoidedRatio` | `totalEmitted>0?totalAvoided/totalEmitted:0;` |
| `avgSolRev` | `companies.reduce((a,c)=>a+c.solutionRev,0)/_n;` |
| `netImpact` | `totalAvoided-totalEmitted;` |
| `avgHandprint` | `companies.reduce((a,c)=>a+c.handprint,0)/_n;` |
| `avgEnablement` | `companies.reduce((a,c)=>a+c.enablement,0)/_n;` |
| `avgCred` | `companies.reduce((a,c)=>a+c.credScore,0)/_n;` |
| `solutionExp` | `companies.filter(c=>c.solutionRev>50).length/_n*100;` |
| `cats` | `{};companies.forEach(c=>{cats[c.sector]=(cats[c.sector]\|\|0)+c.avoided;});` |
| `topCat` | `Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]?.[0]\|\|'N/A';` |
| `attrCov` | `companies.filter(c=>c.attribution>0).length/_n*100;` |
| `avgTax` | `companies.reduce((a,c)=>a+c.taxonomyPct,0)/_n;` |
| `genTrend` | `()=>QUARTERS.map((q,i)=>({` |
| `CRED_METHODS` | `['ISO 14064-2','GHG Protocol Scope 4','PCAF Avoided','EU Taxonomy Art.18','SBTi FLAG','ISSB S2 para 29','Custom Internal','PAS 2080'];` |
| `trendData` | `useMemo(()=>genTrend(),[]);  const sectorDist=useMemo(()=>{ const m={};companies.forEach(c=>{m[c.sector]=(m[c.sector]\|\|0)+c.avoided;});` |
| `top10` | `useMemo(()=>[...companies].sort((a,b)=>b.avoided-a.avoided).slice(0,10),[companies]);` |
| `boost` | `scenarioSlider/100;` |
| `radarData` | `useMemo(()=>CRED_METHODS.map((m,i)=>({` |
| `peerData` | `useMemo(()=>[ {name:'Our Portfolio',avoided:kpis.totalAvoided,credibility:kpis.credibility,handprint:kpis.handprint,highlight:true}, {name:'Peer Avg',avoided:kpis.totalAvoided*0.82,credibility:kpis.credibility*0.88,handprint:kpis.handprint*0.9,highlight:false}, {name:'Top Quartile',avoided:kpis.totalAvoided*1.15,credibility:kpis.credibili` |
| `kpiDeltas` | `useMemo(()=>({ totalAvoided:'+4.2%',avoidedRatio:'+0.08x',solutionRev:'+2.1pp',netImpact:'+8.1%', handprint:'+3.4pts',enablement:'-1.2pp',credibility:'+4.2pts',solutionExp:'+2.3pp', purePlay:'+3',topCategory:'unchanged',attrCoverage:'+1.8pp',taxAlign:'+3.1pp', }),[]);` |
| `auditTrail` | `useMemo(()=>Array.from({length:40},(_,i)=>({ id:i+1, timestamp:`2025-${String(Math.floor(1+sr(i*131)*12)).padStart(2,'0')}-${String(Math.floor(1+sr(i*137)*28)).padStart(2,'0')} ${String(Math.floor(sr(i*139)*24)).padStart(2,'0')}:${String(Math.floor(sr(i*141)*60)).padStart(2,'0')}`, action:['Avoided calc updated','Credibility rescored','Me` |
| `handprintBySector` | `useMemo(()=>SECTORS.slice(0,8).map((s,i)=>({` |
| `rows` | `filteredCompanies.map(c=>`"${c.name}","${c.sector}",${c.emitted},${c.avoided},${c.net},${c.credScore},${c.handprint},${c.enablement},${c.solutionRev},${c.taxonomyPct}`).join('\n');` |
| `blob` | `new Blob([header+rows],{type:'text/csv'});` |
| `val` | `m.stat==='avoided'?Math.round(kpis.totalAvoided*1000):` |
| `methodCompliance` | `CRED_METHODS.map((m,i)=>({` |
| `rate` | `m.companies>0?Math.round(m.compliant/m.companies*100):0;` |

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
**Frontend seed datasets:** `BOARD_SECTIONS`, `COMPANY_NAMES`, `CRED_METHODS`, `INITIAL_ALERTS`, `KPI_DEFS`, `PERIODS`, `QUARTERS`, `SECTORS`, `SECTOR_COLORS`, `SUB_MODULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Product Categories | — | Scope 4 use cases | Most material Scope 4 claims |
| Reference Comparison | — | Methodology | Baseline against which reduction is measured |
| Double-Count Risk | — | Methodology challenge | Two companies claiming same avoided emission |
- **Product lifecycle data** → LCA comparison vs reference → **Avoided emission per unit**
- **Sales volume data** → Scaling calculation → **Total portfolio avoided emissions**
- **Supply chain claims** → Double-count check → **Net avoided emissions**

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
**Methodology:** PACT-aligned avoided emissions
**Headline formula:** `AvoidedEmissions = ReferenceScenario_emissions - Product_emissions; Scope4 = Net(S1+S2+S3) - AvoidedEmissions`

Reference scenario = highest plausible alternative technology/behaviour. Displacement: solar panel displaces coal-fired electricity. Additionality: avoided emissions must not be double-counted with avoided emissions of other actors.

**Standards:** ['WBCSD PACT Framework', 'GHG Protocol Scope 4 Guidance (draft)', 'C40 Cities']
**Reference documents:** WBCSD PACT Framework for Avoided Emissions; GHG Protocol Scope 4 Guidance (draft); Quantis/ERM Avoided Emissions Guide

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
| `avoided-emissions-portfolio` | engine:avoided_emissions_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims a "PACT-aligned" methodology
> where `AvoidedEmissions = ReferenceScenario_emissions − Product_emissions`. Two problems:
> (1) the **frontend hub page computes no reference scenario at all** — each of its 150 companies
> gets *independent random* `emitted` and `avoided` values, so the displayed "avoided" numbers are
> not derived from any baseline comparison; and (2) the platform's real avoided-emissions
> methodology lives in `backend/services/avoided_emissions_engine.py` (which cites **GHG Protocol
> Scope 4 Guidance 2022 + SBTi BVCM + Paris Article 6**, not WBCSD PACT), and the page **never
> calls it** — no fetch/axios in the file despite the module's registered trace routes
> (`POST /api/v1/avoided-emissions/*`). Both layers are documented below.

### 7.1 What the module computes

**Frontend (hub):** a 150-company portfolio cockpit with 12 KPIs, 21 alerts, 9 board-report
sections and 5 sub-module cards. Company generation (per company `i`):

```js
emitted     = round(50 + s2×500)        // ktCO2e, s* = sr(seed) draws
avoided     = round(20 + s3×800)        // ktCO2e — independent of emitted
net         = avoided − emitted
credScore   = round(40 + s4×55)         // → High ≥80 / Medium ≥60 / Low
handprint   = round(10 + sr(i*19+2)×90);  enablement = round(5 + sr(i*23+4)×85)
scope4      = round(avoided × 0.85);      attribution = round(avoided × (0.5 + sr(i*43)×0.4))
```

**Backend (engine):** per-activity avoided emissions with real factor tables:

```python
avoided_per_unit = max(0, baseline_factor − solution_factor)          # kgCO2e/unit
total_avoided_tCO2e = avoided_per_unit × quantity × attribution_factor / 1000
```

plus additionality scoring, Article 6 ITMO eligibility, SBTi BVCM eligibility, and portfolio
aggregation with `net_benefit = total_avoided − own_S1+2+3` and
`avoidance_ratio = total_avoided / own_emissions` (both honestly `None` when own emissions are not
supplied).

### 7.2 Parameterisation

Backend baseline factors (kgCO₂e/unit, engine constants — standard emission-factor magnitudes):

| Baseline | EF | Solution | EF |
|---|---|---|---|
| coal_electricity_kwh | 0.820 | solar_kwh | 0.040 |
| grid_average_eu_kwh | 0.276 | wind_kwh | 0.011 |
| grid_average_us_kwh | 0.386 | ev_km | 0.050 |
| diesel_litre | 2.640 | heat_pump_kwh | 0.060 |
| steel_tonne_bof (t) | 2.200 | green_steel_tonne | 0.400 |
| beef_kg | 27.00 | plant_based_protein_kg | 2.000 |
| car_petrol_km | 0.192 | led/efficiency kwh_saved | 0.000 |

Rubrics: additionality = mean of *supplied* criterion scores over 5 criteria (regulatory surplus,
investment, technological, temporal, geographical); "strong" requires mean ≥ 70 **and** ≥ 4
criteria ≥ 60; unsupplied criteria stay unscored (no fabrication). Article 6 requires **all 5**
criteria (corresponding adjustment, authorization, participation, SD contribution,
real/permanent/additional) explicitly confirmed; `ITMO_potential = annual_avoided ×
attribution_factor` only when eligible. BVCM eligibility = **≥ 4 of 5** SBTi requirements.
Reporting-quality tiers: ≥80 verified / ≥60 assured / ≥40 reported / else estimated.

Frontend constants: period multipliers 0.25 (Q4 2025) / 0.75 (YTD) / 1.0 (FY); credibility tiers
80/60; 8 credibility methods radar (ISO 14064-2, GHG Protocol Scope 4, PCAF Avoided, EU Taxonomy
Art. 18, SBTi FLAG, ISSB S2 ¶29, Custom Internal, PAS 2080); scenario uplift
`net + net×(slider/100)×0.6`. All synthetic demo values.

### 7.3 Calculation walkthrough

1. **Frontend KPIs** — `totalAvoided = Σ avoided × pMul / 1000` (Mt), `avoidedRatio =
   totalAvoided/totalEmitted` (guarded), `netImpact = totalAvoided − totalEmitted`, averages for
   handprint/enablement/credibility/taxonomy, `solutionExp` = share of companies with
   solutionRev > 50%, `attrCoverage` = share with attribution > 0, top sector by avoided.
2. **Trend** — 12 quarters with baked-in narrative: `emitted = 180 + noise − 4i` (declining),
   `avoided = 120 + noise + 8i` (rising) → net crosses positive mid-series by construction.
3. **Peer panel** — hard-coded ratios of own KPIs (Peer Avg = 0.82×avoided, Top Quartile = 1.15×).
4. **Backend full assessment** — activities → per-activity calc (§7.1) → additionality → Article 6
   → BVCM → portfolio aggregation; activities missing avoided totals contribute 0 and are counted
   in `activities_missing_avoided`.

### 7.4 Worked example — backend activity calc

Solar generation displacing coal power: `baseline = 0.820`, `solution = 0.040` kgCO₂e/kWh,
`quantity = 10,000,000 kWh`, investor `attribution_factor = 0.25`:

| Step | Computation | Result |
|---|---|---|
| Avoided per unit | max(0, 0.820 − 0.040) | 0.780 kgCO₂e/kWh |
| Gross avoided | 0.780 × 10⁷ / 1000 | 7,800 tCO₂e |
| Attributed | 7,800 × 0.25 | **1,950 tCO₂e** |
| Category | "solar_panels" ∈ enabled examples | enabled |
| Net benefit (own S1-3 = 5,000 t) | 1,950 − 5,000 | −3,050 t (net emitter) |
| Avoidance ratio | 1,950 / 5,000 | 0.39× |

Against the EU grid average instead of coal, the same activity yields
`(0.276 − 0.040) × 10⁷ × 0.25 / 1000 = 590 tCO₂e` — a 3.3× swing purely from baseline choice,
which is exactly why the guide's "reference scenario" question is the crux of Scope 4 credibility.

### 7.5 Companion analytics on the page

Sub-module cards (Scope 4 Calculator, Handprint Analytics, Enablement Mapping, Portfolio Lens,
Taxonomy Screening) surface single KPI stats; a methodology-compliance table computes per-method
`rate = compliant/companies × 100`; a 40-row synthetic audit trail and a configurable board report
(audience/date-range/section toggles) round out the page. CSV export writes the filtered company
table (10 columns).

### 7.6 Data provenance & limitations

- **Frontend data is 100% synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`), and — critically —
  `avoided` is drawn independently of `emitted`, sector, or any baseline: the page demonstrates
  the *reporting surface* of Scope 4, not its calculation.
- The frontend/backend disconnect means the honest-null design of the engine (unscored criteria,
  None ratios) is invisible in the UI, which always shows fully-populated numbers.
- Backend factor tables are engine constants of standard magnitude (e.g. coal 0.820 kgCO₂e/kWh ≈
  IEA supercritical coal; beef 27 kg/kg ≈ Poore & Nemecek) but carry no vintage/source metadata in
  code — a production build should version them.
- No double-counting screen is computed anywhere (the guide's "Double-Count Screen" exists only as
  a red alert string in `INITIAL_ALERTS`).
- `scope4 = avoided × 0.85` and `attribution = avoided × (0.5–0.9)` are display heuristics.

### 7.7 Framework alignment

- **GHG Protocol (avoided emissions / "Scope 4")** — GHGP's *Estimating and Reporting Avoided
  Emissions* guidance requires a consequential comparison of the assessed product against the
  most-likely reference scenario, reported **separately** from Scope 1/2/3. The backend implements
  the comparative-EF core and the separate net-benefit reporting; the frontend does not.
- **SBTi BVCM (2023)** — beyond-value-chain mitigation must be additional to (not netted against)
  science-based targets; the engine's 5-requirement check (science-based, beyond boundary, no
  double counting, high quality, transparent reporting) mirrors the guidance and warns on boundary
  and double-counting failures.
- **Paris Agreement Article 6.2/6.4** — ITMOs require host-country authorization and corresponding
  adjustments so the same reduction isn't counted in two NDCs; the engine enforces all-criteria
  eligibility and flags `corresponding_adjustment_required: True` unconditionally.
- **WBCSD PACT (guide reference)** — PACT is primarily a *product carbon footprint data-exchange*
  initiative; the guide conflates it with WBCSD's separate Avoided Emissions Framework. Neither is
  cited in code.
- **ICVCM CCPs** — referenced as the "high_quality" BVCM requirement: the ICVCM assesses carbon-
  credit programs and methodology categories against 10 Core Carbon Principles (governance,
  additionality, permanence, robust quantification, etc.); here it is a caller-confirmed boolean,
  not an assessed score.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the seeded hub to its own honest engine, with dynamic grid baselines (analytics ladder: rung 1 → 3)

**What.** This module is two disconnected halves. The backend (`services/avoided_emissions_engine.py`, 9 routes) is one of the platform's most rigorously honest engines — additionality criteria unscored rather than fabricated, Article 6 criteria defaulting to False unless confirmed, `net_benefit_tco2e` reported as None without real own-emissions input. The frontend hub, meanwhile, renders 150 PRNG-generated companies (`avoided = round(20+s3×800)`, seeded credScores, a synthetic 40-row audit trail, hard-coded `kpiDeltas`) and never calls those routes. Evolution A connects them and upgrades the engine's static factors.

**How.** (1) The hub's company table becomes a portfolio of real assessments: activities entered (or CSV-imported) per company, run through `POST /full-assessment` and `/portfolio-aggregate`; KPI tiles compute from engine responses, with the engine's honest-null convention surfacing as explicit "insufficient data" states instead of the current always-populated synthetic averages. (2) Upgrade `BASELINE_FACTORS` from static constants (grid_average_eu_kwh 0.276 etc.) to vintage-tagged lookups backed by the platform's EIA/ENTSO-E ingested grid data, so avoided-kWh claims use year- and region-correct counterfactuals — the single biggest methodological lever for Scope 4 credibility (rung 3: factors calibrated to observed grid mix). (3) Exercise the six POST routes in the lineage harness (all currently `skipped` — the write-side blind spot).

**Prerequisites.** The lineage-harness POST triage (REQUIRE_AUTH gating vs payload issues); an activities data model (currently there is no persistence — the engine is stateless); retire `kpiDeltas` (hard-coded "+4.2%" strings) and the synthetic audit trail. **Acceptance:** a company with no supplied own-emissions shows null avoidance ratio in the UI (not a number); the same solar activity assessed for 2020 vs 2024 EU grid uses different baseline factors with vintages displayed; POST routes pass the harness.

### 9.2 Evolution B — Scope 4 claims analyst enforcing the honest-null contract (LLM tier 2)

**What.** The engine's conservative design makes it an ideal Tier-2 tool surface: a copilot that walks an analyst through a defensible avoided-emissions claim — "assess our heat-pump product line" triggers `/calculate-activity` (baseline − solution × quantity × attribution), then `/additionality-check`, `/bvcm-check`, and `/article6-eligibility` in sequence, narrating each verdict and, critically, relaying every unscored criterion and None verbatim ("temporal additionality: unscored — no evidence supplied") rather than smoothing gaps.

**How.** Tool schemas from the 9 existing OpenAPI operations (6 POSTs are computational, not persisting — no confirmation gating needed); grounding corpus is this Atlas record plus the engine's own reference constants (`AVOIDED_EMISSION_CATEGORIES` with per-category additionality standards, `CROSS_FRAMEWORK_MAP` for "where can I disclose this?" questions spanning GHG Protocol, ISSB S2 ¶29, ESRS E1). The copilot's system prompt encodes the module's core doctrine — avoided emissions are controversial precisely because of double-counting and inconsistent baselines — so it always asks for the attribution factor's basis and flags claims where `reporting_quality_score` lands in the "estimated" tier.

**Prerequisites.** POST routes callable (same triage as Evolution A); nothing else hard — the engine surface is ready today. **Acceptance:** every tCO₂e figure in an answer traces to a tool response; an assessment with unconfirmed Article 6 criteria yields "not eligible" with the unmet list, never an optimistic summary; the copilot refuses to net avoided emissions against Scope 1–3 when the engine returned None.