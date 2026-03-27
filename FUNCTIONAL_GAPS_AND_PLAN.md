# Functional Gap Analysis & Implementation Plan
## By User Type: FI, REIT, Asset Manager, VC/PE, Energy

**Date:** 2026-03-08
**Constraint:** Each implementation session must fit within a single context window (~50k lines output)

---

## PART A: USE CASE FUNCTIONAL REQUIREMENTS (What Each User Type Needs)

---

### A1. Financial Institutions (Banks, Insurers)

#### Core Workflows

| # | Use Case | Description | Current Status |
|---|----------|-------------|----------------|
| FI-01 | Loan Book Climate Stress Test | Run NGFS scenarios across entire loan book; output PD/LGD/EAD shifts per sector, per scenario, per stage | 60% — ECL + scenarios exist; no EAD model, no automated stress test runner |
| FI-02 | PCAF Financed Emissions Report | Calculate Scope 1/2/3 financed emissions at security, fund, and portfolio level with DQS hierarchy | 80% — PCAF engine + bridge complete; missing Scope 3 financed and fund-level aggregation report |
| FI-03 | Green Asset Ratio (GAR) Calculation | Auto-calculate EU Taxonomy Art.449a GAR from loan book classification | 30% — Table exists (fi_eu_taxonomy_kpis); no automated calculation from taxonomy assessments |
| FI-04 | EBA Pillar 3 ESG Disclosure | Generate structured disclosure per CRR Art.431-455 + EBA ITS templates | 10% — Regulatory panels exist; no ITS XML/XBRL export format |
| FI-05 | Counterparty Climate Risk Scoring | Score each counterparty on transition + physical risk; feed into PD adjustment | 50% — Counterparty routes exist; no composite climate risk score |
| FI-06 | IFRS 9 ECL Full Lifecycle | Stage 1/2/3 migration, SICR triggers, vintage analysis, backtesting | 70% — ECL engine strong; missing vintage analysis and PD backtesting (Gini/KS) |
| FI-07 | Credit Decision API | Real-time PD adjustment per counterparty + scenario for credit origination | 0% — Not started |
| FI-08 | Insurance Solvency II / Cat Risk | Technical provisions, SCR, MCR, cat risk underwriting | 5% — insurance_climate_risk.py exists but minimal |

#### Functional Gaps (FI-Specific)

| Gap ID | Gap | Priority | Effort |
|--------|-----|----------|--------|
| FI-G1 | No EAD model (Credit Conversion Factors by asset class) | P1 | 2 weeks |
| FI-G2 | No Green Asset Ratio auto-calculation | P1 | 1 week |
| FI-G3 | No Pillar 3 ESG ITS export | P2 | 3 weeks |
| FI-G4 | No PD backtesting (Gini, KS, Brier score) | P1 | 1 week |
| FI-G5 | No counterparty composite climate score | P1 | 1 week |
| FI-G6 | No stress test runner (automated multi-scenario) | P1 | 2 weeks |
| FI-G7 | No credit decision real-time API | P2 | 2 weeks |
| FI-G8 | Insurance module incomplete (Solvency II) | P3 | 4 weeks |
| FI-G9 | No LGD downturn (TTC vs PIT) differentiation | P2 | 1 week |
| FI-G10 | No sovereign bond climate risk | P2 | 2 weeks |

---

### A2. Real Estate / REITs

#### Core Workflows

| # | Use Case | Description | Current Status |
|---|----------|-------------|----------------|
| RE-01 | Portfolio Valuation Roll-Up | Aggregate property-level DCF/cap-rate valuations to fund/REIT NAV with ESG adjustments | 40% — Single-property valuation works; no portfolio aggregation |
| RE-02 | CRREM Pathway Alignment | Map each property to CRREM decarbonization pathway; identify stranding year | 60% — CRREM engine exists (739 lines); not wired to property portfolio UI |
| RE-03 | EPC Transition Risk Scoring | Score properties by EPC rating against regulatory timeline (EU MEPS 2030/2033) | 20% — EPC field exists on properties; no regulatory timeline stranding logic |
| RE-04 | Physical Risk Mapping (Flood/Heat/Fire) | Overlay physical hazard layers on property locations | 10% — CLVaR engine exists; no spatial queries (PostGIS), no hazard APIs |
| RE-05 | Retrofit CapEx Planning | NPV/payback analysis for energy efficiency upgrades per property | 0% — Not started |
| RE-06 | GRESB Submission Workflow | Auto-populate GRESB questionnaire from platform data; track completion % | 20% — GRESB scoring exists; no questionnaire template population |
| RE-07 | Green Premium / Brown Discount Quantification | Empirical rent/cap-rate differential by EPC/certification level | 10% — Sustainability calculator has rent premium estimates; no empirical model |
| RE-08 | Tenant ESG Profile Integration | Track tenant emissions, green lease clauses, occupancy patterns | 0% — No tenant data model |
| RE-09 | Fund-Level LP Reporting | Generate periodic investor reports with ESG KPIs per fund | 0% — No fund structure / LP tracking |
| RE-10 | BNG / Nature Restoration Assessment | UK Biodiversity Net Gain + EU Nature Restoration Law compliance | 0% — Not started |

#### Functional Gaps (RE-Specific)

