# Scenario Stress Test
**Module ID:** `scenario-stress-test` · **Route:** `/scenario-stress-test` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level climate stress testing under NGFS scenarios. Covers transition (carbon price, policy) and physical (hazard, GDP shock) channels with sector-level loss attribution.

> **Business value:** Regulatory climate stress tests are now mandatory across EU, UK, Australia, and Hong Kong. This module enables scenario analysis required for TCFD/ISSB Strategy disclosures, ECB SREP climate assessment, and internal capital adequacy planning under climate stress.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `HOLD_NAMES`, `MACRO`, `PORTFOLIO`, `SCENARIOS`, `SECTOR_IMPACTS`, `SECTOR_NAMES`, `STRESS_RESULTS`, `TABS`, `TOTAL_MV`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtB` | `n=>n>=1e3?`$${fmt(n/1e3)}B`:`$${fmt(n,0)}M`;` |
| `clamp` | `(v,lo,hi)=>Math.max(lo,Math.min(hi,v));` |
| `safeDivide` | `(a,b,fallback=0)=>b!==0?a/b:fallback;` |
| `base` | `sr(si*100+sci*13+7);` |
| `sIdx` | `Math.floor(sr(i*17)*SECTOR_NAMES.length);` |
| `idio` | `sr(i*100+sci*7)*4-2;` |
| `TOTAL_MV` | `PORTFOLIO.reduce((a,h)=>a+h.market_value,0);` |
| `YEARS` | `Array.from({length:31},(_,i)=>2025+i);` |
| `losses` | `PORTFOLIO.map(h=>h.scenImpacts[s.id].loss_pct*h.market_value/100);` |
| `totalLoss` | `losses.reduce((a,v)=>a+v,0);` |
| `sortedLosses` | `[...losses].sort((a,b)=>a-b);` |
| `var95idx` | `Math.floor(sortedLosses.length*0.95);` |
| `var99idx` | `Math.floor(sortedLosses.length*0.99);` |
| `var95` | `sortedLosses[Math.min(var95idx,sortedLosses.length-1)];` |
| `var99` | `sortedLosses[Math.min(var99idx,sortedLosses.length-1)];` |
| `es95` | `tailLosses.length>0?tailLosses.reduce((a,v)=>a+v,0)/tailLosses.length:0;` |
| `btnS` | `a=>({fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:a?700:500,padding:'8px 18px',border:`1px solid ${a?T.gold:T.border}`,borderRadius:6,back` |
| `kpiLab` | `{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.sub,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `HOLD_NAMES`, `SCENARIOS`, `SECTOR_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scenarios | — | NGFS | Current Policies, Delayed Transition, Below 2°C, Net Zero 2050, Divergent Net Zero |
| Portfolio Loss (NZ 2050) | — | Model | AUM decline under Net Zero 2050 stress |
| Sector Contribution | — | Attribution | Largest single-sector contributor to stress loss |
- **NGFS scenario parameters** → Sector-level shock transmission → **Entity-level loss estimates**
- **Portfolio holdings** → AUM-weighted aggregation → **Portfolio stress loss**
- **Stress results** → Regulatory capital calculation → **Capital adequacy under stress**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated climate stress test
**Headline formula:** `PortfolioLoss = Σ(w_i × EntityLoss_i); EntityLoss = f(sector, scenario, horizon)`
**Standards:** ['NGFS Phase 5', 'ECB CST 2024', 'BoE CBES']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).