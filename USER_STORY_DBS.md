# User Story — DBS Group: Head of Sustainability & Investment Analytics

> **Document Type:** Enterprise User Story / Product Fit Analysis
> **Institution:** DBS Group Holdings Ltd
> **Persona:** Head of Analytical Team, Sustainability & Investments
> **Platform:** A2 Intelligence — Risk Analytics Platform
> **Date:** 2026-03-03
> **Reference:** DBS Sustainability Report 2024, DBS Annual Report 2024

---

## 1. Persona

**Name:** (Composite — representative of the team)
**Title:** Head of Analytics, Sustainability & Investments
**Division:** Institutional Banking Group (IBG) — Sustainable Finance & Risk Analytics
**Reports to:** Chief Sustainability Officer + Chief Risk Officer
**Location:** Singapore (primary); oversight across 19 markets

**Team Responsibilities:**
- Own the quantitative methodology behind DBS's Scope 3 financed emissions measurement (PCAF-aligned)
- Track progress against seven sectoral decarbonisation targets committed under NZBA
- Produce TCFD-aligned climate scenario analysis for the annual Sustainability Report
- Deliver climate-adjusted credit risk metrics (PD, LGD, ECL) to the CRO
- Support MAS Climate Risk stress testing submissions
- Monitor Paris Alignment of the lending book against IEA NZE 2050 glidepaths
- Advise front-office teams on transition finance eligibility and sector-level exposure limits
- Coordinate ISSB S2 and GRI disclosures for the investor relations team

**Primary KPIs:**
| KPI | 2024 Status | Target |
|-----|-------------|--------|
| O&G absolute financed emissions | 26.2 MtCO₂e | 27.7 MtCO₂e by 2030 |
| Power portfolio emissions intensity | ~138 kgCO₂/MWh (est.) | 138 kgCO₂/MWh by 2030 |
| Renewables share of power portfolio | 62% | >50% sustained |
| Thermal coal exposure | S$1.3B | Phase-out by 2039 |
| Sustainable finance committed | S$89B | Ongoing growth |
| Sectoral targets on track | 5 of 7 | 7 of 7 |
| Steel emissions intensity | +7% YoY (off-track) | -27% by 2030 vs. 2020 |
| Shipping emissions intensity | Off-track | -23% by 2030 vs. 2020 |

---

## 2. Context: DBS's Sustainability Mandate

DBS is the first bank in Southeast Asia to publish a comprehensive set of PCAF-aligned Scope 3 financed emissions targets across all major emitting sectors. As a member of the Net-Zero Banking Alliance (NZBA), it has committed to net zero financed emissions by 2050, with science-based interim targets for 2030.

**Nine priority sectors** (31% of outstanding loans, majority of IBG financed emissions):

| Sector | Target Type | 2020 Baseline | 2030 Target | 2024 Status |
|--------|-------------|---------------|-------------|-------------|
| Oil & Gas | Absolute (MtCO₂e) | 38.6 MtCO₂e | 27.7 MtCO₂e | 26.2 MtCO₂e (on track) |
| Power | Intensity (kgCO₂/MWh) | 260 kgCO₂/MWh | 138 kgCO₂/MWh | ~62% renewables (on track) |
| Real Estate | Intensity (CRREM) | Baseline per CRREM | -42% intensity | On track |
| Automotive | Intensity (gCO₂/km) | Baseline | -57% | On track |
| Aviation | Intensity (gCO₂/RTK) | Baseline | -16% | On track |
| Steel | Intensity (tCO₂/tSteel) | Baseline | -27% | +7% in 2024 — off-track |
| Shipping | Intensity (gCO₂/DWT·nm) | Baseline | -23% | Off-track |
| Food & Agri | Data coverage | — | Coverage target | In progress |
| Chemicals | Data coverage | — | Coverage target | In progress |

**Reporting frameworks used:** TCFD, PCAF, IEA NZE 2050, CRREM (real estate), GRI 2021, SASB, NZBA guidelines, MAS Environmental Risk Management, SGX-ST Listing Rules, ISSB S1/S2.

---

## 3. Current State — What the Analytical Team Does Today (Without the Platform)

