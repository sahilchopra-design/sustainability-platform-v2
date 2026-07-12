# Taxonomy Hub
**Module ID:** `taxonomy-hub` · **Route:** `/taxonomy-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-jurisdictional taxonomy comparison and alignment tool covering EU Taxonomy, UK Green Taxonomy, ASEAN Taxonomy, China Green Bond Catalogue and other emerging frameworks.

> **Business value:** EU Taxonomy alignment is mandatory in NFRD/CSRD reporting; 38% average alignment among large EU companies in 2023 (EBA), with significant variation by sector and activity classification approach.

**How an analyst works this module:**
- Map business activities to taxonomy activity classification systems
- Assess DNSH compliance against environmental objectives
- Verify minimum social safeguard requirements (OECD Guidelines, UN Guiding Principles)
- Calculate eligible and aligned revenue, capex and opex
- Compare alignment across jurisdictions and report to investors

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIONS`, `Badge`, `Btn`, `COUNTRY_ADOPTION`, `Card`, `DATA_GAPS`, `DEADLINES`, `FRAMEWORK_COVERAGE`, `KPI`, `LS_KEY`, `LS_PORTFOLIO`, `MODULES`, `ProgressBar`, `SectionTitle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULES` | 6 | `name`, `code`, `path`, `color`, `icon`, `desc`, `status`, `completion` |
| `FRAMEWORK_COVERAGE` | 9 | `fullName`, `compliance`, `color` |
| `COUNTRY_ADOPTION` | 14 | `frameworks`, `count` |
| `DEADLINES` | 9 | `fw`, `desc`, `urgency` |
| `ACTIONS` | 9 | `module`, `action`, `impact`, `effort`, `deadline` |
| `DATA_GAPS` | 8 | `gap`, `severity`, `dataNeeded`, `holdingsAffected` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`.replace(/"/g, '""')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `holdingsData` | `useMemo(() => { const src = companies.length ? companies.slice(0, 80) : Array.from({ length: 40 }, (_, i) => ({ name: `Company ${i + 1}`, ticker: `C${i + 1}`, sector: ['Energy','Financials','Technology','Materials','Industrials'][i % 5], country: ['IN','US','UK','DE','JP'][i % 5] }));` |
| `radarData` | `FRAMEWORK_COVERAGE.map(f => ({ framework: f.fw, compliance: f.compliance, fullMark: 100 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIONS`, `COUNTRY_ADOPTION`, `DATA_GAPS`, `DEADLINES`, `FRAMEWORK_COVERAGE`, `MODULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU Taxonomy Aligned Revenue | — | Taxonomy Assessment | Share of total revenue from activities aligned with EU Taxonomy technical screening criteria. |
| UK Taxonomy Eligible Revenue | — | UK Green Taxonomy | Share of revenue from activities in scope of UK Green Taxonomy; alignment assessment pending final criteria. |
| Jurisdictions Covered | — | Framework Library | Number of active taxonomy frameworks mapped in the hub including EU, UK, ASEAN, China, Canada, South Africa. |
- **Business Activity Data, DNSH Assessment Records, Revenue/Capex/Opex Data** → Activity classification + DNSH + minimum safeguards engine → **Taxonomy alignment KPIs, CSRD Article 8 disclosures, investor reporting packages**

## 5 · Intermediate Transformation Logic
**Methodology:** Taxonomy Alignment Score
**Headline formula:** `TAS = Eligible Revenue / Total Revenue × Aligned Revenue / Eligible Revenue`

Two-step calculation: eligibility (exposure to covered activities) multiplied by alignment (DNSH compliance + minimum social safeguards).

**Standards:** ['EU Taxonomy Regulation 2020/852', 'UK Green Taxonomy 2023']
**Reference documents:** EU Taxonomy Regulation (EU) 2020/852; EU Taxonomy Delegated Acts 2021/2800 & 2023/2486; UK Green Taxonomy Consultation 2023; ASEAN Taxonomy for Sustainable Finance v3 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the funnel: TAS from per-holding assessments, not literals (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents that the hub's 14 headline KPIs and 5-step funnel (`taxEligibility=72.4`, `taxAlignment=41.8`, `dnshCompliance=89`...) are hard-coded literals, while a genuinely computed per-holding aggregate (`consistencyData`, §7.3) sits on the same page unreconciled — filtering holdings changes the table but the frozen KPIs stay put. Worse, the synthetic generator draws `eu_tax_aligned` independently of `eu_tax_eligible`, so ~13.5% of holdings are logically-impossible aligned-but-ineligible (§7.5). Evolution A makes every headline number derive from the holdings layer, per the §8 spec already written.

**How.** (1) Fix the generator's conditional structure immediately: `aligned` drawn only within `eligible`, DNSH and safeguards as gates per §8.3's indicator-function chain — eligibility strictly a superset of alignment. (2) Replace the 14 literals with roll-ups: `PortfolioTAS = Σ TAS(h)×w_h / Σw_h`, funnel steps computed as successive conditional shares so the funnel actually funnels. (3) Wire real inputs where they exist: large EU issuers' disclosed Taxonomy KPI tables (mandatory under CSRD Art. 8 from FY2024) seeded for the `GLOBAL_COMPANY_MASTER` names the page already pulls, with a PCAF-style data-quality flag for estimated rows (§8.6). (4) `AlignmentRatio` defined as 0 when `EligibleRevenue=0`, per §8.6's NaN warning.

**Prerequisites.** Activity-level revenue splits are the hard data gap (§8.4) — start company-level with disclosed KPIs, defer activity-level TSC assessment to the linked EU Taxonomy sub-module. **Acceptance:** filtering holdings moves every headline KPI; zero aligned-but-ineligible rows possible by construction; computed portfolio TAS reconciles with `consistencyData` on the same page.

### 9.2 Evolution B — Multi-jurisdiction taxonomy navigator copilot (LLM tier 1)

**What.** As a navigation hub over 5 live sub-modules (EU Taxonomy, SFDR, ISSB Materiality, GRI Alignment, Framework Interop) with accurate deadline and country-adoption reference tables, this module's LLM fit is a router-explainer: "we're a German asset manager with UK and Singapore holdings — which frameworks bind us, in what order do deadlines hit, and which sub-module do I use for each?" answered from `DEADLINES`, `COUNTRY_ADOPTION`, `MODULES`, and this Atlas record.

**How.** Tier 1 per the roadmap: the hub has no backend (EP code None), so the corpus is its static reference tables — which §7.6 confirms are accurate regulatory content (CSRD ESRS 2026-04-30, SFDR PAI, ISSB S2 mandatory dates for AU/SG/HK) — plus each linked sub-module's Atlas overview so the copilot routes users to the right page rather than answering beyond the hub's surface. This is a natural precursor to the roadmap's tier-3 desk orchestration: the hub already encodes the module graph for the disclosure desk. Guardrails: while headline KPIs remain literals (pre-Evolution-A), the copilot must not present them as portfolio measurements — the §7 mismatch text is embedded precisely so it can say "this figure is a static placeholder."

**Prerequisites.** Deadline table given an `as_of` vintage field and a refresh owner — stale regulatory dates are worse than none. **Acceptance:** every deadline/jurisdiction claim cites its reference row; routing suggestions name only the 5 real sub-module paths; KPI questions pre-Evolution-A get the placeholder disclaimer.