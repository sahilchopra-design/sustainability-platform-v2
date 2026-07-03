# Materiality Intelligence Hub
**Module ID:** `materiality-hub` · **Route:** `/materiality-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Cross-framework materiality intelligence combining CSRD double materiality, ISSB single materiality, and GRI impact materiality. Includes SASB sector standards mapping and peer analysis.

> **Business value:** Reporting to multiple frameworks simultaneously is a major efficiency challenge. This hub identifies topics material across all frameworks and maps shared data requirements, reducing the duplication burden of CSRD + ISSB + GRI multi-standard reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `KpiCard`, `SECTORS`, `STAKEHOLDER_GROUPS`, `TABS`, `TOPICS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `maturityTrend` | `YEARS.map((yr, i) => ({` |
| `scatterData` | `useMemo(() => filteredTopics.map(t => ({` |
| `topicBarData` | `useMemo(() => filteredTopics.map(t => ({` |
| `stakeData` | `useMemo(() => STAKEHOLDER_GROUPS.map(s => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `STAKEHOLDER_GROUPS`, `TABS`, `TOPICS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CSRD Material Topics | — | Company range | Double materiality triggers |
| ISSB Material Topics | — | Company range | Enterprise value impact triggers |
| SASB Accounting Metrics | — | SASB | Industry-specific quantitative disclosure metrics |
- **SASB sector standards** → Industry metric mapping → **Sector-relevant disclosure topics**
- **Company business model** → Multi-framework materiality → **Topics material under each framework**
- **Peer disclosures** → Benchmark comparison → **Sector materiality norms**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-framework materiality comparison
**Headline formula:** `CSRD: impact OR financial; ISSB: enterprise value only; GRI: impact only`
**Standards:** ['EFRAG ESRS', 'ISSB IFRS S1', 'GRI Standards 2021', 'SASB']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).