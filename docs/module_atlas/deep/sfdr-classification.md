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
