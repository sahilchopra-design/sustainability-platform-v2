## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **Energy Performance Gap
> Score** — `EPG = (EUI_actual − EUI_benchmark)/EUI_benchmark × 100`, flagging assets above +20% and
> awarding top-tier labels below −15%. **That formula does not appear in the code.** The actual
> achievability engine (`SCHEME_EVAL`) computes a *five-metric composite score* (energy, carbon, water,
> waste, renewables) and maps it linearly onto each scheme's label ladder. The module is a **portfolio
> certification tracker + scheme-recommendation calculator**, loading a real asset register from
> `localStorage` (`ra_re_portfolio_v1`) rather than seeded data. Sections below document the composite
> score as implemented; §8 specifies the production certification-readiness/EPG model.

### 7.1 What the module computes

For each property, `SCHEME_EVAL(prop)` builds one heuristic composite and reuses it across all 15
certification schemes:

```js
score = (200 − ei)·0.3 + (100 − ci)·0.2 + (100 − wi·20)·0.1 + wd·0.2 + rn·0.2
// ei = energy_intensity kWh/m²; ci = carbon_intensity kgCO2/m²; wi = water L/m²;
// wd = waste_diversion %; rn = renewable_share %
```
Then per scheme (with `levels` = that scheme's label ladder):
```js
idx      = clamp(⌊ score / (100 / levels.length) ⌋, 0, levels.length−1)   // achievable label
achievable = levels[idx]
estCost  = costBase($/m²) · gfa_m2 / 1e6                                   // $M
roi      = (premiumPct/100 · noi_usd_mn) / estCost
payback  = estCost / (premiumPct/100 · noi_usd_mn)
recommend = roi > 2.5 ? 'best' : roi > 1.0 ? 'consider' : 'not'
```

Portfolio KPIs: certified GFA/GAV coverage, average `score`, average green-lease %, and a **green rent
premium** = `(avgRent_certified − avgRent_uncertified) / avgRent_uncertified × 100`.

### 7.2 Parameterisation / scoring rubric

The composite weights and metric normalisers are **hand-chosen heuristics**, not a published rubric:

| Metric | Transform | Weight | Note |
|---|---|---|---|
| Energy intensity `ei` | `200 − ei` | 0.30 | higher score for lower EUI; caps implied at 200 kWh/m² |
| Carbon intensity `ci` | `100 − ci` | 0.20 | lower kgCO₂/m² → higher score |
| Water intensity `wi` | `100 − wi·20` | 0.10 | ×20 rescales a ~1.5 L/m² figure |
| Waste diversion `wd` | `wd` | 0.20 | % diverted, direct |
| Renewable share `rn` | `rn` | 0.20 | %, direct |

Label mapping is a **uniform linear cut** of `score` across the ladder — e.g. a 5-level scheme uses 20-pt
bands. The cost/premium/payback constants come from `CERT_COST_BENEFIT` (15 rows, e.g. LEED Platinum
$28/m², 12.5% rent premium, 5.8-yr payback), attributed in-guide to JLL/CBRE green-premium research.
`REGIONAL_REQUIREMENTS` (11 jurisdictions: EU EPC-B by 2030, UK MEES, NYC LL97, NABERS disclosure, etc.)
is a static reference table.

### 7.3 Calculation walkthrough

Real portfolio (≥30 properties) → for each property compute `score` → per scheme derive achievable label,
`estCost`, `roi`, `payback`, `recommend`. Portfolio tab aggregates certified vs total GFA/GAV, computes
the green rent premium from certified/uncertified rent means, and builds a target-progress view:
`currentPct = certGFA/totalGFA·100`, `gap = targetPct − currentPct`, `needed = gap/100 · totalGFA` (m²
to certify), with `prioritized` = uncertified assets sorted by EPC score.

### 7.4 Worked example

Property: `ei=120`, `ci=40`, `wi=1.5`, `wd=65`, `rn=20`, `gfa=20,000 m²`, `noi=$12M`.

| Term | Computation | Contribution |
|---|---|---|
| Energy | (200−120)·0.3 | 24.0 |
| Carbon | (100−40)·0.2 | 12.0 |
| Water | (100−1.5·20)·0.1 | 7.0 |
| Waste | 65·0.2 | 13.0 |
| Renewables | 20·0.2 | 4.0 |
| **score** | Σ | **60.0** |

For **LEED** (4 levels, band = 25): `idx = ⌊60/25⌋ = 2` → **Gold**. With LEED Gold `costBase=$15/m²`,
`premium=8.2%`: `estCost = 15·20000/1e6 = $0.30M`; `roi = (0.082·12)/0.30 = 3.28` (>2.5 → **'best'**);
`payback = 0.30/(0.082·12) = 0.30/0.984 = 0.30 yr`. (Note the payback here is unrealistically short
because `estCost` scales with GFA in $M while the benefit uses NOI directly — see §7.5.)

### 7.5 Data provenance & limitations

- **No seeded PRNG** — the portfolio is user-supplied via `localStorage`; if absent the page shows an
  empty/onboarding state. Metric defaults (`ei||150`, `ci||50`…) fill missing fields.
- The composite `score`, its weights, and the uniform label-cut are **ad-hoc heuristics** with no
  standards basis — a real certification prediction must model each scheme's own credit structure.
- ROI/payback conflate a per-m² retrofit cost with portfolio NOI, producing implausibly fast paybacks
  (§7.4); no discounting.
- The same `score` drives all 15 schemes identically, ignoring that BREEAM, LEED, WELL, NABERS weight
  categories very differently.

**Framework alignment:** BREEAM / LEED v4.1 / WELL / NABERS (label ladders enumerated in `CERT_SCHEMES`);
EU Taxonomy real-estate TSC and SFDR PAI 18 (energy-inefficient real estate) are the intended reporting
targets referenced in `REGIONAL_REQUIREMENTS`. Each real scheme derives its rating from a *weighted
credit tally* (e.g. BREEAM scores nine categories with regional weightings to a % that maps to
Pass→Outstanding; LEED sums points across Energy/Water/Materials to Certified→Platinum) — the module
collapses all of this into one linear cut, which §8 replaces.

## 8 · Model Specification — Building Certification-Readiness & EPG Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Predict, per asset, (a) the certification tier each scheme would award and (b) the Energy Performance Gap
vs the relevant benchmark, to prioritise retrofit capex and evidence EU Taxonomy / SFDR PAI-18 alignment.
Coverage: standing commercial/residential real-estate portfolios.

### 8.2 Conceptual approach
Two coupled models. (1) **EPG** exactly as the guide states — a normalised deviation of measured energy
use intensity from a climate- and use-adjusted benchmark, following CRREM and ENERGY STAR Portfolio
Manager's weather-normalised EUI methodology. (2) **Per-scheme credit predictor** — replicate each
scheme's own weighted category tally rather than a shared composite, mirroring how BRE (BREEAM) and USGBC
(LEED) actually score, so predicted tiers are scheme-consistent.

### 8.3 Mathematical specification
```
Weather-normalise: EUI_norm = EUI_actual · (HDD_ref + CDD_ref)/(HDD_site + CDD_site)
EPG = (EUI_norm − EUI_benchmark) / EUI_benchmark · 100                 (guide's headline)
Flag: EPG > +20 → retrofit-priority ; EPG < −15 → top-quartile candidate
Per scheme s with categories c, credits earned e_c of max m_c, weights w_{s,c}:
   Score_s = Σ_c w_{s,c} · (e_c / m_c) · 100     (Σ_c w_{s,c} = 1)
   Tier_s  = ladder_s( Score_s )                 (scheme's published % thresholds)
Taxonomy flag: EUI_norm ≤ top-15%-of-stock threshold  AND  EPC ∈ {A,B}
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `EUI_benchmark` | use/geography benchmark | CBECS/ENERGY STAR, national EPC medians |
| `HDD/CDD` | degree-days | NOAA / national met services |
| `w_{s,c}` | category weights per scheme | BREEAM/LEED/NABERS technical manuals |
| ladder thresholds | %→tier cuts | scheme certification standards |
| top-15% threshold | Taxonomy DNSH | EU Taxonomy real-estate delegated act |

### 8.4 Data requirements
Per asset: metered energy by fuel, floor area, use type, location (for degree-days), EPC rating, credit
evidence per scheme category, NOI, rent. Sources: utility/BMS meters, EPC registries (free in EU), CBECS
(free, US), scheme registries (BRE/USGBC). The platform already ingests the asset register via
`localStorage` and holds the cost/premium reference table.

### 8.5 Validation & benchmarking plan
Backtest predicted tiers against actually-awarded certificates in the portfolio; reconcile EPG-flagged
assets against CRREM stranding years; sensitivity of predicted tier to ±1 credit; cross-check
weather-normalised EUI against ENERGY STAR Portfolio Manager output on shared assets.

### 8.6 Limitations & model risk
Credit-evidence data is often incomplete → predictor degrades to EPC/EUI-only proxy, flagged low
confidence. Scheme manuals change between versions (LEED v4 vs v4.1) — version the weight tables.
Benchmarks are stock-relative and drift as stock decarbonises; refresh annually. Conservative fallback:
report a predicted *tier range* when category coverage < 70%.
