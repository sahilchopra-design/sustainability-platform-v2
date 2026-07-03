# Procurement Climate Risk Analytics
**Module ID:** `procurement-climate-risk` · **Route:** `/procurement-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DN2 · **Sprint:** DN

## 1 · Overview
Analyses climate physical and transition risks embedded in procurement portfolios. Identifies supply chain disruption probability from climate events, carbon cost pass-through from carbon-intensive suppliers, and regulatory exposure from EUDR and CS3D supply chain due diligence requirements.

> **Business value:** Required for corporate procurement and sustainability teams managing CS3D compliance, CFOs stress-testing carbon cost pass-through, and supply chain risk managers. Provides systematic risk-weighted procurement climate analysis and regulatory compliance gap reporting.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CATEGORIES`, `CAT_TYPES`, `KpiCard`, `REGIONS`, `RISK_LEVELS`, `RiskBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Risk Dashboard', 'Physical Risk', 'Transition Risk', 'Concentration Analysis', 'Category Deep-Dive', 'Regional Heat Map', 'Mitigation Playbook', 'Sc` |
| `composite` | `(c.physicalRisk + c.transitionRisk) / 2;` |
| `totalSpend` | `useMemo(() => CATEGORIES.reduce((a, c) => a + c.spendMn, 0), []);` |
| `avgPhysical` | `useMemo(() => CATEGORIES.reduce((a, c) => a + c.physicalRisk, 0) / Math.max(1, CATEGORIES.length), []);` |
| `avgTransition` | `useMemo(() => CATEGORIES.reduce((a, c) => a + c.transitionRisk, 0) / Math.max(1, CATEGORIES.length), []);` |
| `criticalCount` | `useMemo(() => CATEGORIES.filter(c => (c.physicalRisk + c.transitionRisk) / 2 >= 7.5).length, []);` |
| `regionalBreakdown` | `useMemo(() => REGIONS.map(r => {` |
| `spend` | `cats.reduce((a, c) => a + c.spendMn, 0);` |
| `avgPR` | `cats.length ? cats.reduce((a, c) => a + c.physicalRisk, 0) / cats.length : 0;` |
| `avgTR` | `cats.length ? cats.reduce((a, c) => a + c.transitionRisk, 0) / cats.length : 0;` |
| `typeBreakdown` | `useMemo(() => CAT_TYPES.map(t => {` |
| `spend` | `cats.reduce((a, c) => a + c.spendMn, 0);` |
| `avgPR` | `cats.length ? cats.reduce((a, c) => a + c.physicalRisk, 0) / cats.length : 0;` |
| `avgCI` | `cats.length ? cats.reduce((a, c) => a + c.carbonIntensity, 0) / cats.length : 0;` |
| `top10ByRisk` | `useMemo(() => [...CATEGORIES].sort((a, b) => ((b.physicalRisk + b.transitionRisk) / 2) - ((a.physicalRisk + a.transitionRisk) / 2)).slice(0, 10), []);` |
| `top10BySpend` | `useMemo(() => [...CATEGORIES].sort((a, b) => b.spendMn - a.spendMn).slice(0, 10), []);` |
| `composite` | `(c.physicalRisk + c.transitionRisk) / 2;` |
| `composite` | `(c.physicalRisk + c.transitionRisk) / 2;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAT_TYPES`, `REGIONS`, `RISK_LEVELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Supply Chain Disruption Cost | — | McKinsey SCRI 2022 | Average annual supply chain disruption cost for large corporations — climate events driving 30%+ of disruption |
| Carbon Pass-Through Rate | — | IEA Carbon Pricing and Industry 2023 | Manufacturing suppliers pass 40–70% of carbon cost increases to buyers via price increases |
| CS3D Due Diligence Scope | — | EU CS3D Directive 2024/1760 | CS3D requires due diligence across direct and indirect supply chain for >500 employee EU companies |
- **Procurement data by supplier, category, and geography** → Risk scoring → **Spend-weighted climate risk by procurement category**
- **Supplier carbon intensity data (CDP, sector averages)** → Carbon pass-through calculation → **Expected price impact from carbon cost pass-through**
- **EUDR/CS3D regulatory requirements** → Compliance gap analysis → **Supplier compliance status and due diligence action plan**

## 5 · Intermediate Transformation Logic
**Methodology:** Procurement Climate Risk Score
**Headline formula:** `ProcurRisk = Σ [SpendShare_i × (PhysicalRisk_i + TransitionRisk_i + RegulatoryRisk_i)]; CarbonPassThrough = Σ [Spend_j × CarbonIntensity_j × CarbonPrice × PassThroughRate]`
**Standards:** ['EU Corporate Sustainability Due Diligence Directive (CS3D) 2024', 'EUDR Regulation 2023/1115', 'Supply Chain Risk Institute Framework', 'Science Based Targets initiative Scope 3 Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).