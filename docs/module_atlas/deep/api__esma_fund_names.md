## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/esma-fund-names` wraps the **ESMA Fund Names ESG Guidelines Engine** ("E16",
`backend/services/esma_fund_names_engine.py`), which tests UCITS/AIF fund names against
**ESMA/2024/249** (Guidelines on funds' names using ESG or sustainability-related terms). The
pipeline: (1) detect ESG terms in the name across 6 category groups, (2) derive the applicable
requirements (80% threshold, PAB exclusions, DNSH, Paris-Aligned Benchmark tracking, real-world
impact evidence), (3) test caller-supplied fund attributes against them, (4) emit a compliance
score, blocking/non-blocking gaps, SFDR alignment note and remediation recommendations. Scoring
quoted from code:

```
threshold_met     = esg_investment_pct ≥ required_threshold (80%)     (auto-true if no terms)
compliance_score  = 40·[threshold] + 25·[PAB exclusions] + 15·[DNSH]
                  + 10·[Paris benchmark] + 10·[impact]                (0–100)
overall_compliant = AND of all five checks
```

### 7.2 Parameterisation

**Term categories** (`ESG_TERM_CATEGORIES`, `GET /ref/term-categories`) — all carry the 80%
threshold and PAB-exclusion requirement; category-specific add-ons per the guidelines:

| Category | Example terms | Extra requirement |
|---|---|---|
| environmental | environmental, climate, green, ESG, sustainable, net-zero, Paris-aligned, GHG… (18 terms) | — |
| social | social, diversity, inclusion, human rights, gender… (11) | — |
| governance | governance, board, stewardship… (6) | — |
| impact | impact, additionality… (4) | real-world impact evidence |
| transition | transition, transforming, improving… (5) | Paris-Aligned Benchmark tracking |
| sustainable_focus | sustainable, sustainability focus (3) | DNSH assessment |

**PAB exclusions** (`GET /ref/pab-exclusions`, with per-item article citations to the Benchmark
Delegated Regulation): controversial weapons (Art 12(1)(a)), UNGC/OECD-MNE violators (b), tobacco
≥ 5% revenue (c), fossil fuels — coal ≥ 1%, oil ≥ 10%, gas ≥ 50% revenue (d), high GHG intensity
(e). These revenue thresholds match Commission Delegated Regulation (EU) 2020/1818 Art. 12.

**Timeline** (`GET /ref/timeline`): Final Report 2024-05-14; in force 2024-08-21; applies to new
funds 2024-11-21; existing funds 2025-05-21 — the real ESMA/2024/249 dates. **Cross-framework
map** (`GET /ref/cross-framework`): SFDR Art 8/9 ("SFDR classification does NOT automatically
satisfy name guidelines"), EU Taxonomy Art 8 DA, MiFID II product categorisation, PRIIPs KID
consistency, EU Benchmark Regulation 2016/1011. **SFDR minimums** (`GET /ref/sfdr-requirements`):
Art 8 → 80% + PAI exclusions; Art 9 → 80% + DNSH additionally.

The 40/25/15/10/10 score weights and the blocking/non-blocking split (threshold and PAB
exclusions block; DNSH, PAB tracking and impact evidence are non-blocking) are **platform design
choices**, not ESMA text.

### 7.3 Calculation walkthrough

- **`POST /detect-terms`** — case-insensitive substring matching of every term in each category
  against the fund name; matched categories accumulate the union of requirement flags; the
  category driving the (single, 80%) threshold is reported as `highest_requirement_category`.
- **`POST /assess`** — requirement flags gate each check: a requirement not triggered by the name
  is automatically compliant (e.g. no DNSH check unless a "sustainable" term appears). Gaps carry
  guideline paragraph citations (§27 threshold, §28–30 exclusions, §33 impact).
  `applicable_exclusions` lists all five PAB screens when environmental or transition terms are
  detected. Recommendations mirror gaps, including the canonical alternative: "…or rename the
  fund to remove ESG terms."
- **`POST /assess/batch`** — maps the single assessment over a fund range.

### 7.4 Worked example

Fund: **"Alpha Global Climate Transition Impact Fund"**, SFDR Art 8, ESG investment 74%, PAI
exclusions ✓, no DNSH, no PAB tracking, no impact evidence.

| Step | Result |
|---|---|
| Detected terms | "climate", "transition" (environmental), "transition" etc. (transition), "impact" (impact) |
| Requirements | threshold 80%, PAB exclusions, Paris benchmark (transition), impact evidence (impact); DNSH not required (no "sustainable" term) |
| Threshold | 74% < 80% → **fail (blocking)** |
| Checks | PAI ✓ (25), DNSH auto-✓ (15), PAB ✗ (0), impact ✗ (0) |
| Compliance score | 0 + 25 + 15 + 0 + 0 | **40.0** |
| Overall | false; blocking gaps = [gap_threshold] |
| Applicable exclusions | all 5 PAB screens (environmental+transition detected) |
| Recommendations | raise allocation to ≥ 80% or rename; track a PAB; document additionality/measurability |

### 7.5 Data provenance & limitations

- **No PRNG/seeded data** — a pure rules engine over caller-supplied fund attributes. Reference
  tables faithfully reproduce ESMA/2024/249 structure, dates and the PAB Art 12 exclusion
  thresholds.
- Term detection is naive substring matching: "ESG" inside another word, multilingual names, and
  word-boundary cases can mis-fire; the real guidelines also distinguish term *combinations*
  (e.g. transition terms combined with environmental terms allow CTB rather than PAB exclusions)
  — the engine applies the stricter union instead.
- ESMA's actual regime distinguishes **PAB exclusions** (environmental/impact/sustainability
  terms) from **CTB exclusions** (transition/social/governance terms — Climate Transition
  Benchmark, which permits some fossil exposure); the engine applies the PAB set to every
  category, a conservative simplification.
- Compliance inputs are self-declared booleans (has_pai_exclusions etc.) — no portfolio
  look-through verification; the "meaningfully invest in sustainable investments" expectation for
  "sustainable" terms is proxied by the DNSH flag alone.
- The compliance score is presentational; ESMA compliance is binary per check, which
  `overall_compliant` captures correctly.

### 7.6 Framework alignment

- **ESMA/2024/249 Guidelines:** the 80% minimum proportion of investments used to meet the E/S
  characteristics or sustainable objectives, term-group taxonomy (environmental, social,
  governance, impact, transition, sustainability), impact/measurability expectations and the
  Nov-2024/May-2025 application dates are all implemented as stated in the Final Report.
- **EU Benchmark Regulation 2016/1011 + Delegated Regulation 2020/1818 Art. 12:** the PAB
  exclusion list with exact revenue thresholds (1% coal / 10% oil / 50% gas / 5% tobacco); PAB
  derives these as activity-revenue screens applied to benchmark constituents — reproduced
  verbatim in the reference data.
- **SFDR (2019/2088):** Art 8 (E/S characteristics) vs Art 9 (sustainable objective) minimums;
  DNSH per Art 2(17) sustainable-investment definition (do-no-significant-harm assessed via PAI
  indicators) is required for Art 9 and "sustainable"-named funds.
- **EU Taxonomy Art 8 DA / MiFID II / PRIIPs:** consistency obligations surfaced as advisory
  cross-framework notes rather than computed checks.
