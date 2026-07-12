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
