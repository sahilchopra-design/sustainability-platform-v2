# Loss & Damage Finance Analytics
**Module ID:** `loss-and-damage-finance` · **Route:** `/loss-and-damage-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DH5 · **Sprint:** DH

## 1 · Overview
Quantifies climate loss and damage (L&D) — economic costs from climate change that cannot be adapted to — across developing countries. Analyses the Santiago Network, UNFCCC L&D Fund modalities, parametric insurance solutions, and national L&D financing strategies.

> **Business value:** Critical for climate-vulnerable developing country finance ministries, humanitarian finance organisations, and impact investors in climate resilience. Provides quantitative foundation for UNFCCC L&D Fund applications and parametric insurance product design aligned with ARC/CCRIF frameworks.

**How an analyst works this module:**
- Select country and hazard type for L&D estimation
- Calculate economic and non-economic loss components
- Model parametric insurance trigger and payout structure
- Analyse L&D Fund eligibility and application modalities
- Generate UNFCCC-format L&D national finance needs assessment

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `REGIONS`, `TABS`, `V20_NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia & Pacific', 'Small Island States', 'Latin America', 'MENA'];` |
| `hdi` | `+(0.3 + sr(i * 7) * 0.5).toFixed(3);` |
| `totalEconomicLoss` | `filtered.reduce((a, c) => a + c.lossesEconomic, 0);` |
| `avgGdpLoss` | `filtered.length ? filtered.reduce((a, c) => a + c.gdpLossClimate, 0) / filtered.length : 0;` |
| `ldEligiblePct` | `filtered.length ? (filtered.filter(c => c.ldFundEligible).length / filtered.length * 100).toFixed(1) : '0.0';` |
| `totalDisplaced` | `filtered.reduce((a, c) => a + c.displacedPersons, 0);` |
| `top15Losses` | `[...filtered].sort((a, b) => b.lossesEconomic - a.lossesEconomic).slice(0, 15).map(c => ({` |
| `hdiScatter` | `filtered.map(c => ({ x: c.humanDevelopmentIndex, y: c.lossesEconomic * tempMultiplier, name: c.name }));` |
| `adaptGapByRegion` | `REGIONS.map(r => ({` |
| `insuranceGap` | `[...filtered].sort((a, b) => a.insuranceCoverage - b.insuranceCoverage).slice(0, 15).map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `TABS`, `V20_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual L&D Costs 2020s | — | V20 Economy Loss Monitor 2023 | Annual climate loss and damage in V20 vulnerable countries — 5× higher than in 2000 |
| L&D Fund Pledge | — | UNFCCC COP28 L&D Fund 2023 | Initial pledges to UNFCCC L&D Fund at COP28 Dubai — far below estimated needs |
| Parametric Insurance Coverage | — | ARC/CCRIF/Pacific Cat Fund 2023 | Total parametric climate risk insurance in developing countries — covering 30+ countries |
- **EM-DAT disaster loss database + GDP data** → L&D economic estimation → **Attributed climate L&D by country, hazard, and year**
- **Climate index data (rainfall, wind speed, temperature)** → Parametric trigger calibration → **Trigger-payout relationship for parametric insurance product design**
- **UNFCCC L&D Fund modalities documents** → Eligibility and access mapping → **Country-level access pathway to L&D Fund resources**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Loss & Damage Estimation
**Headline formula:** `L&D_Economic = DirectLoss + IndirectLoss + NonEconomicLoss; DirectLoss = AssetDamage + BusinessInterruption; ParametricPayout = max(0, (TriggerIndex - Threshold) × PayoutRate × SumInsured)`

L&D distinct from adaptation costs — represents residual climate harm; parametric insurance uses index triggers to accelerate payouts and reduce basis risk versus indemnity products

**Standards:** ['IPCC AR6 WGII Chapter 16 — Key Risks Across Sectors', 'UNFCCC Santiago Network (2019)', 'COP27 Sharm el-Sheikh L&D Fund (2022)', 'ARC African Risk Capacity Parametric Framework']
**Reference documents:** IPCC AR6 WGII Chapter 16 — Key Risks Across Sectors and Regions; UNFCCC Santiago Network Operationalisation 2023; COP27 Decision — Funding Arrangements Responding to Loss and Damage; ARC African Risk Capacity — Parametric Insurance Framework 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formulas —
> `L&D_Economic = DirectLoss + IndirectLoss + NonEconomicLoss`,
> `DirectLoss = AssetDamage + BusinessInterruption`, and
> `ParametricPayout = max(0, (TriggerIndex − Threshold) × PayoutRate × SumInsured)` — are **not
> computed anywhere in the code**. There is no direct/indirect loss decomposition and no parametric
> insurance trigger-payout model. What the code actually implements is a static 55-country V20/LDC
> panel with `sr()`-seeded loss figures and a single real interactive feature: a temperature-scenario
> multiplier applied uniformly to economic losses. Sections below document the code as it actually
> behaves.

