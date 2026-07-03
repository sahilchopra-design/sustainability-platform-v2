# Offshore Wind Resource & Wake Loss Analytics
**Module ID:** `offshore-wind-resource` · **Route:** `/offshore-wind-resource` · **Tier:** B (frontend-computed) · **EP code:** EP-DR1 · **Sprint:** DR

## 1 · Overview
Engineering-grade offshore wind resource assessment covering Weibull wind speed distribution fitting, Jensen wake model array loss calculation, AEP computation via power curve integration, P50/P90 probabilistic yield, IEC 61400-3 site characterisation, and extreme wind event analysis. Covers 8 benchmark offshore markets with 18 analytical tabs for pre-FEED resource assessment.

> **Business value:** Designed for offshore wind developers, independent engineers, and institutional investors conducting pre-FEED wind resource assessment. Replicates the Windographer + WAsP + DNVGL workflow for site characterisation — covering Weibull fitting, Jensen wake modelling, and IEC 61400-3 site categorisation in a single interactive tool with 18 analytical tabs covering all dimensions of offshore wind resource due diligence.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `MARKETS`, `MONTHS`, `SITES`, `SideSection`, `Slider`, `TABS`, `TURBINES`, `TabBar`, `Toggle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `deficit` | `(1 - Math.sqrt(1 - Ct)) * Math.pow(D / (D + 2 * k * x), 2);` |
| `toggleSec` | `i => setSec(p => p.map((v, j) => j === i ? !v : v));` |
| `vHub` | `useMemo(() => vRef * Math.pow(hubHeight / 80, shearExp), [vRef, hubHeight]);` |
| `lambda` | `useMemo(() => vHub / (Math.pow(1 + 1 / wk, 1 / wk) * 0.9), [vHub, wk]);` |
| `frac` | `Math.pow((v - turbine.cutIn) / (turbine.rated - turbine.cutIn), 3);` |
| `prob` | `weibullPdf(v, wk, lambda) * 0.5;` |
| `gross` | `totalE * n;` |
| `deficit` | `1 - (U_wake / vHub);` |
| `avgWakeDeficit` | `arrRows > 1 ? wakeDeficit / (arrRows - 1) : 0;` |
| `wake` | `gross * (1 - effectiveWakeLoss);` |
| `net` | `wake * (1 - elecLoss / 100) * (avail / 100);` |
| `capacityFactor` | `(net / (turbine.mw * n * 8760)) * 100;` |
| `capacityMW` | `turbine.mw * arrRows * arrCols;` |
| `totalCapex` | `capex * capacityMW * 1000; // $` |
| `annualOpex` | `opex * capacityMW * 1000;  // $/yr` |
| `crf` | `r * Math.pow(1 + r, projLife) / (Math.pow(1 + r, projLife) - 1);` |
| `annualCapex` | `totalCapex * crf;` |
| `p90Aep` | `+p90Val(netAEP, p90Sigma / 100).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `MARKETS`, `MONTHS`, `SITES`, `TABS`, `TURBINES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual AEP (P50) | `AEP = ∫ P(v) × f(v,k,λ) × 8760 dv` | Wind atlas + power curve | Gross AEP before wake and availability losses; North Sea 12MW turbine at class I site: ~52 GWh/turbine/yr; cap |
| Wake Loss | `Jensen top-hat model: ΣU_deficit/ΣU₀` | Turbine layout + wake model | Strongly dependent on spacing: 5D spacing → ~15% loss; 8D spacing → ~8% loss; offshore wakes persist further ( |
| Capacity Factor (net) | `Net AEP / (P_rated × 8760)` | Wind atlas + loss chain | Best offshore CF: 52–58% (prime North Sea Grade A sites); US East Coast: 42–50%; floating sites (deep water hi |
| P90/P50 ratio | `P90 = P50 × exp(−1.282 × σ_combined)` | Lognormal model | P90 haircut typically 6–12% for offshore; smaller than onshore because maritime wind is more stable; σ include |
| Extreme Wind (50yr) | `Gumbel distribution extreme value fit` | DNVGL-ST-0437 | Site-specific 50-year return period wind speed for turbine structural class selection; IEC Class I turbines ra |
| Wind Power Density | `WPD = ½ρv³; ρ≈1.23 kg/m³ at sea level` | Wind atlas at hub height | Key site quality metric; IEC Class I: WPD >500 W/m²; Class III: <300 W/m²; higher WPD → better economics but h |
| Turbine Spacing (optimal) | `Wake loss / land constraint trade-off` | Layout optimisation | Offshore wind turbine rows typically 8–10D downwind spacing, 5–6D cross-wind spacing; tighter spacing reduces  |
- **Site coordinates + turbine selection → Weibull k/λ fit (seeded from region)** → Jensen wake model on array layout → **Net AEP after wake + availability; P50/P90 from combined σ**
- **Wind speed bins (0–25m/s) × Weibull pdf × power curve lookup** → Numerical AEP integration → **Gross AEP, wind speed → power contribution histogram, capacity factor**
- **ERA5/MERRA-2 interannual variability (seeded)** → Lognormal P90 with uncertainty RSS → **P50/P75/P90/P99 annual energy, bankability statement**

## 5 · Intermediate Transformation Logic
**Methodology:** Weibull AEP Integration + Jensen Wake Model + P90 Lognormal
**Headline formula:** `AEP = 8760 × P_rated × ∫₀^∞ P(v)/P_rated × f(v,k,λ)dv; Wake: U_wake = U₀(1−(1−√(1−Ct))×(D/(D+2k×x))²); P90 = P50×exp(−1.282×σ)`
**Standards:** ['IEC 61400-1:2019', 'IEC 61400-3-1:2019 Offshore Wind', 'DNVGL-ST-0437 Wind Conditions', 'MEASNET Cup Anemometry Calibration']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).