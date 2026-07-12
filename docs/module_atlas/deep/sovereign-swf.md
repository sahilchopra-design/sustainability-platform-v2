## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — frontend/backend disconnect, not a missing model.** This module
> is unusual among the sovereign family: a genuinely well-built backend engine exists
> (`backend/services/sovereign_swf_engine.py`, 1,279 lines — real 24-principle GAPP/Santiago
> Principles scoring, a faithful Norwegian GPFG exclusion screen, a PACTA-style portfolio
> temperature calculator, and a Hartwick-Rule intergenerational-equity assessment, all built on 25
> real, named, hand-curated SWF profiles with plausible AUM/ESG figures). **The frontend page never
> calls it.** `SovereignSWFPage.jsx` contains no `axios`/`fetch` call anywhere in the file; instead it
> independently regenerates a **75-fund synthetic universe** with `sr()`-seeded scores for every
> metric the backend already computes properly (Santiago score, ESG score, climate score, fossil-fuel
> exposure, portfolio temperature). The `trace_labels` API routes recorded in this module's registry
> are real, working endpoints — they are simply unused by the page that is supposed to consume them.
> Sections 7.1–7.4 document what the frontend actually renders; §7.5 documents the real (but
> disconnected) backend methodology.

### 7.1 What the frontend computes

`SWFS` is a 75-entry array; the first 5 real-sounding fund names (`SWF_NAMES[0..4]` = GPFG, ADIA,
CIC, KIA, HKMA) get **hardcoded plausible AUM values** (1380/993/1240/750/580 $Bn), the next 5 get a
scaled random AUM, and the remaining 65 get a smaller random AUM. Every other metric — for **all 75
funds, including the 5 real-named ones** — is `sr()`-generated independent of the real data:

