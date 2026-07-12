## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *credit-quality scoring engine*:
> `QualityScore = f(Additionality, Permanence, MRV_Rigor, CobenefitCount)` on a 0–100 scale, a
> portfolio-weighted quality score, an **ICVCM CCP pass-rate** (score ≥ 60 screen), and a methodology
> HHI diversification metric. **None of the scoring logic exists in the code.** The page is a
> portfolio-orchestration *dashboard* over 40 synthetic projects — credit-volume rollups by family,
> region, and registry, a methodology library (20 real methodology codes), a synthetic market
> overview, and a crude "Quick Calculator" (`area × familyYield × price`). No quality score, no CCP
> screen, no HHI are computed. Sections below document the code; §8 specifies the missing quality model.

### 7.1 What the module computes

Everything reduces to aggregations over the seeded `PROJECTS` array (40 projects):

```js
totals.issued     = Σ creditsIssued        // + retired, available, pipeline count
familyChart[f]    = Σ credits by family (issued/retired/available)
geoChart[r]       = Σ credits by region
marketOverview[r] = { projects, volume, avgPrice: sr(i·53)×25 + 5 }   // synthetic price
// Quick Calculator (Tab 6)
annualCredits = round(area × familyYield[family] × mul)
totalCredits  = annualCredits × period
avgPrice      = sr(methIndex×43)×30 + 5                                // synthetic $/t
totalValue    = round(totalCredits × avgPrice)
```

`familyYield` is a hard-coded per-family credit yield (tCO₂e/ha/yr): Nature-Based 8.5, Ag & Soil 3.2,
Energy 12.1, Waste 6.8, Industrial 15.4, CDR 2.1, Cookstoves 4.5.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `METHODOLOGIES` | 20 real codes (VM0047, VM0009, ACM0002, Puro-Biochar, Iso-DAC…) with family/cluster/registry/complexity | Real registry methodology identifiers; complexity is a hand label |
| `familyYield` | 8.5 / 3.2 / 12.1 / 6.8 / 15.4 / 2.1 / 4.5 tCO₂e per unit | Hard-coded heuristic yields |
| `creditsIssued/Retired/Available` | `sr(i·k)×range + base` | Synthetic PRNG |
| `pricePerCredit` | `sr(i·37)×45 + 3` ($3–48) | Synthetic; spans real VCM range |
| `avgPrice` (calculator/market) | `sr(idx)×25–30 + 5` | Synthetic |
| Registries / regions / families | Verra, GS, ACR, CAR, Puro, Isometric / 8 regions / 7 families | Real taxonomy |

### 7.3 Calculation walkthrough

1. **Executive Dashboard** — total issued/retired/available across projects; family and geography
   bar charts; recent-activity feed (first 8 projects).
2. **Project Pipeline / Family Navigator** — filter and group the 40 synthetic projects.
3. **Methodology Library** — searchable table of the 20 methodology records.
4. **Credit Market Overview** — per-registry project count, volume, and *synthetic* average price.
5. **Quick Calculator** — `area × familyYield × period × synthetic price` → indicative credits and $.
6. Reads the shared `CarbonCreditContext` summary (`getSummary()`) to surface live calculations
   pushed by sibling `cc-*` modules.

### 7.4 Worked example — Quick Calculator

Nature-Based family (familyYield 8.5), area 500 ha, period 10 yr, `mul` = 1, synthetic avgPrice
say $18/t:

| Step | Computation | Result |
|---|---|---|
| Annual credits | 500 × 8.5 × 1 | 4,250 tCO₂e/yr |
| Total credits | 4,250 × 10 | 42,500 tCO₂e |
| Total value | 42,500 × 18 | **$765,000** |

The price is a PRNG draw, so the dollar figure is illustrative, not a valuation.

### 7.5 Data provenance & limitations

