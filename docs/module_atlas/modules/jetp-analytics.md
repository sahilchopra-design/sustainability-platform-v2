# JETP Analytics
**Module ID:** `jetp-analytics` · **Route:** `/jetp-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DH3 · **Sprint:** DH

## 1 · Overview
Analyses Just Energy Transition Partnerships (JETPs) — bilateral agreements between G7/donor countries and coal-dependent emerging markets (South Africa, Indonesia, Vietnam, India, Senegal) for accelerated energy transition. Models JETP finance package terms, technology deployment plans, and just transition social co-benefits.

> **Business value:** Essential for sovereign investors monitoring JETP country credit trajectories, development finance institutions structuring JETP finance packages, and ESG analysts assessing coal-dependent country transition risk. Provides quantitative JETP progress metrics against investment plans and IEA coal phase-out pathways.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `JETP_COUNTRIES`, `REGIONS`, `STATUSES`, `STATUS_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA'];` |
| `totalRetirement` | `filtered.reduce((a, c) => a + c.retirementTarget, 0);` |
| `totalPledged` | `filtered.reduce((a, c) => a + c.pledgedFinance, 0);` |
| `avgImpl` | `filtered.length ? filtered.reduce((a, c) => a + c.implementationScore, 0) / filtered.length : 0;` |
| `totalWorkers` | `filtered.reduce((a, c) => a + c.justTransitionWorkers, 0);` |
| `projectedDisbursed` | `filtered.reduce((a, c) => a + c.pledgedFinance * disbursementRate / 100, 0);` |
| `financeData` | `filtered.map(c => ({` |
| `coalData` | `[...filtered].sort((a, b) => b.retirementTarget - a.retirementTarget).map(c => ({` |
| `implScatterData` | `filtered.map(c => ({` |
| `workerData` | `filtered.map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `JETP_COUNTRIES`, `REGIONS`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| JETP Pledges (5 countries) | — | JETP Secretariat 2023 | Total JETP finance pledged to South Africa, Indonesia, Vietnam, India, Senegal through 2022–23 |
| Coal Phase-Out Jobs at Risk | — | ILO Just Transition Guidelines 2023 | Direct coal sector workers at risk globally from accelerated phase-out — 3M in JETP countries alone |
| JETP Leverage Target | — | JETP Partnership Design Guidelines | Each JETP package targets $3 private finance mobilised per $1 of public/concessional commitment |
- **JETP investment plan documents by country** → Finance package analysis → **Grant/loan/guarantee/TA breakdown and sector allocation**
- **Coal fleet data (capacity, age, utilisation)** → Retirement scheduling → **Optimal retirement sequence by age and cost**
- **Labour market data by coal-dependent region** → Just transition cost modelling → **Worker retraining cost and community economic impact**

## 5 · Intermediate Transformation Logic
**Methodology:** JETP Energy Transition Model
**Headline formula:** `CoalRetirementNPV = Σ [(FossilRevenue_t - GreenReplacement_t) / (1+r)^t]; JustTransitionCost = Σ [WorkerRetraining_i + CommunityInvestment_j + SocialProtection_k]`
**Standards:** ['JETP Investment Plans 2022–2023', 'IPCC AR6 WGIII Just Transition', 'IEA Coal Phase-Out Financing Framework', 'ILO Just Transition Guidelines']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).