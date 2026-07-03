# DME Dashboard
**Module ID:** `dme-dashboard` · **Route:** `/dme-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Main dashboard of the Dynamic Materiality Engine providing an executive overview of materiality scores, trend signals, and top-ranked material topics across the monitored entity universe. Configurable widgets display heatmaps, score distributions, alert counts, and momentum indicators. Entry point for all DME sub-modules.

> **Business value:** Provides leadership and sustainability teams with a continuously updated, evidence-based view of the organisation's most material ESG topics. The single-entry dashboard ensures all DME analytical modules are accessible from one governed interface.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_COLORS`, `ALERT_TIERS`, `COLORS`, `COMPANY_NAMES`, `DEF_COEFF`, `ENTITIES`, `MODULES`, `MONTHS`, `NGFS_SCENARIOS`, `PILLARS`, `REGIMES`, `REGIME_COLORS`, `REGIONS`, `SECTORS`, `SECTOR_COEFF`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(0)}M`;` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'LATAM', 'Middle East', 'Africa'];` |
| `pdBase` | `0.01 + s(3) * 0.12;` |
| `velocityT` | `-0.3 + s(7) * 0.6;` |
| `pdExp` | `clamp(pdBase * Math.exp(coeff.alphaT * velocityT), 0.001, 0.85);` |
| `assetV` | `500 + s(11) * 4500;` |
| `debt` | `assetV * (0.2 + s(13) * 0.6);` |
| `vol` | `coeff.baseVol + s(17) * 0.1;` |
| `pdMerton` | `clamp(normalCDF(-d2), 0.001, 0.90);` |
| `pdConsensus` | `(pdExp * 0.35 + pdMerton * 0.35 + (pdBase * (1 + s(19) * 0.5)) * 0.30);` |
| `zScore` | `s(23) * 4.2;` |
| `esgScore` | `20 + s(29) * 70;` |
| `envScore` | `20 + s(31) * 70;` |
| `socScore` | `20 + s(37) * 70;` |
| `govScore` | `20 + s(41) * 70;` |
| `dmi` | `esgScore * 0.40 + (100 - pdConsensus * 300) * 0.40 + (50 + s(43) * 50) * 0.20;` |
| `var95` | `assetV * (0.03 + s(47) * 0.12);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TIERS`, `COLORS`, `COMPANY_NAMES`, `MODULES`, `MONTHS`, `NGFS_SCENARIOS`, `PILLARS`, `REGIMES`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Topics Scored | — | DME topic library | Total ESG topics actively scored by the Dynamic Materiality Engine for the monitored entity |
| High-Materiality Topics (Score > 70) | — | DME scoring engine | Count of topics with a current materiality score exceeding the high materiality threshold of 70/100 |
| Platform Materiality Score | — | DME aggregation | Weighted composite materiality score across all active topics on a 0–100 scale |
| Score Momentum (30d) | — | Trend engine | Change in platform materiality score over the trailing 30-day window |
- **DME scoring engine outputs (78 topic scores, all entities)** → Weighted aggregation using administrator-configured topic weights → **Platform Materiality Score and trend time series**
- **External data signal feeds (news, regulatory, NGO, financial)** → Signal ingestion, NLP classification, and topic attribution → **Per-topic signal count, sentiment, and source diversity**
- **Alert engine** → Threshold comparison and APS calculation → **Alert count and critical alert roster for dashboard widget**

## 5 · Intermediate Transformation Logic
**Methodology:** Platform Materiality Score
**Headline formula:** `PMS = Σᵢ (Topic Scoreᵢ × Topic Weightᵢ) / Σᵢ Weightᵢ`
**Standards:** ['EFRAG Materiality Assessment Guidelines', 'ESRS 1 Chapter 3', 'GRI 3 Material Topics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).