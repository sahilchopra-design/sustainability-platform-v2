## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes the *real* CORSIA mechanism —
> a **sector growth factor** (`Offset_req = (E_yr − E_baseline) × SGF`), EEU procurement
> optimisation, and ICAO MRV export. The code implements a **per-airline route-based approximation
> instead**: each airline's own baseline = average of its 2019 and 2020 emissions, and its offset
> requirement = its own growth above that baseline × a flat ratio (no sector-wide SGF, no EEU
> price optimisation, no MRV export). Phase labels also disagree with ICAO's actual timeline: the
> code's phases are `'Pilot (2024-26)', 'Phase 1 (2027-35)', 'Mandatory'`, whereas ICAO's pilot
> phase was 2021–2023, first phase 2024–2026, second (mandatory) phase 2027–2035. Finally, the
> authoritative `CORSIA_BASELINES` reference dataset (ICAO sector emissions 2010–2024, 589 MtCO₂
> 2019 baseline) is **imported but never used**.

### 7.1 What the module computes

For 120 synthetic airlines (real names/IATA codes, seeded data), the page computes CORSIA
baselines and offsetting obligations, fleet-emission analytics, an SAF supplier landscape, and an
aviation credit-risk table. Core formula (`calcCORSIA_offset`, with its own inline citation
"ICAO Doc 9501 Vol.IV"):

```js
b2019     = annualCO2 × baseline2019_factor            // factor 1.0 → 2019 = current emissions
b2020     = annualCO2 × baseline2020_factor            // 0.4–0.65: "2020 was ~60% of 2019 (COVID)"
baseline  = (b2019 + b2020) / 2
offsetting = max(0, (annualCO2 − baseline) × offset_ratio)   // ratio 1.0 Pilot, 0.85 otherwise
```

Because `baseline2019_factor = 1.0`, the baseline is always
`annualCO2 × (1 + b2020_factor)/2 < annualCO2`, so **every airline always has a positive
offsetting obligation** — a structural artefact of anchoring 2019 emissions to *current*
emissions.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Baseline definition | mean(2019, 2020) | ICAO CORSIA 2024 update (inline comment); note ICAO later re-based to 85% of 2019 — code keeps the original 2019/2020 average |
| 2020 COVID factor | 0.4 + sr(i·89+4)×0.25 → 0.40–0.65 | synthetic; comment "~60% of 2019" (ICAO actual: 237/589 ≈ 0.40) |
| offset_ratio | 1.0 (Pilot) / 0.85 (Phase 1, Mandatory) | code constants; real CORSIA uses an annually published sector growth factor, not 0.85 |
| Fleet size | 40–500 aircraft | synthetic |
| annualCO2 (MtCO₂) | fleetSize × 0.018 + sr(·)×8 | synthetic scaling (≈18 kt/aircraft base) |
| SAF share | 0–12% | synthetic (sector actual ~0.2–0.5% in 2024) |
| Emissions intensity | 55–120 gCO₂/RPK-scale | synthetic; benchmark bases per aircraft type hard-coded (Electric 8, Next-gen 42, Turboprop 65, Narrow-body 72, Regional 85, Wide-body 90, Freighter 120) |
| SAF mandate trajectory | 2% (2025) → 6% (2030) → 20% (2035) → 70% (2050) | matches EU ReFuelEU Aviation mandate schedule |
| Phase assignment | s<0.3 Pilot / s<0.75 Phase 1 / else Mandatory | seeded split 30/45/25% |
| Compliance status | 55% Compliant / 25% Partial / 15% Non-compliant / 5% Exempt | seeded split |

### 7.3 Calculation walkthrough

1. **CORSIA Compliance tab** — KPIs `totalCO2 = Σ annualCO2`, `totalOffset = Σ offsetReq`,
   `avgSaf = Σ safPct / 120`, phase distribution pie, compliance score
   `(compliant + 0.5×partial)/total × 100`, and a paginated airline table with region/phase
   filters.
2. **Fleet Emissions Analyzer** — fleet-mix allocation (each aircraft type takes
   `floor(remaining × sr(·) × 0.45)`, last type gets the remainder), fleet age vs emissions
   intensity scatter, and a **fleet-replacement what-if**: over 2025–2050 in 5-year steps,
   `replaced = min(100, (replacePct/100)×((i+1)/6)×100)` and
   `reduction = replaced × 0.01 × (Next-gen 0.35 | Electric 0.85 | else 0.15)` — i.e. next-gen
   aircraft cut 35% and electric 85% of replaced-fleet emissions.