| Gap ID | Gap | Priority | Effort |
|--------|-----|----------|--------|
| RE-G1 | No portfolio-level valuation aggregation (NAV roll-up) | P1 | 2 weeks |
| RE-G2 | CRREM not wired to property portfolio | P1 | 1 week |
| RE-G3 | No EPC regulatory timeline stranding logic (EU MEPS) | P1 | 1 week |
| RE-G4 | No retrofit CapEx NPV/payback calculator | P1 | 2 weeks |
| RE-G5 | No tenant data model or green lease tracking | P2 | 2 weeks |
| RE-G6 | No GRESB questionnaire auto-population | P2 | 2 weeks |
| RE-G7 | No green premium empirical hedonic model | P2 | 1 week |
| RE-G8 | No fund structure / LP tracking tables | P2 | 2 weeks |
| RE-G9 | PostGIS adoption for spatial hazard queries | P1 | 3 weeks |
| RE-G10 | No BNG / Nature Restoration module | P3 | 3 weeks |

---

### A3. Asset Managers (Long-Only, Multi-Asset)

#### Core Workflows

| # | Use Case | Description | Current Status |
|---|----------|-------------|----------------|
| AM-01 | Portfolio Construction with ESG Constraints | Optimize portfolio weights subject to carbon budget, exclusion list, PAI limits | 10% — Portfolio analytics engine exists but MOCKED |
| AM-02 | SFDR Periodic Reporting (Art. 8/9) | Auto-generate SFDR periodic report with all mandatory PAI indicators + EU Taxonomy % | 40% — PAI indicators calculated; no auto-populated report template |
| AM-03 | ESG Attribution Analysis | Decompose portfolio ESG performance into allocation + selection + interaction effects | 0% — Not started |
| AM-04 | Benchmark Tracking & Relative Performance | Track portfolio vs MSCI/S&P ESG indices; calculate tracking error, active share | 30% — Index profiles exist; no tracking error or active share calculation |
| AM-05 | Stewardship & Voting Outcomes | Track engagement activities, voting records, and measure engagement effectiveness | 20% — Engagement tracker exists; no voting record aggregation or outcome measurement |
| AM-06 | Fund Look-Through Carbon Footprint | Calculate WACI at fund level with look-through to underlying securities | 70% — PCAF advanced does fund look-through; missing consolidated fund report |
| AM-07 | Client Reporting (Institutional LP) | Generate quarterly/annual ESG report per client mandate | 0% — No client reporting templates |
| AM-08 | Exclusion List Management | Maintain and apply exclusion criteria (weapons, tobacco, thermal coal) | 0% — Not started |
| AM-09 | Paris Alignment & Net Zero Tracker | Track portfolio temperature score over time; compare to 1.5/2.0C pathway | 60% — Temperature scoring exists; no time-series tracking or visual trajectory |
| AM-10 | Regulatory Compliance Dashboard | Single view of SFDR, EU Taxonomy, ISSB compliance status per fund | 30% — Individual regulatory panels exist; no unified fund compliance view |

#### Functional Gaps (AM-Specific)

| Gap ID | Gap | Priority | Effort |
|--------|-----|----------|--------|
| AM-G1 | Portfolio analytics engine entirely MOCKED (import random) | P0 | 3 weeks |
| AM-G2 | No ESG attribution analysis (Brinson-Fachler) | P1 | 2 weeks |
| AM-G3 | No SFDR periodic report auto-generation | P1 | 2 weeks |
| AM-G4 | No benchmark tracking error / active share | P1 | 1 week |
| AM-G5 | No exclusion list management | P1 | 1 week |
| AM-G6 | No client reporting templates | P2 | 2 weeks |
| AM-G7 | No stewardship outcome measurement | P2 | 1 week |
| AM-G8 | No unified fund compliance dashboard | P2 | 2 weeks |
| AM-G9 | No fund structure / share class / NAV tables | P1 | 2 weeks |
| AM-G10 | No holding-level position data model | P1 | 1 week |

---

### A4. VC / PE Firms

#### Core Workflows

| # | Use Case | Description | Current Status |
|---|----------|-------------|----------------|
| PE-01 | Deal Screening ESG Risk Assessment | Pre-investment ESG risk scoring with red flags, sector heat map, regulatory exposure | 0% — Not started |
| PE-02 | ESG Due Diligence Checklist | Standardized DD framework with material topic identification per sector | 0% — Not started |
| PE-03 | Portfolio Company ESG Monitoring | Track KPIs (emissions, energy, water, waste, diversity) across portfolio companies over time | 10% — csrd_kpi_values can store KPIs; no PC-specific dashboard |
| PE-04 | Value Creation Plan (ESG) | Post-acquisition ESG improvement roadmap with target-setting and progress tracking | 0% — Not started |
| PE-05 | Exit Readiness Scoring | Assess portfolio company ESG maturity for IPO/trade sale; gap remediation tracker | 0% — Not started |
| PE-06 | Impact Measurement (IRIS+ / SDG) | Map portfolio company activities to IRIS+ metrics and UN SDGs | 5% — Impact calculator exists but no IRIS+/SDG framework |
| PE-07 | GP/LP ESG Reporting | Generate annual ESG report for LPs; ILPA/PRI template alignment | 0% — Not started |
| PE-08 | IRR Sensitivity to ESG Factors | Model how carbon pricing, regulation, and ESG improvements affect returns | 10% — Scenario engine exists; no PE-specific IRR sensitivity model |
| PE-09 | Fund-Level Carbon Footprint | Aggregate financed emissions across portfolio companies using PCAF methodology | 40% — PCAF engine works; no PE fund-level wrapper |
| PE-10 | Co-Investment & Syndication Tracking | Track co-investors, pro-rata rights, follow-on rounds | 0% — Not started |

