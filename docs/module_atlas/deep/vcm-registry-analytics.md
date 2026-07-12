## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry names a "Registry Integrity Score"
> (`RIS = Additionality Score × Permanence Score × Verification Score`) with a "12% Low-Integrity
> Flags" headline. **No such score is computed anywhere in the file** — there is no `RIS`, no
> additionality/permanence/verification sub-score, and no "low-integrity flag" logic. The page also
> imports real Verra registry data (`VERRA_PROJECTS`, `VERRA_STATS` from
> `frontend/src/data/verraRegistryData.js`, 819 real projects) **but never references either import
> after the `import` statement** — the whole page instead renders a separate, fully synthetic
> registry/project dataset built with the seeded PRNG. The sections below document what the code
> actually renders.

### 7.1 What the module computes

Six synthetic datasets, all seeded by `sr(seed) = frac(sin(seed+1)×10⁴)`:

- **`REGISTRY_DATA`** (6 registries: Verra, Gold Standard, ACR, CAR, ART TREES, Plan Vivo) —
  `issued`/`retired`/`buffer`/`projects` counts, with Verra and Gold Standard's `issued`/`retired`/
  `projects` **hardcoded after generation** (`REGISTRY_DATA[0].issued = 1820e6`, etc.) to plausible
  real-world orders of magnitude, overriding the random draw for just those two registries.
- **`ISSUANCE_TREND`** (2016–2024, per registry) — linear growth (`120 + i·28 + noise`) per registry.
- **`PT_DATA`** (9 project types) — credits/price/projects, with REDD+, Renewable Energy and
  Cookstoves entries hardcoded post-generation to specific values (e.g. REDD+ `credits=680e6,
  price=$4.20`).
