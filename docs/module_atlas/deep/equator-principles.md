## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The MODULE_GUIDES entry advertises an **ESAP Compliance Score**
> (`ESAP_score = Closed/Total×100 − Σ Severity_i×Overdue_i`) and an ESAP action-item tracker with
> owners, deadlines and monitoring alerts. **No ESAP tracker or ESAP scoring exists in this module.**
> What the code actually implements is a genuine, rule-based **EP-IV applicability & categorisation
> engine** — deriving Category A/B/C, designated-vs-non-designated-country treatment, and the
> required subset of Principles 1–10 — running on both the frontend (`deriveCategory`,
> `getPrincipleStatus`) and a real backend (`apply_equator_principles`). This is one of the few
> modules with **no synthetic PRNG anywhere**: everything is deterministic rule logic grounded in
> EP IV / OECD Common Approaches / IFC PS. The sections below document that real logic.

### 7.1 What the module computes

The core output is a **project category** and a **per-principle applicability status**. Frontend
`deriveCategory` (a quick client-side classifier):

```js
highRisk = [Energy, Mining, Infrastructure]; medRisk = [Manufacturing, Agriculture, Transport, Water/Sanitation]
if (highRisk.includes(sector) && value >= $10M) return 'A'
if (highRisk.includes(sector) || (medRisk.includes(sector) && value >= $50M)) return 'B'
if (medRisk.includes(sector)) return 'B'
return 'C'
```

`getPrincipleStatus(num)` then marks each of the 10 principles `required | conditional | not_required`
by category:
- **Category C** → only P1 (Review) required; P10 (Reporting) required only if value ≥ $100M.
- **Category A** → all 10 required; P7 (Indigenous Peoples) `conditional` unless `indigenousAffected`.
- **Category B** → P1–P6, P8, P10 required; P7 conditional on IP impact; **P9 (Independent
  Monitoring)** required only in **non-designated** countries, else conditional.

The authoritative version runs server-side (`POST /api/v1/export-credit-esg/equator-principles` →
`apply_equator_principles`), which additionally returns `ep_applicable`, ESIA scope, required
standards, and IESC-review flag.

### 7.2 Parameterisation / rubric (all named-standard, not synthetic)

| Rule | Value | Provenance |
|---|---|---|
| EP applicability threshold | $10 M project value | EP IV scope (`EP_APPLICABILITY_THRESHOLD_USD`) |
| High-risk sectors | Energy, Mining, Infrastructure | OECD Common Approaches sector risk |
| Designated countries | 23 high-income OECD (US, GB, DE, FR, JP, KR, AU, CA, …) | EP IV Annex — designated-country list |
| Category A | high-risk sector ≥ $10 M | OECD Category A (significant adverse E&S) |
| Category B | high-risk any value, or med-risk ≥ $50 M | OECD Category B (limited/site-specific) |
| Category C | remainder | OECD Category C (minimal/no impact) |
| Backend high-risk-B | Cat-B + (community ∨ indigenous affected) → full 10 | EP IV escalation for sensitive B |

Reference tables are all real EP IV content: `EP_PRINCIPLES` (all 10 with requirement checklists),
`IFC_PS` (PS1–PS8 with scope), `ESIA_STAGES` (Screening→Monitoring with document lists and
timelines).

### 7.3 Calculation walkthrough

1. User enters project name, value, country, sector and sensitivity flags (community / indigenous /
   cultural heritage / existing ESIA).
2. `autoCategory = deriveCategory(sector, value)`; user may override via `categoryOverride`.
3. `isDesignated = DESIGNATED_COUNTRIES.includes(country)` → picks IFC PS vs host-country law.
4. `getPrincipleStatus` walks 1–10 producing the required/conditional/not-required checklist.
5. On "Assess", the same inputs POST to the backend, which re-derives category via
   `_resolve_oecd_category`, sets `high_risk_b`, assembles `requirements[]` (ESIA commissioning,
   IFC-PS applicability, FPIC for IP, PS8 for heritage, IESC review for A/high-risk-B) and returns
   the applicable-principle detail objects plus a sample of EP signatory banks.

### 7.4 Worked example — $50 M energy project in India

