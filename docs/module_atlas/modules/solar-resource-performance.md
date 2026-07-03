# Solar Resource & Performance Analytics
**Module ID:** `solar-resource-performance` · **Route:** `/solar-resource-performance` · **Tier:** B (frontend-computed) · **EP code:** RE-RES1 · **Sprint:** RE

## 1 · Overview
Engineering-grade solar resource assessment and operational performance analytics with NASA POWER live API integration. Covers GHI/DNI/DHI irradiance analysis, PR/CUF/availability metrics, PVsyst-style loss waterfall (13 loss factors), Arrhenius degradation modelling, weather normalization via P-value regression, and soiling analytics across 18 analytical tabs.

> **Business value:** Essential for solar asset managers, technical advisors (independent engineers), and lenders conducting resource assessment. Replicates the PVsyst + SolarAnywhere workflow for pre-construction yield studies and operational performance benchmarking — with free NASA POWER irradiance data as a rapid-access alternative to paid satellite data providers (SolarAnywhere, Solargis).

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `LOCATIONS`, `MODULE_TECHS`, `MONTHS`, `SideSection`, `Slider`, `TABS`, `Toggle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tempShape` | `[-0.65, -0.50, -0.10, 0.35, 0.75, 1.10, 1.30, 1.25, 0.85, 0.30, -0.20, -0.55];` |
| `annual` | `ghiBase * 365;` |
| `ghi` | `ghiShape[i] * ghiBase * (1 + (sr(seed + i * 3) - 0.5) * 0.06);` |
| `dni` | `ghi * (0.60 + sr(seed + i * 7) * 0.20);` |
| `dhi` | `ghi - dni * 0.75;` |
| `temp` | `tempAvg + tempShape[i] * Math.abs(tempAvg) * 0.8 + (sr(seed + i * 11) - 0.5) * 2;` |
| `wind` | `2.5 + sr(seed + i * 5) * 3.5;` |
| `humidity` | `35 + sr(seed + i * 13) * 45;` |
| `clearness` | `(ghi / (ghiShape[i] * ghiBase + 0.01)).toFixed(2);` |
| `tCell` | `m.temp + 25 * 0.03;` |
| `tempLoss` | `Math.abs(tempCoeff) * Math.max(0, tCell - 25);` |
| `totalLoss` | `soilingAnnual / 100 + wiring / 100 + mismatch / 100 + shading / 100 + (1 - inverterEff / 100);` |
| `yieldKwh` | `m.ghi * pr;` |
| `factor` | `y === 0 ? 1 : (1 - firstYear - lid) * Math.pow(1 - annualDeg, y - 1);` |
| `p90` | `annualMWh * Math.exp(-1.282 * sigma);` |
| `p75` | `annualMWh * Math.exp(-0.674 * sigma);` |
| `p99` | `annualMWh * Math.exp(-2.326 * sigma);` |
| `optTilt` | `Math.abs(lat) * 0.87 + 4;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `LOCATIONS`, `MONTHS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Performance Ratio (PR) | `E_actual / (G_ref × P_rated)` | IEC 61724-1 | Core operational KPI; IEC 61724-1 defines PR; >80% is strong; below 75% signals inverter or soiling issue |
| Capacity Utilisation Factor (CUF) | `Annual MWh / (capacity × 8,760)` | Plant SCADA | Equivalent to capacity factor; 20–28% typical for fixed-tilt utility solar in high-irradiance locations |
| Temperature Coefficient Loss | `α_T × (T_module − 25°C) × G/1000` | IEC 61853-2 | Modern mono-PERC: −0.35%/°C; TOPCon: −0.28%/°C; higher losses in hot climates (India, MENA, Australia) |
| Soiling Loss | `ΔPR_soiling = PR_clean − PR_actual (periods without rain)` | Empirical IEC 61724 | Largest variable loss in arid regions (MENA, India); automated cleaning triggers when soiling loss > cleaning  |
| Degradation Rate | `Arrhenius calendar aging + EFC cycle aging` | NREL degradation survey | Industry median 0.50%/yr (mono-PERC); Arrhenius component dominates for utility-scale; LID corrected in first- |
| P90 GHI (10-year) | `Inter-annual variability from NASA POWER historical data` | NASA POWER + TMY | P90 10-year (P90/√10) used by lenders; single-year P90 is −6 to −12% depending on climate zone |
| NASA POWER GHI | `ALLSKY_SFC_SW_DWN parameter, 1/2° resolution` | NASA POWER v2.0 (MERRA-2) | Free NASA satellite-derived irradiance; 1-degree spatial resolution; validated against ground stations at ±8%  |
- **NASA POWER API (lat/lon → ALLSKY_SFC_SW_DWN, T2M, 2015–2023)** → Monthly GHI + temperature parsing → **Site-specific P50 GHI, inter-annual variability σ, TMY construction**
- **User-defined system parameters (capacity, tilt, azimuth, losses)** → 13-factor loss waterfall calculation → **DC/AC energy estimate, PR, CUF, soiling-adjusted yield**
- **Historical production data (user upload or seeded)** → OLS regression: production ~ GHI × temperature → **R², normalized PR, weather-adjusted underperformance identification**

## 5 · Intermediate Transformation Logic
**Methodology:** OLS Weather Normalization + Arrhenius Degradation + PVsyst Loss Waterfall
**Headline formula:** `PR_norm = PR_actual × (T_ref − 25) / (T_act − 25) × (GHI_ref/GHI_act); Δη(t) = A·exp(−Ea/RT)·√t + EFC·k_cyc`
**Standards:** ['IEC 61724-1', 'IEC 61853-2', 'ASTM E2848', 'PVsyst 7.x methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`