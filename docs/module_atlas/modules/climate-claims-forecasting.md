# Climate Claims Forecasting
**Module ID:** `climate-claims-forecasting` · **Route:** `/climate-claims-forecasting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Actuarial engine for climate-adjusted insurance claims forecasting. Projects loss ratios, claims frequency, and severity trends under physical climate scenarios for property, agricultural, and liability lines using CAT model integration and climate scenario overlays.

> **Business value:** Climate-adjusted expected loss = baseline E[Loss] × ClimateMultiplier(t, RCP). Multiplier compounds at 1–3%/yr depending on peril and scenario. Flood and wildfire show highest multiplier acceleration under RCP8.5.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `LOSS_DISTRIBUTIONS`, `NGFS_SCENARIOS`, `PERILS`, `PML_RETURN_PERIODS`, `REGIONS`, `REGION_PERIL_COMBOS`, `SCEN_COLORS`, `SCEN_FREQ_MULTS`, `SCEN_SEV_MULTS`, `TIME_POINTS`, `TabBtn`, `TrendArrow`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERILS` | `['Hurricane/Typhoon','Flood','Wildfire','Earthquake','Hail','Drought','Extreme Heat','Freeze/Ice Storm','Subsidence','Tsunami'];` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East','Africa','Oceania','South Asia','East Asia','Southeast Asia','Caribbean','Scand` |
| `seed` | `ri * 100 + pi * 7;` |
| `baseFreq` | `+(sr(seed + 1) * 0.08 + 0.01).toFixed(4);` |
| `baseSev` | `+(sr(seed + 2) * 900 + 50).toFixed(0);` |
| `clFreqTrend` | `+(sr(seed + 3) * 0.05 + 0.005).toFixed(4);` |
| `clSevTrend` | `+(sr(seed + 4) * 0.04 + 0.005).toFixed(4);` |
| `catProb` | `+(sr(seed + 5) * 0.6 + 0.05).toFixed(3);` |
| `socInfl` | `+(sr(seed + 6) * 0.04 + 0.01).toFixed(3);` |
| `demSurge` | `+(catProb > 0.3 ? sr(seed + 7) * 0.05 + 0.10 : sr(seed + 7) * 0.05).toFixed(3);` |
| `insGap` | `+(sr(seed + 8) * 60 + 10).toFixed(1);` |
| `emergRisk` | `+(sr(seed + 9) * 0.8).toFixed(3);` |
| `reinsThreshold` | `+(baseSev * (sr(seed + 10) * 3 + 5)).toFixed(0);` |
| `pml100` | `+(baseSev * (sr(seed + 11) * 8 + 4) * baseFreq * 100).toFixed(0);` |
| `pml250` | `+(pml100 * (1 + sr(seed + 12) * 0.6 + 0.3)).toFixed(0);` |
| `inflLoad` | `+(sr(seed + 13) * 0.03 + 0.02).toFixed(3);` |
| `lossDistIdx` | `Math.floor(sr(seed + 14) * 4);` |
| `annualHistory` | `Array.from({ length: 5 }, (_, y) => +(baseSev * baseFreq * (0.8 + sr(seed + 15 + y) * 0.4)).toFixed(0));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOSS_DISTRIBUTIONS`, `NGFS_SCENARIOS`, `PERILS`, `PML_RETURN_PERIODS`, `REGIONS`, `SCEN_COLORS`, `SCEN_FREQ_MULTS`, `SCEN_SEV_MULTS`, `TABS`, `TIME_POINTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Frequency Multiplier | `IPCC AR6 hazard change factors` | IPCC AR6 Atlas | Multiplication factor applied to baseline claims frequency under climate scenario |
| Severity Trend | `Historical regression + climate overlay` | Munich Re NatCat | Annual severity increase rate combining economic growth and climate intensification |
| Combined Loss Ratio | `(Claims + Expenses) / Premium` | Actuarial model | Insurance loss ratio; above 100% indicates underwriting loss |
| CAT Loss Load | `Excess losses above attritional baseline` | CAT model | Catastrophe loss component of total projected claims |
- **NatCat historical database** → 20-yr loss data → baseline frequency/severity → **Attritional and CAT base rates**
- **IPCC AR6 Atlas** → Hazard intensity changes → climate multiplier → **Climate-adjusted projected losses**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-adjusted claims frequency × severity model
**Headline formula:** `E[Loss](t) = Σ_{perils} FreqBase(t) × SevBase(t) × ClimateMultiplier(t,RCP); ClimateMultiplier(t,RCP) = 1 + γ(RCP) × (t–t₀)`
**Standards:** ['IPCC AR6 Extremes Atlas', "Lloyd's Market Association Climate Change Scenarios", 'Munich Re NatCatSERVICE', 'ACTUARIES Climate Risk Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).