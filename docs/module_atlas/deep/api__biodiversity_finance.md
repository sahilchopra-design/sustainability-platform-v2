## 7 · Methodology Deep Dive

Grounded in `backend/services/biodiversity_finance_engine.py` (E23; routes:
`api/v1/routes/biodiversity_finance.py`). A biodiversity-finance assessment engine spanning five
frameworks: TNFD v1.0 (14 metrics / 4 pillars), SBTN Steps 1–5, CBD GBF Target 15 (sub-elements
a–f), MSA.km² land-use footprint, and ENCORE/PBAF cross-framework linkage.

### 7.1 What the engine computes

The single `assess()` method assembles a `BiodiversityAssessment`. Its one *genuine ecological
computation* is the **Mean Species Abundance (MSA) footprint**:

```
area_lt   = total_area × frac_lt / Σ frac        (allocate area to each land-use type)
msa_loss  = area_lt × (1 − msa_factor_lt)         (biodiversity-integrity loss, km²·MSA)
total_footprint_km2 = Σ msa_loss
hotspot   = land-use types where msa_loss > 25% of total footprint
```

Everything else is *scoring / status assembly* from caller-supplied inputs:

| Output | Formula |
|---|---|
| TNFD pillar maturity | caller-supplied 1–5 per pillar, clamped; overall = `int(mean of supplied pillar scores)` |
| TNFD gaps | metrics in a pillar not in the caller's `assessed` list |
| SBTN readiness | `steps_complete / 5 × 100`; status ladder complete/partial/not_started |
| CBD GBF alignment | `avg(sub_element_scores)` → aligned ≥70 / progressing ≥40 / else early-stage |
| Nature-positive score | `Σ` of available components: `TNFD/5×40 + SBTN_readiness×0.30 + CBD_avg×0.30` |
| PBAF 2023 status | derived from SBTN: `partial` if steps < 3 else `compliant` |

### 7.2 Parameterisation

**Land-use MSA factors** (fraction of pristine species abundance retained) — the core reference
table, consistent with GLOBIO/MSA convention:

| Land use | MSA factor | Loss weight (1 − factor) |
|---|---|---|
| Primary vegetation | 1.00 | 0.00 |
| Secondary vegetation | 0.70 | 0.30 |
| Extensive agriculture | 0.50 | 0.50 |
| Aquaculture | 0.40 | 0.60 |
| Intensive agriculture | 0.30 | 0.70 |
| Plantation forestry | 0.20 | 0.80 |
| Mining / quarrying | 0.10 | 0.90 |
| Urban built-up | 0.05 | 0.95 |

Unmapped land use defaults to msa_factor 0.5. **TNFD pillars**: governance / strategy / risk
management / metrics & targets, each weighted 0.25, with the 14 named metrics (M1–M14)
distributed 3/3/3/5. **SBTN steps**: 1 Assess · 2 Interpret · 3 Measure · 4 Set · 5 Act. **CBD
GBF Target 15 sub-elements** 15a–15f (assess / reduce / increase-positive / disclose / consumer
information / harmful-subsidy reduction). **Nature-positive weights** 40/30/30 across TNFD/SBTN/
CBD are a platform composite (no external standard prescribes this blend).

### 7.3 Calculation walkthrough

The engine is built around an **honest-null discipline** (extensive inline comments): every input
that was "previously fabricated via `random.Random(hash(entity_id))`" is now either caller-supplied
or reported as `None` / `insufficient_data` with a warning. So:

- TNFD: absent pillar maturity → `tnfd_overall_maturity = None` + warning; a pillar with no
  `assessed` list has all its metrics counted as gaps.
- MSA: computed only when both `operational_area_km2 > 0` and `land_use_breakdown` are supplied;
  otherwise a warning and empty footprint.
- SBTN: `steps_complete` (clamped 0–5) drives the readiness % and the complete/partial/not_started
  ladder; `next_priority_step = min(steps+1, 5)`.
- CBD: needs `cbd_sub_element_scores`; otherwise `overall_alignment = "insufficient_data"`.
- Nature-positive score sums *only the components that exist* — no zero-fill — so it is `None`
  if no framework input is present.
