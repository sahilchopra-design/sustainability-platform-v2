# Ratings Migration Momentum
**Module ID:** `ratings-migration-momentum` · **Route:** `/ratings-migration-momentum` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Generates ESG rating upgrade and downgrade momentum signals from historical migration matrices to identify positive and negative ESG trajectories.

> **Business value:** Transforms historical ESG rating data into forward-looking momentum signals, providing systematic investors with an ESG quality improvement factor.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AlphaSignalBuilder`, `COMPANIES`, `COMPANY_NAMES`, `ESG_EVENTS`, `KPI`, `MigrationTracker`, `MomentumSignals`, `PROVIDERS`, `PROV_COLORS`, `ProviderLeadLag`, `QUARTERS`, `RATINGS`, `SECTORS`, `Spark`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26'];` |
| `genCompanies` | `(count)=>COMPANY_NAMES.slice(0,count).map((name,i)=>({` |
| `base` | `Math.floor(sr(i*100+pi*13+qi*3)*5)+1;` |
| `rLabel` | `(idx)=>RATINGS[Math.max(0,Math.min(6,idx))]\|\|'CCC';` |
| `pts` | `data.map((v,i)=>`${(i/(data.length-1))*w},${h-(((v-mn)/rng)*h)}`).join(' ');` |
| `tabs` | `['Migration Tracker','Momentum Signals','Provider Lead-Lag','Alpha Signal Builder'];` |
| `activeProviders` | `useMemo(()=>PROVIDERS.map((_p,i)=>provFilter[i]?i:null).filter(x=>x!==null),[provFilter]);` |
| `from` | `c.ratings[pi][qPair],to=c.ratings[pi][qPair+1];` |
| `total` | `ups+downs+stable;` |
| `upDownData` | `useMemo(()=>PROVIDERS.map((p,pi)=>{` |
| `diff` | `c.ratings[pi][qPair]-c.ratings[pi][qPair+1];` |
| `paged` | `filtered.slice(page*perPage,(page+1)*perPage);` |
| `totalPages` | `Math.ceil(filtered.length/perPage);` |
| `from` | `rLabel(c.ratings[pi][qPair]),to=rLabel(c.ratings[pi][qPair+1]);` |
| `diff` | `c.ratings[pi][qPair]-c.ratings[pi][qPair+1];` |
| `avg` | `activeProviders.length?activeProviders.reduce((s,pi)=>s+(c.ratings[pi][qPair]-c.ratings[pi][qPair+1]),0)/activeProviders.length:0;` |
| `momentum` | `useMemo(()=>COMPANIES.map(c=>{` |
| `provScores` | `PROVIDERS.map((_p,pi)=>{` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_NAMES`, `ESG_EVENTS`, `PROVIDERS`, `PROV_COLORS`, `QUARTERS`, `RATINGS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Coverage Universe | — | ESG Rating Database | Securities with at least 12 months of ESG rating history for momentum calculation. |
| Top Decile Momentum (avg Δscore) | — | Migration Analytics | Average 12-month score improvement for top-decile momentum companies. |
| Momentum Signal IC | — | Backtest Engine | Information coefficient of momentum signal vs 12-month forward ESG ratings. |
- **Historical ESG rating time series** → Migration event detection; momentum score construction; backtest → **Momentum signal scores, migration matrix, and long/short candidate list**

## 5 · Intermediate Transformation Logic
**Methodology:** Migration Momentum Score
**Headline formula:** `Mᵢ = Σ(upgrade_events – downgrade_events) / T × recency_weight`
**Standards:** ['MSCI ESG Rating History', 'Sustainalytics Rating History']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).