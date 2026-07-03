# Controversy Monitor
**Module ID:** `controversy-monitor` · **Route:** `/controversy-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides real-time ESG controversy monitoring across investee companies with severity scoring, reputational risk flags, and automated alerting. Aggregates controversy signals from news, NGO publications, regulatory filings, and social media to provide a comprehensive incident tracking dashboard.

> **Business value:** Enables ESG teams and portfolio managers to stay ahead of reputational and regulatory risks in real time, prioritise stewardship interventions, and demonstrate active oversight of ESG incidents to clients and regulators.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORY_COLORS`, `CONTROVERSY_DB`, `CustomBarTooltip`, `CustomPieTooltip`, `PIE_COLORS`, `RECOMMENDATIONS`, `SEVERITY_COLORS`, `SEVERITY_LABELS`, `STATUS_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `scope1Mt` | `((c.scope1_co2e \|\| 0) / 1e6).toFixed(2);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `formatDate` | `(d) => { const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };` |
| `totalExp` | `holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0) \|\| 1;` |
| `totalWeightAtRisk` | `matched.reduce((s, c) => s + c.portfolioWeight, 0);` |
| `totalExposureAtRisk` | `matched.reduce((s, c) => s + c.portfolioExposure, 0);` |
| `totalEsgImpact` | `matched.reduce((s, c) => s + c.esgImpact, 0);` |
| `key` | ``${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;` |
| `rows` | `filtered.map(c => {` |
| `rows` | `watchlistedEvents.map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONTROVERSY_DB`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Controversies | — | RepRisk / Media | Number of active (unresolved) ESG controversies per company in the monitoring universe |
| Peak Severity Score | — | Scoring model | Maximum severity of any active controversy; 5 = global human rights/environmental catastrophe |
| Reputational Risk Index | — | RepRisk RRI | Rolling 24-month composite reputational risk score derived from controversy volume and severity |
| Alert Velocity | — | News monitoring | Rate of new controversy signals; spike detection triggers immediate analyst notification |
| Remediation Progress | — | Company disclosures / GRI | Proportion of identified remediation actions completed for active controversies |
- **News APIs / NGO publications / regulatory filings** → NLP classification by E/S/G category, severity scoring → **Structured controversy signal feed**
- **Social media and litigation databases** → Match to LEI/company universe, compute reach and novelty → **Company-level controversy log**
- **Company remediation disclosures (GRI, UNGP)** → Track commitments, verify closure evidence → **Remediation progress tracker per controversy**

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy Severity Scoring
**Headline formula:** `Severity = max(Category_weight × Reach_score × Novelty_factor)`
**Standards:** ['RepRisk Methodology', 'MSCI ESG Controversy Framework', 'GRI 2-26 Remediation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).