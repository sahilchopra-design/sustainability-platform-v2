## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is accurate on structure: the module implements a **genuine GIIN IRIS+
catalogue** (real metric IDs — PI9468 Clean Energy, OI8869 GHG Reduced, PI1595 Evidence Quality…)
organised across the Impact Management Project's **five dimensions** (What / Who / How Much /
Contribution / Risk), with SDG mapping and GIIN benchmark medians. The scoring engine normalises each
metric to 0–100 and averages by dimension. The important caveat: **metric values are user-entered
where available, otherwise a seeded fallback** — so an un-populated company's "impact" is a
`Math.sin`-hashed placeholder, not real reported data.

### 7.1 What the module computes

`computeIrisScores(company, irisData)` produces per-metric values, per-dimension scores, and a
composite. Values prefer user input, else a seeded draw scaled to the metric's unit:

```js
seed = Σ charCodeAt(company_id) ; rng(off) = frac(sin(seed+off+1)·10⁴)
value = userVal ?? ( rng(...)·(unit==='%'?80 : unit==='count'?rev·50 : unit==='USD Mn'?rev·0.15
                                : unit.includes('score')?70 : rev·10) + (unit==='%'?10:5) )     // relevant metrics
      | rng(...)·20                                                                              // non-relevant
dimScore  = min(100, Σ min(100, value/denom·100) / #relevantMetrics)          // per dimension
avgScore  = Σ dimScore / 5
evidenceQual = round(PI1595.value / 20) || 3                                   // maps to 1–5 tier
```

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| `IRIS_METRICS` catalogue | 25 metrics × 5 IMP dimensions, real IDs (PI/OI codes) | GIIN IRIS+ System — **authentic identifiers** |
| SDG mapping per metric | e.g. PI9468 → SDG 7,13 | Real IRIS+ SDG crosswalk |
| `GIIN_BENCHMARKS` | what 62, who 55, how_much 48, contribution 40, risk 58 | GIIN Navigating Impact sector medians |
| `sector_relevance` gating | 'All' or GICS sector | Determines which metrics count |
| Value scaling by unit | %→0–80, count→rev·50, USD Mn→rev·0.15, score→0–70 | **Synthetic fallback** heuristic |
| Seed | char-code sum of `company_id` | Deterministic per company |
| Evidence tier | value/20 → 1–5 | IRIS+ Risk dimension (1=RCT … 5=anecdotal) |
| `GLOBAL_COMPANY_MASTER` | imported company list | Platform company master |

### 7.3 Calculation walkthrough

1. For each holding/company, `computeIrisScores` iterates the 25 metrics; relevant metrics (by sector)
   take user data or a unit-scaled seeded value; non-relevant metrics get a small seeded value.
2. Each metric value is normalised to ≤100 against a unit-specific denominator; the dimension score is
   the mean over relevant metrics.
3. `avgScore` = mean of the five dimension scores; `evidenceQual` derives a 1–5 tier from PI1595.
4. Portfolio aggregates: mean avgScore, total impact revenue (OI4114), total beneficiaries (PI1104),
   total GHG reduced (OI8869), mean evidence tier; radar of dimension scores vs GIIN benchmarks.
5. CSV export lists every metric value per company.

### 7.4 Worked example (one company, unpopulated)

Company `rev = $500M`, sector Energy, no user data. Metric OI4114 (Revenue from Impact Products,
USD Mn) with `rng = 0.4`:

| Step | Computation | Result |
|---|---|---|
| Value (USD Mn unit) | 0.4 × (500 × 0.15) + 5 | 0.4×75 + 5 = **35 USD Mn** |
| Normalise (denom rev·0.5 = 250) | min(100, 35/250×100) | **14.0** |
| Dimension (How Much) score | mean of relevant How-Much metric scores | e.g. **41** |
| avgScore | (What+Who+HowMuch+Contribution+Risk)/5 | e.g. **48** |
| Evidence tier (PI1595 seeded 60) | round(60/20) | **3** |

Because no user data was entered, the entire impact profile here is seeded — real use requires
entering reported IRIS+ values, which then replace the fallback.

### 7.5 Companion analytics on the page

