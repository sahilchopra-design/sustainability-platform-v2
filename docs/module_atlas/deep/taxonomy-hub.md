## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `TAS = Eligible Revenue/Total Revenue ×
> Aligned Revenue/Eligible Revenue` — a genuine two-step multiplicative calculation. **The headline
> KPIs are hard-coded literals, not computed from this formula or from any portfolio data**:
> `taxEligibility = 72.4`, `taxAlignment = 41.8`, `dnshCompliance = 89`, `sustainableInv = 38.6`, and
> 10 other headline figures are typed-in constants (lines 166–179). A **separate, genuinely computed**
> per-holding aggregate (`consistencyData`, §7.3) exists alongside these static KPIs but is not used
> to derive them — the two are presented on the same dashboard without reconciliation, so a user
> filtering/refreshing holdings will see the static headline KPIs stay frozen while the per-holding
> table changes underneath them.

### 7.1 What the module computes

This is primarily a **navigation hub** for 5 live taxonomy sub-modules (EU Taxonomy, SFDR
Classification, ISSB Materiality, GRI Alignment, Framework Interop — each a `MODULES` card linking
to its own dedicated page), plus a dashboard layer showing: 8 framework compliance scores
(`FRAMEWORK_COVERAGE` — ISSB 74%, CSRD 62%, GRI 69%, TCFD 78%, SFDR 82%, EU Taxonomy 57%, TNFD 34%,
BRSR 88% — static), 13-country framework-adoption mapping (`COUNTRY_ADOPTION`), 8 real regulatory
deadlines (`DEADLINES`, e.g. CSRD ESRS first reporting 2026-04-30), an 8-item action-priority list,
and a 7-row data-gap summary.

### 7.2 Per-holding synthetic data

```js
holdingsData[i] = {
  eu_tax_eligible: sRand(seed(name)) > 0.3,          // ~70% eligible
  eu_tax_aligned:  sRand(seed(name)+1) > 0.55,        // ~45% aligned (of all, not conditional on eligible)
  sfdr_art:        sRand(+2) > 0.7 ? 'Art 9' : sRand(+2) > 0.35 ? 'Art 8' : 'Art 6',
  issb_ready:       round(40+sRand(+3)*55),
  dnsh_pass:        sRand(+6) > 0.2,                   // ~80% pass
  safeguards:       sRand(+7) > 0.15,                  // ~85% pass
}
```

Sourced from the platform's real `GLOBAL_COMPANY_MASTER` company list (first 80 rows) when available,
falling back to 40 synthetic placeholder companies otherwise; each holding's booleans/scores use a
name-derived string hash (`seed()`, a djb2-style hash) fed into the standard `sRand()` PRNG — a
stable-per-company but still synthetic pseudo-random assignment. Critically, `eu_tax_aligned` is
drawn **unconditionally** (>0.55 on its own seed), not as a subset of `eu_tax_eligible` — a real
alignment assessment can only apply to activities already deemed eligible, so this data model permits
a logically-impossible "aligned but not eligible" holding.

### 7.3 The genuine (but disconnected) aggregate

```js
consistencyData['EU Tax Aligned'].pct = round(count(eu_tax_aligned) / holdingsData.length × 100)
consistencyData['SFDR Art 9'].pct     = round(count(sfdr_art==='Art 9') / holdingsData.length × 100)
consistencyData['ISSB Ready (75%+)'].pct = round(count(issb_ready>=75) / holdingsData.length × 100)
```

This **is** a real portfolio-level aggregation from the per-holding synthetic data — correct
arithmetic, no division-by-zero guard needed since `holdingsData` is always non-empty. But its output
(e.g. "EU Tax Aligned: X%") is never reconciled against, or used to update, the static headline KPI
`taxAlignment=41.8%` shown elsewhere on the same page — the two figures can and likely will disagree.

### 7.4 The "flow" funnel (also static)

```js
flowSteps = [
  {step:1, label:'EU Taxonomy Eligibility', value: taxEligibility=72.4},
  {step:2, label:'DNSH + Safeguards',        value: dnshCompliance=89},
  {step:3, label:'EU Taxonomy Alignment',    value: taxAlignment=41.8},
  {step:4, label:'SFDR Sustainable Investment', value: sustainableInv=38.6},
  {step:5, label:'ISSB Material Assessment', value: issbCompliance=74},
]
```

Displayed as a sequential funnel implying each step derives from the previous (eligibility → DNSH →
alignment → SFDR → ISSB), which visually communicates the guide's intended eligibility×alignment
chain — but every value is an independent static literal. Note the numbers are not even internally
consistent with a funnel interpretation: alignment (41.8%) is *lower* than DNSH+safeguards compliance
(89%) as expected (alignment requires passing DNSH), but SFDR sustainable investment (38.6%) sits
*below* taxonomy alignment (41.8%) despite SFDR sustainable-investment criteria typically drawing on,
not narrowing, taxonomy alignment — plausible in reality (different denominators/scopes) but not
demonstrable from static numbers alone.

### 7.5 Worked example

For a holding with `name='Reliance Industries'`: `s = seed('Reliance Industries')` (djb2 hash, a
large positive integer). `eu_tax_eligible = sRand(s) > 0.3`. Since `sRand` outputs a uniform-ish [0,1)
value, this resolves true ~70% of the time across the portfolio. Independently, `eu_tax_aligned =
sRand(s+1) > 0.55` resolves true ~45% of the time. Because these are independent draws, roughly
`0.70×0.45 ≈ 31.5%` of holdings would show *both* `eligible=true` and `aligned=true` by chance alone
(the intersection you'd expect if a real alignment assessment correctly required eligibility first),
but because `aligned` isn't actually conditioned on `eligible` in the generator, an additional
`~0.30×0.45=13.5%` of holdings will show `aligned=true` while `eligible=false` — a logical
impossibility under the real EU Taxonomy framework, where alignment is only assessable for eligible
activities.

### 7.6 Data provenance & limitations

- **All per-holding taxonomy flags are synthetic**, name-hash-seeded; only the underlying company
  identity (name/ticker/sector/country) is drawn from the real `GLOBAL_COMPANY_MASTER` dataset.
- **All 14 headline KPIs and the 5-step funnel are hard-coded literals**, disconnected from the
  per-holding data and from each other — see §8 for what the guide's TAS formula requires.
- `eu_tax_aligned` is generated independently of `eu_tax_eligible`, permitting logically-impossible
  aligned-but-ineligible holdings in the synthetic dataset.
- Framework compliance scores (`FRAMEWORK_COVERAGE`) and country-adoption mapping are static
  reference content, not computed from any portfolio.

**Framework alignment:** the 5 linked sub-modules (EU Taxonomy, SFDR, ISSB, GRI, Framework Interop)
correctly represent the real regulatory landscape and the regulatory deadline table (CSRD, SFDR PAI,
ISSB S2 mandatory dates for AU/SG/HK) is accurate as of the data's vintage. The DNSH and minimum
social safeguards concepts are correctly named per EU Taxonomy Regulation (EU) 2020/852, but their
implementation here is a per-holding boolean coin-flip rather than an actual criteria assessment.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the guide's actual Taxonomy Alignment Score (TAS) as a portfolio roll-up, computed from
genuine activity-level eligibility and alignment assessments per holding, for CSRD Article 8 and
SFDR disclosure purposes.

### 8.2 Conceptual approach

Implement the **EU Taxonomy's own two-step test** exactly as specified in Regulation 2020/852: first
determine revenue/CapEx/OpEx **eligibility** (does the activity appear in the Taxonomy's covered NACE
activity list), then determine **alignment** among eligible activities only (does it meet Technical
Screening Criteria substantial-contribution thresholds AND pass DNSH AND meet minimum safeguards).
This mirrors the calculation architecture used by MSCI's EU Taxonomy Alignment tool and Refinitiv's
Taxonomy solution — eligibility as a strict superset of alignment, never the reverse.

### 8.3 Mathematical specification

```
EligibleRevenue(company) = Σ_{activities a ∈ NACE-covered list} Revenue(a)
EligibilityRatio = EligibleRevenue / TotalRevenue                              ∈[0,1]

