# Infrastructure ESG Due Diligence
**Module ID:** `infra-esg-dd` · **Route:** `/infra-esg-dd` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides pre-investment ESG due diligence framework for infrastructure assets aligned with GIIA Global ESG Reporting and Performance Framework, covering environmental baseline assessment, social impact, stakeholder engagement, and governance of the investee entity. Supports GP/LP reporting and infrastructure-specific ESG risk mitigation planning.

> **Business value:** Enables infrastructure investors to identify material ESG risks before financial close, structure ESG covenants in financing agreements, meet GIIA ESG framework reporting obligations, and demonstrate alignment with IFC Performance Standards required for development finance institution co-investment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_TYPES`, `Badge`, `COUNTRIES`, `Card`, `DD_ITEMS`, `DEFAULT_INFRA_PORTFOLIO`, `EP_COLORS`, `KPI`, `PIE_COLORS`, `SDG_NAMES`, `STORAGE_KEY`, `SortIcon`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ASSET_TYPES` | `['Solar','Wind','Toll Road','Port','Airport','Water','Telecom','Mining','Storage','Geothermal','Hydro','Rail','Waste-to-Energy','Gas Pipeline'];` |
| `pct` | `(v, d = 1) => v != null ? `${v.toFixed(d)}%` : '-';` |
| `fmt` | `(v, d = 1) => v != null ? v.toFixed(d) : '-';` |
| `fmtB` | `v => v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`;` |
| `fmtK` | `v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;` |
| `updated` | `{ ...data, assets: data.assets.map(a => a.id === assetId ? { ...a, ...changes } : a) };` |
| `nextId` | ``INF-${String(data.assets.length + 1).padStart(2, '0')}`;` |
| `final` | `{ ...asset, id: nextId, composite_esg: Math.round((asset.environmental_score + asset.social_score + asset.governance_score) / 3) };` |
| `types` | `useMemo(() => ['All', ...new Set(assets.map(a => a.type))], [assets]);` |
| `totalInvestment` | `assets.reduce((s, a) => s + a.total_investment_usd_mn, 0);` |
| `avgESG` | `assets.length ? assets.reduce((s, a) => s + a.composite_esg, 0) / assets.length : 0;` |
| `totalAvoided` | `assets.reduce((s, a) => s + a.avoided_emissions_tco2e, 0);` |
| `totalJobs` | `assets.reduce((s, a) => s + a.jobs_created, 0);` |
| `avgCommunity` | `assets.length ? assets.reduce((s, a) => s + a.community_impact_score, 0) / assets.length : 0;` |
| `ddTotalAll` | `assets.reduce((acc, a) => {` |
| `ddPct` | `ddTotalAll.total > 0 ? (ddTotalAll.done / ddTotalAll.total * 100) : 0;` |
| `typeDistrib` | `useMemo(() => { const m = {}; assets.forEach(a => { m[a.type] = (m[a.type] \|\| 0) + 1; }); return Object.entries(m).map(([name, value]) => ({ name, val` |
| `investByType` | `useMemo(() => { const m = {}; assets.forEach(a => { m[a.type] = (m[a.type] \|\| 0) + a.total_investment_usd_mn; }); return Object.entries(m).map(([type,` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `COUNTRIES`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Infrastructure ESG Score | — | GIIA / EDHECinfra | Composite ESG rating for infrastructure assets; energy transition assets (wind, solar, batteries) typically sc |
| Environmental Baseline Completeness (%) | — | IFC Performance Standard 6 | Percentage of required environmental baseline studies completed (biodiversity, noise, air, water, soil); IFC P |
| Community Benefit Agreement Coverage (%) | — | Social impact assessment | Proportion of affected communities with documented community benefit agreements covering employment, access, a |
| Transition Risk Score | — | IEA NZE / NGFS | Climate transition risk for the asset relative to sector decarbonisation pathway; stranded asset risk rises st |
- **Infrastructure asset technical data (capacity, technology, geography)** → Score against GIIA ESG criteria by sub-pillar → **Infrastructure ESG sub-pillar scores**
- **Environmental impact assessment reports** → Cross-reference against IFC PS checklist → **Environmental baseline completeness gap analysis**
- **Community consultation records** → Assess against GIIA social engagement standards → **Social license risk rating**

## 5 · Intermediate Transformation Logic
**Methodology:** Infrastructure ESG Risk Rating
**Headline formula:** `IERR = w_E × Environmental_score + w_S × Social_score + w_G × Governance_score + w_Transition × Transition_risk`
**Standards:** ['GIIA Global ESG Reporting and Performance Framework', 'EDHECinfra ESG Methodology', 'IFC Performance Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).