```
santiagoScore   = round(40 + sr(i×19+7)×60)     // 40–100 (backend's real score is 0–24)
esgScore        = round(30 + sr(i×23+11)×70)     // 30–100
climateScore    = round(25 + sr(i×29+13)×75)     // 25–100
fossilFuelExposure = 5 + sr(i×31+17)×45           // 5–50%
greenAllocation = 2 + sr(i×37+19)×28              // 2–30%
portfolioTemp   = 1.6 + sr(i×41+23)×2.4           // 1.6–4.0°C
transparencyScore = round(35+sr(i×43+29)×65); governanceScore = round(40+sr(i×47+31)×60)
netZeroTarget   = null | 2050 | 2040 | 2060 (categorical via sr() threshold)
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| AUM (first 5 funds) | Hardcoded real-ish values | Real (approximate published AUM) |
| AUM (remaining 70) | Synthetic | `sr()`-seeded |
| Santiago/ESG/climate/transparency/governance scores | Synthetic 0–100 scales | Not derived from GAPP principles or any documented rubric |
| `region`/`fundType` | Categorical, hand-mapped for first ~10 real funds, `sr()`-assigned for the rest | Mixed |
| GAPP Principles list (`GAPP_PRINCIPLES`, 25 rows) | Real 24-principle titles/descriptions | Reproduced in a seed table, not scored against the actual fund |

### 7.3 Calculation walkthrough (frontend)

1. **Fund generation** — 75 funds, `SWFS`, as above.
2. **Aggregates** — `totalAUM`, `avgESG`, `avgTemp` (all guarded with `filteredSWFs.length ? … : 0`),
   `aumByRegion`, `fundTypeData`, `esgByRegion`.
3. **Santiago principle detail (GAPP)** — for a *selected* fund, `gappData` scores each of the 25
   `GAPP_PRINCIPLES` as `round(selectedFundObj.santiagoScore × (0.7 + sr()×0.6))` — i.e. it fans the
   fund's **already-synthetic** headline Santiago score out into 25 pseudo-principle-level scores
   with ±30% noise, rather than genuinely evaluating each principle (contrast with the backend's
   `_score_principle`, which checks real fund attributes per criterion).
4. **NGFS/Paris alignment bucket** — `ngfsAlignment` buckets funds by `portfolioTemp` into
   `1.5°C / 2°C / 3°C / 4°C+` tiers using fixed thresholds `[0,1.75), [1.75,2.5), [2.5,3.5), [3.5,∞)`
   — thresholds are reasonable NGFS-style bucket boundaries, applied to synthetic data.
5. **What-if divestment slider** — `whatIfTemp` reduces the fleet-average `portfolioTemp` by
   `(divRateSlider/100)×0.8°C` — an assumed linear, uncalibrated sensitivity (0.8°C max reduction at
   100% divestment rate), not derived from the PACTA sector-temperature methodology the backend
   actually implements.
6. **Divestment/exclusion tabs** — `exclusionAdoption`, `commitByStatus`, `cumulativeDivest` — all
   further aggregates over the same 75-fund synthetic table.

### 7.4 Worked example — GPFG (Norway), frontend vs. backend for the same fund

| Metric | Frontend (`SWFS[0]`, synthetic) | Backend (`SWF_PROFILES["GPFG"]`, real/curated) |
|---|---|---|
| AUM | $1,380Bn (hardcoded, plausible) | $1,700Bn |
| Santiago/GAPP score | 75 *(on an ad-hoc 40–100 scale)* | 22 **/24** (≈91.7%) |
| Fossil fuel exposure | **10.7%** | **4.2%** |
| Green bond allocation | 14.7% | $28Bn ÷ $1,700Bn ≈ 1.6% |
| Portfolio implied temp | 2.12°C | 2.1°C |

`sanScore=round(40+sr(7)×60)=75`, `fossilFuel=round(5+sr(24)×45,1)=10.7`,
`portTemp=round(1.6+sr(30)×2.4,2)=2.12` (computed via `sr(s)=frac(sin(s+1)×10⁴)`). The portfolio
temperature happens to land close to the real GPFG figure by coincidence of the random draw; fossil
fuel exposure is off by more than 2× — demonstrating that even for the platform's flagship,
real-name-carrying fund, the frontend numbers are not sourced from the accurate backend profile.

### 7.5 The real (disconnected) backend methodology

`backend/services/sovereign_swf_engine.py` implements four genuine, well-specified functions that
the frontend does not call:

- **`assess_swf_esg`** — scores 24 real IWG-SWF Santiago/GAPP principles (3 pillars: Legal Framework
  GAPP 1-8, Institutional Governance GAPP 9-15, Investment Policies GAPP 16-24) via
  `_score_principle`, which checks each principle's specific compliance criteria against the fund's
  actual attributes (e.g. `coal_exclusion_applied` requires `fossil_fuel_exposure_pct<5.0`;
  `paris_alignment_tracked` requires `portfolio_temp_c<2.5`). Tiers: `leader ≥85%`, `advanced ≥65%`,
  `developing ≥40%`, else `laggard`.
- **`apply_gpfg_exclusion_screen`** — a faithful replica of Norway's NBIM exclusion criteria:
  coal revenue >30% → excluded; any tobacco revenue → excluded; cluster munitions/nuclear
  weapons outside NPT/anti-personnel mines → excluded; severe environmental/systematic human-rights
  controversies → excluded; coal revenue 10–30% or moderate controversies → observation list.
- **`calculate_portfolio_temperature`** — genuine PACTA/MSCI-proxy weighted-average temperature:
  `portfolio_temp = Σ(weight×company_temp) / Σweight` across equities and sovereign bonds, with a
  real 18-sector benchmark table (coal 4.5°C, oil&gas 3.8°C, renewables utilities 1.6°C, tech 1.7°C
  …) and Paris-alignment bucketing (`≤1.65°C` Paris-1.5, `≤2.0` below-2°C, `≤3.0` above-2-below-3,
  else above-3°C).
- **`assess_intergenerational_equity`** — real Hartwick Rule (1977) + Hotelling Rule (1931)
  economics: `hartwick_compliant = annual_withdrawal_pct ≤ 4.0%` (GPFG's actual fiscal rule);
  `optimal_depletion_rate = (ρ + θ×g)×100 = (0.03+1.5×0.02)×100 = 6.0%`; sustainability score
  `= max(0, 100 − fiscal_gap×20 − resource_dependency×0.5)`.

These are exactly the kind of formulas a §8 "Model Specification" section would normally have to
design from scratch for a purely-synthetic module — here they already exist in production Python and
simply need to be wired to the frontend via the 8 documented `trace_labels` routes.

### 7.6 Data provenance & limitations

- **Frontend:** all 75 funds' scores and 70/75 funds' AUM are `sr()`-synthetic; only 5 funds get a
  hardcoded, plausibly-real AUM figure and no other real attribute.
- **Backend:** 25 real, named SWF profiles with plausible AUM/ESG/climate figures (data appears
  hand-curated to public disclosures circa 2023/24, not live-refreshed — no source URL or vintage
  tag is recorded in the file).
- No code path joins the two — a genuine remediation item is wiring `SovereignSWFPage.jsx` to the
  8 existing `/api/v1/sovereign-swf/*` routes rather than building any new model.

**Framework alignment:** IFSWF Santiago Principles / GAPP (real 24-principle criteria genuinely
implemented in the backend, not surfaced in the UI) · Norwegian GPFG exclusion model (faithfully
replicated in the backend's `apply_gpfg_exclusion_screen`) · PACTA / MSCI portfolio-temperature
methodology (real sector-benchmark table in the backend) · Hartwick Rule (1977) / Hotelling Rule
(1931) intergenerational-equity economics (correctly formulated in the backend).
