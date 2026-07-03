# Enablement Methodology
**Module ID:** `enablement-methodology` · **Route:** `/enablement-methodology` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements the PCAF Scope 3 Category 15 investment enablement methodology for financed emissions attribution across asset classes. Quantifies the proportion of an investee's emissions enabled or avoided through financing activity, applying PCAF data quality scoring and economic attribution logic. Supports alignment with PCAF Standard Part A and Part B for banks, asset managers, and insurers.

> **Business value:** Provides financial institutions with a regulatory-grade financed emissions calculation engine that satisfies PCAF Standard requirements, supports SBTi FI target-setting, and generates audit-ready Cat.15 disclosure tables for TCFD and CDP responses.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AdditionalityAssessment`, `Badge`, `CATEGORIES`, `CAT_COLORS`, `Card`, `EnablementScorer`, `ISSUERS`, `KPI`, `PORTFOLIO_TREND`, `PRODUCTS`, `PROJECTS`, `PortfolioEnablement`, `Q_LABELS`, `REGULATIONS`, `REPORT_SECTIONS`, `ReportingDisclosure`, `SECTORS`, `SECTOR_STACK`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Green Bond','Sustainability-Linked Loan','Climate Fund','Project Finance','Green Loan','Transition Bond','Social Bond','Blue Bond'];` |
| `CATEGORIES` | `['Renewable Energy','Energy Efficiency','Clean Transport','Sustainable Agriculture','Waste Management','Water','Circular Economy','Nature-Based Soluti` |
| `type` | `TYPES[Math.floor(s1*TYPES.length)];` |
| `cat` | `CATEGORIES[Math.floor(s2*CATEGORIES.length)];` |
| `sector` | `SECTORS[Math.floor(s3*SECTORS.length)];` |
| `issuer` | `ISSUERS[Math.floor(s4*ISSUERS.length)];` |
| `volume` | `Math.round(50+s5*950);` |
| `enabledReduction` | `Math.round(1000+s6*49000);` |
| `financedEmissions` | `Math.round(500+s7*25000);` |
| `ratio` | `parseFloat((enabledReduction/Math.max(financedEmissions,1)).toFixed(2));` |
| `additionality` | `Math.round(20+s8*80);` |
| `vintage` | `2020+Math.floor(sr(i*31)*6);` |
| `maturity` | `vintage+Math.floor(3+sr(i*37)*12);` |
| `coupon` | `parseFloat((1.5+sr(i*41)*4.5).toFixed(2));` |
| `cat` | `CATEGORIES[Math.floor(s1*CATEGORIES.length)];` |
| `sector` | `SECTORS[Math.floor(s2*SECTORS.length)];` |
| `Q_LABELS` | `['Q1-22','Q2-22','Q3-22','Q4-22','Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];` |
| `PORTFOLIO_TREND` | `Q_LABELS.map((q,i)=>({quarter:q,` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `CAT_COLORS`, `ISSUERS`, `Q_LABELS`, `REGULATIONS`, `REPORT_SECTIONS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Attribution Factor (%) | — | PCAF Standard Part A | Financing share of EVIC; determines proportion of investee GHG inventory attributed to the financier. |
| Financed Emissions (tCO2e) | — | PCAF/GHG Protocol | Absolute attributed emissions from lending or investment activity; primary PCAF reporting metric. |
| PCAF Data Quality Score | — | PCAF DQ Framework | Score 1 = highest quality (audited Scope 1+2); Score 5 = proxy/estimated; affects disclosure confidence band. |
| Avoided Emissions (tCO2e) | — | PCAF Part B | Emissions avoided by enabling clean energy or efficiency projects; reduces net portfolio footprint. |
- **Portfolio management system (holdings + balances)** → Match to PCAF asset class; compute EVIC-based attribution factor → **Attribution factor per position (%)**
- **Investee GHG inventories (CDP/Trucost/estimated)** → Assign PCAF DQ score 1â€“5; apply sector proxy where actuals unavailable → **Financed emissions per investee (tCO2e)**
- **Renewable project finance records** → Calculate avoided emissions vs. grid displacement factor → **Avoided emissions portfolio total (tCO2e)**

## 5 · Intermediate Transformation Logic
**Methodology:** Enabled Emissions Attribution
**Headline formula:** `EE = (Financing / EVIC) × Investee_GHG`
**Standards:** ['PCAF Global Standard 2022', 'GHG Protocol Scope 3 Cat.15', 'TCFD']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).