## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states the calculation engine is
> `Revenue from Socially Aligned Activities ÷ Total Revenue × 100`. **No revenue-based alignment calculation
> exists in the code.** The `alignedPct`/`eligiblePct` figures shown per social objective (e.g. "Affordable
> Housing: 38% aligned") are **hand-set constants** baked into the `SOCIAL_OBJECTIVES` seed array, not
> computed from any company revenue split. Per-activity `alignmentScore`, `dnsScore` (DNSH), and `msscScore`
> (Minimum Social Safeguards) are independently-seeded random numbers, not outputs of the "Three-Test
> Alignment Framework" the page itself describes in the Alignment Scoring tab. The sections below document
> what the code actually renders.

### 7.1 What the module computes

The page is built around two hand-authored reference tables — `SOCIAL_OBJECTIVES` (8 EU Social Taxonomy
categories: affordable housing, healthcare, education, employment, financial inclusion, digital access,
gender equality, food security, each tagged to one UN SDG and a fixed `budget`/`alignedPct`/`eligiblePct`)
and `ACTIVITIES` (20 named real-world-style activities, e.g. "Social housing construction", each mapped to
one objective, a region, and a **hand-picked eligibility label** from a fixed 20-element array cycling
`Eligible`/`Not Eligible`/`Review Required`). A separate `BONDS` array lists 12 real European supranational
/agency issuers (EIB, European Commission, AFD, KfW, EBRD, IFC…) with synthetic volume and a deterministic
`taxonomyAligned = (i % 3 !== 0)` flag (two-thirds of bonds "aligned", by index position, not by any
assessed criterion).

### 7.2 Parameterisation

| Field | Rule | Provenance |
|---|---|---|
| `SOCIAL_OBJECTIVES.alignedPct` / `.eligiblePct` | fixed per-objective constant (33–78%) | **hand-authored, not calculated** |
| `ACTIVITIES.eligibility` | fixed 20-element cyclic array | **hand-authored**, not derived from `alignmentScore`/`dnsScore`/`msscScore` |
| `alignmentScore` | `sr(i*7)×40+45` → 45–85 | synthetic |
| `dnsScore` (DNSH) | `sr(i*11)×30+60` → 60–90 | synthetic |
| `msscScore` (Min. Social Safeguards) | `sr(i*17)×35+55` → 55–90 | synthetic |
| `capexMn` | `sr(i*23)×200+20` → $20–220M | synthetic |
| `BONDS.taxonomyAligned` | `index % 3 !== 0` | deterministic pattern, not assessed |
| `PROGRESS` (2020–2025 time series) | linear trend (+8pp/yr eligible, +6pp/yr aligned) + `sr()` noise | hand-authored trajectory, not fit to real disclosure data |

### 7.3 Calculation walkthrough

- **Overview KPIs**: `Avg Eligible %`/`Avg Aligned %` are plain means of the 8 fixed `SOCIAL_OBJECTIVES`
  constants — an average of hard-coded numbers, not a computed portfolio statistic.
- **Activity Screener**: filters `ACTIVITIES` by objective/region; eligibility counts are tallies of the
  fixed `eligibility` label array. `alignmentScore`/`dnsScore`/`msscScore` are displayed per row but are
  **not used to derive the `eligibility` label** — the two are independent data sources on the same row.
- **DNSH & MSSC scatter** (Eligibility tab): plots `dnsScore` vs `msscScore` per activity — a visual, not a
  pass/fail gate; no threshold logic converts these scores into the eligibility flag.
- **Social bonds tab**: counts `taxonomyAligned` bonds and sums `volume`; no per-bond alignment assessment.

### 7.4 Worked example

For "Social housing construction" (activity index 0, objective `affordable-housing`):

| Field | Formula | Result |
|---|---|---|
| `alignmentScore` | `sr(0×7)×40+45 = sr(0)×40+45` | ≈ **45 + 40×sr(0)** |
| `dnsScore` | `sr(0×11)×30+60` | ≈ **60 + 30×sr(0)** |
| `msscScore` | `sr(0×17)×35+55` | ≈ **55 + 35×sr(0)** |
| `capexMn` | `sr(0×23)×200+20` | ≈ **$20 + 200×sr(0)M** |
| `eligibility` (hand-picked, index 0) | fixed array position | **"Eligible"** |

Because `sr(0)` is the same seed input (`Math.sin(1)*10000` fractional part) across all four scaled
formulas, the four scores are not independent random draws in a statistical sense — they are perfectly
correlated transformations of one underlying `sr()` call at index 0, a subtlety not visible in the UI.

### 7.5 Three-Test Alignment Framework (descriptive only)

The Alignment Scoring tab documents the real EU Platform on Sustainable Finance's proposed **three-test
structure** for social taxonomy alignment — this is accurately named but not wired to any pass/fail logic:

| Test | Definition (as displayed) |
|---|---|
| Substantial Contribution (SC) | Activity makes a measurable positive contribution to ≥1 social objective |
| Do No Significant Harm (DNSH) | Activity does not significantly harm any other social/environmental objective |
| Minimum Social Safeguards (MSSC) | Baseline UNGP/ILO/anti-corruption/tax-transparency protections |

### 7.6 Data provenance & limitations

- **All eligibility labels, alignment percentages, and scores are synthetic or hand-authored constants** —
  none derive from actual company revenue, capex, or opex splits (which is what EU Taxonomy alignment
  legally requires). The `sr(seed) = frac(sin(seed+1)×10⁴)` PRNG generates the numeric scores; the
  categorical eligibility array is manually written.
- The three-test framework is **displayed as an explainer, not implemented as a scoring pipeline** — there
  is no code path that takes an activity's SC/DNSH/MSSC scores and derives its eligibility status.
- Bond `taxonomyAligned` uses an arbitrary index-modulo rule, not the issuer's actual use-of-proceeds
  framework.
- No revenue, capex, or opex KPI (the EU Taxonomy Article 8 disclosure basis) exists anywhere in the module.

### 7.7 Framework alignment

- **EU Platform on Sustainable Finance Social Taxonomy Report (2022)** — the module's objective set (8
  categories) and three-test structure are faithful to the report's proposed architecture; no technical
  screening criteria (TSC) thresholds are implemented.
