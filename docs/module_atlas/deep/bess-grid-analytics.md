## 7 · Methodology Deep Dive

*(Guide and code reconcile well structurally — Arrhenius + cycle degradation, PNNL-style LCOS,
greedy 4-hour dispatch, revenue stacking and IRA ITC toggles are all genuinely implemented. Two
quantitative caveats are documented below: the calendar-aging term is numerically inert as coded,
and the LCOS denominator double-counts a factor of 365.)*

### 7.1 What the module computes

RE-BESS1 is a fully interactive BESS economics workbench (chemistry/market/co-location sliders,
18 analytical views). Core engines, quoted from code:

**Degradation** (`calcDegradation`, chemistry-specific constants):

```js
calFade  = A × exp(−Ea / (R × T_K)) × √year        // Arrhenius calendar aging
cycFade  = EFC_per_year × year × k_cyc              // linear cycle aging
combined = min(0.95, √(calFade² + cycFade²));  capacity = 1 − combined
```

**LCOS** (`calcLCOS`):

```js
capex    = capexPerKWh × 1000 × capMWh
npvOpex  = Σ (capex × opexPct) / (1+r)^y
npvReplace = (capex × 0.25) / (1+r)^y  at y = round(life × 0.55)
eMWh_y   = EFC_per_year × capMWh × deg_y × 365          // ← see §7.6: extra ×365
LCOS     = (capex + npvOpex + npvReplace) / Σ eMWh_y/(1+r)^y
```

**Dispatch** (`greedyDispatch`): sort 24 hourly prices; charge the 4 cheapest hours, discharge the
4 dearest; SOC steps `+P/E×RTE` (charge) / `−P/E` (discharge) from 0.5;
`arbitrage = Σ P_dis×MW − Σ P_chg×MW/RTE`, floored at 0. Market prices are seeded shapes:
`base × peakMult × (0.9 + sr(·)×0.2)` with peak 1.8× (16:00–20:00), shoulder 1.3× (07:00–10:00),
off-peak 0.7×; base $/MWh = CAISO 45, ERCOT 38, PJM 42, MISO 35, ISO-NE 48, NYISO 55.

**Revenue stack & finance:** `freqRegRev = MW × capPrice × 12`, `capMarketRev = P × pct × capPrice
× 12`, solar-clipping capture `solarMW × 0.05 × 8760` MWh; `npvCapex = capex × (1 − ITC%)`,
`npvRevenue = totalRev × annuity(r, life)`, `NPV = npvRevenue − npvCapex`.

### 7.2 Parameterisation

| Constant | LFP | NMC | NCA | Guide's generic value |
|---|---|---|---|---|
| Arrhenius pre-factor A | 0.022 | 0.026 | 0.030 | 0.024 |
| Activation energy Ea (eV) | 0.52 | 0.48 | 0.44 | 0.5 |
| Cycle-fade slope k_cyc | 1.8e-5 | 2.5e-5 | 3.0e-5 | 2.0e-5 |

`R = 8.314e-5` (gas constant scaled to eV/K; the Boltzmann constant is 8.617e-5 — a ~3.5%
denominator difference). Defaults: 100 MWh / 25 MW (4-hour), RTE 90%, DoD 90%, 25 °C, 15 years,
7% discount, capex $280/kWh, opex 1.5% of capex/yr, ERCOT, 1.0 EFC target, ITC on. Replacement =
25% of capex at 55% of life; the separate LCOS-waterfall view uses different heuristics
(augmentation 20% + replacement 10% of capex) — the two cost decompositions are not mutually
consistent. All values are code constants in the right literature ranges (PNNL/NREL-style), with
no vintage citations in code.

### 7.3 Calculation walkthrough