#### Functional Gaps (PE-Specific)

| Gap ID | Gap | Priority | Effort |
|--------|-----|----------|--------|
| PE-G1 | No deal pipeline / screening module | P1 | 3 weeks |
| PE-G2 | No ESG due diligence framework | P1 | 2 weeks |
| PE-G3 | No portfolio company monitoring dashboard | P1 | 2 weeks |
| PE-G4 | No value creation plan / exit readiness | P2 | 2 weeks |
| PE-G5 | No IRIS+ / SDG impact framework | P2 | 2 weeks |
| PE-G6 | No GP/LP reporting templates (ILPA/PRI) | P2 | 2 weeks |
| PE-G7 | No IRR sensitivity to ESG factors model | P1 | 1 week |
| PE-G8 | No fund structure (vintage, commitment, drawdown, distribution) | P1 | 2 weeks |
| PE-G9 | No cap table / equity structure model | P2 | 2 weeks |
| PE-G10 | No co-investment / syndication tracking | P3 | 1 week |

---

### A5. Energy Sector Companies (Utilities, IPPs, Oil & Gas)

#### Core Workflows

| # | Use Case | Description | Current Status |
|---|----------|-------------|----------------|
| EN-01 | Generation Mix Transition Planning | Model coal/gas phase-out schedule with renewable replacement timeline and cost | 50% — Generation mix + stranded assets exist; no interactive transition planner |
| EN-02 | Renewable Project Finance (P50/P90) | Energy yield modeling with P50/P90 confidence, LCOE, IRR under carbon price scenarios | 30% — LCOE in green_hydrogen_calculator; no wind/solar yield model |
| EN-03 | PPA Risk Scoring | Score power purchase agreements on counterparty credit, price risk, curtailment risk | 0% — Not started |
| EN-04 | Grid Decarbonization Pathway | Track network operator transition plans, grid emission factor trajectories by country | 40% — TOOL07 grid EF exists; no time-series trajectory |
| EN-05 | Methane Monitoring (OGMP 2.0) | Quantify methane leakage from O&G operations; report per OGMP 2.0 framework | 10% — energy_csrd_e2_pollution has methane field; no OGMP framework |
| EN-06 | Stranded Asset Retirement Scheduling | Optimal retirement sequencing with just transition cost overlays and replacement capex | 60% — Stranded asset calc exists; no retirement sequencing optimizer |
| EN-07 | Capacity Factor Forecasting | Project wind/solar output under climate scenarios (wind pattern shifts, irradiance changes) | 0% — Not started |
| EN-08 | Energy Storage Modeling | Battery degradation, round-trip efficiency, replacement capex under different dispatch profiles | 0% — Not started |
| EN-09 | Scope 3 Category 11 (End-Use Combustion) | Calculate downstream emissions for fossil fuel producers | 10% — Scope 3 engine has categories; no Cat 11 specific model for energy |
| EN-10 | CSRD E1-E5 Complete Disclosure | Generate structured CSRD environmental disclosure from operational data | 50% — All 5 CSRD E tables exist; no auto-population from operational data |

#### Functional Gaps (EN-Specific)

| Gap ID | Gap | Priority | Effort |
|--------|-----|----------|--------|
| EN-G1 | No renewable project P50/P90 yield model | P1 | 2 weeks |
| EN-G2 | No PPA risk scoring module | P1 | 2 weeks |
| EN-G3 | No methane monitoring (OGMP 2.0) | P1 | 1 week |
| EN-G4 | No capacity factor forecasting under climate scenarios | P2 | 2 weeks |
| EN-G5 | No energy storage / battery modeling | P2 | 2 weeks |
| EN-G6 | No generation transition planner (interactive) | P1 | 2 weeks |
| EN-G7 | No Scope 3 Cat 11 end-use combustion model | P1 | 1 week |
| EN-G8 | No grid EF trajectory (time-series by country) | P1 | 1 week |
| EN-G9 | No CSRD E1-E5 auto-population from operational data | P2 | 2 weeks |
| EN-G10 | No nuclear decommissioning / waste liability model | P3 | 3 weeks |

---

## PART B: CROSS-CUTTING GAPS (From Council Review)

| Gap ID | Gap | Affects | Priority | Effort |
|--------|-----|---------|----------|--------|
| XC-G1 | No XBRL/iXBRL export for CSRD/ISSB | All (regulatory submission) | P0 | 4 weeks |
| XC-G2 | No disclosure completeness checker | All (ESRS) | P1 | 2 weeks |
| XC-G3 | No unified Entity 360 dashboard | All (cross-module view) | P1 | 3 weeks |
| XC-G4 | No Cmd+K command palette / global search | All (UX) | P1 | 1 week |
| XC-G5 | No multi-year trend visualization | All (reporting) | P1 | 1 week |
| XC-G6 | Dashboard uses seed data, not real data | All (trust) | P0 | 2 weeks |
| XC-G7 | No counterparty master table (FK alignment) | FI, AM, Energy | P1 | 2 weeks |
| XC-G8 | No PostGIS adoption for spatial queries | RE, Nature | P1 | 3 weeks |

---

