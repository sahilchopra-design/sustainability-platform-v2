## 7 · Methodology Deep Dive

The Carbon Project Lifecycle Manager is a workflow/state-tracking module aligned with its guide: it models
the 8-stage carbon-project lifecycle, a 7-section PDD builder, an MRV/validation stage tracker, and
issuance milestones, using real methodology codes, registries, VVBs, and crediting-period rules. It does
not run a risk or valuation model, so §8 is not triggered (one mislabelled quantity is flagged instead).

### 7.1 What the module computes

For 60 projects distributed across the 8 lifecycle stages, the module derives pipeline aggregates and
per-project progress:

```js
totalExpected = estimatedAnnualCredits × creditingPeriodYrs         // lifetime credit volume
issued        = stage∈{Issuance,Renewal,Verification} ? totalExpected×(0.3..0.8)
              : stage==='Monitoring'                    ? totalExpected×(0.1..0.3) : 0
pipeline      = Σ totalExpected
issuedYTD     = Σ issued
avgCycle      = mean(daysSinceLast)
npv           = (issuedYTD × 12 / 1e6).toFixed(1)                   // ⚠ NOT an NPV
totalScore    = doneItems / totalItems × 100                        // PDD completeness
```

The PDD builder scores completeness across `PDD_SECTIONS` (33 checklist items across the 7 mandatory
sections); the validation tracker steps projects through `VAL_STAGES` with target durations.

### 7.2 Parameterisation

**Lifecycle stages** (`STAGES`): Conception → PDD Development → Validation → Registration → Monitoring →
Verification → Issuance → Renewal/Expired — the canonical Verra/CDM project flow.

**Real reference lists** (provenance: authentic standards taxonomy):

| List | Values |
|---|---|
| REGISTRIES | Verra VCS, Gold Standard, CDM, ACR, CAR |
| METHODOLOGIES | VM0007, ACM0002, GS-METH-COOK, VM0015, AMS-I.D, VM0042 … (real codes) |
| VVBS | Bureau Veritas, SGS, TÜV SÜD, DNV, RINA, LRQA, ERM CVS (real accredited bodies) |
| VCU_TYPES | VCU, GS-VER, CER, ACER, CRT |
| CRED_PERIOD_YRS | 7/10/20/30 yr — real crediting periods (e.g. VM0042 soil = 30yr, biogas = 20yr) |

**Synthetic per-project fields** (`sr()`-seeded): estimated annual credits (5k–100k), issuance %, PDD
completion %, CARs open/closed, days-since-last-activity, validation/verification status. The stage,
registry, methodology, country, and sector are assigned by round-robin (`i % length`), not random.

### 7.3 Calculation walkthrough

Projects are bucketed by stage (`stageCounts`) → pipeline totals summed → issued-YTD summed → the "npv"
KPI is `issuedYTD × 12 / 1e6` (i.e. it values issued credits at a flat **$12/credit** and expresses in
$M — a credit-volume proxy, not a discounted cash flow). The PDD builder counts checked items against 33
total for a completeness %. The validation tracker advances a selected project through the stage list with
target vs actual days-in-stage.

### 7.4 Worked example (pipeline + PDD)

A project: `estimatedAnnualCredits = 40,000`, `creditingPeriodYrs = 10` → `totalExpected = 400,000`
credits. Stage = Issuance → `issued = 400,000 × (0.3..0.8)`, say ×0.55 = **220,000** credits issued.

Pipeline "npv" contribution: `220,000 × 12 / 1e6 = $2.64M` (at the flat $12/credit heuristic).

PDD completeness: if 24 of the 33 `PDD_SECTIONS` items are checked → `totalScore = 24/33 × 100 = 72.7%`.

### 7.5 Companion analytics & interconnections

- **Stage funnel** — project counts and credit volumes per lifecycle stage.
- **PDD builder** — 7-section (A description, B baseline, C duration, D monitoring, E GHG impacts, F SD
  impacts, G stakeholder consultation) checklist with weighted completeness.
- **MRV / calibration schedule** — per-parameter last/next calibration dates with Overdue/Due-Soon/OK
  status (`FREQ_RULES`).
- **Crediting rules** (`CRED_RULES`) — AFOLU vs non-AFOLU crediting-period and renewal rules.

### 7.6 Data provenance & limitations

- Methodology codes, registries, VVBs, credit types, and crediting-period years are **real**; project
  instances and all progress metrics are **synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- The `npv` KPI is **mislabelled** — it is issued-credit volume valued at a flat $12/credit, not a
  discounted cash flow; it ignores price differentiation by methodology (the pricing module handles that)
  and has no discounting.
- The module tracks *state*, not economics — no project finance, no MRV data ingestion, no live registry
  serial numbers.

**Framework alignment:** Verra VCS Standard v4.0 — the 8-stage lifecycle, PDD structure, and VCU issuance ·
UNFCCC CDM Modalities & Procedures — CDM registration flow and CER credit type · Gold Standard for Global
Goals v2.0 — GS-VER credit type and SD-impact PDD section · Paris Agreement Article 6.4 — the mechanism the
lifecycle can target for authorised credits · ISO 14064-2/3 — the MRV monitoring-plan and validation/
verification steps the tracker sequences (VVB validation before registration, periodic verification before
each issuance).
