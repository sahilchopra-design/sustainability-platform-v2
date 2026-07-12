# Regulatory Horizon Scanner
**Module ID:** `regulatory-horizon` · **Route:** `/regulatory-horizon` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Forward-looking regulatory pipeline for ESG and sustainability regulation globally. Covers consultations, proposed rules, upcoming effective dates, and impact assessment for 20+ jurisdictions.

> **Business value:** Staying ahead of regulatory change is critical — implementing changes at the last minute creates operational risk. This module provides the regulatory intelligence needed to plan compliance projects with adequate lead time across all applicable jurisdictions.

**How an analyst works this module:**
- Horizon Map shows regulatory timeline by jurisdiction
- Alert System flags upcoming deadlines and consultation closes
- Impact Assessment shows which reports and modules are affected

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `Badge`, `COMPANIES`, `JURISDICTIONS`, `Kpi`, `PIE_C`, `REGS`, `Row`, `STATUSES`, `STATUS_C`, `TABS`, `TOPICS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ALERTS` | 13 | `id`, `date`, `title`, `severity`, `jurisdiction` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOPICS` | `['Reporting','Disclosure','Climate','Taxonomy','Governance','Human Rights','Technology','Biodiversity','Due Diligence','Anti-Greenwashing'];` |
| `names` | `['CSRD Wave 3 SMEs','SFDR Level 3 RTS','EU AI Act FinSvcs','CSDDD Implementation','EU Taxonomy Delegated Act 3','UK SDR Anti-Greenwash','FCA Sustainability Labels','PRA Climate SS3/23','SEC Climate Rule Final','SEC ESG F` |
| `compGapMatrix` | `COMPANIES.map((c,ci)=>({company:c,gaps:REGS.slice(0,20).map((r,ri)=>({reg:r.name,status:['Compliant','Partial','Gap','N/A'][Math.floor(sr(ci*100+ri*7)*4)],score:Math.round(sr(ci*50+ri*13)*100)}))}));` |
| `exportCSV` | `(rows,filename)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.` |
| `kpis` | `useMemo(()=>({ total:REGS.length, inForce:REGS.filter(r=>r.status==='In Force').length, avgReadiness:Math.round(REGS.reduce((a,r)=>a+r.readiness,0)/REGS.length), totalCost:Math.round(REGS.reduce((a,r)=>a+r.complianceCost,0)), critCount:REGS.filter(r=>r.priority==='Critical').length, avgGaps:Math.round(REGS.reduce((a,r)=>a+r.gapCount,0)/RE` |
| `byJurisdiction` | `useMemo(()=>JURISDICTIONS.map(j=>({name:j,count:REGS.filter(r=>r.jurisdiction===j).length,avgImpact:Math.round(REGS.filter(r=>r.jurisdiction===j).reduce((a,r)=>a+r.impactScore,0)/(REGS.filter(r=>r.jurisdiction===j).lengt` |
| `byTopic` | `useMemo(()=>TOPICS.map(t=>({name:t,value:REGS.filter(r=>r.topic===t).length})),[]);` |
| `byStatus` | `useMemo(()=>STATUSES.map(s=>({name:s,value:REGS.filter(r=>r.status===s).length})),[]);` |
| `timelineData` | `useMemo(()=>['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026'].map((q,i)=>({quarter:q,starting:Math.round(3+sr(i*71)*8),deadline:Math.round(2+sr(i*73)*10),cumulative:Math.round((i+1)*7+sr(i` |
| `weighted` | `filtered.map(r=>({...r,weightedScore:Math.round((r.complianceCost/10*impactWeights.cost/100)+(r.impactScore*impactWeights.complexity/100)+(r.gapCount*5*impactWeights.timeline/100))})).sort((a,b)=>b.weightedScore-a.weight` |
| `topChart` | `weighted.slice(0,20).map(r=>({name:r.name.slice(0,25),score:r.weightedScore,impact:r.impactScore,cost:Math.round(r.complianceCost/10)}));` |
| `gapCounts` | `{Compliant:0,Partial:0,Gap:0,'N/A':0};co.gaps.forEach(g=>gapCounts[g.status]++);` |
| `gapPie` | `Object.entries(gapCounts).filter(([_,v])=>v>0).map(([k,v])=>({name:k,value:v}));` |
| `gapColors` | `{Compliant:T.green,Partial:T.amber,Gap:T.red,'N/A':T.textMut};` |
| `jurAlertCount` | `JURISDICTIONS.slice(0,8).map(j=>({name:j,alerts:ALERTS.filter(a=>a.jurisdiction===j).length,high:ALERTS.filter(a=>a.jurisdiction===j&&a.severity==='High').length}));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/regulatory-horizon/scan` | `scan` | api/v1/routes/regulatory_horizon.py |
| POST | `/api/v1/regulatory-horizon/readiness` | `readiness` | api/v1/routes/regulatory_horizon.py |
| POST | `/api/v1/regulatory-horizon/regulatory-burden` | `regulatory_burden` | api/v1/routes/regulatory_horizon.py |
| POST | `/api/v1/regulatory-horizon/synergies` | `synergies` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/regulation-pipeline` | `ref_regulation_pipeline` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/entity-applicability` | `ref_entity_applicability` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/cost-benchmarks` | `ref_cost_benchmarks` | api/v1/routes/regulatory_horizon.py |
| GET | `/api/v1/regulatory-horizon/ref/interconnection-map` | `ref_interconnection_map` | api/v1/routes/regulatory_horizon.py |

### 2.3 Engine `regulatory_horizon_engine` (services/regulatory_horizon_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_build_applicability_matrix` |  |  |
| `RegulatoryHorizonEngine.scan_horizon` | entity_type, jurisdiction, sectors, time_horizon_years | Identify applicable regulations, sort by deadline + impact, estimate compliance cost, produce change velocity score and top-5 priority list. |
| `RegulatoryHorizonEngine.assess_implementation_readiness` | entity_type, current_capabilities, target_regulation | Gap analysis for a specific regulation. current_capabilities: {capability_name: bool} Returns readiness gap, effort estimate, timeline, dependency chain. |
| `RegulatoryHorizonEngine.calculate_regulatory_burden` | entity_type, aum_usd_bn, jurisdiction | Estimate total compliance cost across all applicable regulations. |
| `RegulatoryHorizonEngine.identify_synergies` | regulation_list | Identify shared data requirements, process overlaps, implementation savings, and sequencing recommendations across a set of regulations. |
| `RegulatoryHorizonEngine.ref_regulation_pipeline` |  |  |
| `RegulatoryHorizonEngine.ref_entity_applicability` |  |  |
| `RegulatoryHorizonEngine.ref_cost_benchmarks` |  |  |
| `RegulatoryHorizonEngine.ref_interconnection_map` |  |  |
| `_estimate_effort` | requirement, cost_cat |  |
| `_aggregate_by` | cost_breakdown, regulations, field |  |
| `_topological_sort` | regulation_ids | Simple dependency-aware sort — regulations with more dependents come last. |
| `get_engine` |  |  |

**Engine `regulatory_horizon_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ENTITY_TYPES` | `['bank', 'insurer', 'asset_manager', 'corporate', 'pension', 'all']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `other`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ALERTS`, `COMPANIES`, `JURISDICTIONS`, `PIE_C`, `STATUSES`, `TABS`, `TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Developments | — | Tracker | Regulatory changes in pipeline globally |
| Jurisdictions | — | Coverage | EU, UK, US, Singapore, HK, Australia, Japan, India, Brazil |
- **Regulatory sources** → Change classification → **Impact assessment**
- **Upcoming deadlines** → Alert generation → **Compliance calendar**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-horizon/ref/cost-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/regulatory-horizon/ref/entity-applicability** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/regulatory-horizon/ref/interconnection-map** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/regulatory-horizon/ref/regulation-pipeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**POST /api/v1/regulatory-horizon/readiness** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/regulatory-horizon/regulatory-burden** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/regulatory-horizon/scan** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/regulatory-horizon/synergies** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory pipeline tracking
**Headline formula:** `Impact = Scope × Magnitude × Urgency per regulatory development`

50+ active regulatory developments tracked. Status: consultation open → final rule → effective date → enforcement. Impact assessment: which platform modules and client disclosures are affected.

**Standards:** ['EC DG FISMA', 'FCA', 'SEC', 'IOSCO']
**Reference documents:** EC FISMA Regulatory Roadmap; IOSCO Sustainability Workplan; FSB Climate Roadmap

**Engine `regulatory_horizon_engine` — extracted transformation lines:**
```python
cutoff_year = today.year + time_horizon_years
change_velocity = round(min(10.0, max_per_yr * 1.5), 1)
readiness_pct = round(met_count / max(len(required), 1) * 100, 1)
external_advisor_usd = round((total_one_time + total_annual) * ext_advisor_pct, 0)
tech_investment_usd = round(total_one_time * 0.50, 0)
combined_savings_pct = min(45.0, total_shared * savings_pct_per_shared * 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Surface the real pipeline and its topological sequencing (analytics ladder: rung 2 → 3)

**What.** §7.7 calls this the most misleading pattern in its batch: a 1,479-line backend engine with 60 genuinely researched regulations (real IDs like `EU_CSDDD`, real adoption/in-force dates, cost benchmarks by entity size, a 6-entity-type applicability matrix, and dependency-aware `_topological_sort` for implementation sequencing) behind four working POST endpoints the frontend never calls — while the page shows the same 60 authoritative-looking regulation *names* with every date, cost, FTE, and readiness field `sr()`-seeded. Evolution A is the §7.7-prescribed wiring (map `GET /ref/regulation-pipeline` and `/scan`/`/readiness`/`/regulatory-burden`/`/synergies` responses onto the existing UI structures — no new backend logic), followed by making the pipeline maintainable.

**How.** (1) Wire all tabs; delete the seeded `REGS` generator. The synergies/dependency view is the differentiator — no sibling module surfaces implementation *sequencing* ("CSRD data infrastructure is a prerequisite for CSDDD due-diligence reporting"), and the engine already computes it. (2) Maintenance path: the 60-regulation dataset gets per-record review dates and an editorial update workflow (a horizon scanner's value halves with each stale quarter); link records to `regulatory-calendar` obligations and `regulatory-change-radar` watchlist items so the three regulatory modules share one fact base with different lenses. (3) Readiness inputs move from seeded scores to the org's actual `regulatory-gap` assessment where frameworks overlap.

**Prerequisites.** Response-shape mapping work (the only real effort); editorial ownership. **Acceptance:** the UI's dates match the engine's records for spot-checked regulations; the sequencing view renders the topological order; a record edited in the backend changes the page without frontend code.

### 9.2 Evolution B — Implementation-planning copilot over the dependency graph (LLM tier 2)

**What.** The engine's unique asset — the regulation dependency graph with cost benchmarks — is planning material: "we're a mid-size EU asset manager: sequence our 2026–2028 regulatory implementations, estimated burden per phase, and where do CSRD and CSDDD workstreams share infrastructure?" The copilot composes `/scan` (applicability), `/regulatory-burden` (cost by entity size), and `/synergies` (shared-workstream detection) into a phased plan the engine's topological sort already orders.

**How.** Tier-2 tool schemas over the four POST operations and ref endpoints; the copilot narrates engine output — phase ordering from the topological sort, burden figures from the cost benchmarks with their entity-size band cited, synergies from the dependency map — and drafts the plan through report studio. Guardrails: cost benchmarks are presented as category estimates with their basis (the engine's own benchmark labels), never as quotes; regulations past their record review date are flagged; questions about jurisdictions outside the 60-record pipeline receive a coverage answer. Entity-profile inputs come from the shared org profile used by the calendar and gap modules.

**Prerequisites (hard).** Evolution A wiring — planning advice from seeded readiness scores would be professionally harmful; review-date fields. **Acceptance:** a generated plan's phase order matches the engine's topological output; every cost figure carries its benchmark band; stale records are visibly flagged in the plan.