## PART C: IMPLEMENTATION PLAN (Session-Safe)

### Design Principles

1. **Each session = 1 deliverable unit** — a self-contained service + route + test file that can be completed in ~2,000-4,000 lines of output
2. **No session exceeds 60% of context window** — leaves room for reading existing code + iteration
3. **Backend first, frontend later** — services and routes are higher value and smaller per unit
4. **Reuse existing patterns** — follow methodology_engine.py dispatch dict, ECL engine dataclass patterns, PCAF bridge architecture
5. **Tests in same session** — every service file gets a companion test file in the same session

---

### Phase 1: Financial Institution Completions (4 sessions)

#### Session 1A: EAD Model + Credit Conversion Factors
**Files:** `services/ead_calculator.py` (~400 lines), `api/v1/routes/ead.py` (~200 lines), `tests/test_ead_calculator.py` (~300 lines)
**Scope:**
- Credit Conversion Factor (CCF) by Basel asset class (corporate, SME, retail, sovereign, bank, specialized lending)
- Off-balance-sheet exposure conversion (undrawn commitments, guarantees, letters of credit, derivatives)
- Maturity adjustment (effective maturity formula per Basel III)
- Integration point: wire EAD into ECL engine (ECL = PD x LGD x EAD)
- 9 Basel asset classes x 4 facility types = 36 CCF combinations
**Est. Output:** ~900 lines new code + ~300 lines tests

#### Session 1B: Green Asset Ratio Calculator + Counterparty Climate Score
**Files:** `services/gar_calculator.py` (~350 lines), `services/counterparty_climate_scorer.py` (~300 lines), `api/v1/routes/gar.py` (~150 lines), `tests/test_gar_counterparty.py` (~300 lines)
**Scope:**
- GAR = EU Taxonomy aligned assets / total covered assets (Art.449a CRR)
- Numerator: loans to taxonomy-eligible activities with alignment assessment
- Denominator: total lending book excluding sovereign, central bank, interbank
- Breakdown by environmental objective (climate mitigation, adaptation, water, circular, pollution, biodiversity)
- Counterparty composite climate score: weighted average of transition risk (40%), physical risk (30%), alignment (20%), data quality (10%)
- Score range 0-100 with rating mapping (A+ to D-)
**Est. Output:** ~800 lines new code + ~300 lines tests

#### Session 1C: Stress Test Runner + PD Backtesting
**Files:** `services/stress_test_runner.py` (~500 lines), `services/pd_backtester.py` (~300 lines), `api/v1/routes/stress_testing.py` (~200 lines), `tests/test_stress_test_pd_backtest.py` (~350 lines)
**Scope:**
- Automated multi-scenario stress test: takes loan book + NGFS scenarios, runs ECL engine per scenario, outputs PD/LGD/EAD/ECL migration matrices
- Stage migration matrix (1->2, 2->3, 3->2 recovery) per scenario
- Sector concentration heatmap (sector x scenario x stage)
- PD backtesting: Gini coefficient, KS statistic, Brier score, Hosmer-Lemeshow test
- Traffic light system (green/amber/red) per Basel regulatory guidance
**Est. Output:** ~1,000 lines new code + ~350 lines tests

#### Session 1D: LGD Downturn + Vintage Analysis
**Files:** `services/lgd_downturn_engine.py` (~300 lines), `services/vintage_analyzer.py` (~300 lines), `api/v1/routes/lgd_vintage.py` (~200 lines), `tests/test_lgd_vintage.py` (~250 lines)
**Scope:**
- LGD downturn model: Frye-Jacobs methodology, downturn LGD = f(PD_downturn, correlation)
- Through-the-cycle vs point-in-time LGD differentiation
- Collateral haircut stress (real estate -20%, financial -30%, other -40% under adverse)
- Vintage analysis: cohort-based ECL tracking over origination quarters
- Default rate by vintage, loss given default by vintage, cumulative loss curves
**Est. Output:** ~800 lines new code + ~250 lines tests

---

### Phase 2: Real Estate / REIT Completions (3 sessions)

#### Session 2A: Portfolio NAV Roll-Up + CRREM Integration
**Files:** `services/re_portfolio_engine.py` (~500 lines), `api/v1/routes/re_portfolio.py` (~250 lines), `tests/test_re_portfolio.py` (~300 lines)
**Scope:**
- Aggregate property-level valuations to portfolio/fund NAV
- Weighted average cap rate, NOI yield, occupancy, EPC distribution
- Wire CRREM stranding engine to property portfolio: stranding year per property, portfolio-level stranding risk %
- EPC distribution chart data (A-G by property count and by GAV)
- Green vs brown split: properties meeting 2030/2033 MEPS vs those requiring retrofit
- Portfolio carbon intensity (kgCO2e/m2) with CRREM pathway overlay
**Est. Output:** ~750 lines new code + ~300 lines tests

#### Session 2B: EPC Transition Risk + Retrofit CapEx Planner
**Files:** `services/epc_transition_engine.py` (~400 lines), `services/retrofit_planner.py` (~400 lines), `api/v1/routes/epc_retrofit.py` (~200 lines), `tests/test_epc_retrofit.py` (~300 lines)
**Scope:**
- EPC regulatory timeline: EU MEPS (minimum energy performance standards) by country
  - Netherlands: EPC C by 2023 (done), EPC A by 2030
  - UK: EPC B by 2030
  - France: DPE E by 2025, D by 2028, C by 2034
  - Germany: EPC by building age milestones
