## 7 · Methodology Deep Dive

Grounded in `backend/services/carbon_price_ets_engine.py` (E71; routes:
`api/v1/routes/carbon_price_ets.py`). Five calculators over the world's carbon-pricing systems:
EU ETS price forecasting, multi-ETS compliance cost, CBAM exposure, portfolio carbon cost, and
IEA-pathway interpolation, plus static reference endpoints for the ETS/CBAM/leakage tables.

### 7.1 What the domain computes

| Function | Core logic |
|---|---|
| `forecast_eu_ets_price` | Year-by-year `price += price·LRF·scenario_mult + MSR_effect`, floored at €20; ±band |
| `calculate_ets_compliance_cost` | Per-ETS `shortfall × reference_price`, summed to USD; % of EBITDA |
| `assess_cbam_exposure` | `embedded_C = volume × intensity`; `cert = embedded_C × max(0, EU_ETS − exporter_price)`; `effective = cert × phase_in%` |
| `calculate_portfolio_carbon_cost` | PCAF financed emissions → carbon cost, transition risk, stranding prob, implied temp |
| `forecast_carbon_price_pathway` | Linear interpolation of IEA WEO anchor prices between anchor years |

### 7.2 Parameterisation (cited to EU/UK/CA/China/RGGI/Korea regulations + IEA WEO 2023)

**ETS systems** (current price USD, LRF, cap MtCO₂): EU ETS $68 / LRF 4.3% / 1,382 Mt · UK $47 /
4.2% / 148 Mt · California $38 / 3.5% / 298 Mt (floor $19.70, ceiling $65) · China $11.5 /
intensity-based / 4,500 Mt · RGGI $14.5 / 3.0% / 91 Mt (floor $2.38) · Korea $8.5 / 2.5% / 598 Mt.

**IEA carbon price pathways** ($/tCO₂, advanced economies) by scenario × year:

| Scenario | 2025 | 2030 | 2050 |
|---|---|---|---|
| NZE | 90 | 130 | 250 |
| APS | 75 | 105 | 210 |
| SDS | 60 | 85 | 180 |
| STEPS | 35 | 45 | 75 |

(with emerging/developing tiers each). **CBAM sectors** (embedded intensity vs EU benchmark
tCO₂/t): cement 0.83/0.766 · iron_steel 1.89/1.328 · aluminium 16.5/6.7 · fertilisers 2.60/2.14 ·
electricity 0.45/0.00 · hydrogen 10.0/0.00; all free-allocation phase-out 2034 (electricity/H₂
2030), full phase-in 2026, with leakage-risk scores. **EU ETS Phase 4 params**: LRF 4.3%
(from 2024, was 2.2%), MSR intake 24%, thresholds 833/1,096 Mt, ETS2 buildings/road 2027.

**EU forecast model constants** (labelled deterministic): MSR tightening €2.5/t/yr (halved after
2030), CBAM spillover €4.0/t; scenario multipliers NZE 1.8 / APS 1.4 / SDS 1.2 / STEPS 0.9 /
current 0.7; uncertainty band 10–15%. **Portfolio constants**: stranding factor 0.45 (NGFS-style),
carbon-VaR shock 0.25, implied temp = `clamp(1.5 + transition_risk × 2.0, 1.5, 4.0)`.

### 7.3 Calculation walkthrough

Every calculator uses **published reference prices** + caller data with **honest-null defaults**
(inline-documented): missing emissions → `insufficient_data`; missing free-allocation → 0% (full
shortfall); missing jurisdiction operations % → 0 exposure; missing EBITDA → null ratio.

- **EU ETS forecast:** compound supply-tightening — LRF scales the *current* price by the annual
  reduction × scenario multiplier, plus a flat MSR tightening; €20 floor; ±band = price ×
  scenario uncertainty fraction.
- **Compliance cost:** EU shortfall = emissions − free allocation, priced at €68 reference; UK/CA/
  China/RGGI costs are operations-share × emissions × reference price × FX; RGGI only for power
  sector; China multiplies by an intensity-excess % (0 if at benchmark). All summed in USD.
