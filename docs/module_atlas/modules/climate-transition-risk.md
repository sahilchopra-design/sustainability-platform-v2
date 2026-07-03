# Climate Transition Risk
**Module ID:** `climate-transition-risk` · **Route:** `/climate-transition-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Policy, market, technology, and reputational transition risk assessment by sector. Covers EU ETS exposure, CBAM liability, carbon cost pass-through, and stranded revenue analysis.

> **Business value:** Transition risk is the dominant near-term climate risk for most financial portfolios. Carbon prices, technology substitution, and consumer preference shifts will reshape sector profitability. Early identification enables portfolio repositioning before risks are fully priced.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CARBON_SECTORS`, `CBAM_COMPANIES`, `CBAM_META`, `CBAM_PRICES`, `Hdr`, `LITIGATION`, `PCAF_CATS`, `POLICY_DRIVERS`, `SECTORS_T1`, `StatCard`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `barData` | `SECTORS_T1.map(s => ({ name:s.name, score:+(s.score*mult).toFixed(1) }));` |
| `costData` | `YEARS.map(yr => {` |
| `total2025` | `CARBON_SECTORS.reduce((a,s)=>a+s.rev*s.ci*p2025/1000,0);` |
| `total2050` | `CARBON_SECTORS.reduce((a,s)=>a+s.rev*s.ci*p2050/1000,0);` |
| `coal2050` | `+(coal.rev*coal.ci*p2050/1000).toFixed(0);` |
| `pctInc` | `total2025>0 ? ((total2050/total2025-1)*100).toFixed(0) : '—';` |
| `barData` | `CBAM_COMPANIES.map(c => ({` |
| `totalCost` | `barData.reduce((a,d)=>a+d.cost,0);` |
| `avgScore` | `(PCAF_CATS.reduce((a,c)=>a+c.score,0)/PCAF_CATS.length).toFixed(1);` |
| `barData` | `PCAF_CATS.map((c,i) => ({ name:c.name.split(' ')[0]+(c.name.includes('(')?' (…)':''), emissions:c.emissions, idx:i }));` |
| `gapData` | `SDA_PATHWAYS.map(s => ({` |
| `avgOver` | `(SDA_PATHWAYS.reduce((a,s) => a+(s.current/s.target2030-1)*100, 0)/SDA_PATHWAYS.length).toFixed(0);` |
| `mostOff` | `SDA_PATHWAYS.reduce((a,b) => b.current/b.target2030 > a.current/a.target2030 ? b : a);` |
| `gap` | `+((s.current/s.target2030-1)*100).toFixed(0);` |
| `areaData` | `Array.from({ length:24 }, (_,i) => ({ month:`M${i+1}`, index:45+sr(i*7)*30 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BAR_CLRS`, `CARBON_SECTORS`, `CBAM_COMPANIES`, `CBAM_PRICES`, `LITIGATION`, `PCAF_CATS`, `POLICY_DRIVERS`, `SECTORS_T1`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Policy Risk Drivers | — | Regulatory | Key policy mechanisms creating financial exposure |
| Tech Disruption Timeline | — | IEA/BNEF | When clean tech achieves cost parity in key sectors |
| Stranded Revenue Potential | — | Model | Revenue at risk from demand substitution |
- **ETS exposure data** → Carbon cost calculation → **Policy risk score**
- **Technology cost curves** → Crossover year estimation → **Tech disruption risk**
- **Demand projections** → Revenue impact modelling → **Stranded revenue estimate**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition risk channel decomposition
**Headline formula:** `TransRisk = PolicyRisk + TechRisk + MarketRisk + ReputationRisk`
**Standards:** ['NGFS Transition Risk Framework', 'TCFD', 'ECB CST']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).