| Task | Current Method | Pain Point |
|------|---------------|------------|
| Calculate PCAF financed emissions | Manual Excel model per sector | No real-time recomputation; PCAF data quality scoring done manually |
| Track glidepath vs. actual | Excel + PowerPoint charts | Rebuilt every reporting cycle; no live dashboard |
| NGFS scenario stress test | External consultants / manual | 6-month lag; no in-house scenario runner |
| Climate-adjusted ECL | Separate credit team model, no integration | Disconnect between sustainability metrics and credit risk |
| TCFD physical risk assessment | Third-party data purchase (periodic) | Point-in-time, not integrated into portfolio view |
| Regulatory disclosures (TCFD, ISSB, GRI) | Narrative drafting; data manually pulled | Fragmented; different teams own different KPIs |
| Steel/Shipping off-track analysis | Manual counterparty data requests | No systematic aggregation of borrower decarbonisation plans |
| Portfolio temperature (ITR) | External vendor (annual update) | No in-house capability; no what-if modelling |

**Core problem:** The team has the data, the methodology, and the commitments — but no integrated platform to run calculations, visualise progress, run scenarios, and generate regulatory outputs in one place.

---

## 4. How the Platform Is Used — Workflow by Module

---

### 4.1 PCAF Financed Emissions — `/financial-risk` → PCAF Panel

**What DBS needs to do:**
Calculate financed emissions for all nine priority sectors using PCAF methodology. O&G uses absolute emissions; all others use intensity metrics. PCAF data quality scores (1–5) must be attached to each exposure.

**How the platform is used:**

The analyst opens `/financial-risk` and navigates to the PCAF panel. They create a PCAF portfolio called `IBG Priority Sectors Portfolio`. They add investees (counterparty exposures) by sector:

- **O&G investees**: input outstanding loan amount (S$), sector classification (Oil & Gas Upstream / Midstream / Downstream), borrower Scope 1+2+3 emissions (from internal credit data), enterprise value or revenue for attribution factor calculation. The platform computes: *Financed Emissions = (DBS loan / EVIC) × Borrower Scope 1+2+3*.
- **Power sector investees**: input installed capacity (MW), generation mix (% renewables, coal, gas), annual generation (MWh). Platform computes: *Weighted emissions intensity (kgCO₂/MWh) attributed to DBS's share*.

**Live recomputation:** When a borrower's data changes (e.g., a power company increases renewables from 40% to 60%), the analyst updates the counterparty record and the platform immediately recalculates the portfolio-level intensity. No more quarterly spreadsheet rebuilds.

**Historical data ingestion (2020–2024):**
The platform's Data Hub (`/data-hub`) is used to upload historical PCAF calculation workbooks for 2020, 2021, 2022, 2023. This populates the time-series view of financed emissions against the IEA NZE glidepath.

*Previous year data sourced via web search where public disclosures exist:*
| Year | O&G Absolute (MtCO₂e) | Source |
|------|----------------------|--------|
| 2020 | 38.6 | DBS SR2020 (baseline) |
| 2022 | ~29.1 (estimated) | DBS SR2022 |
| 2023 | 26.2 | DBS SR2023 |
| 2024 | TBD | DBS SR2024 (current) |

*Internal data (not public) — uploaded by the team:* borrower-level Scope 3 emissions, asset-level generation data, vessel-level AER/CII, individual real estate asset CRREM pathways.

---

### 4.2 Paris Alignment & NZBA Glidepath Tracking — `/portfolio-analytics`

**What DBS needs to do:**
Track each sector's actual trajectory vs. the IEA NZE 2050 glidepath, year by year. Identify which sectors are on track (power, O&G, automotive, real estate, aviation) and which are diverging (steel, shipping).

**How the platform is used:**

The analyst opens `/portfolio-analytics`. The Portfolio Analytics panel shows:

- **WACI (Weighted Average Carbon Intensity)** — aggregated across all nine sectors
- **ITR (Implied Temperature Rise)** — computed per sector using the platform's Paris alignment engine, referenced against the IEA NZE 2050 scenario
- **Sector-level glidepath chart** — actual intensity plotted against the target glidepath (e.g., Power: 260 → 138 kgCO₂/MWh by 2030 → 0 by 2040)
- **RAG status per sector** — Green (on track), Amber (at risk), Red (off-track against glidepath reference year)

For 2024: Power, O&G, Automotive, Real Estate, Aviation = Green. Steel, Shipping = Red.