- **CBAM:** certificate rate = EU ETS price − exporter carbon price (floored 0), times embedded
  carbon and phase-in %; competitiveness impact = effective cost / trade revenue; unreported
  intensity falls back to the published sector default (flagged).
- **Portfolio:** PCAF `financed_emissions = WACI × revenue × (exposure/AUM)` per holding (or
  reported directly); transition risk = `min(1, FE/(AUM/1e6)/500)`; stranding = risk × 0.45;
  carbon VaR = weighted cost × 0.25; implied temp linear in risk; holdings missing data are
  skipped and flagged, never fabricated.
- **IEA pathway:** pure linear interpolation between anchor years, €1 floor; CAGR and milestone
  list derived.

### 7.4 Worked example (EU ETS forecast, APS, 4-year horizon)

Base €68, LRF 0.043, APS scenario_mult 1.4, MSR €2.5/yr, uncertainty 12%:

| Year | LRF effect (price×0.043×1.4) | MSR | New price |
|---|---|---|---|
| 2026 | 68 × 0.0602 = 4.09 | 2.5 | 74.59 |
| 2027 | 74.59 × 0.0602 = 4.49 | 2.5 | 81.58 |
| 2028 | 81.58 × 0.0602 = 4.91 | 2.5 | 88.99 |
| 2029 | 88.99 × 0.0602 = 5.36 | 2.5 | 96.85 |
| 2030 | 96.85 × 0.0602 = 5.83 | 2.5 | **105.18** |

2030 band: 105.18 ± 12% → €92.6–€117.8. This lands near the IEA APS advanced 2030 anchor ($105),
a sanity check on the calibration. A steel importer with 1M t emissions, 30% free allocation:
shortfall 700,000 t × €68 = €47.6M EU ETS cost.

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data.** All model constants are inline-documented as deterministic
  calibration values (not entity figures); prior random draws for MSR/CBAM/uncertainty and
  stranding were replaced with fixed constants.
- The EU ETS forecast is a **reduced-form compounding model**, not a supply-demand equilibrium or
  MSR balance simulation — MSR is a flat €2.5/t adder, CBAM spillover is reported but not added
  to the path. Prices can compound unrealistically over long horizons.
- Reference ETS prices are point-in-time snapshots (2023/24 levels); FX rates are fixed constants
  (EUR 1.09, GBP 1.27/0.78, CNY 7.1).
- CBAM certificate logic uses the *default* sector intensity when actual is unreported, and a
  simple EU-ETS-minus-exporter-price rate — the real CBAM adjusts for free allocation phase-out
  and actual verified embedded emissions per Implementing Reg (EU) 2023/1773.
- Portfolio transition-risk → temperature and stranding mappings are stylised heuristics (factors
  0.45 / 0.25 / the `/500` scalar), not calibrated NGFS damage functions.

### 7.6 Framework alignment

- **EU ETS Phase 4 (Directive 2023/958)** — LRF 4.3% post-2024, MSR intake 24% and 833/1,096 Mt
  thresholds, Innovation/Modernisation Funds, ETS2 (2027) and maritime (2024) inclusion.
- **EU CBAM (Regulation 2023/956, Implementing Reg 2023/1773)** — six covered goods, embedded-
  carbon vs EU benchmark, transitional reporting 2023–25, certificates from 2026, free-allocation
  phase-out to 2034; certificate price linked to weekly EU ETS auction average (here the spot
  reference).
- **UK ETS / California Cap-and-Trade / China national ETS / RGGI / Korea K-ETS** — each system's
  scope, cap, LRF, price floors/ceilings and intensity-vs-absolute design captured in reference
  data; China modelled intensity-based (benchmark tCO₂/MWh coal 0.877 / gas 0.392).
- **IEA World Energy Outlook 2023 (NZE / APS / SDS / STEPS)** — the published carbon-price
  trajectories by economy tier, interpolated between anchor years.
- **PCAF** — portfolio financed emissions via the WACI × revenue × attribution-factor
  (exposure/AUM) convention.
- **NGFS** — the disorderly-transition stranding factor and carbon-VaR shock reference NGFS
  scenario logic (approximated with fixed scalars).