- Stranding risk score by EPC rating x country x year
- Retrofit CapEx planner: per-measure cost estimates (LED, HVAC, insulation, solar, heat pump)
- NPV and payback period per measure and per property
- Portfolio-level retrofit budget: total capex needed, prioritized by ROI
- Green value uplift estimate post-retrofit
**Est. Output:** ~1,000 lines new code + ~300 lines tests

#### Session 2C: Green Premium Model + Tenant ESG
**Files:** `services/green_premium_engine.py` (~350 lines), `services/tenant_esg_tracker.py` (~300 lines), `api/v1/routes/green_premium_tenant.py` (~200 lines), `tests/test_green_premium_tenant.py` (~250 lines)
**Scope:**
- Green premium: empirical rent differential by certification level (LEED Platinum +12%, Gold +8%, Silver +4%)
- Brown discount: EPC-based cap rate expansion (G: +80bps, F: +60bps, E: +40bps)
- Net effective rent adjustment per property
- Tenant ESG data model: tenant name, sector, Scope 1/2 emissions, green lease clauses (yes/no)
- Green lease clause coverage: % of leases with energy data sharing, fit-out standards, waste management
- Occupancy ESG score: weighted by leased area
**Est. Output:** ~850 lines new code + ~250 lines tests

---

### Phase 3: Asset Manager Completions (3 sessions)

#### Session 3A: Fund Structure + Holding-Level Position Model
**Files:** `services/fund_structure_engine.py` (~400 lines), `db/models/fund_models.py` (~120 lines), `alembic/versions/037_add_fund_structure_tables.py` (~200 lines), `api/v1/routes/fund_management.py` (~250 lines), `tests/test_fund_structure.py` (~250 lines)
**Scope:**
- Fund model: fund_id, name, SFDR classification (Art.6/8/9), inception date, AUM, base currency
- Share class model: class_id, fund_id, NAV, TER, management fee, performance fee
- Holding model: holding_id, fund_id, security_id (ISIN), weight, market_value, acquisition_cost, entry_date
- Benchmark assignment: fund_id -> benchmark_index (MSCI World, S&P 500, etc.)
- LP/investor model: investor_id, fund_id, commitment, called, distributed, DPI, TVPI
- Migration for new tables
**Est. Output:** ~1,200 lines new code + ~250 lines tests

#### Session 3B: ESG Attribution + Benchmark Analytics
**Files:** `services/esg_attribution_engine.py` (~500 lines), `services/benchmark_analytics.py` (~350 lines), `api/v1/routes/attribution_benchmark.py` (~200 lines), `tests/test_attribution_benchmark.py` (~300 lines)
**Scope:**
- Brinson-Fachler ESG attribution: decompose portfolio carbon footprint change into:
  - Allocation effect (sector weight differences vs benchmark)
  - Selection effect (company carbon intensity differences within sector)
  - Interaction effect
- Tracking error calculation (ex-post, annualized)
- Active share (% holdings differing from benchmark)
- ESG score delta vs benchmark (portfolio avg vs index avg)
- PAI indicator comparison vs benchmark
- Information ratio (excess ESG return / tracking error)
**Est. Output:** ~1,050 lines new code + ~300 lines tests

#### Session 3C: SFDR Periodic Report + Exclusion List + Compliance Dashboard
**Files:** `services/sfdr_report_generator.py` (~400 lines), `services/exclusion_list_engine.py` (~250 lines), `api/v1/routes/sfdr_exclusion.py` (~200 lines), `tests/test_sfdr_exclusion.py` (~250 lines)
**Scope:**
- SFDR periodic report template (Art.8/9): auto-populate from PAI calculations
  - Environmental/social characteristics promoted
  - Proportion of investments: taxonomy aligned %, other environmental %, social %, other %
  - Top 10 investments table
  - PAI indicator values with year-over-year comparison
- Exclusion list engine: maintain exclusion criteria per fund
  - Controversial weapons (cluster munitions, anti-personnel mines, biological/chemical)
  - Tobacco (production >5% revenue)
  - Thermal coal (mining >10% revenue, power >30% generation)
  - Arctic oil & gas
  - Custom user-defined exclusions
- Screen portfolio holdings against exclusion list; flag breaches
- Fund compliance dashboard data: per fund, show SFDR/Taxonomy/PAI/exclusion status
**Est. Output:** ~850 lines new code + ~250 lines tests

---

### Phase 4: VC/PE Module (3 sessions)

#### Session 4A: Deal Pipeline + ESG Screening
**Files:** `services/pe_deal_engine.py` (~500 lines), `db/models/pe_models.py` (~150 lines), `alembic/versions/038_add_pe_tables.py` (~200 lines), `api/v1/routes/pe_deals.py` (~250 lines), `tests/test_pe_deals.py` (~300 lines)
**Scope:**
- Deal pipeline model: deal_id, company_name, sector, stage (sourcing/screening/DD/IC/closing/portfolio/exited)
- ESG screening scorecard: 5 dimensions x 5 ratings
  - Environmental: carbon intensity, resource efficiency, pollution, biodiversity
  - Social: labor practices, human rights, community impact, product safety
  - Governance: board structure, anti-corruption, data privacy, tax transparency
  - Transition risk: regulatory exposure, carbon pricing impact, technology disruption
  - Physical risk: asset location, climate hazard exposure, supply chain resilience