- **Five-dimension radar** — company scores vs `GIIN_BENCHMARKS`.
- **SDG contribution** — metrics mapped to SDG targets with official SDG colours.
- **Portfolio KPIs** — impact revenue %, total beneficiaries, total GHG reduced, mean evidence tier.
- **Additionality** — `addScore = min(100, innov·0.6 + (cap>0?30:0) + 10)` from Contribution metrics.
- **localStorage persistence** of user-entered IRIS values (`ra_iris_data_v1`).

### 7.6 Data provenance & limitations

- The **IRIS+ catalogue, IDs, SDG mappings and GIIN benchmarks are real**; the **metric values are
  user-entered or seeded fallbacks** (`Math.sin`-hashed by company_id) — flag any company profile with
  no localStorage entries as fully synthetic.
- Normalisation denominators are heuristic (e.g. revenue-scaled), not GIIN-defined thresholds.
- Additionality/evidence tiers are simplified proxies, not IMP-assessed ratings.

**Framework alignment:** *GIIN IRIS+ System* — the module uses authentic IRIS+ metric identifiers and
the five IMP dimensions (What, Who, How Much, Contribution, Risk), the exact structure IRIS+ prescribes.
*Impact Management Project* — dimension scores map to IMP's five-dimension impact norms. *UN SDGs* —
each metric carries its real SDG target links. *OPIM* — the guide references Operating Principles for
Impact Management for the disclosure output. IRIS+ itself does not prescribe a single composite score;
GIIN's *Navigating Impact* provides sector benchmarks, which the module uses as the radar reference.

## 8 · Model Specification

**Status: specification — not yet implemented in code (for the value-generation path; the catalogue
and scoring skeleton are real).**

### 8.1 Purpose & scope
Replace the seeded fallback values with an evidenced impact-measurement pipeline: ingest reported
IRIS+ metric values, benchmark against GIIN sector distributions, and produce a defensible five-
dimension impact profile and additionality rating.

### 8.2 Conceptual approach
Data-first IRIS+ scoring: reported KPIs → unit normalisation against GIIN *Navigating Impact* peer
quartiles → dimension aggregation with IMP-consistent weighting → additionality/risk assessment per
IMP norms. Benchmarked to GIIN IRIS+ and IFC OPIM Principle-7 verification practice.

### 8.3 Mathematical specification
For company *c*, metric *m* in dimension *d*:

```
z_{c,m}     = (Value_{c,m} − median_{sector,m}) / IQR_{sector,m}      // peer-relative
pct_{c,m}   = Φ(z_{c,m})·100                                          // percentile score 0–100
DimScore_d  = Σ_{m∈d, relevant} w_{d,m}·pct_{c,m} / Σ w_{d,m}
Additionality = f(Capital Mobilized OI5320, Innovation PI9061, Policy PI3390)   // IMP Contribution
ImpactRisk  = g(Evidence PI1595, Execution PI8291, External PI4453, Stakeholder PI6190)
Composite   = Σ_d ω_d·DimScore_d                                      // ω = IMP-materiality weights
```

| Parameter | Source |
|---|---|
| Peer medians/IQR `median, IQR` | GIIN Navigating Impact benchmark database |
| Metric weights `w, ω` | IMP materiality; fund mandate |
| SDG crosswalk | IRIS+ official SDG mapping |
| Evidence tiers | IRIS+ Risk dimension definitions (RCT→anecdotal) |

### 8.4 Data requirements
Reported IRIS+ KPI values per investee per year, sector/geography for benchmarking, capital-mobilised
and evidence-quality inputs. Platform has the catalogue, benchmark medians, and localStorage input;
needs the GIIN peer-distribution feed and reported-data ingestion.

### 8.5 Validation & benchmarking plan
Reconcile dimension percentiles against GIIN Navigating Impact quartiles; verify additionality against
OPIM Principle-7 independent verification; sensitivity of composite to metric weights; check evidence-
tier distribution against sector norms.

### 8.6 Limitations & model risk
IRIS+ metrics are self-reported and sparsely benchmarked; cross-sector comparability is limited;
additionality is inherently qualitative. Fallback: report dimension scores separately with data-
coverage flags rather than a single composite when reported coverage is low.