- **ILO Living Wage Methodology / EU Adequate Minimum Wages Directive 2022/2041** — referenced in the guide;
  not used in any calculation (no wage data field exists in the seed).
- **UNGP Reporting Framework** — the MSSC test description cites UNGP/ILO/anti-corruption baseline; again
  descriptive only.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support portfolio-level EU Social Taxonomy alignment disclosure (analogous to Article 8 Taxonomy Regulation
KPIs, once social technical screening criteria are finalised) for asset managers reporting under SFDR and
CSRD/ESRS S1–S4. Scope: corporate revenue/capex/opex splits mapped to the 8 social objectives.

### 8.2 Conceptual approach

Mirror the **environmental EU Taxonomy alignment pipeline already in production practice** (as implemented
by MSCI, ISS, Clarity AI Taxonomy modules): (1) NACE/ISIC activity-code mapping to eligible activities, (2)
per-activity technical screening criteria (TSC) pass/fail against disclosed KPIs, (3) DNSH cross-check
against the other objectives, (4) MSSC gate via a binary UNGP/ILO compliance flag, (5) revenue-weighted
roll-up to a portfolio alignment %. This is the same architecture Clarity AI and ISS ESG already run for
environmental Taxonomy; the social pillar swaps in the EU Platform's proposed social TSCs once finalised.

### 8.3 Mathematical specification

```
EligibleRevenue_c   = Σ_a Revenue_{c,a}                for activities a in the EU Social Activity List
AlignedRevenue_c    = Σ_a Revenue_{c,a} × 1{SC_pass_a ∧ DNSH_pass_a ∧ MSSC_pass_c}
CompanyAlignment_c  = AlignedRevenue_c / TotalRevenue_c
PortfolioAlignment  = Σ_c Weight_c × CompanyAlignment_c
```
`SC_pass_a` = activity KPI (e.g. % of housing units at below-market rent) ≥ published TSC threshold;
`DNSH_pass_a` = no breach flagged on any of the other 3 EU Taxonomy environmental objectives + remaining
social objectives; `MSSC_pass_c` = company-level binary (UNGP due-diligence process in place, no severe
controversy flag, ILO core convention non-breach).

| Parameter | Calibration source |
|---|---|
| EU Social Activity List / TSCs | EU Platform on Sustainable Finance Social Taxonomy Report (final, once adopted) |
| MSSC controversy flag | Refinitiv/Sustainalytics controversy severity feed, or platform's existing controversy engine |
| Activity → NACE mapping | EU Taxonomy Compass (already a platform reference-data source per MEMORY.md GAP wiring) |

### 8.4 Data requirements

Company-level revenue/capex/opex by NACE activity code (financial statement segmentation — often the
hardest input to source; proxy via revenue-segment disclosure or third-party activity-mapping vendors),
UNGP/ILO compliance flags (Sustainalytics/RepRisk controversy feeds), portfolio holdings/weights (already in
platform contexts). The EU Taxonomy Compass reference table already wired into the platform (per
`docs/module_atlas` reference-data layer notes) covers the *environmental* activity list and could be
extended with the social activity list once the Commission adopts final TSCs.

### 8.5 Validation & benchmarking plan

Reconcile `CompanyAlignment_c` for large-cap EU issuers against their own CSRD/Taxonomy disclosures once
mandatory social-pillar reporting begins (phase-in expected post-2026). Cross-check against ISS ESG/Clarity
AI vendor Taxonomy-alignment figures where the environmental pillar overlaps (data-pipeline validation even
before the social TSCs are final).

### 8.6 Limitations & model risk

The EU social taxonomy TSCs are **not yet finalised in EU law** — any implementation must clearly flag
alignment figures as based on the Platform's *draft* 2022 proposal, subject to change. Revenue-segment data
at the activity-code granularity required is frequently unavailable for non-EU issuers; the model should
degrade to an "eligible but alignment unknown" state rather than defaulting to 0% or 100%.