### 7.1 What the module computes

55 named V20/LDC (Vulnerable Twenty / Least Developed Country) nations — Bangladesh, Pakistan,
Nepal, Ethiopia, Kenya, Haiti, Maldives, Vanuatu, and 47 more real, correctly-classified vulnerable
countries — each with 10 synthetic loss/exposure metrics generated once via `sr(i×k)`:

```js
lossesEconomic        = 0.1  + sr(i*11)*9.9     // $0.1-10Bn/yr
lossesNonEconomic     = 1    + sr(i*13)*9        // 1-10 (index, unit unspecified)
climateAttributedLosses = 20 + sr(i*17)*75        // 20-95% attribution share
gcfAccess             = sr(i*19) > 0.4            // boolean GCF (Green Climate Fund) access flag
ldFundEligible        = sr(i*23) > 0.35           // boolean L&D Fund eligibility flag
adaptationDeficit     = 0.2  + sr(i*29)*7.8        // $0.2-8Bn
displacedPersons      = 0.01 + sr(i*31)*3.99       // 0.01-4M
extremeEventFrequency = 2    + sr(i*37)*28         // 2-30 events/yr
gdpLossClimate        = 0.5  + sr(i*41)*14.5        // 0.5-15% of GDP
insuranceCoverage     = 1    + sr(i*43)*49          // 1-50%
humanDevelopmentIndex = 0.3  + sr(i*7)*0.5           // 0.3-0.8 (shares seed sr(i*7) with region assignment)
```

### 7.2 The one real calculation: temperature-scenario multiplier

```js
tempMultiplier = tempScenario<=1.5 ? 1.0 : tempScenario<=2.0 ? 1.4 : tempScenario<=3.0 ? 2.1 : 3.2
```
A user-controlled slider (1.5°C–4°C in 0.5° steps) scales every displayed economic-loss figure by
this step function. This is the module's only genuinely interactive, deterministic (non-random)
calculation, applied consistently across the KPI card, Top-15-losses chart, and HDI-vs-losses
scatter.

### 7.3 Parameterisation

| Field | Provenance |
|---|---|
| 55 country names, region assignment (6 regions) | **Real** — V20 members and other LDCs correctly named and grouped |
| All 10 quantitative attributes per country | Synthetic demo values, `sr()`-seeded per country index |
| `tempMultiplier` step function (1.0/1.4/2.1/3.2 at 1.5/2.0/3.0/4.0°C) | Author-chosen scaling factors; directionally consistent with the physical expectation that loss severity accelerates super-linearly with warming, but not calibrated to a specific IPCC/NGFS damage function |
| `finMobilisation` slider ($10–400Bn) | Present in the UI but **not read by any of the code shown** in the loss/KPI calculations — appears to be a display-only or as-yet-unwired control |

### 7.4 Calculation walkthrough

- **KPIs**: `totalEconomicLoss × tempMultiplier` for the headline "$XBn/yr" figure;
  `avgGdpLoss = mean(gdpLossClimate)` (not temperature-scaled); `ldEligiblePct =
  count(ldFundEligible)/n×100`; `totalDisplaced = Σ displacedPersons` (also not temperature-scaled,
  an inconsistency — displacement risk under a hotter scenario is not modelled to increase even
  though economic loss is).
- **Top-15 Losses chart**: ranks filtered countries by `lossesEconomic`, applies `tempMultiplier` to
  each before charting.
- **HDI vs Losses scatter**: `x = humanDevelopmentIndex`, `y = lossesEconomic × tempMultiplier` — lets
  a user visually explore whether lower-HDI countries show higher climate losses; since both axes are
  independently `sr()`-seeded (HDI shares a seed with region assignment, not with losses), any visual
  pattern is coincidental rather than modelled.
- **Adaptation Deficit by Region**: `Σ adaptationDeficit` grouped by region — a straightforward sum,
  not temperature-scaled.
- **Insurance Gap chart**: `gap = 100 − insuranceCoverage` for the 15 least-covered countries — a
  correct, if trivial, complement calculation.

### 7.5 Worked example

Bangladesh (`i=0`): `lossesEconomic = 0.1 + sr(0)×9.9`. `sr(0) = frac(sin(1)×10000) = 0.7095` →
`lossesEconomic ≈ 0.1 + 0.7095×9.9 = 7.13` ($Bn/yr). At the default 1.5°C scenario
(`tempMultiplier=1.0`), the displayed figure is $7.13Bn; moving the slider to 3.0°C
(`tempMultiplier=2.1`) instantly re-displays it as $14.97Bn — a 2.1× jump with no underlying change
to the country's actual modelled vulnerability, since the multiplier is applied uniformly to all 55
countries regardless of their individual exposure profile.

### 7.6 Data provenance & limitations

