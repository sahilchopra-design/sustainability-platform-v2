# ISSB Materiality Assessment
**Module ID:** `issb-materiality` · **Route:** `/issb-materiality` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISSB S1 materiality assessment applying enterprise value materiality test. Covers the materiality determination process, investor-focused assessment, connectivity between financial and sustainability information.

> **Business value:** Materiality determination is the gating step for all ISSB disclosures. A robust, documented process reduces legal risk and focuses reporting effort on what matters to investors. This module enables systematic, auditable materiality assessments aligned with ISSB S1.

**How an analyst works this module:**
- Materiality Process Builder documents assessment methodology
- Topic Universe covers SASB sector standards as starting point
- Stakeholder Input records investor consultation evidence
- Connectivity Map links material topics to financial statement line items
- Materiality Statement generates board-approved determination

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CAT_COLORS`, `ISSB_S2_REQUIREMENTS`, `ISSB_TCFD_MAP`, `IssbMaterialityPage`, `KpiCard`, `LS_OVERRIDES`, `LS_PORT`, `SASB_MATERIALITY`, `SECTORS`, `Section`, `TCFD_RECS`, `TOPICS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ISSB_S2_REQUIREMENTS` | 12 | `pillar`, `requirement`, `issb_ref` |
| `TCFD_RECS` | 12 | `pillar`, `rec` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `pct` | `v => `${(v * 100).toFixed(1)}%`;` |
| `enriched` | `useMemo(() => holdings.map(h => {` |
| `s2Status` | `ISSB_S2_REQUIREMENTS.map(req => {` |
| `discScore` | `+((met * 100 + partial * 50) / s2Status.length).toFixed(1);` |
| `filtered` | `useMemo(() => sectorFilter === 'All' ? enriched : enriched.filter(h => h.mappedSector === sectorFilter), [enriched, sectorFilter]);  /* ── Sort helpers ──────────────────────────────────────────── */ const doSort = (key) => setSort(p => ({ key, asc: p.key === key ? !p.asc : false }));` |
| `kpis` | `useMemo(() => { const totalW = enriched.reduce((s, h) => s + h.weight, 0) \|\| 1;` |
| `weightedTopics` | `enriched.reduce((s, h) => s + h.materialTopics * (h.weight / totalW), 0);` |
| `avgTopics` | `enriched.length ? enriched.reduce((s, h) => s + h.materialTopics, 0) / enriched.length : 0;` |
| `avgCompliance` | `enriched.length ? enriched.reduce((s, h) => s + h.disclosureScore, 0) / enriched.length : 0;` |
| `sectorsCovered` | `[...new Set(enriched.map(h => h.mappedSector))].length;` |
| `envT` | `enriched.reduce((s, h) => s + h.envTopics, 0) / (enriched.length \|\| 1);` |
| `socT` | `enriched.reduce((s, h) => s + h.socTopics, 0) / (enriched.length \|\| 1);` |
| `govT` | `enriched.reduce((s, h) => s + h.govTopics, 0) / (enriched.length \|\| 1);` |
| `avgCov` | `enriched.reduce((s, h) => s + h.dataCoverage, 0) / (enriched.length \|\| 1);` |
| `highSector` | `Object.entries(SASB_MATERIALITY.matrix).sort((a, b) => b[1].length - a[1].length)[0];` |
| `avgDisc` | `enriched.reduce((s, h) => s + h.disclosureScore, 0) / (enriched.length \|\| 1);` |
| `topicFreq` | `useMemo(() => { const totalW = enriched.reduce((s, h) => s + h.weight, 0) \|\| 1;` |
| `s2Agg` | `useMemo(() => ISSB_S2_REQUIREMENTS.map(req => {` |
| `gap` | `enriched.length - met - partial;` |
| `doubleMat` | `useMemo(() => TOPICS.map(t => {` |
| `financial` | `+(20 + sr(s, 1) * 80).toFixed(0);` |
| `impact` | `+(20 + sr(s, 2) * 80).toFixed(0);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"` ).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `ids` | `overrideTopics.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);` |
| `radarData` | `pillars.map(p => {` |
| `avg` | `reqs.length ? reqs.reduce((s, r) => s + r.pctMet, 0) / reqs.length : 0;` |
| `metTotal` | `enriched.reduce((s, h) => s + h.met, 0);` |
| `partialTotal` | `enriched.reduce((s, h) => s + h.partial, 0);` |
| `gapTotal` | `enriched.reduce((s, h) => s + h.gaps, 0);` |
| `catAgg` | `Object.entries(CAT_COLORS).map(([cat, color]) => ({` |
| `avgT` | `b.filter.length ? (b.filter.reduce((s, h) => s + h.materialTopics, 0) / b.filter.length).toFixed(1) : 0;` |
| `avgD` | `b.filter.length ? (b.filter.reduce((s, h) => s + h.disclosureScore, 0) / b.filter.length).toFixed(1) : 0;` |
| `avgC` | `b.filter.length ? (b.filter.reduce((s, h) => s + h.dataCoverage, 0) / b.filter.length).toFixed(1) : 0;` |
| `catDblData` | `Object.keys(CAT_COLORS).map(cat => {` |
| `dataAvail` | `Math.floor(t.count * (0.4 + sr(hashStr(t.id), 3) * 0.55));` |
| `gapPct` | `t.count ? +((gap / t.count) * 100).toFixed(0) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ISSB_S2_REQUIREMENTS`, `TCFD_RECS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Material Topics | — | Assessment | Varies by sector and business model |
| Test Standard | — | ISSB S1 | Single materiality, investor perspective only |
| Connectivity | — | ISSB S1 Para 19 | Required linkage to financial statements |
- **Business model analysis** → Sustainability risk identification → **Material topic longlist**
- **Investor consultation** → Significance assessment → **Material topic shortlist**
- **Material topics** → Financial impact linkage → **Connectivity to financial statements**

## 5 · Intermediate Transformation Logic
**Methodology:** Enterprise value materiality test
**Headline formula:** `Material = significant_impact_on_enterprise_value (actual or reasonably expected)`

ISSB uses single materiality (investor-focused). Topic is material if reasonably expected to affect enterprise value through risks/opportunities. Contrast with CSRD double materiality (impact + financial). Connectivity: links sustainability to financial statements.

**Standards:** ['ISSB IFRS S1 (2023)', 'IASB Materiality Practice Statement']
**Reference documents:** ISSB IFRS S1 General Requirements; SASB Industry Standards; IASB Practice Statement 2 on Materiality

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *materiality determination
> process* tool — "Materiality Process Builder documents assessment methodology," "Stakeholder Input
> records investor consultation evidence," "Connectivity Map links material topics to financial
> statement line items," "Materiality Statement generates board-approved determination." **None of
> these workflow features exist in the code.** What the page actually implements is a **static
> SASB-sector materiality heatmap crossed with a per-holding, seeded-random ISSB S2 compliance
> score** — a mapping/scoring tool, not a process/evidence-capture tool. The sections below document
> the code as it actually behaves.

### 7.1 What the module computes

Two independent layers, both keyed off a portfolio of holdings (loaded from `localStorage` or
defaulted to the first 30 rows of `GLOBAL_COMPANY_MASTER`):

1. **SASB materiality mapping** — a static lookup table `SASB_MATERIALITY.matrix` assigns each of
   11 GICS sectors a fixed subset of 26 SASB-style topics (`E01`–`E08` Environment, `S01`–`S05`
   Social Capital, `H01`–`H04` Human Capital, `B01`–`B05` Business Model, `G01`–`G04` Governance).
   Each holding is matched to a sector via substring match, and its material topic set is
   `matrix[sector] ∪ overrides.add − overrides.remove` (manual overrides persist in
   `localStorage: ra_materiality_overrides_v1`).
2. **ISSB S2 compliance status** — for the 11-item `ISSB_S2_REQUIREMENTS` list, each holding gets a
   Met/Partial/Gap status **per requirement**, entirely from a seeded pseudo-random draw:
   ```js
   v = sr(hashStr(company_name), hashStr(req.id))
   status = v > 0.55 ? 'Met' : v > 0.25 ? 'Partial' : 'Gap'
   disclosureScore = (met×100 + partial×50) / 11
   ```
   There is **no real disclosure data input** — the "compliance level" a user sees for any company
   is a deterministic hash of its name, not an assessment of anything it has actually disclosed.

### 7.2 Parameterisation

| Construct | Values | Provenance |
|---|---|---|
| SASB topics | 26 items across 5 categories | Modelled on real SASB Materiality Map structure/naming; the sector↔topic membership is the module's own simplified approximation, not the literal SASB Materiality Finder dataset |
| GICS sectors | 11 | Matches SASB's 11 sector groups |
| ISSB S2 requirements | 11, 4 pillars (Governance 2, Strategy 4, Risk Mgmt 3, Metrics & Targets 2) | IFRS S2 paragraph references cited per item (e.g. `IFRS S2.5-6`) |
| TCFD recommendations | 11, same 4 pillars | TCFD 2017 final recommendations |
| `ISSB_TCFD_MAP` | 1:1 dictionary, 11 entries | Author-defined cross-walk (S2-S4 Transition Plans → TCFD-S2 Strategy) |
| Status thresholds | `v>0.55`→Met, `v>0.25`→Partial, else Gap | Arbitrary tri-band split of the `sr()` output, not calibrated to any real disclosure-rate distribution |
| Holding weight (synthetic portfolio) | `3 + sr(hashStr(name),1)×7` → 3–10% | Synthetic demo value |
| Data coverage | `50 + sr(s,7)×45` → 50–95% | Synthetic demo value |
| Double materiality financial/impact scores | `20 + sr(hashStr(id),1 or 2)×80` → 20–100 | Synthetic demo value |
| Pillar benchmark (radar) | `40 + sr(hashStr(pillar),5)×40` → 40–80 | Synthetic demo value, not a real peer benchmark |

### 7.3 Calculation walkthrough

- **Heatmap tab** — renders `SASB_MATERIALITY.matrix` directly; clicking a lit cell shows the count
  of portfolio holdings mapped to that sector. Purely a lookup, no computation.
- **Portfolio Profile tab** — `topicFreq` counts, for each of the 26 topics, how many holdings have
  it in their material set and the portfolio-weight-adjusted `weightedPct`; the bar chart ranks
  topics by that percentage.
- **ISSB S2 Compliance tab** — `s2Agg` aggregates the per-holding, per-requirement synthetic status
  counts into a portfolio-level Met/Partial/Gap table with `pctMet = met / n_holdings × 100`.
- **Double Materiality tab** — classifies each of the 26 topics into a 2×2 quadrant
  (Double Material / Financial Only / Impact Only / Monitor) using the synthetic financial/impact
  scores at a 50/50 threshold.
- **Threshold Setter tab** — a slider (10–100%) filters `topicFreq` to topics whose `weightedPct`
  exceeds the threshold — a live re-materialisation of the topic list, still driven by the same
  static SASB matrix and synthetic weights.
- **Manual Override tab** — lets a user add/remove topic IDs per company; stored in `localStorage`
  and merged into `enriched` on every render, so it is the only genuinely user-controlled input in
  the whole page.

### 7.4 Worked example

Holding "Acme Utilities Co", mapped to sector `Utilities` (15 material topics per the matrix).
`hashStr("Acme Utilities Co")` yields some integer `s`. For requirement `S2-M1` (Scope 1/2/3
disclosure):

| Step | Computation | Result (illustrative) |
|---|---|---|
| `hashStr('S2-M1')` | Java-style 31-multiplier rolling hash | e.g. `-142_857_331` |
| `v = sr(s, hash)` | `frac(sin(s + hash + 1) × 10,000)` | e.g. `0.71` |
| Status | `0.71 > 0.55` | **Met** |
| Repeat for 11 requirements | met=6, partial=3, gap=2 (illustrative) | — |
| `disclosureScore` | `(6×100 + 3×50) / 11` | **68.2%** |

The same holding's SASB material topic count is fixed by its sector: Utilities → 15 topics
(`E01,E02,E03,E04,E05,E06,E07,S01,S04,H01,H02,B02,G01,G03,G04`), independent of the ISSB score.

### 7.5 Sector materiality density

`SECTORS.map` computes per-sector topic counts split Environment/Social+Human/Business+Governance
for the stacked-bar "Sector Materiality Density" chart. Utilities and Energy carry the most
Environment topics (7 each); Energy has the highest total (16), matching the KPI card "Highest
Materiality" = `Object.entries(matrix).sort by length)[0]`.

### 7.6 Companion analytics

- **ISSB vs TCFD tab** — renders the static `ISSB_TCFD_MAP` cross-walk table with an "Aligned/No
  Match" badge; since the map covers all 11 items, every row shows Aligned.
- **Pillar Readiness Radar** — portfolio pillar score (`s2Agg` filtered by pillar, averaged) plotted
  against the synthetic benchmark described in §7.2.
- **S2 Compliance Distribution pie** — sums `met`/`partial`/`gaps` across all holdings and all 11
  requirements (portfolio × 11 cells) into one three-slice pie.

### 7.7 Data provenance & limitations

- **All portfolio holdings, ISSB S2 compliance statuses, disclosure scores, data-coverage
  percentages, double-materiality scores, and the pillar benchmark are synthetic**, generated by the
  platform's seeded PRNG `sr(seed,off) = frac(sin(seed+off+1)×10⁴)` combined with a Java-style
  string hash (`hashStr`) — deterministic per company name/requirement ID but with **no relationship
  to any real company's actual disclosures**. A user researching a specific company would see a
  plausible-looking but entirely fabricated ISSB compliance scorecard.
- The SASB sector↔topic matrix is a hand-authored approximation of the real SASB Materiality Map,
  not the literal SASB Materiality Finder data — real sector-specific topic sets should be sourced
  from IFRS Foundation's SASB Standards.
- The double-materiality "financial vs impact" scores are independent random draws with no economic
  or scientific basis; a production tool would source financial materiality from analyst/investor
  surveys and impact materiality from stakeholder consultation (as CSRD/EFRAG guidance requires).
- Manual overrides are the only real user input and are stored client-side only (no audit trail,
  no multi-user sync).

**Framework alignment:** ISSB IFRS S1 (materiality gating standard, referenced but not implemented
as a process) · ISSB IFRS S2 (4-pillar disclosure structure genuinely modelled, paragraph references
correct) · TCFD 2017 (11-recommendation cross-walk) · SASB Standards (sector/topic taxonomy
approximated). The module's real contribution is a **plausible SASB×ISSB reference structure**; it
should not be presented to users as a scored assessment of any real company.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the seeded-random ISSB S2 compliance score with a real disclosure-evidence assessment that
an investment or corporate-reporting team can trust for board sign-off and regulatory filing
readiness. Scope: any listed entity subject to IFRS S2 (or a jurisdiction's local adoption),
scored per filing period.

### 8.2 Conceptual approach
Mirror the deterministic, evidence-based scoring already implemented server-side in
`backend/services/issb_s2_engine.py`'s `_score_pillar_completeness()` — a **checklist-completeness
model**: each of the ~55 IFRS S2 disclosure items across 4 pillars is either evidenced (from
uploaded filings, XBRL tags, or analyst-confirmed checkboxes) or not; the pillar score is
`matched / total × 100`, weighted 20/30/25/25 across Governance/Strategy/Risk Management/
Metrics & Targets. This is the same design pattern used by MSCI's ESG controversy-disclosure
scoring and Bloomberg's ESG Disclosure Score — completeness-of-disclosure, not inferred quality.

### 8.3 Mathematical specification
```
pillar_score_p  = (Σ 1[item_i disclosed]) / N_p  × 100          for p in {gov, strat, riskmgmt}
metrics_score   = 0.6 × qual_pct + 0.4 × quant_pct
  qual_pct  = matched_disclosure_items / N_metrics_items × 100
  quant_pct = (1[S1>0] + 1[S2>0] + 1[S3>0] + 1[financed≠∅] + 1[carbon_price≠∅] + 1[capex_pct>0]) / 6 × 100
overall_score   = 0.20·gov + 0.30·strat + 0.25·riskmgmt + 0.25·metrics
completeness_pct = round(overall/100 × total_disclosure_items) / total_disclosure_items × 100
```
| Parameter | Calibration source |
|---|---|
| Pillar weights (0.20/0.30/0.25/0.25) | Author judgement approximating relative disclosure burden per IFRS S2 paragraph count — should be re-derived from EFRAG/IFRS Foundation implementation guidance on assurance priority |
| Disclosure item catalogue (~55 items) | IFRS S2 (June 2023) paragraphs 6–50, itemised |
| Status thresholds (Met/Partial/Gap) | Should be defined per item as binary (disclosed/not) — "Partial" only meaningful for narrative items scored by an NLP/analyst confidence tier |

### 8.4 Data requirements
- Uploaded sustainability report / 10-K climate section (PDF/XBRL) → route through the platform's
  `llm-esg-extractor` module to auto-populate `governance_disclosures[]`, `strategy_disclosures[]`
  etc. as evidenced item lists.
- Scope 1/2/3 GHG figures — already collected platform-wide (GHG inventory modules).
- Internal carbon price, climate capex % — from CDP or company 10-K disclosure.
- Existing platform hook: `backend/services/issb_s2_engine.py::assess()` already implements this
  exact deterministic scoring — the frontend module should call it with real evidence lists instead
  of leaving `*_disclosures` fields empty (in which case the engine honestly returns 0, per its own
  docstring: *"When no evidence is supplied... its score is 0.0 and an honest note is attached —
  never a fabricated value"*). **The current frontend implementation bypasses this real engine
  entirely and fabricates its own scores client-side.**

### 8.5 Validation & benchmarking plan
- Backtest against a sample of 20–30 companies with known IFRS S2 / TCFD disclosure grades from
  CDP or MSCI ESG Ratings; compare completeness_pct ranking correlation (target Spearman ρ > 0.6).
- Sensitivity: verify score monotonically increases as more `*_disclosures` items are supplied.
- Reconcile against IFRS Foundation's own annual "State of Play" implementation surveys.

### 8.6 Limitations & model risk
- Completeness ≠ quality: a company can tick every disclosure-item box with boilerplate language and
  score 100%; a real model needs an NLP substantiveness check (already partly available via
  `llm-esg-extractor`'s confidence scoring) layered on top.
- No assurance-level adjustment: IFRS S2 encourages (but does not yet mandate) limited/reasonable
  assurance — a mature model should discount unassured disclosures.
- Conservative fallback: any item without positive evidence must score 0, never an imputed/estimated
  value — this fail-safe already exists in the real backend engine and must be preserved in any
  frontend integration.

## 9 · Future Evolution

### 9.1 Evolution A — Stop bypassing the honest engine; add the real SASB dataset (analytics ladder: rung 1 → 2)

**What.** §7's flag is pointed: per-company ISSB S2 compliance statuses are a deterministic hash of the company *name* (`sr(hashStr(name), hashStr(req.id))` → Met/Partial/Gap), so "a user researching a specific company would see a plausible-looking but entirely fabricated ISSB compliance scorecard" — while §8.4 reveals the platform **already has the right engine**: `backend/services/issb_s2_engine.py::assess()` scores pillar completeness from evidenced disclosure lists and honestly returns 0 with a note when no evidence is supplied. The frontend bypasses it entirely. Evolution A: (1) route all compliance scoring through the real engine, with evidence lists populated via upload/extraction or analyst confirmation; (2) replace the hand-approximated sector↔topic matrix with the actual IFRS Foundation SASB Standards materiality data; (3) move the manual-override store from localStorage (no audit trail, §7.7) to a DB table with user/timestamp — materiality determination is exactly the decision that needs an audit trail.

**How.** (1) `POST /issb-materiality/assess` wrapping the engine per holding; the double-materiality tab's random financial/impact scores replaced by entered assessment values or honest empties (CSRD/EFRAG requires consulted inputs, not draws — §7.7). (2) SASB Standards topic sets ingested as refdata with licence-appropriate sourcing. (3) The synthetic pillar "benchmark" replaced by the portfolio's own distribution or removed. (4) Validation per §8.5: completeness ranking against CDP/MSCI disclosure grades for a 20–30 company sample, target Spearman ρ > 0.6.

**Prerequisites.** The name-hash scoring deleted; evidence-input path (the sibling `llm-esg-extractor` is the designated feeder per §8.4); SASB data sourcing. **Acceptance:** a company with no evidence scores 0 with the engine's honest note, not a hash-derived 68%; overrides carry user/date; sector topic sets cite the SASB standard version.

### 9.2 Evolution B — Materiality-process copilot with evidence capture (LLM tier 2)

**What.** The guide promised workflow features the code never built — process builder, stakeholder-input capture, connectivity map, board materiality statement (§7's mismatch list). Those are language-and-evidence workflows, better delivered LLM-native than as forms: "start a materiality assessment for this issuer — walk me through the ISSB S1 enterprise-value test", "record this investor-call note as significance evidence for topic E03", "draft the board materiality statement from the assessed topic set, with the determination rationale per topic."

**How.** Tier 2 over the Evolution A assessment routes plus an evidence table (topic × source × note × date): the copilot structures free-text consultation notes into evidence records (suggested, analyst-confirmed), applies the single-vs-double materiality distinction correctly (ISSB investor-focus vs CSRD impact — §5 contrasts them precisely, and conflating them is the classic user error the copilot must catch), and generates the materiality statement with every topic's inclusion/exclusion rationale traceable to evidence records. Connectivity mapping ("link topic E01 to the impairment note") is suggested from the financial-statement line-item vocabulary and confirmed by the analyst. The no-fabrication rule extends to evidence: the copilot never asserts stakeholder views that aren't in captured records.

**Prerequisites (hard).** Evolution A (statement generation over hash-fabricated compliance would be an auditable-decision document built on noise); evidence data model. **Acceptance:** every statement claim links to an evidence record; single/double materiality framing correct per target framework; topics without evidence are listed as unassessed, not defaulted.