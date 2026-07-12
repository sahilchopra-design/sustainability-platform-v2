## 7 · Methodology Deep Dive

This is a **tier-A module with a genuinely standards-grounded backend** (`esg_controversy_engine.py`,
~1,680 lines). The guide's headline formula (`ControversyScore = Severity × MediaImpact × Duration`)
is a simplification; the real engine implements the **Sustainalytics 5-level framework**,
**RepRisk RRI** (0–100) approximation, a **50-incident-type** E/S/G library with severity floors and
UNGC/SFDR-PAI mappings, a **5-criteria remediation score**, and **SFDR PAI 10/11/14** portfolio
exposure. The frontend's `rng()` is used only for a demonstration incident-catalogue table; the
`assess`/`portfolio`/`remediation`/`trend` panels call the real backend. No blanket ⚠️ flag — the
guide understates the engine rather than mismatching it.

### 7.1 What the module computes

**(a) RRI approximation** (`_compute_rri`):

```python
rri = min(100, round( Σ_incidents [ severityScore(inc) × source_weight("national_media"=1.0) ]
                       × sector_multiplier , 1))
```

`severityScore` maps `reprisk_severity ∈ {low, medium, high, critical}` → numeric via
`_REPRISK_SEVERITY_TO_SCORE` (medium default = 7); `sector_multiplier` from
`INDUSTRY_EXPOSURE_FACTORS` (e.g. mining/oil&gas > 1). `rri → RepRisk rating` (AAA 0–25 … CCC 86–100)
via range lookup.

**(b) Sustainalytics level** (`_compute_sustainalytics_level`): the max per-incident level floor,
escalated by incident count (≥5 → +1) and by RRI (≥75 → level 4, ≥60 → level 3).

**(c) Remediation score** (`calculate_remediation_score`): five criteria × 0–20 = 0–100, with adequacy
tiers and a Sustainalytics level deduction (≥80 → −2 notches, ≥60 → −1).

**(d) Portfolio exposure** (`assess_portfolio_controversy_exposure`): value-weighted level and RRI,
SFDR PAI-10 (value in UNGC-violating names), PAI-14 (controversial weapons), high-risk holding list.
The frontend mirrors the weighted score as:

```js
wScore = Σ (controversy_level × market_value) / totalMv
ungcPct = Σ (mv of UNGC violators) / totalMv × 100
```

### 7.2 Parameterisation / scoring rubric

**Sustainalytics 5-level** (with real ESG-rating-impact and materiality bands):

| Level | Label | ESG-rating impact | Review cycle | Revenue at risk |
|---|---|---|---|---|
| 1 | Low | 0 | 6 mo | Negligible |
| 2 | Moderate | 2 | 6 mo | 0–2% |
| 3 | Significant | 5 | 3 mo | 2–5% |
| 4 | High | 10 | 1 mo | 5–15% |
| 5 | Catastrophic | 20 | 1 mo | >15% (viability risk) |

**RepRisk RRI dimensions** (documented, partially applied): novelty (first 1.0 / repeat-14d 0.5 /
repeat-30d 0.25), reach (international-media ×1.5), severity, sharpness. **RepRisk rating** ranges are
authentic (AAA 0–25, AA 26–45, A 46–55, BBB 56–65, BB 66–75, B 76–85, CCC 86–100).

**Provenance:** these are **real published methodologies**, cited in the engine docstring
(Sustainalytics ESG Risk Rating 2023, RepRisk RRI 2023, UNGC Ten Principles, OECD Guidelines 2023,
SFDR RTS 2022/1288 PAI 10–11, MSCI 2023). The 50 incident types carry `sustainalytics_level_floor`,
`reprisk_severity`, `ungc_violation`, `ungc_principles`, `sfdr_pai_indicator` and revenue-at-risk
ranges — a curated reference library, not PRNG.

### 7.3 Calculation walkthrough

1. User selects entity, sector, active incidents (from 50-type catalogue), optional severity
   overrides, financial impact, remediation status → `POST /assess`.
2. Backend: `rri = _compute_rri`; `rating = _rri_to_reprisk_rating`; `level =
   _compute_sustainalytics_level`; `ungc = _check_ungc_violations`; `rev_at_risk =
   _compute_revenue_at_risk`; overall tier from level.
3. Remediation panel: 5 sliders (0–20 each) → `/remediation-score` → adequacy tier + notch deduction.
4. Portfolio panel: holdings with `active_incidents` and `market_value_usd` → `/portfolio-exposure`
   → weighted level/RRI, SFDR PAI values, high-risk names.
5. Trend panel: 12-month incident history → trajectory.

### 7.4 Worked example — mining entity, oil spill + bribery

Incidents = `[oil_spill, bribery]`, sector = mining. Suppose severities are `critical` (score 20) and
`high` (score 12), and mining `sector_multiplier = 1.2`, source weight national_media = 1.0:

| Step | Computation | Result |
|---|---|---|
| Σ severity × source | 20×1.0 + 12×1.0 | 32 |
| × sector mult | 32 × 1.2 | 38.4 |
| RRI | min(100, 38.4) | **38.4** |
| RepRisk rating | 26–45 band | **AA** |
| Level floor | max(oil_spill floor, bribery floor) — say 4 | 4 |
| Escalation | n=2 (<5), RRI 38 (<60) → no bump | **Level 4 (High)** |
| Revenue at risk | max of incident ranges (High → 5–15%) | **15%** |

If remediation scores 85/100, the Sustainalytics level is deducted 2 notches (→ effectively level 2
management overlay). Every step is deterministic engine logic — no random draws.

### 7.5 Data provenance & limitations

- **Backend is curated real-standard data**, not synthetic. The only PRNG (`rng(i)=frac(sin(i+seed+1)
  ×10⁴)`) in the frontend seeds a *demonstration* incident-catalogue table (`sev`, `fin` sample
  columns) and the reputational-risk-illustration donut — not the assess/portfolio results.
- RRI is an **approximation**: it applies only the `national_media` source weight and a sector
  multiplier; the documented novelty/reach/sharpness decay weights are defined but not fully applied
  in `_compute_rri` (real RepRisk RRI is a time-decayed daily index).
- Duration/recency (the guide's "Duration" term) is not in the assess score; it appears only in the
  separate trend module.
- Incident severities default to the catalogue floor unless the user overrides — real controversy
  scoring is event-specific and source-verified.

**Framework alignment:** **Sustainalytics ESG Risk Rating** — the 5-level controversy framework with
per-level ESG-rating impact and review cycles is implemented directly · **RepRisk RRI/Rating** — the
0–100 index and AAA–CCC rating bands are authentic, with a simplified severity×source×sector scoring ·
**UN Global Compact** — incident→UNGC-principle mapping drives norms-based exclusion flags ·
**OECD Guidelines for MNEs** — referenced for the ESG due-diligence framing · **SFDR RTS PAI 10**
(UNGC/OECD violations) and **PAI 14** (controversial weapons) — computed as value-weighted portfolio
exposure. MSCI's own controversy score (0–10, event-flag driven, capping the ESG letter rating) is
approximated by the level→rating-impact mapping.
