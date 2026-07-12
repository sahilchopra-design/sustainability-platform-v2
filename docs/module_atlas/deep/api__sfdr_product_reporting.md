## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sfdr-product-reporting` (engine E22, `sfdr_product_reporting_engine.py`) produces
**product-level SFDR periodic reports** (RTS 2022/1288 Annex III for Art 8, Annex V for Art 9) and
a **sustainable-investment verification** aggregate. Its header carries an explicit data-integrity
covenant: *"Every returned metric is either a REAL computation from caller-supplied inputs … or an
HONEST NULL when the required input is absent. No metric is drawn at random."*

```
report_completeness_pct   = (mandatory − missing) / mandatory × 100     (null if sections unknown)
pai_coverage_pct          = mean of supplied per-indicator coverage_pct (null if none)
vs_benchmark_delta        = value − benchmark_value                     (only when both present)
verified_sustainable_pct  = min(dnsh %, social-good %, governance %)    over supplied components
weighted_share(flag)      = Σ w_h[flag true] / Σ w_h × 100              only over holdings reporting the flag
```

### 7.2 Parameterisation

**PAI registry** (`PAI_MANDATORY_INDICATORS`) — the 14 RTS Table-1 mandatory indicators with the
correct RTS numbering and units: PAI-1 GHG emissions (tCO₂e/€M invested), PAI-2 carbon footprint,
PAI-3 GHG intensity (tCO₂e/€M revenue), PAI-4 fossil-fuel exposure (%, threshold 0.0), PAI-5
non-renewable energy %, PAI-6 energy intensity (MWh/€M revenue), PAI-7 biodiversity-sensitive
areas (yes/no), PAI-8 emissions to water, PAI-9 hazardous waste, PAI-10 UNGC/OECD violations,
PAI-11 lack of UNGC/OECD processes, PAI-12 unadjusted gender pay gap, PAI-13 board gender
diversity, PAI-14 controversial weapons (yes/no, threshold 0.0).

**Article configs** (`SFDR_ARTICLES`): Art 8 has 10 mandatory report sections (summary, DNSH,
E/S characteristics, strategy, proportion, monitoring, due diligence, engagement, designated
index, website info); Art 9 swaps in sustainable-investment-objective and attainment-of-objective
sections and adds benchmark-sustainability extras.

**Verification criteria** (`SUSTAINABLE_INVESTMENT_CRITERIA`): dnsh_verified,
social_good_contribution, governance_screening, additionality (noted "optional under RTS").

**Thresholds:** DNSH gap flag when `dnsh_verified_pct < 0.80 × sustainable_pct`; PAI coverage
warning below 75 %; Art 9 recommendation when verified sustainable < 50 %. All three are platform
conventions, not statutory numbers.

### 7.3 Calculation walkthrough

1. **Completeness** — only computed when the caller states `sections_completed`; otherwise null
   plus the warning "Report completeness not assessed". Gaps list the missing mandatory sections.
2. **PAI table** — all 14 indicators always appear; each takes the caller's value (yes/no
   indicators coerced to 0/1 floats), coverage, and benchmark (benchmark used only if a
   `benchmark_index` is named). Aggregate coverage is the simple mean over indicators that
   reported coverage.
3. **Verification (in-report)** — echoes supplied DNSH/social/governance percentages;
   `verified_sustainable_pct` is the **minimum** of supplied components, encoding the RTS logic
   that a sustainable investment must clear *all three* tests simultaneously (a conservative
   lower bound, since the min assumes perfect overlap of failures).
4. **Verification (from holdings)** (`POST /verify-sustainable-investment`) — exposure-weighted
   share per boolean flag, aggregated **only over holdings that report the flag** but normalised
   by *total* portfolio weight — so unreported holdings implicitly count as "no". If no holdings
   or no flags: `data_status = "insufficient_data"`.
5. Taxonomy alignment and per-objective breakdown are pass-throughs from the taxonomy engine;
   website-disclosure completeness is tri-state (None = unknown).

### 7.4 Worked example — Art 9 fund verification

Holdings: A (w 40, is_sustainable ✓, dnsh ✓, social_good ✓, governance ✓), B (w 35, is_sustainable
✓, dnsh ✗, social_good ✓, governance ✓), C (w 25, flags absent).

| Metric | Computation | Result |
|---|---|---|
| total_w | 40+35+25 | 100 |
| sustainable_pct | (40+35)/100 | **75.0 %** |
| dnsh_verified_pct | 40/100 | **40.0 %** |
| social_good_pct | (40+35)/100 | 75.0 % |
| governance_screened_pct | 75.0 % | 75.0 % |
| verified_sustainable_pct | min(40, 75, 75) | **40.0 %** |

Feeding these into `generate_report` (Art 9, `sustainable_investment_pct = 75`):
`dnsh 40 < 0.80 × 75 = 60` → `fails_criteria = ["dnsh_gap"]`; verified 40 < 50 → recommendation
"Art 9 fund: verified sustainable investment % is low — review DNSH assessment process".

### 7.5 Interconnections

The engine is explicitly the aggregation tail of three upstream engines: entity-level PAI values
(`sfdr_pai_engine` family) feed `pai_data`; the EU-taxonomy engine feeds
`taxonomy_aligned_pct`/`taxonomy_by_objective`; DNSH/good-governance screens feed the verification
sub-metrics. `GET /ref/*` endpoints expose the registries (PAI indicators, articles, DNSH
objectives, RTS sections, reporting timeline, sustainable-investment criteria) as static
reference data for the frontend.

### 7.6 Data provenance & limitations

- **No PRNG, no fabrication** — this is one of the remediated "honest null" engines: every metric
  is caller-derived or null with `insufficient_data`/warning markers. The `aum_mn = 100.0` default
  parameter exists in the signature but is never used in any computation.
- `verified_sustainable_pct = min(components)` is a bound, not a measured joint qualification —
  real verification requires holding-level conjunction (which `verify_sustainable_investment`
  does correctly when flags are supplied per holding, via all-flag booleans, though it also
  reports each flag independently rather than their intersection).
- The holdings aggregator treats missing flags as failing (numerator omits them, denominator
  keeps their weight) — conservative but can understate compliance for data-gap reasons.
- No historical/YoY comparison in this engine (that lives in `sfdr_report_generator`); no iXBRL.

### 7.7 Framework alignment

- **SFDR RTS (EU) 2022/1288 Annex III/V** — periodic-report section lists mirror the RTS
  templates' question headings; PAI Table-1 numbering and units are faithful to the RTS.
- **SFDR Art 2(17) sustainable investment definition** — the three-part test (contribution to an
  E/S objective, DNSH, good governance) is exactly the verification triple; the engine's min-rule
  operationalises "must satisfy all three".
- **EU Taxonomy Regulation 2020/852** — DNSH across the six environmental objectives (CCM, CCA,
  water, circular economy, pollution, biodiversity) is referenced via `dnsh_verified` and the
  per-objective taxonomy breakdown.
- **SFDR Art 10** — website product-disclosure completeness is tracked as the tri-state
  `website_disclosure_complete` with a remediation recommendation when false.