3. **SAF & Alternative Fuels** — 15 real supplier names across 5 pathways (HEFA,
   Fischer-Tropsch, Alcohol-to-Jet, e-Kerosene, Power-to-Liquid) with synthetic capacity
   (50–1,000 kt), price ($1,800–5,000/t) and lifecycle reduction (50–95%); plotted against the
   ReFuelEU-style mandate curve.
4. **Investment & Credit Risk** — 30 synthetic instruments (Green Bond/SLL/…): spread 80–500 bp
   and `climateSpread = spread × (1 + sr(·)×0.35)` — a flat 0–35% climate uplift, plus stranded
   risk buckets and a TCFD score 40–95.

### 7.4 Worked example — airline i = 0 (Lufthansa row)

- `fleetSize = floor(40 + sr(2)×460)`; sr(2) = frac(sin(3)×10⁴) = frac(1411.20) = 0.2001 →
  fleetSize = floor(40+92.05) = **132**.
- `annualCO2 = 132×0.018 + sr(5)×8`; sr(5) = frac(sin(6)×10⁴) = frac(−2794.15…) = 0.8449 →
  2.376 + 6.759 = **9.14 MtCO₂**.
- `b2020_factor = 0.4 + sr(4)×0.25`; sr(4) = frac(sin(5)×10⁴) = frac(−9589.24) = 0.7576 → 0.589.
- `baseline = 9.14 × (1 + 0.589)/2 = 9.14 × 0.7945 =` **7.26 MtCO₂**.
- Phase seed `s = sr(3)` = frac(sin(4)×10⁴) = 0.9750 → ≥ 0.75 → **Mandatory**, ratio 0.85.
- `offsetReq = max(0, 9.14 − 7.26) × 0.85 = 1.88 × 0.85 =` **1.60 MtCO₂e** of eligible units.

### 7.5 Data provenance & limitations

- **All airline, supplier, bond and airport rows are synthetic**, seeded via
  `sr(seed) = frac(sin(seed+1)×10⁴)`; names are real but data is not. The one genuinely sourced
  dataset — `CORSIA_BASELINES` (ICAO Environmental Report sector emissions, 589 MtCO₂ 2019) — is
  imported and unused.
- The per-airline "growth vs own baseline" scheme resembles CORSIA's *individual/route-based*
  attribution option but omits the sectoral growth factor that ICAO actually applies through 2032;
  the 0.85 ratio is a placeholder for it.
- Baseline uses avg(2019, 2020) per the original CORSIA design; ICAO Assembly A41 (2022) re-based
  the threshold to **85% of 2019 emissions** from 2024 — the code has not adopted this.
- No EEU eligibility, pricing or procurement optimisation; offset purchases in the quarterly view
  are seeded fractions of the requirement (0.6–1.4 × pro-rata).
- SAF blending does **not** reduce the offset requirement in code (contrary to both CORSIA rules
  and the guide's claim) — `safPct` is display-only.

### 7.6 Framework alignment

- **ICAO CORSIA (Annex 16 Vol IV / Doc 9501 Vol IV)** — CORSIA obliges operators on international
  routes between participating states to offset `(sector emissions − baseline) × SGF`, with the
  sectoral growth factor published annually by ICAO and a gradual shift to individual growth
  factors from 2033; eligible units must appear on ICAO's TAB-approved EEU list. The module
  approximates the arithmetic shape (growth above a 2019/2020-average baseline) at airline level
  but omits SGF, the 85%-of-2019 re-basing, and unit eligibility.
- **EU ReFuelEU Aviation (Reg. 2023/2405)** — the SAF mandate trajectory in code (2%→6%→20%→34%→
  42%→70% for 2025/2030/2035/2040/2045/2050) matches the regulation's blending mandates,
  including the e-fuel sub-quotas implied at pathway level.
- **EU ETS aviation** — referenced in the header copy only; no allowance-price math exists.
- **TCFD** — the bond table's `tcfdScore` is a synthetic 40–95 label, not a disclosure assessment.