**Off-track drill-down (Steel example):**
The analyst clicks into the Steel sector panel. The platform shows the top 10 steel borrowers by financed emissions, their reported production route (BF-BOF vs EAF), and each borrower's decarbonisation plan status (from internal engagement records uploaded via Data Hub). The analyst can filter to borrowers with >10% deviation from glidepath.

---

### 4.3 NGFS Climate Scenario Analysis — `/scenario-analysis`

**What DBS needs to do:**
Run stress tests under NGFS scenarios to assess portfolio-level transition and physical risk for the TCFD disclosure and MAS climate risk submission.

**How the platform is used:**

The analyst opens `/scenario-analysis`. They select the IBG Priority Sectors Portfolio and run three scenarios:

- **Net Zero 2050** (Orderly): Rapid transition, carbon price rises to ~US$250/tCO₂ by 2030. Transition risk high for O&G and coal. Physical risk low.
- **Delayed Transition** (Disorderly): Carbon price shock post-2030. Higher stranded asset risk. Relevant for Steel and Shipping.
- **Current Policies / Hot House World**: No additional policies. High chronic physical risk from temperature rise. GDP losses 2–4× previous estimates (NGFS Phase V 2024 update).

For each scenario, the platform outputs:
- **Expected Loss (EL)** by sector — climate-adjusted vs. baseline
- **Capital Charge increase** — transition risk premium on RWA
- **CO₂ reduction required** per sector to remain on glidepath under each scenario
- **Stranded asset probability** for coal and O&G exposures

The NGFS `/browser` page lets the analyst pull full IEA-aligned scenario pathways (carbon price, GDP, temperature, energy mix) for Singapore, China, India, and Indonesia — the four primary markets driving IBG's sector exposures.

---

### 4.4 Climate-Adjusted Credit Risk (ECL) — `/financial-risk` → ECL Panel

**What DBS needs to do:**
Produce IFRS 9 ECL estimates with a climate overlay — adjusting PD and LGD upward for borrowers in high-transition-risk sectors, to embed in the credit risk model and CRO report.

**How the platform is used:**

The analyst opens the ECL panel. They run an ECL assessment for the IBG loan book:

- Stage 1/2/3 classification by borrower credit grade
- Climate overlay applied: for O&G, coal, steel, and shipping borrowers — PD adjusted upward per the NGFS Delayed Transition scenario using the platform's climate-adjusted PD engine
- Physical risk overlay: for real estate collateral in coastal/flood-prone locations (Singapore, Mumbai, Ho Chi Minh City), LGD adjusted upward based on climate VaR on collateral values

Output: Climate-adjusted ECL by sector, stage breakdown (Stage 1/2/3), and a comparison vs. base ECL to quantify the incremental climate provision.

This feeds directly into the TCFD financial impact disclosure table: "Material financial impact of climate risk on the lending portfolio."

---

### 4.5 Real Estate — CRREM Pathway Compliance — `/real-estate-assessment`

**What DBS needs to do:**
Assess the DBS real estate lending book against CRREM pathways by geography. Real estate is the only sector where DBS uses a location-specific pathway (CRREM) rather than a global IEA glidepath.

**How the platform is used:**

For each real estate asset financed by DBS (office, retail, industrial, residential), the analyst inputs:
- Asset type, location (Singapore, HK, mainland China, India, Indonesia)
- Energy use intensity (kWh/m²/year) and Scope 1+2 emissions intensity
- Loan amount and loan-to-value

The platform's CRREM integration plots each asset on the relevant CRREM pathway for that country and asset type. Assets above the CRREM pathway line are flagged as "stranding risk" — transition risk embedded in the collateral.

**Green premium / brown discount:**
The platform applies RICS-aligned ESG adjustments to the collateral valuation — green-certified assets (BCA Green Mark Platinum in Singapore, LEED Gold in India) receive a premium; brown assets above CRREM pathway receive a discount, reducing effective LTV.

**2024 DBS Status:** Real estate sector was on track for the -42% intensity target. The platform's CRREM view validates this by showing the weighted average intensity of the real estate book sits below the CRREM glidepath.

---

### 4.6 Stranded Assets — Coal Phase-Out Monitoring — `/stranded-assets`

**What DBS needs to do:**
Monitor thermal coal exposure (target: S$1.3B in 2024, phasing out to zero by 2039) and assess stranding risk for individual coal power plant and mine assets.

**How the platform is used:**

