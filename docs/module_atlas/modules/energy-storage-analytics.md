# Energy Storage Analytics
**Module ID:** `energy-storage-analytics` · **Route:** `/energy-storage-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DF4 · **Sprint:** DF

## 1 · Overview
Models battery energy storage system (BESS) and long-duration storage (LDES) project economics including revenue stacking from frequency response, capacity markets, energy arbitrage, and renewable firming. Calculates levelised cost of storage (LCOS) and storage investment NPV.

> **Business value:** Essential for BESS developers, grid-scale storage investors, utilities, and infrastructure funds. Revenue stacking analysis maximises project IRR, LCOS benchmark positions against competing technologies, and grid stability service modelling supports regulatory approval.

**How an analyst works this module:**
- Input storage system specifications (capacity, duration, chemistry)
- Model revenue streams (FFR, BM, arbitrage, capacity market)
- Calculate LCOS and compare with technology benchmarks
- Run degradation and cycle life scenarios
- Optimise dispatch strategy and revenue stacking

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Card`, `KpiCard`, `PROJECTS`, `REGIONS`, `SERVICES`, `TABS`, `TECH`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECH` | 8 | `name`, `capexKwh`, `opexKwh`, `rte`, `cycles`, `calLife`, `cRate`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `SERVICES` | `['Frequency Regulation','Capacity Market','Energy Arbitrage','Peak Shaving','Ancillary Services','Behind-the-Meter'];` |
| `REGIONS` | `['GB','Germany','France','USA-CAISO','USA-PJM','Australia-NEM','Singapore'];` |
| `tech` | `TECH[Math.floor(sr(i*7)*TECH.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `service` | `SERVICES[Math.floor(sr(i*13)*SERVICES.length)];` |
| `powerMw` | `Math.round(5 + sr(i*17)*295);     // MW` |
| `durHrs` | `Math.round(1 + sr(i*19)*11);       // hours` |
| `energyMwh` | `powerMw * durHrs;` |
| `dod` | `0.80 + sr(i*23)*0.15;              // depth of discharge` |
| `capex` | `tech.capexKwh * energyMwh / 1000;  // $M` |
| `opexYr` | `tech.opexKwh  * energyMwh / 1000;  // $M/yr` |
| `totalCycles` | `Math.min(tech.cycles, annCycles * tech.calLife);` |
| `totalMwh` | `totalCycles * dod * energyMwh;` |
| `lcos` | `(capex * 1e6 + opexYr * 1e6 * tech.calLife) / (totalMwh * 1000); // $/MWh` |
| `lcosAdj` | `Math.max(20, Math.round(lcos * 10 + sr(i*31)*20) / 10);` |
| `freqRev` | `service==='Frequency Regulation'  ? powerMw * 18000 / 1e6 : powerMw * sr(i*37)*8000/1e6;` |
| `capacityRev` | `service==='Capacity Market'        ? powerMw * 50000 / 1e6 : powerMw * sr(i*41)*20000/1e6;` |
| `arbitrage` | `energyMwh * cf * 365 * 35 / 1e6;` |
| `totalRevYr` | `freqRev + capacityRev + arbitrage;` |
| `irr` | `Math.round(5 + (totalRevYr - opexYr) / capex * 70 + sr(i*43)*6);` |
| `elcc` | `Math.round(60 + sr(i*47)*35); // %` |
| `techCompare` | `useMemo(() => TECH.map(t => {` |
| `lcosTrajectory` | `useMemo(() => Array.from({length:6},(_,i)=>({ year:(2025+i*5).toString(), liNmc:  Math.round(180-i*18), lfp:    Math.round(160-i*15), flow:   Math.round(350-i*25), phs:    Math.round(80-i*2), })), []);` |
| `revenueByService` | `useMemo(() => SERVICES.map(s=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `SERVICES`, `TABS`, `TECH`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Li-ion BESS CapEx 2023 | — | BloombergNEF BESS Price Survey 2023 | Four-hour Li-ion system all-in installed cost — projected to fall to $100/kWh by 2030 |
| LCOS Li-ion (4hr) | — | Lazard LCOS v8.0 2023 | Levelised cost of storage for 4-hour Li-ion BESS — competitive with peaker plants at grid scale |
| Grid-scale BESS Deployments 2023 | — | BloombergNEF H2 2023 Storage Report | Grid-scale BESS deployments in 2023 — on track for IEA Net Zero 600 GWh/yr by 2030 |
- **Grid frequency and price data (EPEX, AEMO, PJM)** → Revenue optimisation modelling → **Expected annual revenue by market product**
- **Battery chemistry specs (capacity, RTE, cycle life, degradation)** → LCOS calculation → **Levelised cost and NPV over asset life**
- **Renewable generation profiles for co-location analysis** → Firming value calculation → **Capacity factor improvement and curtailment reduction value**

## 5 · Intermediate Transformation Logic
**Methodology:** Levelised Cost of Storage (LCOS)
**Headline formula:** `LCOS = [CapEx + Σ(OpEx_t + EnergyCost_t) / (1+r)^t] / Σ[EnergyDispatched_t / (1+r)^t]; RoundTripEfficiency = EnergyOut / EnergyIn`

LCOS includes round-trip efficiency losses in energy cost; revenue stacking from multiple market products (FFR, BM, DA arbitrage) improves project economics

**Standards:** ['IEA Energy Storage 2023', 'BloombergNEF BESS Market Outlook 2024', 'IRENA Innovation Outlook — Thermal Energy Storage', 'Lazard LCOS v8.0 2023']
**Reference documents:** IEA Energy Storage and Electricity Markets Report 2023; BloombergNEF Battery Energy Storage System Market Outlook 2024; Lazard Levelised Cost of Storage Analysis v8.0 (2023); IRENA Innovation Outlook — Thermal Energy Storage 2020

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`

## 7 · Methodology Deep Dive

The guide's LCOS definition — `LCOS = [CapEx + Σ(OpEx+EnergyCost)/(1+r)^t] / Σ[EnergyDispatched/(1+r)^t]`,
with round-trip efficiency and revenue stacking — is substantively implemented, with two caveats: (i)
the LCOS here is **undiscounted** (no `(1+r)^t` term), and (ii) the computed LCOS is nudged by a small
random adjustment before display. The technology parameter table is realistic (matches
BloombergNEF/Lazard magnitudes); the 50 projects are synthetic.

### 7.1 What the module computes

Per project (50), from a randomly-assigned technology:

```js
energyMwh   = powerMw × durHrs
capex ($M)  = tech.capexKwh × energyMwh / 1000
opexYr ($M) = tech.opexKwh  × energyMwh / 1000
annCycles   = cf × 365                              // cf = utilisation 0.15–0.70
totalCycles = min(tech.cycles, annCycles × calLife) // cycle- OR calendar-limited
totalMwh    = totalCycles × dod × energyMwh          // lifetime throughput
lcos ($/MWh)= (capex·1e6 + opexYr·1e6·calLife) / (totalMwh·1000)
lcosAdj     = max(20, round(lcos·10 + sr(i·31)·20)/10)   // ±random nudge, floored at $20
```

**Round-trip efficiency** is carried per technology (`rte`) but is not divided into the energy cost —
the guide says RTE losses should inflate energy cost; here RTE is displayed, not applied to LCOS.

**Revenue stacking:**
```js
freqRev     = service=='Frequency Regulation' ? powerMw·18000/1e6 : powerMw·sr()·8000/1e6
capacityRev = service=='Capacity Market'      ? powerMw·50000/1e6 : powerMw·sr()·20000/1e6
arbitrage   = energyMwh · cf · 365 · 35 / 1e6        // $35/MWh arbitrage spread
totalRevYr  = freqRev + capacityRev + arbitrage
irr         = round(5 + (totalRevYr − opexYr)/capex · 70 + sr()·6)
```

### 7.2 Parameterisation / scoring rubric

Technology parameters (realistic, hand-authored):

| Tech | capex $/kWh | opex $/kWh | RTE | cycles | cal. life | Anchor |
|---|---|---|---|---|---|---|
| Li-ion NMC | 180 | 8 | 0.90 | 4,000 | 15 | BNEF ~$230–280 all-in 4h |
| Li-ion LFP | 160 | 6 | 0.92 | 6,000 | 20 | longer-cycle chemistry |
| Vanadium Flow | 350 | 12 | 0.75 | 20,000 | 25 | LDES, high cycle life |
| CAES | 60 | 3 | 0.65 | 50,000 | 40 | compressed air |
| Pumped Hydro | 80 | 2 | 0.80 | 100,000 | 60 | ~70–85% RTE (Lazard) |
| Thermal | 25 | 1 | 0.70 | 30,000 | 30 | cheapest $/kWh |
| H₂ LDES | 120 | 10 | 0.40 | 10,000 | 20 | low RTE, seasonal |

| Revenue constant | Value | Basis |
|---|---|---|
| FFR price (if service = FreqReg) | $18,000/MW·yr | ancillary-service value |
| Capacity-market price | $50,000/MW·yr | capacity payment |
| Arbitrage spread | $35/MWh | DA price spread |
| LCOS floor | $20/MWh | display guard |

### 7.3 Calculation walkthrough

Assign tech/region/service → size the system (`powerMw × durHrs`) → capex/opex scale with energy →
lifetime throughput = min(cycle-limited, calendar-limited) cycles × DoD × energy → LCOS = total
lifetime cost / lifetime MWh → revenue stacking sums FFR/capacity/arbitrage → IRR from
`(revenue − opex)/capex`. Technology comparison and LCOS-trajectory tabs run the same LCOS on
`TECH` with declining cost projections (`liNmc 180→90` over 2025–2050).

### 7.4 Worked example

An LFP project: `powerMw = 50`, `durHrs = 4` → `energyMwh = 200`. Tech LFP: capex 160, opex 6, cycles
6000, calLife 20. Utilisation `cf = 0.40`; `dod = 0.90`.
```
capex   = 160 × 200 / 1000 = $32M
opexYr  = 6 × 200 / 1000 = $1.2M/yr
annCycles = 0.40 × 365 = 146; totalCycles = min(6000, 146×20=2920) = 2920
totalMwh = 2920 × 0.90 × 200 = 525,600 MWh
lcos = (32e6 + 1.2e6×20) / (525,600 × 1000)
     = (32,000,000 + 24,000,000) / 525,600,000 ... units: $/MWh
     = 56,000,000 / 525,600 = $106.5/MWh   (before random nudge)
```
So this 4-hour LFP system prices at ≈$107/MWh levelised — in the Lazard $0.15–0.25/kWh (i.e.
$150–250/MWh) band for shorter-cycle Li-ion, lower here because the 20-year calendar life amortises
capex over 2,920 cycles. Arbitrage revenue: `200 × 0.40 × 365 × 35/1e6 = $1.02M/yr`.

### 7.5 Companion analytics

- **Technology comparison:** LCOS and RTE across the 7 chemistries; LDES (flow/CAES/PHS) shown as
  low-$/kWh but low-RTE trade-offs.
- **LCOS trajectory:** declining-cost projections 2025→2050 (Li-NMC 180→90, flow 350→225).
- **Revenue stacking & grid integration:** service-mix revenue and ELCC (effective load-carrying
  capability, `60 + sr()·35`%).
- **Advanced analytics:** delegated to the shared `CleanTechAdvancedAnalytics` wrapper (EU
  Taxonomy/SBTi overlay).

### 7.6 Data provenance & limitations

- **Technology parameters are realistic and hand-authored** (BNEF/Lazard-consistent); **project-level
  inputs are synthetic**, seeded by `sr()`, and the final `lcosAdj` adds a small random nudge on top
  of the real LCOS.
- LCOS is **undiscounted** (no NPV weighting of the cost/throughput streams) and does **not** apply
  RTE to energy cost, both simplifications vs the guide's formula and Lazard's method.
- Revenue figures for non-matching services and IRR carry random components, so project-level economics
  are illustrative.

**Framework alignment:** **Lazard LCOS v8.0** — the levelised-cost framing and the technology cost
bands; **BloombergNEF BESS Outlook** — the capex/$-kWh and deployment context; **IEA Energy Storage** —
the LDES vs short-duration taxonomy. RTE (round-trip efficiency), the guide's core loss term, is
tracked per technology but not yet folded into the LCOS energy cost as those standards prescribe.

## 9 · Future Evolution

### 9.1 Evolution A — Discounted LCOS, real price series, and true dispatch optimization (analytics ladder: rung 2 → 5, staged through 3)

**What.** §7's verdict: the LCOS is "substantively implemented" over a realistic 8-chemistry `TECH` table (BNEF/Lazard-consistent capex, RTE, cycle life), with two defects — it's **undiscounted** (the guide's `(1+r)^t` terms are missing) and the computed value is **nudged by a random adjustment** before display (`lcosAdj = lcos·10 + sr(i·31)·20`). Revenue stacking is heuristic: seeded service revenues, an arbitrage line at a flat $35/MWh spread, IRR with `sr()` noise. The 50 projects are synthetic. Evolution A fixes the math, grounds prices, and then does the thing the roadmap names this engine family for: prescriptive revenue stacking.

**How.** Stage 1 (rung 3): move to `services/storage_economics_engine.py` with properly discounted LCOS (bench-pinned against a Lazard v8.0 worked example), delete the random nudge outright (it's a guardrail-violating fabrication pattern), and replace flat arbitrage assumptions with real price series — ENTSO-E day-ahead and EIA prices are already wired into the platform from the data-sources wave-1 work. Stage 2 (rung 5): dispatch optimization via scipy (the roadmap explicitly names BESS-stacking a natural first mover for the prescriptive rung) — maximize revenue over price/frequency series subject to c-rate, DoD, and cycle-budget constraints, yielding an *optimized* revenue stack per project instead of seeded service revenues.

**Prerequisites (hard).** The `sr()` nudge and seeded IRR removed first (rung-3 credibility gate); price-series coverage per region (GB/CAISO/NEM need sources beyond ENTSO-E — disclose coverage). **Acceptance:** discounted LCOS reproduces the Lazard reference within tolerance; optimizer output beats the naive single-service baseline on the same series (testable claim); zero `sr()` in any economics path.

### 9.2 Evolution B — Storage project screening analyst (LLM tier 2)

**What.** A tool-calling analyst for developer/investor questions: "screen a 100 MW / 4h LFP project in GB: LCOS, optimized revenue stack, IRR, and how sensitive is it to cycle life?" It chains Evolution A's endpoints — LCOS computation, dispatch optimization on the region's real price series, sensitivity sweep — and drafts the screening memo with the revenue-stack decomposition (FFR vs capacity vs arbitrage shares) from the optimizer's actual output, including the degradation trade-off the optimizer surfaces (cycling harder raises revenue but burns cycle budget).

**How.** Tool schemas from the engine endpoints; grounding corpus = this Atlas record's §5 LCOS formula and §7 tech-parameter table so chemistry comparisons quote real capex/RTE/cycle values. What-ifs ("same project as flow battery") are recomputation calls. The validator covers $/MWh, IRR, and revenue figures; region-specific market rules the engine doesn't model (GB capacity-market derating specifics) trigger the refusal path with a pointer to what *is* modeled.

**Prerequisites (hard).** Evolution A stage 1 minimum — an analyst narrating the current randomly-nudged LCOS and seeded IRRs would put fabricated economics in front of investment decisions. **Acceptance:** a golden GB-LFP screen reproduces from scripted tool calls; the memo's revenue shares sum to the optimizer total; chemistry-comparison figures match the TECH table exactly.