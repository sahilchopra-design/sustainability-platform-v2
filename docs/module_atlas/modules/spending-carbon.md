# Spending Carbon
**Module ID:** `spending-carbon` · **Route:** `/spending-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Personal and corporate spend-based carbon footprint calculator that converts expenditure categories into GHG emissions using environmentally extended input-output (EEIO) coefficients.

> **Business value:** Spend-based footprinting enables rapid Scope 3 estimation where activity data is unavailable; suitable for SMEs and personal carbon budgets.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PEER_BENCHMARKS`, `PIE_COLORS`, `SEASONAL_LABELS`, `TRANSITION_PATHS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `count` | `8 + Math.floor(sr(_sc++) * 8);` |
| `cat` | `cats[Math.floor(sr(_sc++) * cats.length)];` |
| `desc` | `descs[cat][Math.floor(sr(_sc++) * descs[cat].length)];` |
| `amt` | `+(5 + sr(_sc++) * 150).toFixed(2);` |
| `carbon` | `+(amt * carbonBase * (0.5 + sr(_sc++))).toFixed(2);` |
| `totalSpend` | `useMemo(() => transactions.reduce((s, t) => s + (t.amount_usd \|\| 0), 0), [transactions]);` |
| `totalCarbon` | `useMemo(() => transactions.reduce((s, t) => s + (t.carbon_kg \|\| 0), 0), [transactions]);` |
| `carbonPerDollar` | `totalSpend > 0 ? totalCarbon / totalSpend : 0;` |
| `pieData` | `useMemo(() => categoryData.map(c => ({ name: c.name, value: c.totalCarbon })), [categoryData]);` |
| `worstMonth` | `useMemo(() => monthlyData.reduce((worst, m) => (!worst \|\| m.intensity > worst.intensity) ? m : worst, null), [monthlyData]);` |
| `lowestCat` | `categoryData.length > 1 ? categoryData[categoryData.length - 1] : null;` |
| `scatterData` | `useMemo(() => transactions.map(t => ({` |
| `beefSave` | `(beefReduction / 100) * 1310;` |
| `transportSave` | `(transportSwitch / 100) * 835;` |
| `energySave` | `(energyReduction / 100) * 500;` |
| `shopSave` | `(shoppingReduction / 100) * 178;` |
| `annualCarbon` | `totalCarbon; // approximate from data period` |
| `forecastCarbon` | `annualCarbon * forecastYears;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `TRANSITION_PATHS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Footprint | — | EEIO Model | Sum of all category emissions; benchmark against national per-capita average of 10–12 tCO2e. |
| Highest Category | — | Spend Ledger | Category contributing largest share of footprint; primary reduction lever. |
| Emission Intensity | — | DEFRA EF 2023 | Weighted average emission factor across all spend; lower is greener. |
- **Spend Ledger / Bank Feed** → Category mapping + EEIO coefficient lookup → **Category footprint breakdown, reduction roadmap**

## 5 · Intermediate Transformation Logic
**Methodology:** Spend-Based Emission Factor
**Headline formula:** `Emissions = Spend (×) EF (kgCO2e/£)`
**Standards:** ['GHG Protocol Scope 3 Cat 1', 'DEFRA EEIO 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).