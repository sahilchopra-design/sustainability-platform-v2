# SDG Bond Impact
**Module ID:** `sdg-bond-impact` · **Route:** `/sdg-bond-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SDG-aligned bond impact reporting and use-of-proceeds tracking mapping green, social and sustainability bond allocations to UN Sustainable Development Goal outcomes.

> **Business value:** Tracks bond proceeds allocation against SDG targets and quantifies impact outcomes for ESG fixed income portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_IMPACT_METRICS`, `Badge`, `Btn`, `CATEGORIES`, `Card`, `KPI`, `PIE_COLORS`, `SDG_COLORS`, `SDG_NAMES`, `SdgBondImpactPage`, `Section`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(v) => (v * 100).toFixed(1) + '%';` |
| `totalInvested` | `useMemo(() => bonds.reduce((s, b) => s + b.size_mn, 0), [bonds]);` |
| `avgImpact` | `useMemo(() => bonds.length ? Math.round(bonds.reduce((s, b) => s + b.impactScore, 0) / bonds.length) : 0, [bonds]);` |
| `pieCatData` | `useMemo(() => CATEGORIES.map(c => ({ name: c, value: categoryTotals[c]?.invested \|\| 0 })).filter(d => d.value > 0), [categoryTotals]);` |
| `scatterData` | `useMemo(() => bonds.map(b => ({ x: b.yield, y: b.impactScore, z: b.size_mn, name: b.issuer, category: b.category })), [bonds]);` |
| `rows` | `bonds.map(b => `${b.id},${b.issuer},${b.category},${b.size_mn},${b.yield},${b.impactScore},${b.verified},${b.additionality},${b.icma_compliant},${b.sd` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `total` | `m.benchmark * (categoryTotals[selectedCategory]?.invested \|\| 0);` |
| `blob` | `new Blob([generateReport()], { type: 'text/plain' });` |
| `impactVal` | `primaryMetric ? primaryMetric.benchmark * b.size_mn : 0;` |
| `val` | `m.benchmark * invested;` |
| `pctVal` | `bonds.length ? (cnt / bonds.length * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bonds Tracked | — | Bond register | Total SDG-labelled bonds under active impact monitoring. |
| Proceeds Allocated | — | Issuer reports | Cumulative use-of-proceeds allocations reported by issuers in tracking period. |
| Avg SDG Alignment | — | Calculated | Mean SDG alignment score across all tracked bonds weighted by proceeds volume. |
- **Issuer allocation reports, SDG taxonomy, bond prospectus data** → Proceeds mapping, SDG alignment scoring, impact metric aggregation → **SDG impact reports, alignment dashboards, investor disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** SDG Alignment Score
**Headline formula:** `Σ (Proceeds to SDG Project × SDG Weight) ÷ Total Proceeds × 100`
**Standards:** ['ICMA GBP', 'UN SDG Taxonomy', 'MDB Harmonised Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).