- **All 55 countries' loss, displacement, adaptation-deficit, and insurance-coverage figures are
  synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)` — none reflect real EM-DAT disaster-loss
  data, GCF portfolio figures, or actual insurance-penetration statistics for these countries.
- The uniform `tempMultiplier` applied identically to all 55 countries ignores that climate damage
  functions are highly heterogeneous by geography (e.g. SIDS face disproportionate sea-level-rise
  exposure vs Sahel countries facing drought) — a single scalar cannot capture this.
- `finMobilisation` slider appears cosmetic/unwired in the reviewed code path.
- No parametric insurance trigger-payout model exists despite the guide's detailed formula and the
  "Insurance Gap" tab name — the tab only shows a static coverage-complement chart.

**Framework alignment:** UNFCCC L&D Fund (COP27/28), Santiago Network, and the V20 Group are real,
correctly-referenced institutions; the country panel correctly reflects V20/LDC membership. ARC and
CCRIF parametric insurance frameworks are named in the guide but have no corresponding trigger/payout
calculation in code. The IPCC AR6 WGII attribution-science framing is referenced by the
`climateAttributedLosses` field name but the field itself is a random draw, not an attribution-study
output.

## 9 · Future Evolution

### 9.1 Evolution A — Real loss data and the parametric payout model, via the sibling engine (analytics ladder: rung 1 → 2)

**What.** §7 documents a static 55-country V20/LDC panel with `sr()`-seeded loss metrics (economic losses, GDP-loss %, displacement, insurance coverage all draws; even the HDI is `0.3 + sr(i·7)·0.5`, sharing its seed with region assignment), boolean fund-eligibility coin flips, and exactly one real calculation — the temperature-multiplier step function (1.0/1.4/2.1/3.2×) applied uniformly to every country. The guide's formulas (loss decomposition, `ParametricPayout = max(0, (Index − Threshold) × Rate × SumInsured)`) don't exist here — but they *do* exist next door: the sibling `loss-damage` module's backend (`loss_damage_engine.py`) implements honest-null FRLD eligibility, parametric trigger design with calibrated basis risk, WIM access scoring and residual-gap analysis behind 10 live routes. Evolution A: this page stops fabricating and consumes that engine — country loss profiles from EM-DAT-derived data (the §4.1 lineage's own named source), eligibility from `calculate_frld_eligibility` (which correctly returns None without ND-GAIN inputs), and the parametric tab wired to `design_parametric_trigger`.

**How.** (1) Ingest ND-GAIN (public) and EM-DAT country loss aggregates into refdata — these feed the engine's `nd_gain_score`/`gdp_usd` inputs directly. (2) The temperature multiplier survives but becomes hazard-differentiated (the flat step function scaling all countries equally is the same flat-multiplier weakness as insurance-protection-gap's). (3) The V20 name list reconciles with the engine's `ref/v20-members` route — one member list platform-wide. (4) UNFCCC-format needs-assessment export assembled from computed, cited components.

**Prerequisites.** The `sr()` country generation deleted; ND-GAIN/EM-DAT ingestion; module-family coordination so this page and `loss-damage` don't diverge. **Acceptance:** eligibility flags come from engine calls with input provenance; a country without ND-GAIN data shows the engine's honest null; parametric payouts compute from trigger parameters, not draws.

### 9.2 Evolution B — L&D Fund application copilot for finance ministries (LLM tier 2)

**What.** The module's stated flagship user — climate-vulnerable finance ministries preparing UNFCCC L&D Fund applications — needs document assembly over evidence: "assess our FRLD eligibility and draft the needs-assessment narrative", "design a drought parametric for our agriculture exposure — trigger, payout speed, basis risk", "how does our insurance penetration compare to the residual gap the fund should cover?" Every quantitative element executes against the sibling engine's routes (`frld-eligibility`, `parametric-design`, `ld-gap-analysis`), whose honest-null design gives the copilot its script for missing data.

**How.** Tier 2: tool schemas over the loss-damage route family plus the five reference GETs (V20 members, FRLD criteria, Global Shield, parametric triggers, loss-event types) for citable grounding. Application drafting maps computed outputs to UNFCCC modality requirements with data gaps enumerated as capacity-building needs — for LDC users, stating what data they lack is itself application content (Santiago Network support exists precisely for that). Basis-risk explanations quote the engine's calibrated index reference data; attribution claims stay within what the loss data supports (attribution science is contested terrain — the copilot cites WWA-style sources rather than asserting causality). Non-economic loss handling follows the engine's 0–1 reported-score convention: narrated only when reported.

**Prerequisites (hard).** Evolution A's engine wiring and real country data (a fund application over seeded losses would be a fabricated sovereign submission — the highest-stakes failure in this batch); Phase 2 tooling. **Acceptance:** every application figure traces to an engine call with inputs shown; missing-data sections framed as needs, never filled; member/criteria facts match the reference routes.