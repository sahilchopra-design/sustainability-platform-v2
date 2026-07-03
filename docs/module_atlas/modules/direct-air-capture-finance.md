# Direct Air Capture Finance Platform
**Module ID:** `direct-air-capture-finance` · **Route:** `/direct-air-capture-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH1 · **Sprint:** EH

## 1 · Overview
Full-cycle finance analysis for 5 DAC technologies: Solid Sorbent (Climeworks), Liquid Solvent (Carbon Engineering/Oxy), Electroswing (Verdox), Moisture-Swing, and DACCS-Wind. IRA §45Q credit ($180/tCO₂ geological), LCOC electricity sensitivity, learning curves, and advance offtake buyers including Stripe Frontier.

> **Business value:** Used by DAC developers optimising project economics, corporate buyers structuring advance purchase commitments, investors evaluating CDR portfolio returns, and policy teams assessing §45Q credit efficiency.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DAC_TECHS`, `KpiCard`, `PROJECTS`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `DAC_TECHS[Math.floor(sr(i * 7 + 1) * DAC_TECHS.length)];` |
| `capKt` | `parseFloat((0.01 + sr(i * 11 + 2) * 0.49).toFixed(2));` |
| `country` | `['USA', 'Iceland', 'Canada', 'Norway', 'UK', 'UAE', 'Australia', 'Switzerland'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Piloting', 'Announced'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `lcoc` | `parseFloat((tech.lcoc * (0.88 + sr(i * 19 + 5) * 0.28)).toFixed(0));` |
| `irr` | `parseFloat((4 + sr(i * 23 + 6) * 9).toFixed(1));` |
| `creditPrice` | `parseFloat((350 + sr(i * 29 + 7) * 450).toFixed(0));` |
| `avgLcoc` | `useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcoc, 0) / filtered.length) : 0, [filtered]);` |
| `totalCap` | `useMemo(() => filtered.reduce((s, p) => s + p.capKt, 0).toFixed(2), [filtered]);` |
| `lcocByElec` | `useMemo(() => [20, 30, 40, 50, 60, 80, 100].map(ep => ({` |
| `creditsPerYear` | `scale * 1000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DAC_TECHS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRA §45Q DAC geological ($/tCO₂) | `Direct payment credit for geological storage` | IRS Final Regulations §45Q 2024 | Requires CO2 injection into Class VI well; verification via EPA MRV; Inflation Reduction Act 2022 increased fr |
| DAC electricity intensity (MWh/tCO₂) | `Solid sorbent: 1.5–2.0; Liquid: 2.0–3.0; SOEC variant: 1.2–1.5` | Climeworks + CE/Oxy technical disclosures | Electricity is 50–70% of DAC LCOC; requires <$30/MWh dedicated renewable power for $200/tCO2 target at 2030 sc |
| Climeworks Mammoth capacity (ktCO₂/yr) | `Iceland geothermal-powered; operational 2024` | Climeworks press release Q2 2024 | Mammoth: 36 ktCO2/yr; 10× Orca (3.6 ktCO2/yr); demonstrates modular scale-up; geothermal provides low-cost pro |
- **IEA/NREL DAC cost data + Climeworks technical disclosures + IRA §45Q statute** → LCOC engine + §45Q calculator + learning curves + offtake intelligence → **DAC developers, carbon removal buyers, DFI investors, and policy teams structuring CDR procurement**

## 5 · Intermediate Transformation Logic
**Methodology:** DAC LCOC Model ($/tCO₂)
**Headline formula:** `LCOC = (CAPEX×CRF + OPEX + Electricity_cost) / Annual_CDR − IRA_§45Q`
**Standards:** ['IEA Direct Air Capture 2022', 'NREL DAC Techno-Economic Analysis 2023', 'Climeworks Orca/Mammoth cost disclosures']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).