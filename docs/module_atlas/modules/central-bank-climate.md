# Central Bank Climate Assessment
**Module ID:** `central-bank-climate` · **Route:** `/central-bank-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central bank climate risk assessment framework covering NGFS scenario implementation, financial stability analysis, macroprudential response tools, and supervisory disclosure compliance.

> **Business value:** Central banks globally are integrating climate into supervisory frameworks. BCBS 530 principles, ECB climate risk management guide, BoE SS3/19, and NGFS membership create regulatory expectations for banks. This module provides the analytical framework for both regulated institutions and supervisors.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CAPITAL_RW_DATA`, `CARBON_PRICE_SCENARIOS`, `CENTRAL_BANKS`, `COLLATERAL_FRAMEWORKS`, `DetailPanel`, `GREEN_BOND_DEMAND`, `GREEN_PROGRAMS`, `GREEN_QE_TREND`, `KPI`, `MANDATE_FILTER`, `NGFS_FILTER`, `NGFS_GROWTH`, `NGFS_SCENARIOS`, `POLICY_EVOLUTION`, `PORTFOLIO_RECS`, `QUARTERS`, `REGIONAL_SUMMARY`, `REGIONS`, `RESERVE_ESG`, `SECTOR_IMPACT`, `STRESS_FRAMEWORKS`, `TABS`, `Tab1`, `Tab2`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `REGIONS` | `['All','Europe','Asia-Pacific','Americas','Middle East & Africa'];` |
| `NGFS_FILTER` | `['All','Member','Observer','Non-Member'];` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `_CBC_MACRO_MAP` | `Object.fromEntries((SOVEREIGN_MACRO_2024\|\|[]).map(c=>[c.country,c]));` |
| `NGFS_GROWTH` | `QUARTERS.map((q,i)=>({` |
| `GREEN_QE_TREND` | `QUARTERS.map((q,i)=>({` |
| `GREEN_BOND_DEMAND` | `QUARTERS.map((q,i)=>({` |
| `POLICY_EVOLUTION` | `QUARTERS.map((q,i)=>({` |
| `ngfsMap` | `{'Member':{bg:'#dcfce7',color:T.green},'Observer':{bg:'#fef9c3',color:T.amber},'Non-Member':{bg:'#fee2e2',color:T.red}};` |
| `doSort` | `col=>{if(sort===col)setSortDir(-sortDir);else{setSort(col);setSortDir(1);}};` |
| `policyScore` | `Math.round(radarSingle.reduce((s,r)=>s+r.val,0)/Math.max(1,radarSingle.length));` |
| `compChart` | `STRESS_FRAMEWORKS.map(f=>({name:f.cb,banks:f.banks,horizon:f.horizonYears,sectors:f.sectors}));` |
| `headers` | `['Central Bank','Country','NGFS','Mandate','Stress Test','Green QE Vol (EUR bn)','Disclosure','Capital Add-on (bps)','Prudential Req','Methodology','S` |
| `rows` | `CENTRAL_BANKS.map(c=>[c.code,c.country,c.ngfs,c.climateMandate,c.stressTestReq?'Yes':'No',c.greenQEVolBn,c.disclosureRules,c.capitalBps,`"${c.prudenti` |
| `csv` | `[headers,...rows].map(r=>r.join(',')).join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `spreadData` | `SECTOR_IMPACT.map(s=>({name:s.sector,spread:parseInt(s.spreadChange),tilt:parseFloat(s.greenTiltImpact)}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPITAL_RW_DATA`, `CARBON_PRICE_SCENARIOS`, `CENTRAL_BANKS`, `COLLATERAL_FRAMEWORKS`, `GREEN_PROGRAMS`, `MANDATE_FILTER`, `NGFS_FILTER`, `NGFS_SCENARIOS`, `PIE_COLORS`, `PORTFOLIO_RECS`, `QUARTERS`, `RADAR_COLORS`, `REGIONAL_SUMMARY`, `REGIONS`, `RESERVE_ESG`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Credit Risk Uplift | — | Scenario analysis | Increase in expected credit losses under disorderly transition |
| Market Risk Repricing | — | Disorderly transition | Mark-to-market loss from abrupt carbon price increase |
| Supervisory Expectations | — | BCBS 530 | Basel expectations for climate risk management |
- **NGFS scenario parameters** → Sector shock transmission → **Bank-level impact estimates**
- **Supervisory data** → Climate risk assessment → **SREP climate score**
- **Financial stability analysis** → Macroprudential recommendation → **Policy response tools**

## 5 · Intermediate Transformation Logic
**Methodology:** Macro-financial climate transmission
**Headline formula:** `FinStability_impact = Σ(Sector_i × Scenario_shock_i × Bank_exposure_i)`
**Standards:** ['NGFS', 'FSB', 'BCBS 530', 'BIS Climate-Related Financial Risks']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).