Inputs flow: sliders → `calcDegradation` (per-year capacity) → `calcLCOS` → KPI; market select →
`marketPrices` → `greedyDispatch` → `annualArb = daily × 365 / 1000` $k → revenue stack (+ freq
reg + capacity + clipping) → project NPV with ITC-reduced capex; chemistry-compare recomputes
LCOS per chemistry; sensitivity tornado applies fixed multipliers (CAPEX ±20% → LCOS ±20%,
RTE ±5pp → ∓6%, degradation ±30% → −5/+8%).

### 7.4 Worked example — LFP degradation at 25 °C, 1 EFC/day, year 10

- `Ea/(R×T_K) = 0.52 / (8.314e-5 × 298.15) = 20.98` → `exp(−20.98) ≈ 7.7e-10`
- `calFade = 0.022 × 7.7e-10 × √10 ≈ 5.4e-11` → **numerically zero**
- `cycFade = 365 × 10 × 1.8e-5 = 0.0657`
- `combined = √(0² + 0.0657²) = 0.0657` → capacity **93.4%** at year 10

Two consequences: (1) the model's 10-year fade (≈ 6.6%) is entirely cycle-driven and roughly half
the guide's own "LFP ~15% at 10 yr" benchmark; (2) the temperature slider has *no visible effect*
— with A ≈ 0.02, exp(−Ea/kT) ≈ 1e-9 kills the calendar term at any earthly temperature. Real
Arrhenius calendar models use a large pre-exponential (A ~ 1e4–1e9) so the exponential suppression
lands in the few-%/√yr range; the code's A was evidently transplanted from a already-collapsed
coefficient form.

### 7.5 Companion analytics

Dispatch view (24-h price bars + SOC line + charge/discharge bands), revenue-stack pie
(arbitrage/freq-reg/capacity/clipping), LCOS waterfall, chemistry comparison, market-by-market
`revPerMWh = annRev / max(1, EFC×cap×365)` screener, FERC-841 market-access checklist, and
long-duration comparison — all driven by the same engines.

### 7.6 Data provenance & limitations

- Market prices, and only they, use the seeded PRNG (`sr(seed)=frac(sin(seed+1)×10⁴)`) — 24-hour
  shapes, not historical ISO data; capacity/AS prices are single sliders, not auction results.
- **LCOS unit bug**: `eMWh = efcPerYear × capMWh × deg × 365` — but `efcPerYear = efcTarget × 365`
  is already annual, so annual energy is overstated ×365 and LCOS understated ×365 (defaults give
  ≈ $0.31/MWh vs the guide's correct $80–250/MWh range). Either the ×365 or the `efcTarget×365`
  conversion should go.
- Calendar-aging term inert (§7.4); temperature and the Arrhenius machinery are decorative.
- Greedy dispatch ignores power-duration feasibility coupling (charging 4h at P may exceed usable
  DoD·E headroom; SOC clipping silently absorbs it) and uses one representative day × 365.
- ITC stacking (energy-community adder), clipping fraction (flat 5% of solar MWh) and the
  augmentation/replacement heuristics are simplified single constants.

### 7.7 Framework alignment

- **PNNL LCOS methodology** — discounted lifetime costs over discounted MWh discharged, including
  O&M and replacement: structurally implemented (with the §7.6 unit bug in the denominator).
- **FERC Order 841 (2018)** — requires RTO/ISO market access for storage (capacity, energy, AS);
  represented as a compliance checklist and the premise of the revenue-stacking tabs.
- **IRA §48E ITC** — standalone storage (≥ 5 kWh, post-2022) is ITC-eligible at 30% base with
  adders; the code applies `capex × (1 − ITC)` and models grid-charge fraction for co-located
  systems, echoing the pre-IRA 75%-solar-charging rule that §48E made obsolete.
- **Arrhenius kinetics** — rate ∝ exp(−Ea/kT); the code's √t calendar-fade shape follows the
  standard parabolic (diffusion-limited SEI growth) model; parameter calibration is the gap.
- **IEC 62619 / UL 9540A (guide references)** — safety standards; named only, no code behaviour.
