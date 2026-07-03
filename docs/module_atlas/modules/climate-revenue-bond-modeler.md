# Climate Revenue Bond Modeller
**Module ID:** `climate-revenue-bond-modeler` · **Route:** `/climate-revenue-bond-modeler` · **Tier:** B (frontend-computed) · **EP code:** EP-DY2 · **Sprint:** DY

## 1 · Overview
Climate revenue bond modelling with dedicated revenue stream analysis (toll, utility, tax increment), debt service coverage calculation, climate risk to revenue base assessment, and green certification premium. Covers MSRB and CDFA frameworks.

> **Business value:** Enables rigorous climate revenue bond modelling integrating DSCR analysis, physical risk revenue discounting, and green certification premium to support issuance structuring and investor credit assessment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_SECTORS`, `COVENANT_TYPES`, `GREEN_STANDARDS`, `Kpi`, `STRESS_SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `netRevenue` | `annualRevenue - annualOm;` |
| `totalIssuance` | `BOND_SECTORS.reduce((s, b) => s + b.issuanceGbn, 0);` |
| `stressData` | `STRESS_SCENARIOS.map(s => ({` |
| `issuanceData` | `[...BOND_SECTORS].sort((a, b) => b.issuanceGbn - a.issuanceGbn).map(s => ({ sector: s.name.split(' ')[0], issuance: s.issuanceGbn, greenShare: s.green` |
| `eScore` | `Math.round(s.greenShare * 0.8 + sr(i * 11) * 20);` |
| `sScore` | `Math.round(70 + sr(i * 17) * 25);` |
| `gScore` | `Math.round(75 + sr(i * 23) * 20);` |
| `overall` | `Math.round((eScore + sScore + gScore) / 3);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_SECTORS`, `COVENANT_TYPES`, `GREEN_STANDARDS`, `STRESS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Debt Service Coverage Ratio | `Net pledged revenue / annual debt service (principal + interest)` | Municipal financial statements | Investment grade threshold typically 1.25x; strong revenue bonds 1.5x+; climate risk stress requires 1.35x+ fl |
| Climate Risk Revenue Discount | `Physical risk scenario reduction to pledged revenue base over bond term` | Moody's Climate Risk Assessment | Flood, drought, or extreme heat can reduce toll, utility, or TIF revenue; quantified using RCP 4.5/8.5 scenari |
| Green Certification Premium | `Yield differential for CBI-certified vs uncertified revenue bond` | Bloomberg BVAL | Smaller than GO greenium due to structure complexity; emerging as infrastructure green finance matures |
- **Municipal financial statements and rate studies** → Historical pledged revenue, DSCR, rate covenant compliance → base case model → **Revenue bond credit metrics**
- **Physical climate risk models (RMS, AIR, Moody's)** → Asset-level physical risk exposure by peril and scenario → revenue impact factors → **Climate-adjusted DSCR**
- **Bloomberg BVAL and EMMA disclosure data** → Market pricing and disclosure for comparable revenue bonds → greenium benchmarking → **Pricing premium analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Debt Service Coverage & Climate Risk Adjustment
**Headline formula:** `DSCR = Net Revenue / Annual Debt Service; Climate-Adjusted Revenue = Base Revenue × (1 - Physical Risk Discount) × (1 + Green Premium)`
**Standards:** ['MSRB Revenue Bond Disclosure Guidelines', 'CDFA Climate-Resilient Infrastructure Finance Toolkit', "Moody's Revenue Bond Rating Methodology 2022"]

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).