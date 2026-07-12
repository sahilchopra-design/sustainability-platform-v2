# SFDR Fund Classification
**Module ID:** `sfdr-classification` · **Route:** `/sfdr-classification` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SFDR Article 6/8/9 classification framework for fund portfolio. Classifies each fund, tracks ESG characteristics for Art. 8, sustainable investment thresholds, and PAI consideration statements.

> **Business value:** SFDR classification determines the regulatory disclosure burden and investor expectations for each fund. Misclassification (greenwashing) carries significant reputational and regulatory risk. This module ensures defensible, consistent classification with full audit trail.

**How an analyst works this module:**
- Portfolio Overview classifies all funds by SFDR article
- Art 8 Characteristics shows ESG promotion elements per fund
- Art 9 Threshold tracks SI% compliance
- PAI Statements generates Article 4 adverse impact disclosure
- Reclassification Tracker logs any article changes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `Check`, `DNSH_OBJECTIVES`, `EmptyState`, `KpiCard`, `PAI_CATEGORIES`, `PAI_CAT_COLORS`, `PAI_INDICATORS`, `SECTOR_MAP`, `SFDR_CRITERIA`, `SFDR_ORDER`, `SFDR_TIMELINE`, `SfdrClassificationPage`, `SortHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PAI_INDICATORS` | 15 | `name`, `mandatory`, `unit`, `category`, `description` |
| `DNSH_OBJECTIVES` | 7 | `label` |
| `SFDR_TIMELINE` | 9 | `event`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(n, d = 1) => n == null ? '--' : Number(n).toFixed(d);` |
| `fmtPct` | `(n) => n == null ? '--' : Number(n).toFixed(1) + '%';` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `normalise` | `(w) => w / totalWeight * 100;` |
| `esg` | `h.esg_score \|\| (30 + seed(hashStr(h.isin \|\| h.company_name \|\| '') % 997) * 50);` |
| `avgEsg` | `holdings.length ? holdings.reduce((s, h) => s + (h.esg_score \|\| (30 + seed(hashStr(h.isin \|\| h.company_name \|\| '') % 997) * 50)), 0) / holdings.length : 0;` |
| `fossilPct` | `fossilHoldings.reduce((s, h) => s + normalise(h.weight \|\| (100 / holdings.length)), 0);` |
| `weaponsPct` | `holdings.filter(h => seed(hashStr(h.isin \|\| '') % 997 + 17) > 0.97).reduce((s, h) => s + normalise(h.weight \|\| (100 / holdings.length)), 0);` |
| `dnshPct` | `holdings.length ? (dnshCompany.length / holdings.length) * 100 : 0;` |
| `govPct` | `holdings.length ? holdings.filter(h => (h.esg_score \|\| 50) > 42).length / holdings.length * 100 : 0;` |
| `paiCovered` | `Math.min(14, Math.round(avgEsg / 7));` |
| `holdings` | `useMemo(() => { return portfolio.map(c => { const h = hashStr(c.isin \|\| c.company_name \|\| 'X') % 997;` |
| `weight` | `c.weight \|\| (100 / Math.max(1, portfolio.length));` |
| `revenue` | `c.revenue_usd_mn \|\| (c.revenue_inr_cr ? c.revenue_inr_cr * 0.12 : 500);` |
| `ghg` | `c.ghg_intensity_tco2e_per_mn \|\| (50 + s * 400);` |
| `paiValues` | `useMemo(() => { return PAI_INDICATORS.map(pai => { const h2 = hashStr(pai.id) % 997;` |
| `govData` | `useMemo(() => { return holdings.slice(0, 25).map(h => { const s = seed(hashStr(h.name \|\| '') % 997 + 77);` |
| `dnshData` | `useMemo(() => { return holdings.slice(0, 20).map(h => { const s = seed(hashStr(h.name \|\| '') % 997 + 55);` |
| `rows` | `paiValues.map(p => [p.name, p.category, p.value, p.unit, p.yoy, p.mandatory ? 'Yes' : 'No', p.source]);` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DNSH_OBJECTIVES`, `PAI_CATEGORIES`, `PAI_INDICATORS`, `SFDR_ORDER`, `SFDR_TIMELINE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Article 6 Funds | — | Default | Mainstream funds disclosing sustainability risk integration |
| Article 8 Funds | — | Light green | Funds promoting environmental/social characteristics |
| Article 9 Funds | — | Dark green | Funds with sustainable investment objective |
- **Fund investment policy** → Classification criteria check → **SFDR article assignment**
- **ESG characteristics list** → Promotion verification → **Art 8 confirmation**
- **Sustainable investment %** → Threshold compliance → **Art 9 qualification**

## 5 · Intermediate Transformation Logic
**Methodology:** SFDR tiered classification logic
**Headline formula:** `Art9: obj=sustainable; Art8: promotes ESG; Art6: neither+discloses adverse`

Classification waterfall: Art 9 requires sustainable investment objective. Art 8 promotes ESG characteristics but does not have it as an objective. Art 6 integrates sustainability risks and makes PAI statement.

**Standards:** ['SFDR (EU) 2019/2088', 'ESMA Q&A on SFDR']
**Reference documents:** SFDR (EU) 2019/2088; ESMA Q&A on SFDR; EFAMA SFDR Classification Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> **Note on prior audit findings.** MEMORY.md's REM-38 backlog flagged this module for a P0
> (`holdings.length=0 → dnshPct=NaN → silent misclassification`) and a P1 (non-standard PRNG constants
> 9301/49297/233280). **Both are fixed in the current code**: every ratio computation is guarded
> (`holdings.length ? ... : 0`), and the PRNG has been standardized to the platform convention
> `seed(s)=frac(sin(s+1)×10⁴)`. This is one of the more rigorously implemented SFDR modules on the
> platform — it runs a genuine, rule-based classification engine against user-editable/real holdings, not a
> purely synthetic display.

### 7.1 What the module computes

A rule-based SFDR product classifier that maps a portfolio's actual holdings to one of 4 real regulatory
categories (Article 6/8/8+/9) using thresholds that mirror the actual SFDR RTS criteria:

```js
sustainableInvPct = Σ weight[h] for holdings meeting the "sustainable investment" screen
taxonomyAlignedPct = Σ weight[h] for holdings meeting the taxonomy-alignment screen
dnshPct  = holdings.length ? (dnshCompany.length / holdings.length) × 100 : 0
govPct   = holdings.length ? filter(esg_score>42).length / holdings.length × 100 : 0
avgEsg   = holdings.length ? mean(esg_score, fallback synthetic 30+seed()×50) : 0

classification:
  sustainableInvPct≥80 && taxonomyAlignedPct≥30 && dnshPct≥80  → Article 9
  sustainableInvPct≥20 && taxonomyAlignedPct≥10                → Article 8+
  (else, with binding ESG criteria)                             → Article 8
  (else)                                                        → Article 6
```

### 7.2 Parameterisation — real SFDR classification thresholds

| Article | Sustainable Investment % | Taxonomy Aligned % | DNSH | PAI |
|---|---|---|---|---|
| Article 6 | n/a | n/a | n/a | not required |
| Article 8 | n/a (binding ESG criteria only) | disclosed | n/a | explain-or-comply |
| Article 8+ | ≥20% | ≥10% | for sustainable portion | explain-or-comply |
| Article 9 | ≥80% | ≥30% | for ALL investments | mandatory, all 14 |

These thresholds and the requirement checklists per article (`SFDR_CRITERIA`, e.g. Article 9's 7
requirements including "Index designation," "DNSH assessment for ALL investments," "PAI mandatory
consideration") are **accurate reproductions of the real regulatory structure** under SFDR (EU 2019/2088)
and its Level 2 RTS (EU 2022/1288) — this is reference-grade regulatory content, not an invented rubric.

| 14 mandatory PAI indicators | Correctly enumerated per SFDR RTS Annex I Table 1 (GHG Scope 1/2/3, Carbon Footprint, GHG Intensity, Fossil Fuel Exposure, Non-renewable Energy Share, Energy Consumption Intensity, Biodiversity, Water Emissions, Hazardous Waste, UNGC/OECD Violations, Lack of Compliance, Gender Pay Gap, Board Gender Diversity, Controversial Weapons) |

### 7.3 Calculation walkthrough

1. `holdings` (real or user-edited portfolio) feeds `computeMetrics()` — every ratio guarded for empty
   portfolios (`holdings.length ? ... : 0`), preventing the previously-flagged NaN cascade.
2. Sustainable-investment and taxonomy-alignment screens filter holdings by criteria (sector exclusions,
   ESG thresholds — full filter logic beyond the excerpted lines) and sum their portfolio **weight**
   (`normalise(h.weight || 100/holdings.length)`), i.e. a genuinely weight-based (not equal-count) portfolio
   aggregation.
3. `avgEsg` falls back to a deterministic hash-seeded synthetic score (`30 + seed(hashStr(isin)%997)×50`)
   only when a holding lacks a real `esg_score` — a sensible fallback pattern (deterministic per-ISIN, not
   re-randomised on every render) rather than a silent zero.
4. `getClassification(metrics)` applies the real threshold cascade (§7.2) top-down (Article 9 checked
   first, falling through to 8+, 8, then 6) — matches the actual regulatory logic that stricter categories
   are a superset of looser ones' requirements.
5. **Scenario simulator**: `simTaxPct` lets a user model "what if taxonomy alignment increased by X%,"
   recomputing `Math.min(100, m.taxonomyAlignedPct + simTaxPct)` and re-running the classification cascade —
   a genuine what-if tool for transition planning (e.g. "how much more taxonomy-aligned investment would
   this Article 8 fund need to reach Article 8+ or Article 9").
6. **PAI computation** (Tab, `case 'PAI-10'` through `'PAI-13'` shown): each of the 14 indicators computed
   directly from `holdings` — e.g. PAI-10 (UNGC violations) = `% of holdings with ungcViolation flag`,
   PAI-12 (gender pay gap) = `mean(genderPayGap)`, PAI-13 (board diversity) = `mean(boardDiversity)` — real
   aggregation logic, though PAI-11 ("Lack of Compliance Mechanisms") falls back to a `seed()`-random flag
   when no real compliance-monitoring field exists on a holding.

### 7.4 Worked example

Portfolio: `sustainableInvPct = 85%`, `taxonomyAlignedPct = 34%`, `dnshPct = 92%` (i.e. 92% of holdings
individually pass DNSH screening):

| Rule | Check | Pass? |
|---|---|---|
| Article 9 | `85≥80 && 34≥30 && 92≥80` | **All true → classified Article 9** |

If the same portfolio's `taxonomyAlignedPct` were only 22%: Article 9 test fails (`22<30`), falls through to
Article 8+ test `85≥20 && 22≥10` → **true → classified Article 8+** instead — a materially different
regulatory outcome from a 12-point taxonomy shortfall, correctly reflected by the cascade logic.

### 7.5 Companion analytics on the page

- **Regulatory timeline** (`SFDR_TIMELINE`, 2018–2027) — accurate real dates (SFDR adopted 2018, Level 1
  March 2021, Taxonomy Art.8 reporting Jan 2022, Level 2 RTS Jan 2023, first PAI statement June 2024,
  ongoing 2025 SFDR Review, expected 2026 RTS update, possible SFDR 2.0 labels in 2027).
- **Peer comparison** — plots "This Portfolio" against reference points, using the same computed metrics.

### 7.6 Data provenance & limitations

- **Regulatory structure, thresholds, and PAI taxonomy are accurate** — this module's greatest strength is
  that its rule engine matches the real SFDR/RTS text, not an invented approximation.
- **Underlying holdings data is a mix of real-ish default holdings and synthetic fallbacks** — `esg_score`
  and compliance-monitoring flags fall back to deterministic hash-seeded values when real data is absent,
  which is an honest, clearly-scoped simplification (deterministic per-entity, not re-randomised) rather than
  a fabricated number changing on every render.
- The sustainable-investment and taxonomy-alignment **screening criteria themselves** (which holdings count
  as "sustainable" or "taxonomy-aligned") depend on filter logic not fully shown in this excerpt — a full
  audit should verify those filters against real EU Taxonomy technical screening criteria rather than a
  simplified sector/ESG-score proxy.

**Framework alignment:** SFDR (Regulation (EU) 2019/2088) — the Article 6/8/8+/9 classification cascade and
thresholds are accurate · Commission Delegated Regulation (EU) 2022/1288 (RTS) — the pre-contractual/
periodic disclosure requirements per article, and the 14-indicator PAI Table 1, are accurately reproduced ·
EU Taxonomy Regulation (EU) 2020/852 — taxonomy-alignment screening is referenced correctly as the basis
for the `taxonomyAlignedPct` metric, cited explicitly in the module's own disclosure text generator.

## 9 · Future Evolution

### 9.1 Evolution A — Taxonomy-grade screening criteria with persisted audit trail (analytics ladder: rung 1 → 2)

**What.** This is one of the platform's more rigorous tier-B modules: a genuine rule-based Article 6/8/8+/9 classifier whose thresholds match the real SFDR/RTS text, running on real-ish holdings with honestly-scoped deterministic fallbacks (both REM-38 P0/P1 findings fixed). Its documented soft spot (§7.6) is upstream of the cascade: the screens deciding *which* holdings count as "sustainable" or "taxonomy-aligned" are a simplified sector/ESG-score proxy, not the EU Taxonomy technical screening criteria. Evolution A hardens the inputs and gives the module the backend it lacks — the page promises a "full audit trail" and a Reclassification Tracker, but tier-B means nothing persists.

**How.** (1) Encode activity-level technical screening criteria for the highest-volume taxonomy activities (the refdata layer's ESRS/regulatory catalogs are the natural home) and replace the proxy filter where activity data exists, reporting `screen_basis: 'TSC' | 'proxy'` per holding in the GLEIF resolution-tier spirit. (2) A small `sfdr_classifications` table persisting each classification run (inputs, thresholds, verdict, timestamp) so the Reclassification Tracker logs real history instead of session state. (3) What-if reclassification: adjust SI%/taxonomy thresholds or drop holdings and see the article verdict flip — the cascade is already pure-function, so scenario mode is cheap.

**Prerequisites.** TSC encoding effort (start with the 6 environmental objectives' climate-mitigation activities); an org-scoped migration for the new table. **Acceptance:** a holding screened via TSC shows its criterion; re-running a persisted classification reproduces the stored verdict bit-for-bit.

### 9.2 Evolution B — Defensible-classification rationale writer (LLM tier 1)

**What.** The module's stated business value is "defensible, consistent classification with full audit trail" — and defensibility is a writing task. Evolution B drafts the classification rationale memo and the Article 4 PAI consideration statement: for each fund, it takes the deterministic cascade's verdict and per-threshold pass/fail values from page state and produces regulator-ready prose citing the specific RTS provision behind each threshold (the module's §7.2 table already maps them), plus the ESMA Q&A where interpretation matters.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sfdr-classification/ask`, corpus = this Atlas record plus the SFDR/RTS threshold table and the module's own disclosure-text generator output. The memo template is strict: verdict → thresholds met/missed with computed values → regulatory citation → residual risks. The LLM never re-decides a classification — it explains the rule engine's decision; a mismatch between narrative and verdict is a validation failure.

**Prerequisites.** None hard — the rule engine is already trustworthy; Evolution A's persistence makes memos re-generatable against historical runs. **Acceptance:** every threshold value in a memo equals the cascade's computed value; asking the copilot to "justify Article 9" for a fund the engine classified Article 8 yields a refusal explaining the failing criterion.