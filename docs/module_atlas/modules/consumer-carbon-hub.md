# Consumer Carbon Hub
**Module ID:** `consumer-carbon-hub` · **Route:** `/consumer-carbon-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses Scope 3 Category 11 consumer use-phase emissions for product portfolios, computing product lifecycle GHG profiles, use-phase intensity benchmarks, and product-level decarbonisation pathway options. Enables manufacturers and retailers to meet GHG Protocol Category 11 reporting requirements and set science-based product targets.

> **Business value:** Helps manufacturers and retailers quantify and reduce the largest component of many companies’ Scope 3 footprints, supporting SBTi product-level targets, CSRD ESRS E1 disclosure, and product-level climate labelling initiatives.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_FACTS`, `CARBON_GLOSSARY`, `CARBON_MILESTONES`, `CARBON_TIPS`, `COMMUNITY_LEADERBOARD`, `IMPACT_COMPARISONS`, `LS_CART`, `LS_CONFIG`, `LS_RECEIPTS`, `LS_WALLET`, `MODULE_CARDS`, `ONBOARDING_STEPS`, `PIE_COLORS`, `WEEKLY_CHALLENGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => n >= 1000 ? (n/1000).toFixed(d)+'k' : Number(n).toFixed(d);` |
| `blob` | `new Blob([hdr+'\n'+body], { type:'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });` |
| `badge` | `(bg, color) => ({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:bg, color });` |
| `totalCarbonYTD` | `useMemo(() => txns.reduce((s, t) => s + (t.carbon_kg \|\| 0), 0), [txns]);` |
| `dailyAvg` | `txns.length > 0 ? (totalCarbonYTD / Math.max(1, new Set(txns.map(t => (t.date \|\| '').slice(0, 10))).size)) : 0;` |
| `budgetUsedPct` | `wallet.budget_kg ? (totalCarbonYTD / wallet.budget_kg * 100) : 0;` |
| `sorted` | `Object.entries(cats).sort((a, b) => b[1] - a[1]);` |
| `totalSpend` | `txns.reduce((s, t) => s + (t.amount \|\| 0), 0);` |
| `sorted` | `Object.entries(months).sort((a, b) => a[1] - b[1]);` |
| `carbonSaved` | `useMemo(() => txns.reduce((s, t) => s + (t.saved_kg \|\| 0), 0), [txns]);` |
| `treesToOffset` | `totalCarbonYTD > 0 ? Math.ceil(totalCarbonYTD / 22) : 0;` |
| `carbonScore` | `Math.max(0, Math.min(100, Math.round(100 - budgetUsedPct)));` |
| `dates` | `[...new Set(txns.map(t => (t.date \|\| '').slice(0, 10)))].sort().reverse();` |
| `diff` | `Math.round((today - d) / 86400000);` |
| `pct` | `Math.min(100, (d.value / d.target) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_FACTS`, `CARBON_GLOSSARY`, `CARBON_MILESTONES`, `CARBON_TIPS`, `COMMUNITY_LEADERBOARD`, `IMPACT_COMPARISONS`, `MODULE_CARDS`, `ONBOARDING_STEPS`, `PIE_COLORS`, `WEEKLY_CHALLENGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Category 11 Emissions | — | GHG Protocol | Total use-phase Scope 3 Category 11 emissions across product portfolio |
| Use-Phase Intensity | — | Product LCA | GHG intensity per unit sold during consumer use phase over product lifetime |
| Grid Emission Factor | — | IEA Electricity Information | Country-specific grid emission factor used for electrically powered product use-phase |
| Product Lifetime (avg) | — | Sector conventions / ADEME | Average assumed useful life of products used in Category 11 calculation |
| Category 11 % of Total Scope 3 | — | GHG Protocol | Proportion of total Scope 3 footprint attributable to consumer use phase |
- **Product registry and sales records** → Match to energy consumption specifications per product SKU → **Use-phase activity data by product**
- **IEA grid emission factor database** → Match sales geography to country EF, apply annual updates → **Country-weighted grid EF per product market**
- **GHG Protocol Cat11 model** → Compute units × EF × lifetime, aggregate by category → **Category 11 total and intensity metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** Use-Phase Lifecycle Emission Model
**Headline formula:** `Cat11_total = Σ_p (Units_sold_p × UsePhase_EF_p × Lifetime_p)`
**Standards:** ['GHG Protocol Scope 3 â€” Category 11', 'ISO 14044 LCA', 'IEA Grid Emission Factors']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).