Inputs: sector=Energy, value=$50 M, country=IN (non-designated), no IP impact.

| Step | Computation | Result |
|---|---|---|
| deriveCategory | Energy ∈ highRisk, $50M ≥ $10M | **Category A** |
| isDesignated | IN ∉ DESIGNATED_COUNTRIES | false → **IFC PS apply** |
| P1–P6, P8, P10 | Category A | required |
| P7 (Indigenous) | A but `indigenousAffected=false` | **conditional** |
| P9 (Monitoring) | Category A | required |
| Backend requirements | not-designated + A | "Commission full ESIA", "IFC PS apply", "IESC review required" |

Change the country to Germany (designated): category stays A (sector/value unchanged), but
`required_standards` flips to "Host Country Law" and P9 monitoring can relax to conditional in the
Category-B path. Everything is reproducible rule logic — no random draws.

### 7.5 Data provenance & limitations

- **No synthetic data.** Category, principle applicability, designated-country list, IFC-PS mapping
  and ESIA stages are all EP IV / OECD / IFC standard content. This is a compliance-workflow tool,
  not a statistical model.
- **The ESAP scoring the guide describes is absent** — there is no action-item tracker, no
  closed/total ratio, no overdue-severity penalty. A production build would add the ESAP register
  (see §8).
- `deriveCategory` is a coarse sector×threshold heuristic; real EP categorisation is impact-based
  (magnitude, reversibility, sensitivity of receptors) via full ESIA, which the module does not model.
- Designated-country list is hard-coded (23 entries) and would need periodic reconciliation with the
  EP Association's official list.

**Framework alignment:** **Equator Principles IV (2020)** — the 10-principle structure, $10 M
threshold, A/B/C categorisation and designated/non-designated split are implemented directly ·
**IFC Performance Standards (2012), PS1–PS8** — mapped in `IFC_PS` and invoked for non-designated
projects · **OECD Common Approaches** — the Category A/B/C criteria and ESIA-scope tiers · **IFC PS7
FPIC** for indigenous peoples and **PS8** for cultural heritage are triggered by the sensitivity
flags.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's ESAP Compliance Score has no
implementation; here is the production model for the ESAP monitoring the guide describes.

**8.1 Purpose & scope.** For an EP-financed project, quantify environmental-and-social action-plan
(ESAP) execution health across the financing life, so lenders can trigger covenant reviews and satisfy
EP10 annual public reporting.

**8.2 Conceptual approach.** A severity-weighted attainment score in the spirit of lender
independent-monitoring reporting cycles (EP Principles 8–9) and IFC ESMS performance-indicator
tracking — analogous to operational-risk overdue-action aging used in bank issue-management systems.

**8.3 Mathematical specification.**
- Base closure: `B = Closed / Total × 100`.
- Overdue penalty: `P = Σ_i sev_i · overdue_i · agingFactor(d_i)`, where `sev_i∈{Low 1, Med 2, High 3,
  Critical 5}`, `overdue_i∈{0,1}`, and `agingFactor(d) = 1 + min(1, d/90)` (linear aging to 2× at 90+
  days overdue).
- Score: `ESAP = max(0, B − P)`; covenant-breach flag when `ESAP < 80` at financial close (guide's
  stated threshold) or any `Critical` item overdue > 30 days.

| Parameter | Value / source |
|---|---|
| Severity weights 1/2/3/5 | IESC severity ratings (EP monitoring practice) |
| Aging cap 2× at 90 days | conservative issue-aging convention |
| Covenant threshold 80% | guide ("below 80% at financial close raises breach risk") |

**8.4 Data requirements.** ESAP register: action id, IFC-PS reference, owner, due-date, close-date,
severity, status. Sourced from the ESIA/ESMP and IESC monitoring reports; none currently stored in
the platform for this module.

**8.5 Validation & benchmarking plan.** Backtest ESAP score against realised covenant events;
sensitivity of score to severity-weight and aging-cap choices; reconcile against IESC semi-annual
report conclusions for the same projects.

**8.6 Limitations & model risk.** Severity ratings are judgemental (IESC-assigned); the aging factor
is a modelling convention; a single Critical item can be masked by many closed low-severity items
unless the hard Critical-overdue override is enforced.
