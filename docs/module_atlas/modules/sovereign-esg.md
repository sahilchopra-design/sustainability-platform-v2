# Sovereign ESG Scorer
**Module ID:** `sovereign-esg` · **Route:** `/sovereign-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
6-dimension ESG assessment for 80 sovereigns using World Bank WGI, Freedom House, Environmental Performance Index, and social indicators. Custom weight configuration.

> **Business value:** Sovereign ESG integration is growing across $5T+ of fixed income portfolios. This module enables systematic, multi-source sovereign ESG assessment beyond simple governance ratings, supporting both exclusion screening and ESG-tilted sovereign allocation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_MAP`, `Card`, `KpiCard`, `LS_PORTFOLIO`, `PIE_COLORS`, `REGION_COLORS`, `SOVEREIGN_DB`, `Section`, `SortTh`, `SovereignEsgPage`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGION_COLORS` | `{ Europe: T.navy, Americas: T.sage, 'Asia-Pacific': T.gold, Africa: '#7c3aed', MENA: '#0d9488' };` |
| `body` | `rows.map(r => cols.map(c => { const v = typeof c.key === 'function' ? c.key(r) : r[c.key]; return typeof v === 'string' && v.includes(',') ? `"${v}"` ` |
| `blob` | `new Blob([hdr + '\n' + body], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `avg` | `(arr, key) => arr.length ? arr.reduce((s, r) => s + (r[key] \|\| 0), 0) / arr.length : 0;` |
| `scatterData` | `useMemo(() => SOVEREIGN_DB.map(c => ({ name: c.name, region: c.region, x: c.ndgain_vulnerability, y: c.ndgain_readiness, z: Math.sqrt(c.gdp_bn) * 3, i` |
| `emissionsSorted` | `useMemo(() => [...SOVEREIGN_DB].sort((a, b) => b.emissions_per_capita - a.emissions_per_capita), []);` |
| `greenBondSorted` | `useMemo(() => [...SOVEREIGN_DB].sort((a, b) => b.green_bond_volume_bn - a.green_bond_volume_bn).slice(0, 20), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `SOVEREIGN_DB`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries | — | Sovereign universe | Global sovereign coverage |
| WGI Dimensions | — | World Bank | Annual governance indicators, -2.5 to +2.5 scale |
| EPI Score | — | Yale EPI | Environmental Performance Index composite |
- **World Bank WGI data** → Governance scoring → **Sovereign governance pillar**
- **Yale EPI data** → Environmental scoring → **Sovereign environmental pillar**
- **UNDP HDI data** → Social scoring → **Sovereign social pillar**

## 5 · Intermediate Transformation Logic
**Methodology:** WGI-based ESG composite
**Headline formula:** `Composite = w_E×Environmental + w_S×Social + w_G×Governance (WGI 6 dims)`
**Standards:** ['World Bank WGI', 'EPI Yale', 'Freedom House']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).