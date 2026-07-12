## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry's headline metric —
> **LCONE** (`(CAPEX×CRF + OPEX − Electricity Revenue − 45Q) / Annual Net CO₂ Negative`) — is
> **never computed in code**; no $/t levelised cost appears anywhere. The guide's other two
> pillars are also absent as calculations: there is no 45Q tax-credit revenue stream (the CDR
> credit price is one generic `co2Price` slider, with $85 appearing only as a sensitivity point)
> and no biomass supply-chain emission netting (the guide's 0.18 tCO₂/MWh RED II deduction) —
> capture is treated as 100% net-negative. What the code *does* implement is a clean interactive
> **BECCS project cash-flow model** with Newton–Raphson IRR, CO₂-price sensitivity, and DSCR.

### 7.1 What the module computes

A single-project BECCS model (`calcBeccs`) driven by 10 sliders + a CCS-technology selector:

```js
netPowerMw   = powerMw × (1 − energyPenalty/100)
annMwh       = netPowerMw × (cf/100) × 8760
annCaptureMt = annMwh × 0.85 × (captureRate/100) / 1e6     // biomassCo2tMwh = 0.85 t/MWh
energyRev    = annMwh × energyRevMwh / 1e6                  // $M/yr
cdrRev       = annCaptureMt × co2Price                      // $M/yr
totalCapexM  = capexBn × 1e3 + annCaptureMt × ccsCapexMtCO2 // plant + CCS ($M per Mt/yr basis)
annuity      = w / (1 − (1+w)^−lifetime)                    // CRF
IRR          = NewtonRaphson([−capex, (rev−opex) × lifetime years])
DSCR         = (rev − opex) / (0.7 × annualised capex)      // assumes 70% debt share
```

`irr()` is a real Newton–Raphson solver (200 iterations, |Δr| < 1e-8 convergence, derivative-based
step) — not a lookup.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| Gross power / CF | 500 MW / 85% | synthetic demo defaults |
| Plant capex | $2.5B | synthetic (Drax-scale magnitude) |
| Biogenic CO₂ intensity | 0.85 tCO₂/MWh | hard-coded; plausible for wood-pellet steam plant |
| Capture rate / energy penalty | 90% / 20% | defaults mirror the post-combustion row |
| Energy revenue / CO₂ price | $80/MWh / $65/t | synthetic demo defaults |
| Opex | $45M/yr | synthetic |
| Lifetime / WACC | 25 yr / 8% | synthetic |
| CCS technologies (4 rows) | post-combustion capex $85/t·yr, opex $32/t, 90%/22%; pre-combustion 92/28/85%/18%; oxy-fuel 78/24/95%/16%; chemical looping 65/20/97%/12% | curated technology benchmarks (Global CCS Institute-style magnitudes) |
| Debt share in DSCR | 70% (`× 0.7`) | hard-coded assumption |
| Financing structures (5 rows) | equity/debt/grant splits with DSCR 1.25–1.55 and real examples (Drax, Stockholm Exergi green bond) | curated editorial |
| Reference projects (7 rows) | Drax 8.0 Mt/yr, capex $2.8B, IRR 9.4% … | curated editorial |

### 7.3 Calculation walkthrough

1. Sliders → `calcBeccs` → KPI cards (net MW, Mt captured, both revenue streams, IRR, DSCR).
2. **Dual revenue stack** — energy vs CDR-credit bar; the module's central economics message is
   the revenue split.
3. **CO₂-price sensitivity** — IRR recomputed at prices {20, 40, 60, 85, 100, 130, 160, 200} $/t
   (85 = the IRA 45Q geological-storage rate, present as a grid point, not a modelled credit).
4. **Financing structures / policy roadmap / project comparison** — curated display tabs
   (capital-stack bars, 2025–2050 policy milestones, capacity-vs-capex-vs-IRR chart).

One code quirk: `capexAnnM × 0` appears in the (unused) `cfs` array — annualised capex is
deliberately excluded from the IRR cash flows (correct, since the upfront −capex is already
period 0) but the dead term suggests an abandoned levelised-cost path — likely the missing LCONE.

### 7.4 Worked example — default inputs

| Step | Computation | Result |
|---|---|---|
| Net power | 500 × (1 − 0.20) | 400 MW |
| Generation | 400 × 0.85 × 8,760 | 2,978,400 MWh/yr |
| CO₂ captured | 2.9784M × 0.85 × 0.90 | **2.28 MtCO₂/yr** |
| Energy revenue | 2,978,400 × $80 /1e6 | $238.3M/yr |
| CDR revenue | 2.28 × $65 | $148.1M/yr |
| Total capex | 2,500 + 2.28 × 85 | $2,694M |
| CRF (8%, 25y) | 0.08 / (1 − 1.08⁻²⁵) | 0.0937 |
| Annualised capex | 2,694 × 0.0937 | $252.4M/yr |
| Net cash flow | 386.4 − 45 | $341.4M/yr |
| Project IRR | solve Σ 341.4/(1+r)ᵗ = 2,694 | **≈ 11.9%** |
| DSCR | 341.4 / (0.7 × 252.4) | **1.93×** |

At $20/t CO₂ the CDR stream falls to $45.6M and IRR drops to ≈ 9.6%; the sensitivity tab shows
this near-linear IRR-vs-price relationship (each +$10/t adds ≈ $22.8M/yr ≈ +0.5–0.7 pp IRR).

### 7.5 Data provenance & limitations

- Slider defaults, technology table, financing structures and the 7 reference projects are
  **curated demo values** (no PRNG in the core model; magnitudes echo IEA/Global CCS Institute
  publications named in the guide, uncited in code).
- **No net-negativity accounting**: biomass supply-chain emissions (cultivation, transport,
  pellet processing — typically 0.1–0.3 tCO₂/MWh) are not deducted, so "CO₂ captured" is
  overstated as "CO₂ removed" by roughly 15–35%.
- **No LCONE**, no tax modelling, no 45Q direct-pay schedule, no EU ETS biogenic interaction —
  the CDR price slider abstracts all policy revenue into one number.
- Flat annual cash flows (no degradation, no price escalation); DSCR uses a fixed 70% notional
  debt share rather than an actual debt schedule.
- IRR Newton–Raphson can diverge for pathological slider combos (no bracketing fallback), though
  defaults are well-behaved.

### 7.6 Framework alignment

- **US 45Q (IRA 2022)** — $85/t for geologically stored CO₂ from point-source capture ($60/t for
  utilisation), with 5-year direct pay; present only as the $85 sensitivity grid point. A faithful
  model would layer 45Q (12-year credit window) on top of voluntary CDR sales.
- **IEA BECCS / NZE** — the policy roadmap tab quotes IEA NZE milestones (0.5 Gt/yr BECCS by 2030,
  ~3.8 Gt/yr biogenic capture mid-century) as editorial content.
- **EU RED II (2018/2001)** — sustainability criteria requiring ≥ 70–80% lifecycle GHG savings
  for biomass power; the guide's 0.18 tCO₂/MWh supply-chain figure belongs to this framework and
  is absent from code.
- **EU Carbon Removal Certification Framework (CRCF)** — named in the 2026–2027 roadmap rows;
  CRCF certifies removals as (captured − released − supply-chain emissions), which is exactly the
  netting step the model omits.
- **Project-finance conventions** — CRF-annuitised capex, DSCR ≈ 1.25–1.55× targets in the
  financing-structure table are standard limited-recourse benchmarks.