The analyst opens `/stranded-assets`. They input the coal exposure portfolio:
- Power plants: capacity (MW), fuel type (thermal coal), age, remaining economic life, location
- Coal mines: reserve size, production cost, DBS loan amount, maturity

The platform's stranded asset engine calculates:
- **Financial stranding date** under each NGFS scenario — the year at which the asset becomes NPV-negative
- **Residual loan exposure at stranding date** — how much of DBS's loan remains outstanding when the asset strands
- **Expected credit loss from early stranding** — excess provision needed

For the 2024 thermal coal book (S$1.3B, down from S$1.8B in 2023), the platform tracks that the portfolio has halved since 2021 — ahead of the phase-out schedule. The chart shows the remaining coal exposure against the IEA coal phase-out glidepath by year.

---

### 4.7 Sector Assessments — Power Plants — `/sector-assessments`

**What DBS needs to do:**
Assess individual power plant borrowers in DBS's power portfolio (62% renewables, target maintained). Monitor coal plant dispatch economics and assess which plants are approaching uneconomic operations under carbon pricing.

**How the platform is used:**

The Power Plant Assessment module takes:
- Plant type (coal, gas, CCGT, solar, wind, hydro, geothermal)
- Installed capacity, capacity factor, heat rate, fuel cost
- Carbon price assumption (from NGFS scenario selected)
- Remaining loan exposure and maturity

Output: **Levelised Cost of Electricity (LCOE)** vs. **electricity market price** per plant, with and without carbon cost. Plants where LCOE + carbon cost > market price are flagged as stranding candidates.

For DBS's power book: the 62% renewables share is shown as a stacked portfolio view. Coal plants (38% of book) are individually stress-tested under Net Zero 2050 carbon pricing — identifying which plants lose dispatch economics by 2028, 2030, 2035.

---

### 4.8 Regulatory Disclosures — `/regulatory`

**What DBS needs to do:**
Produce the TCFD, ISSB S2, and GRI-aligned climate disclosures for the Sustainability Report, as well as data packs for MAS regulatory submissions.

**How the platform is used:**

The analyst opens `/regulatory`. The platform has pre-populated the regulatory output panels with data from the PCAF, ECL, Scenario Analysis, and Portfolio Analytics runs above:

**TCFD Panel:**
- Governance: governance structure inputs (pre-filled from template)
- Strategy: scenario-specific risk/opportunity narrative — auto-generated from NGFS run results
- Risk Management: climate risk identification process — mapped to sector-level ECL and stranded asset outputs
- Metrics & Targets: all seven sectoral targets pulled from the portfolio analytics glidepath tracker — actual vs. target vs. glidepath

**ISSB S2 Panel:**
- Quantitative climate risk disclosures (physical and transition) by scenario
- Cross-industry metric categories (GHG emissions, energy, water)
- Industry-based SASB metrics for diversified banking sector

**BRSR / Singapore Taxonomy Panel:**
- For DBS's Indian operations: BRSR (Business Responsibility and Sustainability Reporting) required by SEBI — populated with India-specific portfolio data
- Singapore Green Finance Taxonomy: sustainable finance S$89B commitment classified against taxonomy criteria

---

### 4.9 Interactive Analytics — `/interactive`

**What DBS needs to do:**
Present to the Sustainability Committee and Board a single dashboard that shows the state of the portfolio, climate risk position, regulatory compliance status, and glidepath progress in one view.

**How the platform is used:**

The Head of Analytics opens `/interactive` for the Board pre-read pack. The dashboard shows:

- **KPI Cards:** Total IBG exposure (S$), Avg Expected Loss (climate-adjusted), Portfolio VaR (NGFS Net Zero 2050), Carbon Footprint (MtCO₂e financed)
- **Portfolio Overview tab:** Sector breakdown of outstanding loans, color-coded by glidepath status (green/amber/red)
- **Climate Risk tab:** Risk heatmap — sectors (rows) × scenarios (columns) — showing EL magnitude per cell. Steel/Shipping show red under Delayed Transition and Current Policies. Power shows green under all scenarios.
- **Emissions tab:** Paris Alignment bars per sector — actual intensity vs. CRREM/IEA glidepath. Two red bars (Steel, Shipping). Five green bars.
- **Sensitivity tab:** What-If studio — the analyst adjusts the carbon price slider from US$150 to US$250/tCO₂ and watches the portfolio ECL recompute in real time, showing the incremental capital charge.
- **Financial Risk tab:** ECL waterfall — base ECL vs. climate-adjusted ECL by stage and sector. Quantifies the incremental provision from climate risk.

