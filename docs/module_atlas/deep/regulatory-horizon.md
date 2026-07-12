## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — same frontend/backend disconnect pattern as
> `regulatory-calendar` and `regulatory-capital`.** `backend/services/regulatory_horizon_engine.py`
> (1,479 lines) is a genuinely detailed engine: a real 60-regulation pipeline (2024–2030, with
> actual regulation IDs like `EU_CSDDD`, `EU_EUDR`, real adoption/in-force/compliance-deadline
> dates, real impact scores and cost categories), a 6-entity-type × 60-regulation applicability
> matrix, cost benchmarks by entity size, a regulatory interconnection/dependency map with
> **topological sort** (`_topological_sort`), and four working POST endpoints (`/scan`,
> `/readiness`, `/regulatory-burden`, `/synergies`) plus 4 `/ref/*` GET endpoints. **The frontend
> never calls any of them** — no `fetch`/`axios`/`useModuleData` exists in
> `RegulatoryHorizonPage.jsx`. Instead, the frontend independently generates its own 60-row `REGS`
> array using real-sounding regulation *names* (borrowed conceptually from the same universe —
> CSRD Wave 3, CSDDD Implementation, EU Taxonomy Delegated Act 3, etc.) but **every numeric and
> status field — jurisdiction, topic, status, dates, impact score, cost, FTE, readiness, gap
> count, priority — is `sr()`-seeded**, unrelated to the real backend pipeline's actual dates and
> costs for the same-named regulations.

### 7.1 What the backend engine computes (real, not rendered)

```python
scan_horizon(...)                        # filters/aggregates the 60-regulation REGULATION_PIPELINE
assess_implementation_readiness(...)     # entity-specific readiness against applicability matrix
calculate_regulatory_burden(...)         # aggregates estimated_compliance_cost_category × entity size
identify_synergies(...)                  # finds regulations with overlapping requirements
_topological_sort(regulation_ids)        # orders regulations by dependency (e.g. CSRD before ESRS sector standards)
```

`REGULATION_PIPELINE[0]` example (real, verifiable): `EU_CSDDD` — Corporate Sustainability Due
Diligence Directive, jurisdiction EU, status "adopted", `expected_in_force_date=2024-07-25`,
`compliance_deadline=2027-07-26`, `impact_score=5`, cost category "very_high" — genuinely
researched regulatory facts.

### 7.2 What the frontend actually displays

```js
REGS = Array.from({length:60}, (_,i) => ({
  name: names[i],                                    // 60 real-sounding regulation names, curated
  jurisdiction: JURISDICTIONS[i % 15],                // deterministic round-robin, not the real regulation's actual jurisdiction
  topic: TOPICS[floor(sr(i×3)×10)],
  status: STATUSES[floor(sr(i×7)×5)],
  impactScore: round(30+sr(i×23)×70),                 // 30–100, seeded — unrelated to backend's 1–5 impact_score
  complianceCost: round(50+sr(i×29)×950),              // $k, seeded
  fte: round(1+sr(i×31)×12),
  readiness: round(10+sr(i×37)×80),
  gapCount: round(sr(i×41)×15),
  priority: PRIORITIES[floor(sr(i×43)×4)],
}))
compGapMatrix = 30 named real companies × first 20 REGS, each cell status/score independently seeded
```

The jurisdiction assignment (`i % 15`, a fixed round-robin over the 15-jurisdiction list) means
**every 15th regulation in array order shares the same jurisdiction regardless of what the
regulation actually is** — e.g. whichever regulation lands at index 15 gets the same jurisdiction
as index 0, purely by array position, not by the regulation's real geography.

### 7.3 Calculation walkthrough (frontend, as actually rendered)

1. **Regulation table** (`REGS`, 60 rows): filterable by jurisdiction/topic/status/priority.
2. **KPIs**: `total=60`, `inForce` (count `status==='In Force'`), `avgReadiness`, `totalCost`,
   `critCount`, `avgGaps` — all straight aggregates over the seeded `REGS`.
3. **Weighted priority score** (`weighted`): `complianceCost/10×costWeight% +
   impactScore×complexityWeight% + gapCount×5×timelineWeight%` — a genuine user-adjustable
   3-factor weighted scoring formula (cost/complexity/timeline sliders sum to 100%), applied to
   the seeded per-regulation fields — this **is** a real implementation of a prioritisation
   formula, just operating on fabricated inputs rather than the real backend's cost/impact data.