- Priority actions are all null-guarded (`x is not None and x < threshold`) so honest nulls can
  never raise.

### 7.4 Worked example (MSA footprint)

A caller supplies `operational_area_km2 = 1,000` and
`land_use_breakdown = {intensive_agriculture: 0.6, primary_vegetation: 0.3, mining_quarrying: 0.1}`
(fractions sum to 1.0):

| Land use | Area (km²) | 1 − MSA factor | MSA loss (km²·MSA) |
|---|---|---|---|
| Intensive agriculture | 600 | 0.70 | 420.0 |
| Primary vegetation | 300 | 0.00 | 0.0 |
| Mining / quarrying | 100 | 0.90 | 90.0 |
| **Total footprint** | | | **510.0** |

Hotspots (loss > 25% × 510 = 127.5): only intensive agriculture (420 > 127.5). Because the total
footprint 510 > 500, the priority action "MSA footprint >500 km² — initiate site-level
biodiversity management plans" is emitted. If the same entity supplies `sbtn_steps_complete = 2`
and `cbd_sub_element_scores` averaging 55, and TNFD maturity averages 3, then
`nature_positive = 3/5×40 + 40×0.30 + 55×0.30 = 24 + 12 + 16.5 = 52.5`.

Note `calculate_msa_footprint()` (a second entry point taking absolute areas) uses a **20%**
hotspot threshold rather than 25% — a minor inconsistency between the two code paths.

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data in the current code** — the module was explicitly de-randomised;
  inline comments repeatedly note that TNFD maturity, SBTN steps, CBD scores, sensitive-ecosystem
  %, and finance metrics "were previously fabricated via `random.Random(hash(entity_id))`" and
  are now honest nulls. This is a model example of the platform's fabrication remediation.
- MSA factors are static GLOBIO-style constants; the engine does *not* apply pressure-specific
  MSA (fragmentation, N-deposition, climate, encroachment) — only land-use MSA, a first-order
  footprint. It also does not weight by ecosystem sensitivity/irreplaceability.
- TNFD maturity is a self-declared 1–5 input, not an evidence-based assessment; the engine
  scores completeness/gaps, not disclosure quality.
- The 40/30/30 nature-positive blend and the ≥70/≥40 CBD alignment cut-points are platform
  conventions, not from the respective standards.
- PBAF status is inferred purely from SBTN step count — a proxy, since PBAF conformance actually
  concerns impact/dependency accounting methodology, not SBTN progress.

### 7.6 Framework alignment

- **TNFD v1.0** — the four recommended-disclosure pillars (Governance, Strategy, Risk & Impact
  Management, Metrics & Targets) and the 14 core global disclosure metrics are catalogued; the
  engine scores self-declared pillar maturity and metric coverage rather than running the TNFD
  LEAP (Locate-Evaluate-Assess-Prepare) process itself.
- **SBTN (Science Based Targets for Nature)** — the five-step Assess→Interpret→Measure→Set→Act
  methodology; readiness is linear in completed steps.
- **CBD Kunming-Montreal GBF Target 15** — sub-elements a–f on business assessment, impact
  reduction, disclosure, consumer information and harmful-subsidy reform; alignment tiered from
  a 0–100 self-score average.
- **GLOBIO / MSA** — MSA (Mean Species Abundance) measures intactness on a 0–1 scale vs pristine
  reference; the land-use MSA factors implement the land-use pressure component of GLOBIO,
  yielding a km²·MSA "biodiversity footprint".
- **ENCORE** — the ecosystem-services list (pollination, water supply, flood mitigation…)
  mirrors ENCORE's natural-capital dependency taxonomy; carried as a cross-framework reference.
- **PBAF Standard (2023)** — the Partnership for Biodiversity Accounting Financials disclosure
  standard for financed impacts/dependencies; here only a derived conformance flag.
- **Cross-framework** — ESRS E4, EU Taxonomy biodiversity DNSH, and GRI 304 fields are passed
  through from caller inputs as honest nulls when absent.
