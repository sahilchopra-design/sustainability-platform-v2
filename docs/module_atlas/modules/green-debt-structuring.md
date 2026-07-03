# Green Debt Structuring Analytics
**Module ID:** `green-debt-structuring` · **Route:** `/green-debt-structuring` · **Tier:** B (frontend-computed) · **EP code:** EP-DD2 · **Sprint:** DD

## 1 · Overview
Green debt structuring analytics for green bonds, green loans, and sustainability-linked loans. Models coupon step-up/down mechanics, second-party opinion costs, post-issuance reporting burden, and greenium analysis. Covers ICMA GBP and GLP frameworks.

> **Business value:** Provides rigorous green debt structuring analytics quantifying greenium benefit against SPO and reporting costs, enabling corporate treasurers to optimise green financing instrument selection.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CURRENCIES`, `FRAMEWORKS`, `INSTRUMENTS`, `REGIONS`, `SDG_TAGS`, `SECTORS`, `SECTOR_COLORS`, `TABS`, `TYPES`, `TYPE_COLORS`, `VERIFIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Green Bond', 'Sustainability-Linked Bond', 'Transition Bond', 'Blue Bond', 'SDG Bond', 'Social Bond', 'Sustainability Bond'];` |
| `notional` | `0.2 + sr(i * 7) * 4.8;` |
| `greenium` | `-(2 + sr(i * 11) * 20);` |
| `kpiTarget` | `20 + sr(i * 13) * 60;` |
| `kpiActual` | `kpiTarget * (0.6 + sr(i * 17) * 0.7);` |
| `coupon` | `1.5 + sr(i * 19) * 4;` |
| `oversubRatio` | `1.2 + sr(i * 23) * 4.8;` |
| `sdgCount` | `2 + Math.floor(sr(i * 29) * 4);` |
| `TYPE_COLORS` | `{ 'Green Bond': '#059669', 'Sustainability-Linked Bond': '#2563eb', 'Transition Bond': '#d97706', 'Blue Bond': '#0891b2', 'SDG Bond': '#7c3aed', 'Soci` |
| `totalNotional` | `filtered.reduce((s, d) => s + d.notional, 0);` |
| `avgGreenium` | `filtered.length ? filtered.reduce((s, d) => s + d.greenium, 0) / filtered.length : 0;` |
| `avgOverSub` | `filtered.length ? filtered.reduce((s, d) => s + d.oversubRatio, 0) / filtered.length : 0;` |
| `totalImpact` | `filtered.reduce((s, d) => s + d.climateImpact, 0);` |
| `kpiOnTrack` | `filtered.filter(d => d.kpiActual >= d.kpiTarget * (kpiMiss / 100)).length;` |
| `typeBreakdown` | `useMemo(() => TYPES.map(t => {` |
| `sectorBreakdown` | `useMemo(() => SECTORS.map(s => {` |
| `kpiStepCalc` | `useMemo(() => filtered.slice(0, 12).map(d => {` |
| `miss` | `Math.max(0, d.kpiTarget - d.kpiActual) / Math.max(0.1, d.kpiTarget) * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CURRENCIES`, `FRAMEWORKS`, `REGIONS`, `SDG_TAGS`, `SECTORS`, `TABS`, `TYPES`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium vs Conventional | `Yield differential for green vs conventional bond by matched issuer/maturity/rating` | Bloomberg BVAL / ICMA market survey | Average greenium -5 to -8 bps in EUR investment grade; USD market smaller (-2 to -4 bps); high-yield minimal |
| Net Green Bond Benefit | `Coupon saving from greenium - SPO cost - annual reporting cost × 5` | ICMA and CBI issuance cost survey | SPO cost $50-150k; annual reporting $30-80k; greenium saving typically covers costs for bonds >€200M |
| SLL Margin Ratchet | `Coupon adjustment range for meeting/missing sustainability performance targets` | LMA Green Loan Principles survey | Market convention ±5-10 bps; symmetric ratchet required by ICMA to avoid tokenism; tied to externally verified |
- **Bloomberg BVAL green bond pricing data** → Real-time and historical green vs conventional yield spreads → greenium calculation → **Net financial benefit analysis**
- **ICMA/CBI SPO and reporting cost surveys** → SPO provider fees and annual reporting cost benchmarks → total cost of green issuance → **Break-even analysis by deal size**
- **LMA SLL market survey data** → Margin ratchet size, KPI types, verification agent market practice → SLL structure benchmarking → **SLL term sheet optimisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Debt Pricing & Structure Analytics
**Headline formula:** `Greenium = Yield(conventional) - Yield(green) in bps; Net Benefit = Greenium Savings - SPO Cost - Reporting Cost over bond life`
**Standards:** ['ICMA Green Bond Principles 2021', 'LMA/APLMA/LSTA Green Loan Principles 2023', 'Climate Bonds Initiative Certification Standard v4.0']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).