- **Entirely synthetic portfolio.** All project volumes, prices, and the market overview use the PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`. Only the methodology taxonomy is real.
- **No quality model.** Despite the guide, there is no additionality/permanence/MRV/co-benefit scoring,
  no ICVCM CCP threshold, and no HHI diversification calculation.
- `familyYield` is a single scalar per family — real yields vary by geography, species, baseline, and
  methodology by an order of magnitude.
- The Quick Calculator ignores baseline, leakage, buffer, and permanence — the very deductions the
  sibling `cc-arr-reforestation`, `cc-dac`, etc. calculators implement.

**Framework alignment (as coded):** references Verra/Gold Standard/ACR/CAR/Puro/Isometric registries
and 20 real methodology codes, but performs no ICVCM/BeZero-style assessment. The guide's ICVCM Core
Carbon Principles screen and quality scoring are unimplemented (see §8).

## 8 · Model Specification — Carbon-Credit Quality Score & ICVCM CCP Screen

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Score every credit / methodology in the portfolio on integrity dimensions, produce a portfolio-weighted
quality score, an ICVCM-CCP pass-rate, and a methodology-concentration (HHI) metric — supporting
buy-side procurement and portfolio construction across all 21 methodology families.

### 8.2 Conceptual approach

A multi-criteria integrity model calibrated to the two dominant third-party rating frameworks —
**BeZero Carbon** (AAA–D letter scale from additionality, over-crediting, permanence, co-benefit,
policy risk) and **Sylvera** (carbon score + additionality + permanence + co-benefits) — with a
hard ICVCM Core Carbon Principles gate. This mirrors how MSCI and S&P Trucost aggregate ESG/carbon
sub-scores into a composite with a minimum-threshold overlay.

### 8.3 Mathematical specification

```
QualityScore_m = 100 × Σ_d w_d · rating_{m,d}          d ∈ {Additionality, Permanence, MRV, Co-benefit}
                 w = (0.30, 0.25, 0.25, 0.20)            rating_{m,d} ∈ [0,1]
CCP_pass_m     = 1 if QualityScore_m ≥ 60 AND all CCP-essential criteria met, else 0
PortfolioScore = Σ_m (vol_m / Σvol) · QualityScore_m
CCP_pass_rate  = Σ_m vol_m·CCP_pass_m / Σ_m vol_m
HHI            = Σ_m (vol_m / Σvol)²                     // 1/N (diversified) → 1 (concentrated)
```

| Parameter | Calibration source |
|---|---|
| Dimension weights `w_d` | ICVCM CCP category emphasis; BeZero/Sylvera factor loadings |
| `rating_{m,d}` | Methodology-level assessment: ICVCM CCP category-level approvals, BeZero/Sylvera public ratings, Verra/GS methodology audits |
| CCP gate criteria | ICVCM Core Carbon Principles Assessment Framework (10 CCPs, program + methodology-category level) |
| Buffer/reversal inputs | Registry non-permanence risk tools (Verra AFOLU, CAR) |

ICVCM derives CCP eligibility by assessing each *carbon-crediting program* and *methodology category*
against 10 Core Carbon Principles across three pillars (Governance, Emissions Impact, Sustainable
Development); a category earns the CCP label only if it clears every essential criterion — hence the
AND-gate above, not a pure score threshold.

### 8.4 Data requirements

Per methodology: ICVCM CCP assessment status (public), BeZero/Sylvera rating (vendor), registry
buffer rate, MRV frequency, verified co-benefit certifications. Per credit: methodology, vintage,
volume, registry serial. Platform already holds the methodology taxonomy and credit volumes; ratings
must be sourced from ICVCM/BeZero/Sylvera.

### 8.5 Validation & benchmarking plan

Reconcile `QualityScore` ordering against BeZero letter grades (rank correlation ≥ 0.7 target);
verify CCP pass-rate against ICVCM's published approved-category list; sensitivity of PortfolioScore
to each weight; HHI sanity vs an equal-weight benchmark.

### 8.6 Limitations & model risk

Third-party ratings disagree materially (BeZero vs Sylvera divergence is well documented) — treat the
composite as ordinal and disclose vendor source. ICVCM CCP coverage is incomplete across methodologies;
un-assessed categories must be flagged "not rated", never defaulted to pass. Synthetic-price valuation
must be replaced with observed CBL/registry transaction prices before any procurement use.
