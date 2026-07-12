## 7 · Methodology Deep Dive

This module has no backend engine and no PRNG — every number is a **static, hand-set illustrative
table**. It does not claim a scoring formula in the guide (the guide's "Match = PlatformMetric →
XBRL_Tag using semantic matching" is descriptive, not a numeric formula), so there is no formula-level
mismatch to flag; the main limitation is that "mapping"/"validation" completeness figures are
authored constants, not the output of any actual semantic-matching or validation process.

### 7.1 What the module computes

Six static reference datasets:

- **`S2_CATEGORIES`** (5 ISSB S2 sections: Governance, Strategy, Risk Management, Metrics & Targets,
  Industry Specific) — each with `tags`/`mapped`/`validated` counts (e.g. Metrics & Targets: 65 tags,
  52 mapped, 45 validated).
- **`E1_CATEGORIES`** (6 ESRS E1 sections: Transition Plan, Policies & Actions, Targets, Energy, GHG
  Emissions, Financial Effects) — same 3-count structure.
- **`VALIDATION_RESULTS`** (6 named checks: required tags present, data type validation,
  cross-reference consistency, calculation linkbase, presentation linkbase, label completeness) —
  each with `passed`/`failed`/`total` out of 202.
- **`MAPPED_STATUS`** (Fully/Partially/Not Mapped pie: 155/32/15, summing to 202 — consistent with
  `VALIDATION_RESULTS`' 202 total, suggesting the two datasets were at least authored to agree with
  each other even though neither is derived from a live tagging process).
- **`TAG_SAMPLES`** (8 example ISSB S2/ESRS E1 tag names with plausible XBRL element-name syntax,
  e.g. `ifrs-s2:AbsoluteGrossScope1`, `esrs-e1:EnergyConsumptionTotal`) — real-looking taxonomy
  concept naming conventions, though not verified against the actual published IFRS/EFRAG taxonomy
  files.

Only two live computations exist: `totalS2 = Σ S2_CATEGORIES.tags` (202... wait, sums to 28+42+35+65+32=202)
and `totalE1 = Σ E1_CATEGORIES.tags` (18+22+15+20+35+12=122), both displayed in the page subtitle.

### 7.2 Parameterisation

| Table | Total tags | Mapped | Validated | Coverage |
|---|---|---|---|---|
| ISSB S2 (5 categories) | 202 | 157 | 134 | 77.7% mapped, 66.3% validated |
| ESRS E1 (6 categories) | 122 | 101 | 86 | 82.8% mapped, 70.5% validated |

The guide's cited "ISSB S2: 200+ tags" and "ESRS E1: 80+ tags" are consistent with these totals
(202 and 122 respectively both exceed the guide's rounded figures), suggesting the constants were
chosen to match the guide's cited external counts even though no live IFRS/EFRAG taxonomy file is
parsed.

### 7.3 Calculation walkthrough

1. **Taxonomy Browser tab** — likely renders `S2_CATEGORIES`/`E1_CATEGORIES` directly as
   bar/table views.
2. **Tag Mapping Tool tab** — `filteredTags` searches `TAG_SAMPLES` (8 rows only) by tag name or
   element name substring — a real search/filter mechanic, but over a tiny illustrative sample, not
   the full 202+122 tag universe the summary cards claim to cover.
3. **Validation Engine tab** — renders `VALIDATION_RESULTS` (6 static checks) — no actual XBRL
   document is validated; the pass/fail counts are fixed regardless of any user action.
4. **Filing Preview tab** — presumably renders a mock iXBRL preview from static content, not a
   generated document from real underlying ESG data.

### 7.4 Data provenance & limitations

- **Every count in this module is a static, hand-authored constant.** There is no live semantic-
  matching engine, no actual EFRAG/IFRA taxonomy file parsing, and no per-user tagging session state
  — every visitor to this page sees identical, unchanging mapping/validation figures.
- **`TAG_SAMPLES` (8 rows) is far smaller than the 202+122 tags the summary KPIs claim** — the Tag
  Mapping Tool cannot actually demonstrate mapping for the vast majority of tags it claims exist.
- The sibling module `xbrl-export-wizard` has a genuinely functional backend engine
  (`backend/services/xbrl_export_engine.py`) with a real ESRS-to-XBRL taxonomy dictionary and ESEF
  validation rules (LEI format check, period-date ordering, taxonomy-membership check, duplicate-fact
  detection) — that engine's `ESRS_XBRL_TAXONOMY` dictionary would be a natural, already-built source
  to replace this module's static `E1_CATEGORIES`/`TAG_SAMPLES` with real taxonomy data (see that
  module's deep dive for detail on why it's also not currently wired to any frontend).

**Framework alignment:** ISSB XBRL Taxonomy and ESRS ESEF Taxonomy (both named in the guide) are
represented only as illustrative summary counts and 8 example tag names — no live taxonomy file is
loaded or validated against in this module.