- Red flag detection: high-carbon sector without transition plan, UNGC violations, sanctions list
- Sector heat map: ESG risk rating by GICS sector
- Deal comparison table: side-by-side ESG scores for IC discussion
- Migration for pe_deals, pe_screening_scores, pe_portfolio_companies
**Est. Output:** ~1,100 lines new code + ~300 lines tests

#### Session 4B: Portfolio Company Monitoring + Value Creation Plan
**Files:** `services/pe_portfolio_monitor.py` (~450 lines), `services/pe_value_creation.py` (~350 lines), `api/v1/routes/pe_portfolio.py` (~200 lines), `tests/test_pe_portfolio_monitor.py` (~300 lines)
**Scope:**
- Portfolio company KPI tracker: emissions, energy, water, waste, diversity, safety incidents
- Quarterly data collection template (what to collect from portfolio companies)
- Traffic light dashboard: green/amber/red per KPI per company
- YoY improvement tracking with target comparison
- Value creation plan generator:
  - Identify ESG improvement levers per sector (energy efficiency, supply chain, governance)
  - Estimate cost and benefit of each lever (capex, opex savings, revenue uplift, risk reduction)
  - Timeline with milestones
  - Exit value impact estimate (EBITDA multiple expansion from ESG improvement)
- Progress tracker: plan vs actual per lever per quarter
**Est. Output:** ~1,000 lines new code + ~300 lines tests

#### Session 4C: GP/LP Reporting + Impact Framework + IRR Sensitivity
**Files:** `services/pe_reporting_engine.py` (~400 lines), `services/pe_impact_framework.py` (~350 lines), `services/pe_irr_sensitivity.py` (~250 lines), `api/v1/routes/pe_reporting.py` (~200 lines), `tests/test_pe_reporting.py` (~300 lines)
**Scope:**
- GP/LP annual ESG report template (ILPA ESG Data Convergence Initiative aligned):
  - Fund-level: WACI, Scope 1+2 total, renewable energy %, board diversity %, work injuries
  - Per portfolio company: same KPIs + YoY trend
  - Aggregation methodology description
- Impact measurement framework:
  - IRIS+ metric catalog (50 common metrics across Operational, Environmental, Social)
  - SDG mapping: each portfolio company activity -> relevant SDGs (1-17)
  - Impact score: weighted contribution to SDG targets
- IRR sensitivity to ESG factors:
  - Base case IRR from cash flows
  - Carbon pricing impact: incremental opex from carbon pricing (0-150 EUR/tCO2e)
  - Regulatory impact: compliance capex for upcoming ESG regulations
  - Green premium: revenue uplift from sustainability positioning
  - Stranding risk: asset impairment under transition scenarios
  - Output: IRR tornado chart showing ESG factor impacts
**Est. Output:** ~1,200 lines new code + ~300 lines tests

---

### Phase 5: Energy Sector Completions (3 sessions)

#### Session 5A: Renewable Project Finance (P50/P90) + PPA Risk
**Files:** `services/renewable_project_engine.py` (~500 lines), `services/ppa_risk_scorer.py` (~300 lines), `api/v1/routes/renewable_ppa.py` (~200 lines), `tests/test_renewable_ppa.py` (~300 lines)
**Scope:**
- Wind energy yield model:
  - Weibull distribution for wind speed (k, lambda parameters by region)
  - Power curve lookup (generic turbine classes: 2MW onshore, 5MW offshore, 8MW offshore)
  - P50 (median), P75, P90 confidence levels
  - Capacity factor calculation
  - Annual generation (MWh) = capacity (MW) x CF x 8760
- Solar energy yield model:
  - Global horizontal irradiance (GHI) by country/region
  - Performance ratio (PR) accounting for temperature, soiling, degradation
  - P50/P90 yield estimates
- LCOE calculation: (CAPEX x CRF + OPEX) / Annual_Generation
- IRR with and without carbon revenue
- PPA risk scoring:
  - Counterparty credit (investment grade / sub-IG / unrated)
  - Price structure (fixed / indexed / merchant exposure %)
  - Tenor (short <5yr / medium 5-15yr / long >15yr)
  - Curtailment risk (grid congestion, negative pricing hours)
  - Regulatory risk (subsidy dependence, policy stability)
  - Composite PPA risk score 0-100
**Est. Output:** ~1,000 lines new code + ~300 lines tests

#### Session 5B: Generation Transition Planner + Grid EF Trajectory
**Files:** `services/generation_transition_planner.py` (~450 lines), `services/grid_ef_trajectory.py` (~300 lines), `api/v1/routes/energy_transition.py` (~200 lines), `tests/test_energy_transition.py` (~300 lines)
**Scope:**
- Generation transition planner:
  - Input: current fleet (fuel type, capacity, age, carbon intensity per plant)
  - Output: optimal phase-out sequence minimizing total cost subject to:
    - Capacity adequacy constraint (demand must be met)
    - Carbon budget constraint (cumulative emissions under pathway)
    - Just transition cost per plant closure (workforce, community)
    - Replacement capex (renewable + storage to replace baseload)
  - Timeline: 2025-2050 with 5-year increments
  - Metrics: total capex, stranded asset write-down, emissions trajectory, capacity mix evolution
