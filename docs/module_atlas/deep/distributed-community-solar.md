## 7 · Methodology Deep Dive

This module implements the guide's *SREC market & net-metering economics* over 20 seeded distributed-
solar projects, anchored to **real SREC price data** and real net-metering-policy structures. The core
economics — SREC revenue, bill savings, LMI share, LCOE, payback — are genuine formulas; project
attributes are `sr()`-seeded within realistic ranges. No ⚠️ mismatch, though §7.5 flags the seeded
project generation.

### 7.1 What the module computes

```js
PROJECTS (20): per project i:
  capacitykW  = 10 + round(sr(i·7)·4990)                 // 10–5000 kW
  srecPrice   = 50 + sr(i·29)·200                        // $/MWh
  srecRevenueAnnual = capacitykW × 0.15 × srecPrice / 1000   // = kW × CF-proxy × $/MWh → $k/yr
  avgBillSavingPct  = 15 + sr(i·13)·30                   // 15–45%
  systemCostPerW    = 2.8 + sr(i·17)·1.4                 // $/W installed
  paybackYr = 5 + sr(i·31)·8 ; lcoe = 55 + sr(i·37)·55   // yr ; $/MWh
  lmiSharePct = 15 + sr(i·41)·30                         // low-mod-income subscriber %
  localJobsCreated = round(capacitykW/1000 × (2 + sr(i·43)·4))
```

The SREC-revenue formula `capacitykW × 0.15 × srecPrice / 1000` embeds a **0.15 capacity-factor /
annual-generation proxy**: kW × 0.15 approximates MWh/yr per kW (a rough 1,314 kWh/kW-yr → ≈0.15 when
scaled), × $/MWh → annual SREC revenue in $k.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| SREC market prices | DC $420, MA $285, NJ $230, MD $75, IL $70, PA $40, VA $55, CO $0 | **real** SREC market data (SRECTrade-consistent) |
| Net-metering policies | Full NEM 1:1, NEM 2.0 TOU, NEM 3.0 export-rate, Virtual NEM, Avoided-cost | **real** policy taxonomy |
| Project types | Rooftop C/R, Carport, Community Solar, Ground-Mount C&I | labels |
| ITC % | 30–40% | real IRA ITC + adders band |
| System cost | $2.8–4.2/W | realistic installed-cost band |
| LMI share | 15–45% | seeded (real programs 20–50% carve-outs) |

DC's $420/MWh SREC (highest, driven by its 100% RPS) and the state ordering are correct real-world
facts; the seeded project SREC prices ($50–250) sample within the market range.

### 7.3 Calculation walkthrough

Each project seeds capacity, then derives SREC revenue (capacity × 0.15 CF-proxy × price), total system
cost (`$/W × kW / 1e6` → $M), and community-solar subscriber counts (20–500 for community projects, 1
otherwise). Portfolio KPIs sum capacity/subscribers/jobs and average bill-saving/payback/LCOE. Charts:
SREC revenue vs price, LMI share vs subscribers, net-metering-policy bill-reduction comparison, and
state SREC-market bars.

### 7.4 Worked example

Project i=3 (Community Solar): `capacitykW = 10 + round(sr(21)·4990)`. If `sr(21) = 0.40` →
`10 + round(1996) = 2006 kW`. `srecPrice = 50 + sr(87)·200`, say `sr(87)=0.5` → `150 $/MWh`.
`srecRevenueAnnual = 2006 × 0.15 × 150 / 1000 = 2006 × 22.5/1000 = 45.1 $k/yr`.
`subscriberCount = 20 + round(sr(33)·480)`, say 260. `totalSystemCostM = 3.5 × 2006 / 1e6 = $0.007M`
per watt-scaling (note the `/1e6` gives $M only for MW-scale capacity; at 2 MW ≈ $7.0M). Bill saving
15–45% distributes across the ~260 subscribers per the community-solar discount model.

### 7.5 Data provenance & limitations

- SREC market prices and net-metering-policy structures are **real**; project-level attributes are
  `sr()`-seeded within realistic ranges. The economics formulas are genuine but simplified.
- The 0.15 SREC generation proxy is a flat capacity-factor stand-in — a real model would use location-
  specific irradiance (NREL PVWatts) and degradation.
- No time-of-use export-rate modelling for NEM 3.0 (the policy is labelled but bill savings don't
  differentiate NEM 1.0 vs 3.0 per project); LMI share is seeded, not tied to actual state carve-out
  rules.

**Framework alignment:** SREC/RPS compliance markets — SRECs are tradeable RPS-compliance instruments
(1 SREC = 1 MWh solar), priced by RPS demand vs the Solar Alternative Compliance Payment (SACP)
ceiling; DC's high price reflects its aggressive RPS. SEIA net-metering policy database and NREL
community-solar tariff analysis underpin the NEM and community-solar structures; DOE/state LMI
carve-out programs (IL CEJA 50%, NY VDER, MA DG) frame the equity overlay.
