# Fund of Funds ESG
**Module ID:** `fund-of-funds` · **Route:** `/fund-of-funds` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Aggregates ESG metrics and carbon footprint across fund-of-fund holdings using look-through methodology, penetrating sub-fund layers to compute portfolio-level weighted averages. Supports SFDR Article 8/9 classification at the FoF level and PAI indicator aggregation across underlying funds with varying data availability.

> **Business value:** Enables fund-of-fund managers to demonstrate SFDR compliance at the product level despite one or two layers of fund intermediation, produce PCAF-aligned financed emissions disclosures, and identify sub-funds that constrain the FoF ESG profile through low transparency or high carbon intensity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `DEFAULT_FUNDS`, `LS_KEY`, `PIE_COLORS`, `SortIcon`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalW` | `funds.reduce((s,f) => s + (f[weight]\|\|0), 0);` |
| `types` | `useMemo(() => ['All', ...new Set(funds.map(f => f.type))], [funds]);` |
| `totalCommit` | `f.reduce((s,x) => s+x.commitment_mn,0);` |
| `totalNav` | `f.reduce((s,x) => s+x.nav_mn,0);` |
| `totalAUM` | `f.reduce((s,x) => s+x.aum_mn,0);` |
| `totalHoldings` | `f.reduce((s,x) => s+x.num_holdings,0);` |
| `geos` | `new Set(f.map(x => x.geography)).size;` |
| `fundTypes` | `new Set(f.map(x => x.type)).size;` |
| `scatterData` | `useMemo(() => funds.filter(f => f.irr != null).map(f => ({ name:f.name, x:f.esg_score, y:f.irr, z:f.commitment_mn, type:f.type })), [funds]);` |
| `distPct` | `y >= 3 ? Math.min((y-3)/7, 1) * 0.35 : 0;` |
| `dists` | `kpis.totalCommit * (y >= 3 ? Math.min((y-3)/5, 1) * 0.25 : 0);` |
| `net` | `calls + dists;` |
| `saveEdit` | `() => { setFunds(p => p.map(f => f.id === editId ? { ...editData } : f)); setEditId(null); setEditData(null); };` |
| `rows` | `filtered.map(f => Object.values(f).map(v => v == null ? '' : `"${v}"`).join(',')).join('\n');` |
| `blob` | `new Blob([hdr + '\n' + rows], { type:'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(filtered, null, 2)], { type:'application/json' });` |
| `blob` | `new Blob([html], { type:'text/html' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEFAULT_FUNDS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Look-Through Coverage (%) | — | Sub-fund transparency reports | Percentage of FoF NAV for which full holding-level data is available; below 70% triggers proxy-based estimatio |
| Weighted Avg Carbon Intensity (tCO2e/$M) | — | PCAF / Sub-fund SFDR data | Revenue-normalised Scope 1+2 carbon intensity aggregated across all look-through positions. |
| SFDR PAI Coverage (%) | — | Sub-fund SFDR disclosures | Share of mandatory PAI indicators computable from available sub-fund disclosures without estimation. |
| Sub-Fund ESG Classification | — | SFDR product classification | Distribution of sub-funds by SFDR article; FoF Article 9 status requires all sub-funds to be Article 8 or abov |
- **Sub-fund transparency reports and holdings files** → Apply look-through weights, map to ISIN universe → **Holding-level ESG and emissions data**
- **SFDR PAI disclosures from underlying funds** → Aggregate PAI indicators weighted by FoF allocation → **FoF-level PAI summary table**
- **Fund NAV and allocation data** → Compute FoF weights, apply PCAF look-through formula → **Weighted average carbon footprint and intensity**

## 5 · Intermediate Transformation Logic
**Methodology:** Look-Through Carbon Footprint
**Headline formula:** `CF_FoF = Σ_f (w_f × Σ_i (w_fi × EVIC_fi⁻¹ × Emissions_fi))`
**Standards:** ['SFDR Delegated Regulation Annex I', 'TCFD Portfolio Alignment', 'PCAF Standard Part A']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).