- Grid emission factor trajectory:
  - Country-level grid EF projections 2024-2050 under NGFS scenarios
  - 30 countries (existing 15 from TOOL07 + 15 additional)
  - Linear interpolation between scenario milestones
  - API: given country + year + scenario -> projected grid EF
  - Used by all modules needing forward-looking Scope 2 calculations
**Est. Output:** ~950 lines new code + ~300 lines tests

#### Session 5C: Methane Monitoring + Scope 3 Cat 11 + CSRD Auto-Population
**Files:** `services/methane_monitor.py` (~300 lines), `services/scope3_cat11_engine.py` (~250 lines), `services/csrd_auto_populate.py` (~400 lines), `api/v1/routes/methane_scope3_csrd.py` (~200 lines), `tests/test_methane_scope3_csrd.py` (~300 lines)
**Scope:**
- Methane monitoring (OGMP 2.0):
  - 5 reporting levels (bottom-up, generic EF, source-specific, site measurement, direct measurement)
  - Source categories: venting, flaring (incomplete combustion), fugitive, process
  - Methane intensity: tCH4 / BOE produced
  - GWP conversion: CH4 x 28 (AR5) or x 29.8 (AR6 with feedback)
  - Benchmarks: Oil & Gas Methane Partnership 2.0 intensity targets
- Scope 3 Category 11 (Use of Sold Products):
  - Fossil fuel producers: combustion EF x volume sold
  - Gas: 56.1 kgCO2/GJ x volume (PJ)
  - Oil: 73.3 kgCO2/GJ x volume (PJ)
  - Coal: 94.6 kgCO2/GJ x volume (PJ)
  - Attribution: 100% of downstream combustion emissions
- CSRD auto-population:
  - Map operational data fields to ESRS E1-E5 data points
  - Auto-fill csrd_kpi_values from energy_csrd_e1 through e5 tables
  - Completeness checker: % of mandatory DPs populated
  - Gap list: missing DPs with suggested data sources
**Est. Output:** ~1,150 lines new code + ~300 lines tests

---

### Phase 6: Cross-Cutting Gaps (3 sessions)

#### Session 6A: XBRL Export Engine (CSRD/ISSB)
**Files:** `services/xbrl_export_engine.py` (~600 lines), `api/v1/routes/xbrl_export.py` (~200 lines), `tests/test_xbrl_export.py` (~300 lines)
**Scope:**
- iXBRL (inline XBRL) tagged HTML generation for CSRD ESEF filing
- EFRAG ESRS taxonomy mapping (ESRS catalog code -> XBRL concept)
- Tag each KPI value with: concept, period, unit, entity identifier, decimals
- Output formats: iXBRL HTML (primary), XBRL XML (secondary), validation report
- Coverage: all ESRS E1 quantitative DPs (GHG emissions, energy, carbon price, financial effects)
- Extensible to E2-E5, S1-S4, G1 in subsequent sessions
- Validation: ESMA filing rules compliance check
**Est. Output:** ~800 lines new code + ~300 lines tests

#### Session 6B: Disclosure Completeness Checker + Multi-Year Trends
**Files:** `services/disclosure_completeness_engine.py` (~400 lines), `services/trend_analytics_engine.py` (~350 lines), `api/v1/routes/disclosure_trends.py` (~200 lines), `tests/test_disclosure_trends.py` (~300 lines)
**Scope:**
- Disclosure completeness checker:
  - Compare populated DPs in csrd_kpi_values against mandatory DPs in csrd_esrs_catalog
  - Per-standard completeness % (ESRS E1: 85%, E2: 40%, etc.)
  - Traffic light per topic: green (>80%), amber (50-80%), red (<50%)
  - Missing DP list with data source suggestions
  - Materiality filter: only count DPs for material topics
- Multi-year trend analytics:
  - YoY change calculation for all numeric KPIs
  - CAGR over 3/5 year windows
  - Trend direction (improving/stable/deteriorating) classification
  - Peer comparison: entity percentile rank per KPI per year
  - Sparkline data for frontend rendering
**Est. Output:** ~950 lines new code + ~300 lines tests

#### Session 6C: Entity 360 Dashboard + Counterparty Master
**Files:** `services/entity_360_engine.py` (~500 lines), `services/counterparty_master.py` (~300 lines), `alembic/versions/039_add_counterparty_master.py` (~150 lines), `api/v1/routes/entity_360.py` (~250 lines), `tests/test_entity_360.py` (~300 lines)
**Scope:**
- Entity 360 service: given entity_id, pull and merge:
  - Financial data (fi_financials or energy_financials)
  - Climate data (PCAF, ECL climate overlays, temperature scores)
  - Carbon data (Scope 1/2/3 emissions, carbon intensity)
  - Nature data (water risk, biodiversity score)
  - Regulatory data (SFDR PAI, CSRD KPIs, EU Taxonomy alignment)
  - Supply chain data (Scope 3 by category, supplier risk)
  - Valuation data (if real estate: property portfolio, NAV)
- Counterparty master table:
  - Canonical counterparty record with: LEI, name, sector (GICS/NACE), country, size
  - FK links to: fi_entities, energy_entities, sc_entities, csrd_entity_registry
  - Deduplication logic: match on LEI > name+country > fuzzy match
  - Used as central join point for all cross-module queries
**Est. Output:** ~1,200 lines new code + ~300 lines tests

---

## PART D: SESSION SCHEDULE