4. **Compliance gap matrix** (`compGapMatrix`): 30 named real companies × 20 regulations, each
   cell an independently seeded status (Compliant/Partial/Gap/N/A) and 0–100 score — no actual
   company-regulation applicability logic (contrast with the backend's real 6×60 entity
   applicability matrix, which is never consulted here).
5. **Timeline** (`timelineData`): 8 quarters (Q1 2025–Q4 2026), `starting`/`deadline` counts and a
   cumulative total, all seeded.
6. **Alerts**: 12 static, dated, realistic-sounding regulatory news items (hardcoded, not derived
   from `REGS`).

### 7.4 Worked example — the disconnect, quantified

Regulation named `'CSDDD Implementation'` appears in the frontend's `REGS[3]` (index 3, matching
the backend's real `EU_CSDDD` in spirit). Backend truth: EU, adopted 2024-07-25, compliance
deadline 2027-07-26, impact 5/5, cost "very_high". Frontend's `REGS[3]`:

| Field | Frontend value (seeded) | Backend truth |
|---|---|---|
| `jurisdiction` | `JURISDICTIONS[3%15]` = **`Germany`** (4th in the fixed list) | **EU** |
| `status` | `STATUSES[floor(sr(21)×5)]`, e.g. **"Consultation"** | **"adopted"** |
| `deadline` | `Q?+2026/2027` (seeded quarter) | **2027-07-26** (exact date, real) |
| `impactScore` | `30+sr(69)×70`, e.g. **≈78/100** | **5/5** (different scale entirely) |

Any user relying on the frontend for CSDDD's actual jurisdiction or deadline would be misled by a
seeded value that happens to share the regulation's name but none of its real attributes.

### 7.5 Weighted priority formula (real formula, fabricated inputs)

```
weightedScore = complianceCost/10 × costWeight% + impactScore × complexityWeight% + gapCount×5 × timelineWeight%
```

User-adjustable sliders for `costWeight`/`complexityWeight`/`timelineWeight` (summing to 100%) —
a legitimate MCDA (multi-criteria decision analysis)-style weighting mechanism, undermined only by
running on seeded rather than real inputs.

### 7.6 Companion analytics

Horizon Map (60-regulation table + filters), Compliance Gap Matrix (30 companies × 20 regs),
Timeline (8-quarter pipeline chart), Alert System (12 static alerts), Priority Scoring
(weighted-score ranking with adjustable sliders), Jurisdiction/Topic/Status breakdowns.

### 7.7 Data provenance & limitations

- **The backend is the platform's real regulatory-intelligence source** — 60 genuinely researched
  regulations with real dates, a real entity-applicability matrix, and dependency-aware
  topological sorting for implementation sequencing. None of it reaches the UI.
- **The frontend's 60 regulation names are real and well-chosen** (matching the same universe the
  backend covers) but every other field is fabricated — this is the most misleading pattern found
  in this batch, because the regulation *names* look authoritative while their dates/status/cost
  are not.
- Fixing this requires wiring `RegulatoryHorizonPage.jsx` to `GET /ref/regulation-pipeline` (for
  the base 60-row table) and `POST /scan`/`/readiness`/`/regulatory-burden`/`/synergies` (for the
  interactive tabs) — the backend's response shapes would need to be mapped onto the existing
  `REGS`/`compGapMatrix` UI structures, but no new backend logic is required.
- `compGapMatrix`'s 30×20 grid should be replaced with the real `_build_applicability_matrix()`
  (6 entity types × 60 regulations) joined against the user's actual entity type, rather than an
  arbitrary company list with seeded scores.

**Framework alignment:** EC DG FISMA / IOSCO Sustainability Workplan / FSB Climate Roadmap —
cited by the guide; the backend's 60-regulation pipeline genuinely spans this universe (CSDDD,
EUDR, SFDR, SEC Climate Rule, ISSB, TNFD, Basel green risk weights, MAS/HKMA/APRA/JFSA regional
rules) with real citation-grade detail · the frontend surfaces the same *names* but with
independently fabricated dates/status/cost that should not be relied upon until the wiring gap is
closed.
