# Supplier ESG Scorecard
**Module ID:** `supplier-esg-scorecard` · **Route:** `/supplier-esg-scorecard` · **Tier:** B (frontend-computed) · **EP code:** EP-DN3 · **Sprint:** DN

## 1 · Overview
Provides systematic ESG scoring of suppliers across environmental, social, and governance dimensions. Integrates climate emissions, labour standards, anti-corruption, and biodiversity criteria with CDP Supply Chain, EcoVadis, and CS3D due diligence requirements.

> **Business value:** Directly required for CS3D supply chain due diligence, EcoVadis benchmark reporting, and CDP supply chain programme participation. Enables procurement teams to prioritise supplier engagement by ESG risk and spending materiality.

**How an analyst works this module:**
- Upload supplier list for ESG scoring
- Assign scores from CDP, EcoVadis, or direct assessment
- Identify high-risk suppliers by ESG dimension
- Model CS3D due diligence coverage gaps
- Generate EcoVadis-comparable supplier scorecards

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `ENGAGEMENT_STAGES`, `KpiCard`, `RED_FLAGS`, `REGIONS`, `SECTORS`, `SUPPLIERS`, `ScorePill`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `(score / max) * 100;` |
| `suppliersWithTotal` | `useMemo(() => SUPPLIERS.map(s => ({` |
| `avgESG` | `useMemo(() => suppliersWithTotal.reduce((a, s) => a + s.esgTotal, 0) / Math.max(1, suppliersWithTotal.length), [suppliersWithTotal]);` |
| `avgE` | `useMemo(() => SUPPLIERS.reduce((a, s) => a + s.eScore, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `avgS` | `useMemo(() => SUPPLIERS.reduce((a, s) => a + s.sScore, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `avgG` | `useMemo(() => SUPPLIERS.reduce((a, s) => a + s.gScore, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `redFlagTotal` | `useMemo(() => suppliersWithTotal.reduce((a, s) => a + s.redFlagCount, 0), [suppliersWithTotal]);` |
| `highRiskCount` | `useMemo(() => suppliersWithTotal.filter(s => s.esgTotal < 40).length, [suppliersWithTotal]);  const sectorBenchmarks = useMemo(() => SECTORS.map(sec => { const sups = suppliersWithTotal.filter(s => s.sector === sec);` |
| `flagBreakdown` | `useMemo(() => RED_FLAGS.map(flag => {` |
| `spend` | `suppliersWithTotal.filter(s => s.redFlags.includes(flag)).reduce((a, s) => a + s.spendMn, 0);` |
| `engagementSummary` | `useMemo(() => ENGAGEMENT_STAGES.map(stage => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGAGEMENT_STAGES`, `RED_FLAGS`, `REGIONS`, `SECTORS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Supplier ESG Assessment Coverage | — | EcoVadis Benchmark 2023 | Only 30% of corporate procurement spend has supplier ESG assessment — CS3D will require 100% |
| CDP Supply Chain Response Rate | — | CDP Supply Chain 2023 | CDP supply chain programme achieves 50% supplier response rate — data gap for non-respondents |
| ESG Risk Premium in Supply | — | McKinsey ESG Procurement 2023 | High ESG suppliers show 12% lower procurement cost volatility from reduced disruption risk |
- **EcoVadis/CDP supplier ratings data** → ESG score baseline → **Supplier scores by ESG dimension and quartile vs peers**
- **Supplier spend data + category mapping** → Risk prioritisation → **Spend-weighted ESG risk by supplier and category**
- **CS3D due diligence requirements** → Compliance mapping → **Required supplier actions and documentation for CS3D**

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier ESG Score
**Headline formula:** `SupplierESG = w_E × EnvironmentalScore + w_S × SocialScore + w_G × GovernanceScore; EnvironmentalScore = ClimateScore × 0.5 + WaterScore × 0.25 + BiodiversityScore × 0.25`

Weighted composite score mirrors EcoVadis four-theme methodology; climate score from CDP supply chain questionnaire; social from ILO core convention compliance; governance from anti-corruption evidence

**Standards:** ['EcoVadis Sustainability Rating Methodology', 'CDP Supply Chain Scoring Methodology 2023', 'GRI Standards Supply Chain Reporting', 'CS3D Supplier Due Diligence Requirements']
**Reference documents:** EcoVadis Sustainability Rating Methodology 2024; CDP Supply Chain Questionnaire 2023; GRI 2 — General Disclosures: Supply Chain Reporting Requirements; CS3D — Annex on Substantive Adverse Impacts Criteria 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `SupplierESG = w_E×Environmental +
> w_S×Social + w_G×Governance`, with `Environmental = Climate×0.5 + Water×0.25 + Biodiversity×0.25`
> — a two-level weighted hierarchy mirroring EcoVadis's 4-theme methodology. **The code implements
> neither level.** `esgTotal = (eScore + sScore + gScore) / 3` is a flat, equal-weighted average of
> three top-level scores; there is no Climate/Water/Biodiversity sub-decomposition of the
> Environmental score anywhere in the file.

### 7.1 What the module computes

90 synthetic suppliers (`SUPPLIERS`), each independently seeded:

```
eScore = 20 + sr(i×11+4)×60        // 20–80
sScore = 20 + sr(i×13+5)×60        // 20–80
gScore = 20 + sr(i×17+6)×60        // 20–80
esgTotal = (eScore + sScore + gScore) / 3     // simple 1/3-1/3-1/3 average, NOT weighted
redFlags = up to 4 flags sampled (with de-duplication) from 7 real risk categories
           (No ESG Policy, Labour Violations, Deforestation Link, Greenwashing Risk,
            Conflict Minerals, Water Stress, Corruption Risk)
engagementStage = one of 6 real stages (Not Engaged → Initial Contact → Assessment Sent →
                   Data Received → Improvement Plan → Verified)
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| E/S/G scores | 20–80 | Synthetic, independent draws — no cross-dimension correlation |
| `esgTotal` weights | 1/3, 1/3, 1/3 | Contradicts the guide's `w_E/w_S/w_G` weighted scheme (EcoVadis-style weights typically favour Environmental and Social over Governance) |
| `RED_FLAGS` (7 categories) | Real CS3D/EcoVadis-relevant risk categories | Randomly assigned, 0–4 per supplier, not derived from the E/S/G scores (a supplier can show high `gScore` yet still carry "Corruption Risk") |
| `ENGAGEMENT_STAGES` (6 stages) | Real, sensible funnel | Randomly assigned per supplier, not tied to score or red-flag count |

### 7.3 Calculation walkthrough

1. **Supplier generation** — 90 suppliers as above, each with a `sector` (7 real sectors: Automotive,
   Electronics, Food & Bev, Apparel, Pharma, Chemicals, Logistics) and `spendMn`.
2. **`suppliersWithTotal`** — adds `esgTotal` and `redFlagCount` per supplier.
3. **Portfolio KPIs** — `avgESG` (mean `esgTotal`), `avgE`/`avgS`/`avgG` (mean per dimension),
   `redFlagTotal` (Σ `redFlagCount`), `highRiskCount` (`esgTotal<40`).
4. **Sector benchmarks** — per-sector `avgE`/`avgS`/`avgG`, `redFlagSups` count — all guarded with
   `sups.length ? … : 0`.
5. **Flag breakdown** — for each of the 7 `RED_FLAGS`, `count` (suppliers carrying it) and `spend`
   ($ exposure at suppliers carrying it) — a genuinely useful spend-at-risk view even though the
   underlying flag assignment is random.
6. **Engagement summary** — per-stage supplier counts across the 6-stage funnel.

### 7.4 Worked example

Supplier `i=0`: `eScore=round(20+sr(4)×60,1)`, `sScore=round(20+sr(5)×60,1)`,
`gScore=round(20+sr(6)×60,1)`. Using `sr(s)=frac(sin(s+1)×10⁴)`:

```
sr(4)=frac(sin(5)×10⁴)=frac(-9589.24)=0.7563  → eScore=20+0.7563×60=65.4
sr(5)=frac(sin(6)×10⁴)=frac(-2794.15)=0.8551  → sScore=20+0.8551×60=71.3
sr(6)=frac(sin(7)×10⁴)=frac(6569.87)=0.8657   → gScore=20+0.8657×60=71.9
esgTotal = (65.4+71.3+71.9)/3 = 69.5
```

Under the guide's own EcoVadis-style weighting (if, say, `w_E=0.35, w_S=0.35, w_G=0.30`, a common
real EcoVadis-adjacent split), this same supplier would score
`0.35×65.4+0.35×71.3+0.30×71.9 = 68.9` — close but not identical to the unweighted 69.5, illustrating
that the weighting choice does matter (more so for suppliers whose dimension scores diverge further
than this example's fairly clustered 65–72 range).

### 7.5 Companion analytics

- **Sector benchmark table** — average E/S/G and red-flag prevalence by sector — genuinely
  aggregated from supplier-level synthetic data.
- **CS3D coverage framing** — the guide's dataPoints (30% assessment coverage, 50% CDP response rate,
  12% cost reduction from high-ESG suppliers) are real 2023 industry statistics cited for context,
  not reproduced or validated by the synthetic 90-supplier dataset.

### 7.6 Data provenance & limitations

- 100% synthetic supplier data; no EcoVadis or CDP Supply Chain ratings are ingested.
- `esgTotal`'s equal-weighting (vs. the guide's stated hierarchical weighted formula) means sector
  and portfolio rankings in this module may differ materially from what an EcoVadis-methodology-
  faithful implementation would produce.
- Red flags and engagement stage are independent of the E/S/G scores — a supplier can simultaneously
  show a top-quartile `gScore` and a "Corruption Risk" flag, which a real due-diligence-linked model
  would treat as contradictory signals requiring reconciliation.

**Framework alignment:** EcoVadis Sustainability Rating Methodology (4-theme structure named in
guide, only a flattened 3-dimension equal-weighted average implemented) · CDP Supply Chain
Questionnaire (named, not ingested) · CS3D Annex adverse-impact criteria (the 7 `RED_FLAGS`
categories are a reasonable proxy set for CS3D-relevant risks, randomly assigned rather than
assessed) · GRI 2 supply-chain disclosure (conceptual only).

## 9 · Future Evolution

### 9.1 Evolution A — Implement the two-level EcoVadis-weighted hierarchy on ingested assessment data (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents that neither level of the guide's hierarchy is implemented: the guide specifies `SupplierESG = w_E×Environmental + w_S×Social + w_G×Governance` with `Environmental = Climate×0.5 + Water×0.25 + Biodiversity×0.25`, but the code computes a flat `esgTotal = (eScore + sScore + gScore) / 3` with no Climate/Water/Biodiversity sub-decomposition. The 90 suppliers are `sr()`-synthetic, and `RED_FLAGS` and `engagementStage` are randomly assigned independent of the scores — a supplier can show a top-quartile governance score while carrying a "Corruption Risk" flag, contradictory signals a real due-diligence model would reconcile. Evolution A builds the EcoVadis-faithful hierarchy on real data.

**How.** (1) Implement the two-level weighted structure: sub-theme scores (Climate/Water/Biodiversity for E; ILO-convention compliance for S; anti-corruption evidence for G) rolling up with EcoVadis-style theme weights that favour E and S over G, replacing the equal-weight average. (2) Ingest real supplier ratings — EcoVadis scorecards and CDP Supply Chain responses (both named in the guide) — replacing the synthetic 90. (3) Derive red flags from the scores and CS3D adverse-impact criteria so a high governance score can't coexist with an unreconciled corruption flag. (4) Tie engagement stage to score/red-flag status. (5) Build the CS3D due-diligence coverage-gap view the workflow promises.

**Prerequisites.** EcoVadis/CDP data access; the EcoVadis theme-weight structure needs encoding. **Acceptance:** the composite uses the two-level weighted hierarchy; red flags derive from scores and CS3D criteria; a supplier's governance score and corruption flag are consistent.

### 9.2 Evolution B — CS3D due-diligence copilot (LLM tier 1)

**What.** A copilot for the procurement/compliance team the module targets: "which suppliers are highest CS3D due-diligence priority?", "why is this supplier flagged for deforestation risk?", "what's our due-diligence coverage gap for CSRD reporting?" — answered from the (Evolution-A) EcoVadis-weighted scores, the derived red flags, and the engagement-stage funnel, grounded in the CS3D and EcoVadis frameworks.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/supplier-esg-scorecard/ask`, corpus = this Atlas record (the two-level formula, the 7 CS3D-relevant red-flag categories, EcoVadis/CDP framework notes) plus live supplier data. Prioritisation narrates the deterministic score × red-flag × spend ranking; red-flag explanations cite the driving sub-theme score and CS3D criterion; coverage-gap answers report the funnel. The copilot cites the specific dimension behind each supplier's score.

**Prerequisites.** Evolution A's real scores and score-derived flags so prioritisation rests on assessed data, not random draws with contradictory signals. **Acceptance:** every score/flag cited traces to the EcoVadis-weighted computation; red-flag explanations reference the driving sub-theme; a supplier outside the assessed set returns a refusal.