- **`PROJECTS`** (top 20, named after real-sounding project titles like "Kariba REDD+," "Katingan
  Mentaya") — `issued`, `retired`, `vintage`, `price`, **`quality` (55–100, `Math.round(55+sr(i·19)·
  45)`)**, `sdgs` count, `status`.
- **`RETIREMENT_BY_TYPE`** — 2022/23/24 retirement volumes for the first 5 project types.

### 7.2 Parameterisation

| Field | Range/value | Provenance |
|---|---|---|
| `REGISTRY_DATA[Verra].issued` | 1,820M (hardcoded) | Plausible real-world order of magnitude, manually set |
| `REGISTRY_DATA[GoldStandard].issued` | 260M (hardcoded) | ″ |
| Other 4 registries' `issued` | 800M–2,600M (random) | `800 + sr(i·7)·1800`, uncalibrated |
| `PT_DATA[REDD+].price` | $4.20 (hardcoded) | Plausible market price, manually set |
| `quality` (per project) | 55–100 | `55 + sr(i·19)·45` — **not the guide's multiplicative RIS**, a flat uniform draw |
| `status` | Active (15) / Under Review (3) / Suspended (2) | Fixed index thresholds (`i<15`, `i<18`), not data-driven |

### 7.3 Calculation walkthrough

1. Registry/project-type/retirement charts render the seeded arrays directly — no derived KPI beyond
   simple `Σ` totals (`totalIssued`, `totalRetired`, `totalProjects`, `retirePct = totalRetired/
   totalIssued×100`, guarded with `totalIssued ? … : '0'`).
2. The 20-project table sorts/colours by `quality` and `status`, but `quality` never factors into any
   aggregate registry statistic — there is no "average integrity by registry" computation.
3. The `VERRA_PROJECTS` import (819 real Verra CCB/SD VISta/Plastic-Waste-Reduction projects with
   real project names, proponents, countries, and co-benefit labels) is loaded into memory and then
   unused — none of its fields (real project counts, real country distribution, real methodology
   names) appear in any chart or table.

### 7.4 Worked example

If the guide's RIS formula were applied to a project with `Additionality=0.75`, `Permanence=0.60`,
`Verification=0.85`: `RIS = 0.75 × 0.60 × 0.85 = 0.3825` → well below the guide's stated "0.6 flags
low-integrity" threshold — i.e. a project with a decent-looking 75%/85% additionality/verification
score can still be dragged below the flag threshold by a weak 60% permanence score, which is exactly
the point of a *multiplicative* (not additive) integrity score: any single weak dimension caps the
whole score. **None of this logic exists in the code** — the closest analogue, `quality`, is a single
flat random number with no sub-dimensional structure at all, so this multiplicative-weakness
dynamic cannot currently be observed or acted on by a user of the page.

### 7.5 Data provenance & limitations

- **All registry totals, issuance trends, and project-type data are synthetic**, only loosely
  anchored to real order-of-magnitude figures for 2 of 6 registries and 3 of 9 project types via
  manual hardcoded overrides after the random generation step.
- **819 rows of real Verra registry data are imported and unused** — this is the most actionable
  finding: wiring `VERRA_PROJECTS`/`VERRA_STATS` into the Registry Analytics tables would immediately
  upgrade at least the Verra portion of the page from synthetic to real.
- **No integrity scoring model exists** despite being the guide's headline methodology — `quality` is
  a single uncalibrated random field with no additionality/permanence/verification decomposition.

**Framework alignment:** ICVCM Core Carbon Principles and VCMI Claims Code (both named in the guide)
are **not implemented** in this module — the sibling `vcm-integrity` module's backend engine
(`backend/services/vcm_integrity_engine.py`) already implements a real, weighted ICVCM CCP scoring
model (see its deep dive) and could supply the `RIS`-equivalent sub-scores this module is missing,
if wired through a shared API call keyed on registry + project type.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Registry Integrity Score gives carbon-credit buyers and portfolio managers a single,
defensible per-project quality signal usable for procurement screening and portfolio-level integrity
reporting, reconcilable with the platform's own `vcm-integrity` ICVCM engine.

### 8.2 Conceptual approach
Reuse the existing `backend/services/vcm_integrity_engine.py` ICVCM CCP scoring (already built and
validated for the `vcm-integrity` module) as the source of the three RIS sub-scores, rather than
building a second, competing scoring methodology: `Additionality = C4 score`, `Permanence = C5
score`, `Verification = C3 (independent V&V) score`. This mirrors how S&P Trucost and MSCI Carbon
Markets both report a single "credit quality" composite built from underlying CCP-aligned
sub-criteria rather than an independently invented scale.

### 8.3 Mathematical specification

```
RIS_project = Additionality_score × Permanence_score × Verification_score     // ∈ [0,1], multiplicative
LowIntegrityFlag = RIS_project < 0.6                                          // guide's stated threshold
RegistryRIS = Σ_project (RIS_project × Volume_project) / Σ_project Volume_project   // volume-weighted registry rollup
```

| Parameter | Calibration source |
|---|---|
| `Additionality_score`, `Permanence_score`, `Verification_score` | Reuse `_compute_icvcm_criteria_scores()` C4/C5/C3 outputs (`vcm_integrity_engine.py`) |
| 0.6 low-integrity threshold | Guide-stated; consistent with ICVCM's own criterion-level 0.60–0.80 thresholds |
| Volume weighting | Standard portfolio-quality convention (CDP/MSCI Carbon Markets) — larger issuances should move the registry-level average more |

### 8.4 Data requirements
Per-project registry, project type, vintage, VVB accreditation status and monitoring frequency
(already modelled as inputs to `assess_vcm_integrity()`), plus real issuance/retirement volumes —
available from `VERRA_PROJECTS` for Verra and would need equivalent public registry exports for Gold
Standard, ACR, CAR, ART TREES and Plan Vivo.

### 8.5 Validation & benchmarking plan
Cross-check RIS distribution against MSCI Carbon Markets' or Sylvera's published quality-rating
distributions for the same registries (directional validation only, since exact methodologies
differ); confirm that known low-integrity project types (older-vintage REDD+ per the Guardian 2023
investigation) fall below the 0.6 threshold at a materially higher rate than renewable-energy or
methane-capture credits.

### 8.6 Limitations & model risk
A multiplicative score is highly sensitive to the weakest dimension, which is intentional but means
data gaps (e.g. missing VVB accreditation data defaulting to a conservative low score) can
mechanically suppress RIS even for genuinely high-quality projects — any sub-score derived from a
missing/default input should be flagged distinctly from a genuinely-assessed low score.