The Board can interact with filters — select a specific scenario, time horizon (2030/2040/2050), or sector — and the entire dashboard updates.

---

## 5. Gap Analysis — What Is Missing to Make This Application Production-Ready for DBS

### 5.1 Platform Feature Gaps

| Gap | Description | Severity | DBS Requirement |
|-----|-------------|----------|-----------------|
| **Portfolio Analytics Engine is mocked** | `/portfolio-analytics` uses `import random` and hardcoded seed data. All KPIs (WACI, ITR, PAI indicators) are fake. | Critical | Real computation engine required for PCAF attribution, ITR, and WACI |
| **No PCAF Data Quality Score (DQS)** | PCAF standard requires each emission estimate to carry a Data Quality Score (1–5). Platform has no DQS field or aggregation logic. | High | Required for PCAF-aligned reporting; affects data disclosure requirements |
| **No Absolute vs. Intensity Target Switch** | PCAF module computes financed emissions but does not support concurrent absolute (O&G) and intensity-based (Power, Steel) target tracking in a unified glidepath view | High | DBS tracks 6 intensity + 1 absolute target simultaneously |
| **No NZBA Glidepath Tracker** | No dedicated tool comparing actual sectoral trajectory to IEA NZE glidepath year by year with sector-specific reference pathways | High | Core NZBA disclosure requirement |
| **No Facilitated Emissions (Capital Markets)** | PCAF covers loans. DBS also includes facilitated emissions from bond underwriting (S$38B in 2024). Platform has no capital markets emission attribution module | High | DBS is unique in including capital markets emissions |
| **No MAS-Specific Regulatory Module** | Regulatory page covers EU taxonomy, SFDR, TCFD, CSRD, ISSB, BRSR — but not MAS Environmental Risk Management Guidelines (2022) or MAS Notice 637 Pillar 2 climate risk | High | MAS is DBS's primary regulator |
| **CRREM Pathways Not Live** | Real Estate module references CRREM but has no live CRREM pathway curves by geography and asset type (Singapore, HK, CN, IN, ID) | High | DBS uses CRREM for real estate sector target |
| **No Shipping Sector Module** | No CII/AER/EEXI calculation for shipping loans. Sector Assessments covers Data Centres, CAT Risk, Power Plants — not Shipping | High | Shipping is one of DBS's two off-track sectors |
| **No Steel Sector Module** | No BF-BOF vs EAF production route analytics, no EAF transition readiness scoring | High | Steel is the other off-track sector; +7% intensity in 2024 |
| **PostGIS Not Implemented** | Physical risk for real estate uses lat/lng floats — spatial queries (flood zone overlay, cyclone tracks, sea-level rise contours) are blocked | Medium | Required for physical risk on real estate collateral across 19 markets |
| **No Time-Series Architecture** | TimescaleDB not implemented. Annual glidepath tracking requires time-series data (2020–2050 by year per sector) | Medium | Multi-year glidepath reporting fundamental to NZBA |
| **No Client Engagement Module** | No workflow to track bilateral decarbonisation engagement with corporate borrowers — status of transition plans, engagement letters, escalation triggers | Medium | Required for NZBA's client engagement reporting |
| **No Transition Finance Eligibility Engine** | No tool to classify a financing transaction against DBS's Transition Finance Framework or Singapore-Asia Taxonomy | Medium | DBS updated transition finance framework in 2024 |
| **No PCAF Asset Class Coverage for Listed Equity** | PCAF module handles loans; no calculation path for listed equity investments or sovereign bonds | Low | DBS has investment securities portfolio |

---

### 5.2 Data Gaps — Publicly Unavailable, Internally Available at DBS

