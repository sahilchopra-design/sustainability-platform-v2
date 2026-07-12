# BESS & Grid Services Analytics
**Module ID:** `bess-grid-analytics` · **Route:** `/bess-grid-analytics` · **Tier:** B (frontend-computed) · **EP code:** RE-BESS1 · **Sprint:** RE

## 1 · Overview
Comprehensive battery energy storage system (BESS) financial and technical analytics. Covers LCOS optimization, revenue stacking (arbitrage/frequency regulation/capacity/demand charge), Arrhenius + cycle degradation modelling, dispatch optimization (greedy price arbitrage), FERC Order 841 compliance, and co-location solar+BESS ITC analysis across 18 analytical tabs.

> **Business value:** Designed for BESS developers, utilities evaluating storage procurement, and infrastructure funds assessing standalone or co-located battery projects. Covers the full analytical stack from Arrhenius degradation modelling to ISO-specific revenue stacking and FERC 841 compliance — replacing the combination of PNNL LCOS spreadsheets, manufacturer degradation tools, and ISO revenue calculators typically used in BESS project evaluation.

**How an analyst works this module:**
- Configure the BESS system in the left System Configuration panel: chemistry (LFP/NMC/NCA), capacity MWh, power MW, C-rate target, and operating temperature
- Enable co-location toggle in the left panel to model Solar + BESS co-location — ITC basis updates to reflect grid charge fraction reduction under IRA §48E rules
- Open "LCOS Waterfall" tab to see the PNNL-methodology cost decomposition: CAPEX component → O&M NPV → augmentation NPV → replacement NPV → LCOS $/MWh
- Navigate to "Revenue Stacking" tab for annual revenue breakdown across arbitrage, frequency regulation, capacity market, and demand charge reduction; adjust market (CAISO/ERCOT/PJM/MISO/ISO-NE) in the Market panel
- Check "Dispatch Optimizer" tab for the greedy 24-hour dispatch schedule: charge 4 cheapest hours → discharge 4 most expensive hours; view SOC profile and daily revenue
- Open "Degradation Model" tab for the Arrhenius calendar aging + EFC cycle aging combined curve; "Chemistry Compare" tab benchmarks LFP vs NMC vs NCA on 10/15/20-year capacity fade
- Review "Co-location (Solar+BESS)" tab for DC-coupled vs AC-coupled comparison, clipping capture revenue, and ITC impact on combined project economics
- Navigate to "Augmentation Plan" tab for the capacity top-up schedule to maintain usable MWh above 80% threshold; "FERC 841 Compliance" tab checks market access eligibility by ISO
- Check "Frequency Regulation" and "Capacity Markets" tabs for per-market revenue rate benchmarks; "Project Finance" tab shows DSCR/IRR for the full BESS project
- Use "Scenario Analysis" for combined price/degradation/EFC stress; "Long-Duration Storage" compares 8-hr BESS to flow battery/LAES/H2 storage; "Sensitivity Summary" shows NPV tornado chart

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHEMISTRIES`, `HOURS`, `KpiCard`, `MARKETS`, `SHdr`, `Sel`, `Slider`, `TABS`, `Toggle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MARKETS` | `['CAISO', 'ERCOT', 'PJM', 'MISO', 'ISO-NE', 'NYISO'];` |
| `kCyc` | `chemistry === 'LFP' ? 1.8e-5 : chemistry === 'NMC' ? 2.5e-5 : 3.0e-5;` |
| `accel` | `Math.exp((Ea / kB) * (1 / T0 - 1 / TK));` |
| `calFade` | `A * accel * Math.sqrt(yr);` |
| `cycFade` | `efcPerYear * yr * kCyc;` |
| `combined` | `Math.sqrt(calFade * calFade + cycFade * cycFade);` |
| `capex` | `capexPerKWh * 1000 * capMWh;` |
| `deg` | `degradation[y - 1]?.capacity \|\| 1;` |
| `opex` | `capex * opexPct;` |
| `eMWh` | `efcPerYear * capMWh * deg; // efcPerYear is already annualized (EFC/yr); do not re-multiply by 365` |
| `sorted` | `prices.map((p, h) => ({ h, p })).sort((a, b) => a.p - b.p);` |
| `chargeHrs` | `sorted.slice(0, 4).map(x => x.h).sort((a, b) => a - b);` |
| `dischargeHrs` | `sorted.slice(-4).map(x => x.h).sort((a, b) => a - b);` |
| `schedule` | `prices.map((p, h) => ({` |
| `arb` | `dischargeHrs.reduce((s, h) => s + prices[h] * powerMW, 0)` |
| `base` | `{ CAISO: 45, ERCOT: 38, PJM: 42, MISO: 35, 'ISO-NE': 48, NYISO: 55 }[market] \|\| 40;` |
| `efcPerYear` | `useMemo(() => efcTarget * 365, [efcTarget]);` |
| `yearsArr` | `useMemo(() => Array.from({ length: lifeYrs }, (_, i) => i + 1), [lifeYrs]);` |
| `degradation` | `useMemo(() => calcDegradation(yearsArr, tempC, efcPerYear, chemistry), [yearsArr, tempC, efcPerYear, chemistry]); const lcos = useMemo(() => calcLCOS(capexPerKWh, powerMW, capMWh, opexPct, discountR / 100, lifeYrs, efcPerYear, degradation), [capexPerKWh, powerMW, capMWh, opexPct, discountR, lifeYrs, efcPerYear, degradation]);` |
| `prices` | `useMemo(() => marketPrices(market), [market]); const dispatch = useMemo(() => greedyDispatch(prices, capMWh * (dod / 100), powerMW, rte / 100), [prices, capMWh, dod, powerMW, rte]);` |
| `annualArb` | `useMemo(() => dispatch.arbitrageDaily * 365 / 1000, [dispatch]);  // $k/yr` |
| `freqRegRevK` | `useMemo(() => freqRegMW * capPrice * 12 / 1000, [freqRegMW, capPrice]);` |
| `capMarketRevK` | `useMemo(() => powerMW * (capMarketPct / 100) * capPrice * 12 / 1000, [powerMW, capMarketPct, capPrice]);` |
| `totalRevK` | `useMemo(() => annualArb + freqRegRevK + capMarketRevK, [annualArb, freqRegRevK, capMarketRevK]);` |
| `gridChargeFraction` | `chargeGrid / 100;` |
| `npvCapex` | `useMemo(() => capex * (1 - itcPct), [capex, itcPct]);` |
| `npvRevenue` | `useMemo(() => totalRevK * 1000 * (1 - Math.pow(1 + discountR / 100, -lifeYrs)) / (discountR / 100), [totalRevK, discountR, lifeYrs]);` |
| `projectNPV` | `useMemo(() => npvRevenue - npvCapex, [npvRevenue, npvCapex]);` |
| `lcosByChemistry` | `useMemo(() => CHEMISTRIES.map(ch => {` |
| `clippedMWh` | `solarMW * 0.05 * 8760;` |
| `revStack` | `useMemo(() => [ { name: 'Arbitrage', value: +annualArb.toFixed(0), color: T.accent }, { name: 'Freq Regulation', value: +freqRegRevK.toFixed(0), color: T.indigo }, { name: 'Capacity Market', value: +capMarketRevK.toFixed(0), color: T.teal }, { name: 'Solar Clipping', value: +clippingRevK.toFixed(0), color: T.solar }, ], [annualArb, freqRe` |
| `lcosWaterfall` | `useMemo(() => { const capexComp = capex / 1000;` |
| `opexNPV` | `capex * opexPct * (1 - Math.pow(1 + discountR / 100, -lifeYrs)) / (discountR / 100) / 1000;` |
| `augCost` | `capex * 0.20 / 1000;` |
| `replaceCost` | `capex * 0.10 / 1000;` |
| `totalCost` | `capexComp + opexNPV + augCost + replaceCost;` |
| `dischargeMWh` | `efcPerYear * capMWh * yearsArr.reduce((s, _, i) => s + (degradation[i]?.capacity \|\| 1) / Math.pow(1 + discountR / 100, i + 1), 0);` |
| `sensData` | `useMemo(() => [ { factor: 'CAPEX ±20%', low: +(Number(lcos) * 0.80).toFixed(1), high: +(Number(lcos) * 1.20).toFixed(1) }, { factor: 'RTE ±5pp', low: +(Number(lcos) * 0.94).toFixed(1), high: +(Number(lcos) * 1.06).toFixed(1) }, { factor: 'Degradation ±30%', low: +(Number(lcos) * 0.95).toFixed(1), high: +(Number(lcos) * 1.08).toFixed(1) },` |
| `disp` | `greedyDispatch(p, capMWh * (dod / 100), powerMW, rte / 100);` |
| `annRev` | `disp.arbitrageDaily * 365 + freqRegRevK * 1000 + capMarketRevK * 1000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHEMISTRIES`, `MARKETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOS | `CAPEX + NPV(OPEX) + NPV(Replacement) / NPV(Discharged MWh)` | PNNL LCOS Framework | 4-hour Li-ion: $110–160/MWh (2024); 2-hour: $140–200/MWh; 8-hour: $80–120/MWh; declining at ~15%/yr with LFP cost trajectory |
| Arbitrage Revenue | `Σ(P_discharge − P_charge) × E_cycled` | CAISO/ERCOT price data | Highly variable by market; ERCOT 2023: $40–90k/MW-yr; CAISO: $20–50k/MW-yr due to solar cannibalization reducing mid-day prices |
| Frequency Regulation Revenue | `Regulation capacity price × MW committed × availability` | FERC Order 755 / CAISO AS | Fast-response BESS earns performance-adjusted regulation revenue; CAISO RegUp/RegDn: $5–25/MW-hr depending on season |
| Capacity Revenue | `Capacity auction clearing price × ICAP MW` | ISO-NE, PJM, NYISO | BESS qualifies as capacity resource under FERC 841; PJM BRA clearing 2023: $34.13/MW-day; ISO-NE FC: $28–55/kW-yr |
| Degradation (10-yr) | `Arrhenius calendar + cycle aging at target EFC/yr` | Manufacturer specs + NREL | LFP chemistry: lower calendar aging than NMC; 1 EFC/day LFP: ~15% at 10 yr; NMC at 1.5 EFC/day: ~25% at 10 yr |
| Round-trip Efficiency | `DC-DC: typically 94–96%; AC-AC: 85–91%` | IEC 62619 / PNNL test data | AC-coupled systems lose efficiency at PCS; DC-coupled co-location avoids PCS losses for solar charging; key LCOS driver |
| ITC on BESS (IRA) | `IRA §48E standalone BESS eligible from 2023` | IRS Notice 2023-29 | IRA 2022 key change: standalone BESS now ITC eligible (≥3 hr storage); co-location with solar also eligible; same bonus adder stack as solar |
- **BESS technical inputs: capacity, C-rate, chemistry, cycle target, temperature** → Arrhenius calendar + cycle degradation model (year 1–25) → **Annual capacity (MWh effective), EFC remaining, LCOS by year**
- **Market price data (seeded hourly for CAISO/ERCOT/PJM/MISO/ISO-NE)** → Greedy dispatch: sort 24h prices → charge 4 lowest → discharge 4 highest → **Arbitrage revenue, dispatch efficiency, round-trip loss accounting**
- **Revenue stacking: arbitrage + freq reg + capacity + demand charge** → Project IRR / NPV / LCOS calculator → **BESS project economics under combined revenue streams vs LCOS cost**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOS + Arrhenius/Cycle Degradation + Greedy Dispatch Optimization
**Headline formula:** `LCOS = (CAPEX + ΣOPEX_t/(1+r)^t + ΣReplace_t/(1+r)^t) / ΣE_discharge_t/(1+r)^t; Δη(t) = √(Δη_cal² + Δη_cyc²)`

LCOS (Levelized Cost of Storage) accounts for CAPEX, O&M, capacity augmentation, and replacement over project life, discounted against energy discharged. Arrhenius calendar aging: Δη_cal = A × exp(−Ea/(R×T_avg)) × √t, where Ea = 0.5eV, A = 0.024, R = 8.314e-5 eV/K. Cycle aging: Δη_cyc = EFC × k_cyc, k_cyc = 2.0e-5. Combined: √(Δη_cal² + Δη_cyc²). Dispatch: sort 24h price array; charge lowest 4h (charge rate = C-rate × capacity); discharge highest 4h. Revenue stacking: arbitrage + frequency regulation (CAISO AS or ERCOT SCED) + capacity (ISO capacity market or BTM demand charge reduction).

**Standards:** ['FERC Order 841', 'PNNL LCOS Methodology', 'IEC 62619 Safety', 'UL 9540A']
**Reference documents:** PNNL — Grid Energy Storage Technology Cost and Performance Assessment 2022 (LCOS Methodology); FERC Order 841 — Electric Storage Participation in Markets Operated by Regional Transmission Organizations; NREL — Optimal Battery Storage Operations for PV Integration (2021); BloombergNEF — BESS Outlook 2024 — Cost Trajectory and Revenue Stack; IEC 62619:2022 — Secondary Cells and Batteries Containing Alkaline or Other Non-Acid Electrolytes — Safety Requirements

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Fix the two numeric defects and converge on the backend dispatch engine (analytics ladder: rung 2 → 3)

**What.** This 18-tab workbench genuinely implements what it claims — Arrhenius + cycle degradation, PNNL-style LCOS waterfall, greedy dispatch, revenue stacking, IRA §48E ITC toggles — and §7 documents two quantitative caveats that are the evolution's first order of business: the calendar-aging term is **numerically inert as coded** (so all degradation is effectively cycle-driven regardless of temperature slider), and the LCOS denominator **double-counts a factor of 365** (`efcPerYear` is already annualised; `eMWh_y` multiplies by 365 again), which deflates LCOS materially. Evolution A fixes both and upgrades the dispatch layer.

**How.** (1) Repair the Arrhenius activation so `tempC` moves the fade curve (with a bench case: LFP at 1 EFC/day should show ~15% fade at 10 years per the module's own §4.1 reference values, NMC at 1.5 EFC/day ~25%). (2) Remove the double ×365 and re-verify LCOS lands in the PNNL-cited $110–160/MWh band for the 4-hour default. (3) Replace the greedy 4-cheapest/4-dearest heuristic with calls to the platform's existing DP-optimal dispatch engine (`POST /api/v1/bess-stacking/*` — `battery-revenue-stacker`'s backend), eliminating a parallel, weaker dispatch implementation; the workbench keeps its configuration UI and gains exact dispatch. (4) Rung 3: seeded hourly market shapes replaced by real ISO price series (ENTSO-E/EIA ingestion) with the market-rate benchmarks (§4.1's CAISO/ERCOT/PJM figures) becoming dated citations.

**Prerequisites.** Coordination with `battery-revenue-stacker` on a shared dispatch contract; regression snapshots before the LCOS fix so downstream screenshots/docs update knowingly. **Acceptance:** temperature slider changes 10-year fade; the bench pins both reference fade curves and the corrected LCOS band; workbench dispatch matches `/dispatch-compare`'s DP result for the same day.

### 9.2 Evolution B — BESS configuration copilot for the developer workbench (LLM tier 1 → 2)

**What.** Eighteen tabs is a lot of surface; the copilot's first job (tier 1) is orientation and explanation: "why does my LCOS jump when I drop to 2-hour duration?", "what does the augmentation plan's 80% threshold mean?", "how does DC-coupling change clipping revenue?" — answered from this Atlas record's formula documentation and the page's live state, with the two §7 caveats disclosed until Evolution A lands (the copilot must not explain a temperature effect the inert term doesn't produce). Tier 2 then adds tool-driven what-ifs via the shared bess-stacking backend: "compare LFP vs NMC on 15-year economics in ERCOT" runs real engine sweeps.

**How.** Tier-1 grounding: §7.1's quoted formulas (degradation, LCOS, dispatch) and §4.1's sourced rate benchmarks — the corpus is unusually complete because the module documents its own math well. Tier 2 tool schemas come from the bess-stacking OpenAPI operations (computational, ungated), with the workbench's configuration state passed as tool arguments so conversation and UI stay in sync. Numeric validation per the Tier-2 contract; market-rate claims cite the dated benchmark table, never fresh LLM estimates.

**Prerequisites.** Copilot router (tier 1); Evolution A's backend convergence (tier 2 — the workbench's local greedy math is not tool-callable and shouldn't become so). **Acceptance:** tier-1 answers about degradation disclose the calendar-term defect until fixed; tier-2 chemistry comparisons trace every $/MWh and fade percentage to engine responses; ISO-specific revenue claims carry the data vintage.