# DME Competitive Intelligence
**Module ID:** `dme-competitive` · **Route:** `/dme-competitive` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Peer materiality benchmarking powered by the Dynamic Materiality Engine, comparing an entity's topic-level materiality scores against sector peers and industry leaders. Identifies where competitors face higher or lower material risk, informing strategic positioning and disclosure strategy. Peer cohort is configurable by sector, geography, and market cap.

> **Business value:** Provides sustainability and strategy teams with a competitive lens on ESG material risk, identifying where the entity is relatively exposed or advantaged versus peers. Informs disclosure prioritisation and competitive positioning in investor ESG engagement.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `KpiCard`, `Section`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sorted` | `[...values].sort((a, b) => a - b);` |
| `esgPercentile` | `percentileRank(sectorPeers.map(p => p.esg_score \|\| 0), company.esg_score \|\| 0);` |
| `carbonPercentile` | `percentileRank(sectorPeers.map(p => 1 / (p.ghg_intensity_tco2e_per_mn \|\| 1)), 1 / (company.ghg_intensity_tco2e_per_mn \|\| 1));` |
| `transitionPercentile` | `percentileRank(sectorPeers.map(p => 100 - (p.transition_risk_score \|\| 0)), 100 - (company.transition_risk_score \|\| 0));` |
| `govPercentile` | `(company.esg_score \|\| 50) / 100 * 100;` |
| `scores` | `allPeerScores.map(p => p.composite);` |
| `esgScores` | `sectorPeers.map(p => p.esg_score \|\| 0);` |
| `carbonScores` | `sectorPeers.map(p => p.ghg_intensity_tco2e_per_mn \|\| 0);` |
| `avg` | `(arr) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 10) / 10 : 0;` |
| `median` | `(arr) => { const sorted = [...arr].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : Math.rou` |
| `std` | `(arr) => { const m = avg(arr); return Math.round(Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length) * 10) / 10; };` |
| `sorted` | `[...allPeerScores].sort((a, b) => b.composite - a.composite);` |
| `selectedRank` | `sorted.findIndex(p => p.company_name === selected.company_name) + 1;` |
| `avg` | `(arr, key) => arr.length > 0 ? Math.round(arr.reduce((s, p) => s + (p[key] \|\| 0), 0) / arr.length) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peer Cohort Size | — | Peer selection engine | Count of companies in the configured peer comparison cohort |
| Topics Above Peer Median | — | RMI calculation | Count of material topics where the entity scores above the sector median RMI |
| Highest RMI Topic | — | DME benchmarking engine | Topic with the greatest relative materiality exposure versus the peer cohort |
| Lowest RMI Topic | — | DME benchmarking engine | Topic with the greatest relative resilience versus the peer cohort |
- **DME materiality scores (entity-level, all topics)** → Aggregation of peer scores by sector cohort and calculation of median distribution → **Peer distribution statistics per topic (median, P25, P75, min, max)**
- **Peer company registry with sector and geography metadata** → Cohort selection and filtering by user-defined parameters → **Peer cohort composition with company-level score table**
- **RMI calculation engine** → Entity score / cohort median normalisation per topic → **RMI heat map and ranked topic list with competitive gap analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Relative Materiality Index
**Headline formula:** `RMI = Entity Scoreᵢ / Sector Median Scoreᵢ × 100`
**Standards:** ['GRI Sector Standards Materiality', 'SASB Industry-Specific Materiality Map', 'EFRAG Sector-Specific ESRS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).