| Data Point | Why It's Needed | Where It Lives Internally | How to Ingest |
|------------|-----------------|--------------------------|---------------|
| **Loan-level borrower emissions** (Scope 1/2/3 by company) | PCAF attribution factor calculation requires individual company emissions | Credit files, ISDA questionnaires, client ESG submissions | Upload via Data Hub CSV; map to PCAF counterparty schema |
| **PCAF Data Quality Scores per exposure** | Regulatory requirement; drives disclosure footnotes | Internal PCAF working model (Excel, Risk team) | Structured upload with DQS field per exposure |
| **Power plant generation mix per borrower** | Required for power sector intensity calculation (kgCO₂/MWh) | Lender technical reports, due diligence files | Manual upload or API feed from Bloomberg/BNEF |
| **Real estate asset energy use intensity** (kWh/m²) per collateral | CRREM pathway plotting | Property valuation reports, building energy certificates | Upload per asset via real estate module |
| **Shipping fleet data** (vessel IMO, DWT, fuel type, AER/CII) | Shipping intensity metric calculation | Ship registers, loan drawdown documents | IHS Markit / Clarksons API integration |
| **Steel production route per borrower** (BF-BOF share, EAF share, DRI %) | Steel intensity metric | Project finance files, annual reports | Web scraping or Bloomberg data + manual verification |
| **Automotive fleet emission data** (gCO₂/km by manufacturer model mix) | Automotive intensity metric | JATO Dynamics, manufacturers' fleet disclosures | Licensed data feed |
| **Aviation RPK and CO₂/RTK per airline borrower** | Aviation intensity | ICAO data, airline investor presentations | ICAO data + airline disclosures |
| **Internal carbon price (ICP)** used in project appraisals | Transition risk stress test calibration | Risk Policy (internal, not public) | Config variable in scenario analysis settings |
| **Physical risk scores on specific collateral** | LGD adjustment for flood/heat/sea-level risk | DBS's own physical risk vendor (e.g., Jupiter, 427MT) | API integration with physical risk data provider |
| **Stage 1/2/3 loan classification with climate flag** | Climate-adjusted ECL | Core banking system (DBS internal credit system) | Extract from core banking → load into ECL module |
| **Counterparty transition plan status** | Client engagement tracker; NZBA engagement disclosure | Relationship Manager CRM notes, Sustainability team logs | Manual entry or CRM integration |
| **Historical financed emissions 2020–2022 by sub-sector** | Time-series glidepath view; baseline validation | PCAF annual working files (internal) | Historical CSV upload to platform time-series store |

---

### 5.3 Data That Can Be Web-Searched and Pre-Loaded

For counterparties where internal data is sparse, the platform can supplement with public data:

| Data Point | Source | Platform Integration |
|------------|--------|---------------------|
| Listed borrower Scope 1/2/3 emissions | CDP disclosures, company CSR reports | Data Hub upload → PCAF counterparty record |
| IEA NZE 2050 glidepaths by sector | IEA official data portal (free) | Pre-loaded in Scenario Browser |
| CRREM pathways by country/asset type | CRREM.eu (free download) | Pre-loaded in Real Estate module (currently missing) |
| NGFS scenario macro variables | NGFS Portal (free) | Already loaded in `/browser` and `/ngfs` |
| Shipping CII ratings (published by classification societies) | Lloyd's Register, DNV public ratings | Shipping module (to be built) |
| Steel company production routes | WorldSteel Association annual statistics | Steel sector module (to be built) |
| Carbon price forecasts | IEA, Bloomberg, ICAP | Scenario builder carbon price input |
| Singapore electricity grid emission factor | EMA Singapore (quarterly updates) | Power sector calculation config |
| MAS regulatory guidance text | MAS.gov.sg (free) | Regulatory module MAS section (to be built) |

---

## 6. End-to-End Scenario: A Week in the Life

**Monday — PCAF Run (Quarterly Update)**
The analyst uploads the latest quarter's loan data (counterparty ID, outstanding balance, sector, borrower emissions from Data Hub). The PCAF panel recomputes financed emissions for all nine sectors automatically. O&G comes in at 25.8 MtCO₂e — below the 27.7 MtCO₂e 2030 target. Power intensity at 130 kgCO₂/MWh — below the 138 target. Steel at 1.89 tCO₂/tSteel — above the 2030 glidepath reference of 1.72. Flagged red.

**Tuesday — Scenario Stress Test (MAS Submission Prep)**
The analyst runs a NGFS Delayed Transition stress test across the full IBG book. Carbon price shock in 2028 increases O&G transition risk EL by S$180M. Steel borrowers see PD uplift of 120bps on average. The ECL climate overlay output is exported as a structured table for the CRO's Pillar 2 submission.

**Wednesday — Real Estate CRREM Review**
The real estate team uploads 47 new commercial real estate collateral records. The platform plots each against the Singapore office CRREM pathway. 8 assets are above the CRREM line — stranding risk flagged. These are cross-referenced with their LTV ratios. Three have LTV >70% and are escalated to the credit committee.

