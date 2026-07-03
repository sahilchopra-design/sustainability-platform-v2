# Utility Physical Climate Risk & Asset Resilience
**Module ID:** `utility-physical-climate-resilience` · **Route:** `/utility-physical-climate-resilience` · **Tier:** B (frontend-computed) · **EP code:** EP-EL5 · **Sprint:** EL

## 1 · Overview
Multi-peril physical risk scoring for 15 utility assets (T&D substations, gas compressors, hydro dams, water treatment, offshore wind, solar, nuclear, control centres) across flood/heat/wind/wildfire/ice perils, hardening measure cost-effectiveness matrix (10 interventions), RCP 2.6/4.5/8.5 annual loss trajectories, insurance gap analysis, SAIDI/SAIFI improvement by intervention, and adaptation finance structures.

> **Business value:** Used by utility climate risk officers conducting TCFD physical risk assessment, infrastructure investors stress-testing asset values under RCP scenarios, and insurance underwriters pricing utility physical risk coverage.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `HARDENING_MEASURES`, `INSURANCE_GAP`, `KpiCard`, `LOSS_TIMELINE`, `PERIL_RADAR`, `Pill`, `RiskBar`, `SAIDI_IMPROVEMENT`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `types` | `['All', ...new Set(ASSETS.map(a => a.type))];` |
| `totalRAV` | `useMemo(() => ASSETS.reduce((s,a)=>s+a.rav,0),[]);` |
| `totalHardening` | `useMemo(() => ASSETS.reduce((s,a)=>s+a.hardening_capex,0).toFixed(0),[]);` |
| `avgInsGap` | `useMemo(() => Math.round(ASSETS.reduce((s,a)=>s+(1-a.insurance_coverage),0)/ASSETS.length*100),[]);` |
| `totalAAEL` | `useMemo(() => (ASSETS.reduce((s,a)=>s+a.rav*a.aep_loss_pct/100,0)/1000).toFixed(1),[]);` |
| `tabs` | `['Asset Universe', 'Physical Risk Map', 'Hardening Economics', 'Loss Trajectory', 'Insurance Gap', 'SAIDI/Reliability', 'Adaptation Finance'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `HARDENING_MEASURES`, `PERIL_RADAR`, `SAIDI_IMPROVEMENT`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| US utility storm costs (2022–23) | `Insurance and uninsured losses from weather events affecting electric utilities` | NOAA Billion-Dollar Weather Events 2023 | Average annual increase 8.5% since 2000; 2022 record year $165Bn total weather losses; utilities carrying incr |
| Average insurance gap (T&D) | `Uninsured physical exposure as % of RAV` | Lloyd's of London Infrastructure Risk Survey 2023 | Transmission assets typically 65-75% insured; distribution 55-65%; water treatment 58-75%; increasing climate  |
| Grid hardening BCR | `Benefit-cost ratio for various hardening interventions` | EPRI Grid Resilience Investment Framework 2022 | ADMS deployment highest BCR at 4.4× (low capex, broad SAIDI benefit); underground cable conversion lowest BCR  |
- **NERC CIP-014 + IPCC AR6 + Swiss Re thermal stress + EPRI grid resilience + FEMA BRIC grant criteria + Lloyds infrastructure risk + EU Taxonomy climate adaptation criteria** → 15-asset risk universe + multi-peril scoring + hardening economics + RCP loss trajectories + insurance gap + SAIDI improvement + adaptation finance → **Climate risk officers at utilities, infrastructure investors conducting TCFD physical risk scenario analysis, insurance underwriters pricing utility asset risk, and ESG analysts assessing utility adaptation investment programmes**

## 5 · Intermediate Transformation Logic
**Methodology:** Physical Risk Loss Modelling & Hardening ROI
**Headline formula:** `AAEL = RAV × AEP_Loss_Pct / 100; Hardening_ROI = (AAEL_Before − AAEL_After) × PV_Factor / Capex; Insurance_Gap = RAV × (1 − Coverage_Ratio); Adaptation_BCR = Σ(Loss_Avoided_t) / (1+r)^t / Hardening_Capex; SAIDI_Improvement = (SAIDI_Before − SAIDI_After) × Customer_Minutes_Value`
**Standards:** ['NERC Physical Security Standards CIP-014', 'IPCC AR6 Chapter 6 — Adaptation Limits and Loss & Damage', 'Swiss Re Institute — Thermal Stress on Electricity Infrastructure 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).