AlignedRevenue(company) = Σ_{a ∈ eligible activities} Revenue(a) ×
                            𝟙[SubstantialContribution(a) ≥ TSC_threshold(a)]
                            × 𝟙[DNSH_pass(a, all 6 objectives)]
                            × 𝟙[MinimumSafeguards_pass(company)]
AlignmentRatio = AlignedRevenue / EligibleRevenue                              ∈[0,1]   (undefined if EligibleRevenue=0; default 0)

TAS(company) = EligibilityRatio × AlignmentRatio  =  AlignedRevenue / TotalRevenue

PortfolioTAS = Σ_holdings (TAS(h) × weight_h) / Σ_holdings weight_h            (AUM-weighted roll-up)
```

| Parameter | Value | Calibration source |
|---|---|---|
| NACE-covered activity list | ~100 activities across 6 objectives | EU Taxonomy Delegated Acts 2021/2139, 2021/2178 |
| TSC thresholds | Activity-specific (e.g. building energy performance, power-sector gCO₂/kWh) | EU Taxonomy Climate Delegated Act Annexes I/II |
| DNSH criteria | 6 environmental objectives, activity-specific | Same Delegated Acts |
| Minimum safeguards | OECD MNE Guidelines + UN Guiding Principles compliance | EU Taxonomy Regulation Art. 18 |
| AUM weighting | Holdings weight | Standard portfolio-metric convention |

### 8.4 Data requirements

- Activity-level revenue/CapEx/OpEx breakdown per holding (currently only company-level identity
  exists; needs company disclosure or third-party activity-mapping data — e.g. ISS-ESG, MSCI, or
  self-disclosed EU Taxonomy KPI tables, already mandatory for large EU issuers under CSRD Art. 8).
- TSC pass/fail per activity per company (from disclosed Taxonomy reports or a vendor feed).
- DNSH assessment outcome per objective per activity.
- Minimum safeguards compliance status (company-level, from controversy/screening data).

### 8.5 Validation & benchmarking plan

Reconcile computed `TAS` against companies' own disclosed EU Taxonomy KPIs (mandatory in CSRD filings
from FY2024) for a validation sample; cross-check `EligibilityRatio` against MSCI/Refinitiv's
published Taxonomy eligibility figures for large-cap EU issuers; sensitivity-test portfolio TAS to
different AUM-weighting conventions (market-value vs. committed-capital weighting for funds).

### 8.6 Limitations & model risk

Activity-level data is frequently unavailable or self-reported without third-party assurance —
production use should track a data-quality/confidence flag per holding (similar to PCAF's DQ score
convention) rather than presenting TAS with false precision when built on estimated or missing
activity data. `AlignmentRatio` is undefined when `EligibleRevenue=0` (a company with no eligible
activities) — define this explicitly as 0, not NaN, to avoid corrupting the AUM-weighted roll-up.
