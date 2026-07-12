## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The MODULE_GUIDES entry defines the scoring engine as
> `Completeness = (EvidenceItems_Submitted / EvidenceItems_Required) × Quality_Weight` with a discrete
> quality-weight ladder (1.0 primary source · 0.7 third-party verified · 0.4 management estimate). **The
> code implements neither the required-item denominator nor the 1.0/0.7/0.4 ladder.** Instead it derives
> completeness as `min(items,4)/4×25`-style ratios, quality as a mean of a seeded 60–100 `quality_score`,
> and adds freshness and regulation-coverage sub-scores the guide never mentions. This is an operational
> evidence-tracking tool (upload, version, review, export) — a defensible workflow product, but its
> "scores" are heuristics over seeded demo evidence, not the required-vs-submitted ratio the guide states.

### 7.1 What the module computes

Evidence items are generated for each of 10 categories × its listed sources, then four category-level
sub-scores drive the readiness radar:

```js
completeness = items.length ? round( items.length / 4 × 25 ) : 0          // 4 sources ⇒ 100%
freshness    = items.length ? round( 100 − mean(min(60, ageDays)) × 100/60 ) : 0
coverage     = items.length ? round( uniqueRegulations / cat.regulations.length × 100 ) : 0
avgQuality   = round( mean(quality_score) )                                // over all evidence
autoPct      = round( |collection_type=='auto'| / |items| × 100 )
avgDays      = mean( (now − collected_at)/86400000 )                       // staleness KPI
```

Portfolio KPIs: unique categories covered, average freshness (days), % auto-collected, average quality,
and last-audit date. There is **no** required-item register — the denominator `4` (sources per category)
and `cat.regulations.length` (regulations per category) are the only "targets".

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| `quality_score` | `round(60 + sr(h,4)·40)` → 60–100 | Synthetic seeded PRNG (hash of `cat.id+src`) |
| `collection_type` | `sr(h,3)>0.4 ? auto : manual` | Synthetic seeded PRNG |
| `daysAgo` | `floor(sr(h,1)·60)` → 0–60 | Synthetic seeded PRNG |
| `reviewed` | `sr(h,2)>0.35` | Synthetic seeded PRNG |
| completeness divisor | `4` sources = 100% | Hard-coded heuristic |
| freshness cap | 60 days = fully stale | Hard-coded heuristic |
| Quality ladder (guide) | 1.0 / 0.7 / 0.4 | **Not implemented** |

Ten `EVIDENCE_CATEGORIES` (EV01–EV10) map to ~20 regulations (SFDR Art 8/9, TCFD, ISSB S2, CSRD ESRS 2,
PCAF, CSDDD, TNFD, UK Stewardship Code, PRA SS 1-13, Basel III, MiFID II…). `AUTO_SCAN_KEYS` (19 entries)
tie each category to a platform `localStorage` key so real evidence can auto-populate if present.

### 7.3 Calculation walkthrough

1. On mount, `generateEvidence()` builds one item per `(category, source)` pair — a deterministic hash
   `hashStr(cat.id+src)` seeds age, review status, collection type, and quality. Results persist to
   `localStorage` (`ra_compliance_evidence_v1`).
2. If real platform artefacts exist under `AUTO_SCAN_KEYS`, they are merged as auto-collected evidence.
3. `freshnessData` / `qualityRadar` recompute the four sub-scores per category for the readiness radar.
4. `regMatrix` cross-tabulates regulations × categories to show coverage gaps; audits come from a fixed
   5-row `generateAudits()` list.

### 7.4 Worked example

Category **EV03 (Climate Risk)** has 4 sources → 4 evidence items. `completeness = round(4/4×25) = 25`…
wait — the divisor logic caps at 4 sources = 100%, so with all 4 present `round(4/4×25)=25`? The formula
`items.length/4×25` yields 100 only when `items.length = 16`; with 4 items it returns **25**. This is a
latent scaling bug: the intended "4 sources = 100%" comment does not match `×25` (which needs 16 items for
100%). Freshness for the same category, if items average 20 days old:
`round(100 − 20×100/60) = round(100 − 33.3) = 67`. Coverage: EV03 lists 3 regulations; if evidence exists
for all 3, `round(3/3×100)=100%`. Quality: if the 4 items score 88/72/95/80, `avgQuality = round(83.75)=84`.

### 7.5 Companion analytics on the page