**Thursday — Board Dashboard Preparation**
The analyst opens `/interactive`, sets the portfolio to IBG Priority Sectors, scenario to Net Zero 2050, time horizon to 2030. The dashboard auto-populates all KPI cards, the sector glidepath heatmap, and the ECL waterfall. A PDF export is generated for the Sustainability Committee pre-read.

**Friday — Regulatory Disclosure Drafting**
The TCFD Metrics & Targets table is pulled from the Regulatory module. All seven sectoral target actuals are pre-filled from the portfolio analytics run. The ISSB S2 quantitative disclosure table is exported. The analyst reviews the narrative sections and submits the draft to IR.

---

## 7. Expected Outcomes (Post Full Implementation)

| Outcome | Current Effort | Post-Platform Effort |
|---------|---------------|---------------------|
| PCAF quarterly emission run | 3 weeks (Excel) | 2 hours |
| TCFD metrics table | 1 week (cross-team data pull) | Automated export |
| MAS climate stress test | 6-8 weeks (external consultant) | In-house, 1 week |
| Board climate dashboard | 2 weeks per quarter | Live, real-time |
| Regulatory disclosure package | 4 weeks | 1 week (narrative only) |
| Off-track sector investigation | Ad hoc, no systematic tool | Automated flagging with drill-down |
| New loan climate risk screen | Manual check, 2-3 days | Real-time at point of origination |

---

## 8. Immediate Implementation Priorities for DBS Pilot

**Phase 1 (Weeks 1–4) — Data Foundation**
1. Upload historical PCAF data 2020–2024 (O&G absolute, power intensity) via Data Hub
2. Load IEA NZE glidepaths for all 7 sectors into Scenario Browser
3. Ingest real estate collateral data for CRREM assessment
4. Load counterparty-level Scope 1/2 data for top 50 borrowers (covers ~80% of financed emissions)

**Phase 2 (Weeks 5–8) — Core Calculations Live**
5. Run live PCAF computation replacing the mocked Portfolio Analytics Engine
6. Implement glidepath tracker with RAG status per sector
7. Run first NGFS scenario stress test; produce ECL climate overlay output
8. Build MAS regulatory module

**Phase 3 (Weeks 9–12) — Disclosure Outputs**
9. TCFD disclosure table auto-generation from platform data
10. ISSB S2 structured disclosure export
11. Board dashboard configured for IBG Priority Sectors portfolio
12. Shipping and Steel sector modules (to address the two off-track sectors)

---

## 9. Sources & References

- [DBS Sustainability Report 2024](https://www.dbs.com/iwov-resources/images/sustainability/reporting/pdf/web/DBS_SR2024.pdf)
- [DBS Net Zero Commitment](https://www.dbs.com.sg/corporate/sustainability/our-path-to-net-zero)
- [DBS announces decarbonisation targets — Press Release](https://www.dbs.com/newsroom/Singapores_DBS_first_bank_in_Southeast_Asia_to_announce_landmark_set_of_decarbonisation_commitments)
- [DBS doubles down on climate goals — Eco-Business 2025](https://www.eco-business.com/news/dbs-doubles-down-on-climate-goals-updates-transition-finance-framework/)
- [ESG Today — DBS Decarbonisation Target Setting](https://www.esgtoday.com/dbs-sets-emissions-reduction-targets-for-financing-and-investing-in-key-carbon-intensive-sectors/)
- [NGFS Scenarios Portal](https://www.ngfs.net/ngfs-scenarios-portal/)
- [PCAF Global Standard — GHG Protocol](https://ghgprotocol.org/global-ghg-accounting-and-reporting-standard-financial-industry)
- [Singapore Banks Decarbonisation Targets Analysis — Asia ReEngage](https://asiareengage.com/wp-content/uploads/2023/08/ARE-Singapore-Banks-Raise-the-Bar-in-Asia-for-Decarbonisation-Targets.pdf)
- [NZBA Guidelines for Climate Target Setting](https://www.unepfi.org/wordpress/wp-content/uploads/2024/03/Guidelines-for-Climate-Target-Setting-for-Banks-Version-2.pdf)
- [CRREM — Carbon Risk Real Estate Monitor](https://www.crrem.eu)