| Session | Deliverable | New LOC | Test LOC | Total | Dependencies |
|---------|------------|---------|----------|-------|--------------|
| **1A** | EAD Calculator | ~600 | ~300 | ~900 | ECL engine (exists) |
| **1B** | GAR Calculator + Counterparty Climate Score | ~650 | ~300 | ~950 | FI tables (exist) |
| **1C** | Stress Test Runner + PD Backtesting | ~700 | ~350 | ~1,050 | ECL + NGFS (exist) |
| **1D** | LGD Downturn + Vintage Analysis | ~600 | ~250 | ~850 | LGD calculator (exists) |
| **2A** | RE Portfolio NAV + CRREM Wire | ~750 | ~300 | ~1,050 | RE valuation (exists) |
| **2B** | EPC Transition + Retrofit Planner | ~800 | ~300 | ~1,100 | Properties table (exists) |
| **2C** | Green Premium + Tenant ESG | ~650 | ~250 | ~900 | RE engine (exists) |
| **3A** | Fund Structure + Holdings Model | ~970 | ~250 | ~1,220 | Migration required |
| **3B** | ESG Attribution + Benchmark Analytics | ~850 | ~300 | ~1,150 | Fund model (3A) |
| **3C** | SFDR Report + Exclusion List | ~650 | ~250 | ~900 | PAI calc (exists) |
| **4A** | PE Deal Pipeline + ESG Screening | ~900 | ~300 | ~1,200 | Migration required |
| **4B** | PE Portfolio Monitor + Value Creation | ~800 | ~300 | ~1,100 | PE models (4A) |
| **4C** | GP/LP Reporting + Impact + IRR Sensitivity | ~1,000 | ~300 | ~1,300 | PE models (4A) |
| **5A** | Renewable P50/P90 + PPA Risk | ~800 | ~300 | ~1,100 | Energy tables (exist) |
| **5B** | Gen Transition Planner + Grid EF Trajectory | ~750 | ~300 | ~1,050 | Stranded assets (exists) |
| **5C** | Methane + Scope 3 Cat 11 + CSRD Auto-Pop | ~950 | ~300 | ~1,250 | Energy CSRD tables (exist) |
| **6A** | XBRL Export Engine | ~800 | ~300 | ~1,100 | ESRS catalog (exists) |
| **6B** | Disclosure Completeness + Trends | ~750 | ~300 | ~1,050 | CSRD KPI store (exists) |
| **6C** | Entity 360 + Counterparty Master | ~1,050 | ~300 | ~1,350 | Migration required |
| **TOTAL** | **19 sessions** | **~15,570** | **~5,630** | **~21,200** | |

---

## PART E: PRIORITY EXECUTION ORDER

### Tier 1 — Do First (Sessions 1A-1D + 6C)
**Why:** Financial institutions are the primary user segment. Completing the credit risk stack (EAD, LGD downturn, stress testing, backtesting) and Entity 360 unlocks the most value.

### Tier 2 — Do Second (Sessions 2A-2C + 3A)
**Why:** Real estate completions (portfolio NAV, CRREM, EPC, retrofit) and fund structure model are high-demand from REITs and asset managers.

### Tier 3 — Do Third (Sessions 3B-3C + 5A-5C)
**Why:** Asset manager attribution/SFDR reports and energy sector completions serve active user segments.

### Tier 4 — Do Fourth (Sessions 4A-4C)
**Why:** VC/PE is a new module with no existing infrastructure; build after core sectors are complete.

### Tier 5 — Do Fifth (Sessions 6A-6B)
**Why:** XBRL export and disclosure completeness are regulatory enablers; high value but can follow functional completions.

---

## PART F: WHAT ALREADY WORKS (No Changes Needed)

| Capability | Service | Status |
|------------|---------|--------|
| ECL Climate Engine (IFRS 9) | ecl_climate_engine.py | Production |
| PCAF WACI + Temperature | pcaf_waci_engine.py | Production |
| PCAF-ECL Bridge | pcaf_ecl_bridge.py | Production (54 tests) |
| 43 CDM Tools | cdm_tools_engine.py | Production (160 tests) |
| 105 Activity Guide | activity_guide_catalog.py | Production |
| 56+ Methodologies | methodology_engine.py | Production (35 tests) |
| Carbon Calculator v1+v2 | carbon_calculator.py, carbon_calculator_v2.py | Production |
| CBAM Calculator | cbam_calculator.py | Production |
| Stranded Asset Calculator | stranded_asset_calculator.py | Production |
| Nature Risk (TNFD LEAP) | nature_risk_calculator.py | Production |
| RE Valuation (3 approaches) | real_estate_valuation_engine.py | Production |
| CRREM Stranding Engine | crrem_stranding_engine.py | Production |
| Climate VaR (RE) | re_clvar_engine.py | Production |
| Scenario Analysis (NGFS) | scenario_analysis_engine.py | Production |
| PD Calculator | pd_calculator.py | Production |
| LGD Calculator | lgd_calculator.py | Production |
| Sustainability Certs (6) | sustainability_calculator.py | Production |
| Peer Benchmarking | peer_benchmark_engine.py | Production |
| Supply Chain Scope 3 | supply_chain_scope3_engine.py | Production |
| CSRD PDF Extraction | csrd_extractor.py | Production (8 entities) |
| Rate Limiting | rate_limiter.py | Production |
| Error Handler | error_handler.py | Production |
| Request Logger | request_logger.py | Production |
| Error Boundary (React) | ErrorBoundary.jsx | Production |