Dashboard (KPIs, category freshness radar, quality radar), Evidence register (sortable/filterable table
with per-item review workflow), Regulation matrix (coverage heatmap), Audit tracker (5 fixed audits with
findings/resolved/status), and CSV export of the filtered evidence. Reviewer names and comments are seeded
from fixed pick-lists. No backend engine or route (`engines: []`, `route_files: []`) — all client-side.

### 7.6 Data provenance & limitations

- **Seed evidence and audits are synthetic**, from the local PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` keyed
  by `hashStr`. Real evidence only appears if the referenced `localStorage` keys are populated by other
  modules — i.e. the tool is a shell that *can* aggregate real artefacts but ships with demo data.
- The **completeness `×25` scaling contradicts its own "4 sources = 100%" comment** (see §7.4) — a
  quantifiable defect.
- The guide's required-vs-submitted ratio and 1.0/0.7/0.4 quality ladder are **absent**; quality is a
  seeded 60–100 mean, not a source-tier weight.

**Framework alignment:** The categories map to real disclosure regimes — *CSRD/ESRS* (Delegated Reg. (EU)
2023/2772, ESRS 2 general + topical standards), *SFDR RTS* (EU 2022/1288 Art 8/9 + PAI), *ISSB IFRS
S1/S2*, *GRI Universal Standards 2021*, *TCFD*, *TNFD*, *PCAF* data-quality scores (DQS 1–5), *CSDDD* and
*UNGP* for human-rights DD, and *PRA SS 1-13 / ECB TRIM* for model-validation evidence. The tool tracks
*evidence for* these frameworks; it does not itself compute any framework's disclosure metric.

---

## 8 · Model Specification — Disclosure Evidence Completeness Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Give compliance teams a defensible, auditable readiness score per regulatory framework: the share of
*required* disclosure data points backed by adequate-quality, in-date, chain-of-custody evidence. Coverage:
all active frameworks (CSRD/ESRS, SFDR, ISSB, GRI, FCA TCFD) and their datapoint trees.

### 8.2 Conceptual approach
Model completeness as a **weighted coverage ratio over a requirement register**, mirroring assurance-firm
readiness assessments (Big-4 CSRD gap tools) and the **PCAF data-quality-score** convention for grading
evidence tiers. Each required datapoint (e.g. an ESRS E1 mandatory disclosure requirement) is either met,
partially met, or unmet, weighted by evidence quality and freshness — the standard "controls coverage ×
control effectiveness" structure of an internal-audit readiness model.

### 8.3 Mathematical specification
```
For framework f with required datapoints D_f:
Coverage_f   = Σ_{d∈D_f}  met(d) · q(d) · fr(d) / |D_f|                    (0–100%)
q(d)  = 1.0 primary · 0.7 third-party assured · 0.4 mgmt estimate         (PCAF-style tiers)
fr(d) = max(0, 1 − age_d / staleness_limit_f)                             (freshness decay)
met(d) ∈ {0, 0.5, 1}   (unmet / partial / complete)
Readiness_f = GREEN if Coverage_f ≥ 85 · AMBER 60–85 · RED < 60
```
| Parameter | Source |
|---|---|
| Requirement register `D_f` | ESRS datapoint list (EFRAG IG3), SFDR RTS Annex, IFRS S2 Appendix |
| Quality tiers `q` | Guide ladder (1.0/0.7/0.4); align to PCAF DQS |
| Staleness limit | Reporting-cycle length (annual = 365d; interim tighter) |
| RAG bands | Assurance-readiness convention |

### 8.4 Data requirements
A machine-readable requirement register per framework (the biggest new asset), each evidence item tagged
with datapoint id, quality tier, source, preparer, and collection date. The platform already stores
evidence items with `category_id`, `regulation`, `quality_score`, `collected_at`, and `collection_type`;
the missing piece is the authoritative `D_f` register and a datapoint-level join.

### 8.5 Validation & benchmarking plan
Reconcile computed readiness against an external assurer's gap assessment on the same period (target
agreement within one RAG band on ≥90% of frameworks). Backtest whether low pre-filing coverage predicts
audit findings (`AUD-*` records). Sensitivity-test on the quality ladder and staleness limits.

### 8.6 Limitations & model risk
Completeness measures *evidence presence*, not disclosure *correctness* — a fully-evidenced datapoint can
still be wrong; pair with substantive review. Requirement registers drift as regulators issue guidance;
version the register and date-stamp scores. Conservative fallback: treat any datapoint with only DQS-4/5
(`q=0.4`) evidence as "partial" (`met=0.5`) so readiness is not overstated.
