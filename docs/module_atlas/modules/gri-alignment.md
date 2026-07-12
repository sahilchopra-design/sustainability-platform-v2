# GRI Alignment Checker
**Module ID:** `gri-alignment` · **Route:** `/gri-alignment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates GRI Standards disclosure compliance checking across GRI 1 (Foundation), GRI 2 (General Disclosures), GRI 3 (Material Topics), and topic-specific standards (GRI 300/400 series). Identifies disclosure gaps, checks required content elements, and maps GRI disclosures to equivalent ISSB, ESRS, and TCFD requirements for dual-reporting efficiency.

> **Business value:** Reduces GRI compliance effort by automating disclosure completeness checking, guides reporters from 'with reference' to 'in accordance' status, and maximises dual-reporting efficiency by identifying GRI disclosures that simultaneously satisfy ISSB, ESRS, and TCFD requirements.

**How an analyst works this module:**
- Upload the sustainability report or disclosure inventory and map each disclosure to the applicable GRI Standard and disclosure number.
- Run the completeness checker to identify disclosures missing mandatory content elements.
- Review the materiality gap analysis to confirm all material topics have a corresponding GRI standard disclosure.
- Use the cross-framework mapper to identify GRI disclosures that simultaneously satisfy ISSB, ESRS, or TCFD requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TOPIC_STDS`, `Badge`, `Btn`, `CATEGORIES`, `CAT_COLORS`, `FRAMEWORKS`, `GRI_BRSR_MAP`, `GRI_CSRD_MAP`, `GRI_ISSB_MAP`, `GRI_STANDARDS`, `GriAlignmentPage`, `INTEROP_DATA`, `KpiCard`, `LS_PORT`, `SECTORS`, `Section`, `TOTAL_DISCLOSURES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `TOTAL_DISCLOSURES` | `ALL_TOPIC_STDS.reduce((s, t) => s + t.disclosures, 0) + GRI_STANDARDS.universal.reduce((s, u) => s + u.disclosures, 0);` |
| `FRAMEWORKS` | `['GRI', 'ISSB/SASB', 'CSRD/ESRS', 'TCFD', 'SFDR'];` |
| `INTEROP_DATA` | `ALL_TOPIC_STDS.map(std => {` |
| `enriched` | `useMemo(() => holdings.map(h => {` |
| `applicableStds` | `ALL_TOPIC_STDS.filter((_, i) => sr(s, i + 10) > 0.25);` |
| `totalDisc` | `applicableStds.reduce((sum, std) => sum + std.disclosures, 0);` |
| `availDisc` | `applicableStds.reduce((sum, std) => sum + Math.round(std.disclosures * (0.2 + sr(s, hashStr(std.id)) * 0.75)), 0);` |
| `coverage` | `totalDisc > 0 ? +((availDisc / totalDisc) * 100).toFixed(1) : 0;` |
| `stdBreakdown` | `applicableStds.map(std => {` |
| `avail` | `Math.round(std.disclosures * (0.2 + sr(s, hashStr(std.id)) * 0.75));` |
| `topGaps` | `stdBreakdown.filter(st => st.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3).map(st => st.name);` |
| `kpis` | `useMemo(() => { const avgStds = enriched.length ? (enriched.reduce((s, h) => s + h.applicableStds, 0) / enriched.length).toFixed(1) : 0;` |
| `totalReqDisc` | `ALL_TOPIC_STDS.reduce((s, t) => s + t.disclosures, 0) + GRI_STANDARDS.universal.reduce((s, u) => s + u.disclosures, 0);` |
| `avgDataAvail` | `enriched.length ? (enriched.reduce((s, h) => s + h.coverage, 0) / enriched.length).toFixed(1) : 0;` |
| `fullAlign` | `enriched.length ? (enriched.filter(h => h.fullAlignment).length / enriched.length * 100).toFixed(1) : 0;` |
| `envAvg` | `enriched.length ? (enriched.reduce((s, h) => s + h.envStds, 0) / enriched.length).toFixed(1) : 0;` |
| `socAvg` | `enriched.length ? (enriched.reduce((s, h) => s + h.socStds, 0) / enriched.length).toFixed(1) : 0;` |
| `ecoAvg` | `enriched.length ? (enriched.reduce((s, h) => s + h.ecoStds, 0) / enriched.length).toFixed(1) : 0;` |
| `sectorAvg` | `enriched.length ? (enriched.reduce((s, h) => s + h.sectorStdsApplicable, 0) / enriched.length).toFixed(1) : 0;` |
| `catBarData` | `useMemo(() => CATEGORIES.map(cat => ({` |
| `discGap` | `useMemo(() => ALL_TOPIC_STDS.map(std => {` |
| `avgAvail` | `holdingsWithStd.length ? holdingsWithStd.reduce((s, h) => { const sb = h.stdBreakdown.find(sb2 => sb2.id === std.id); return s + (sb ? sb.available : 0); }, 0) / holdingsWithStd.length : 0;` |
| `avgGap` | `std.disclosures - avgAvail;` |
| `avgCov` | `applicable > 0 ? enriched.filter(h => h.stdBreakdown.find(sb => sb.id === t.id)).reduce((s, h) => { const sb = h.stdBreakdown.find(sb2 => sb2.id === t.id); return s + (sb ? sb.pct : 0); }, 0) / applicable : 0;` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"` ).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `pct` | `sb ? sb.pct : -1;` |
| `count` | `INTEROP_DATA.filter(std => f === 'GRI' ? std.gri : f === 'ISSB/SASB' ? std.issb : f === 'CSRD/ESRS' ? std.csrd : f === 'TCFD' ? std.tcfd : std.sfdr).length;` |
| `radarData` | `ALL_TOPIC_STDS.map(std => {` |
| `bucketData` | `buckets.map(b => ({` |
| `brsrBarData` | `Object.entries(GRI_BRSR_MAP).map(([griId, map]) => {` |
| `issBarData` | `ALL_TOPIC_STDS.map(std => {` |
| `csrdBarData` | `ALL_TOPIC_STDS.map(std => {` |
| `sectorData` | `SECTORS.map(sec => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `FRAMEWORKS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GRI In-Accordance Compliance (%) | — | GRI content index review | Share of material topic GRI disclosures meeting all required content elements for 'in accordance' status; typical first-year reporters achieve 55â€“65%. |
| Materiality Coverage (%) | — | GRI 3 material topics | Proportion of material topics identified through the double materiality assessment that are addressed by a GRI topic-specific standard. |
| GRI-ISSB Mapped Disclosures | — | ISSB-GRI collaboration mapping | Share of GRI 2 and topic-specific disclosures that also satisfy an ISSB S1/S2 or ESRS requirement, enabling dual-use reporting. |
| Quantitative Metric Coverage (%) | — | GRI disclosure checklist | Percentage of GRI disclosures with quantitative metrics (vs qualitative-only); higher quantitative coverage supports comparability. |
- **Sustainability report disclosure inventory** → Map each disclosure to GRI Standard and disclosure number, check content elements → **GRI completeness scorecard**
- **Double materiality assessment results** → Cross-reference material topics against available GRI topic standards → **Materiality coverage gap analysis**
- **ISSB/ESRS/TCFD requirement databases** → Map GRI disclosures to equivalent cross-framework requirements → **Dual-use disclosure efficiency report**

## 5 · Intermediate Transformation Logic
**Methodology:** GRI Disclosure Completeness Score
**Headline formula:** `DCS = Σ_k (Complete_k × w_k) / Σ_k w_k × 100`

Assesses completeness of each GRI disclosure by checking mandatory content elements (governance, management approach, metrics, and targets), weighting by materiality tier. A DCS above 85% indicates GRI 'with reference' level compliance; 100% across all material topic standards is required for 'in accordance' with GRI Standards.

**Standards:** ['GRI Universal Standards 2021 (GRI 1/2/3)', 'GRI 300 Environmental Standards', 'GRI 400 Social Standards']
**Reference documents:** GRI 1 â€” Foundation 2021; GRI 2 â€” General Disclosures 2021; GRI 3 â€” Material Topics 2021; GRI-ISSB Collaboration MOU and Mapping Table (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide defines a Disclosure Completeness Score
> `DCS = Σ(Completeₖ×wₖ)/Σwₖ × 100`. The page's actual coverage metric is *unweighted*: available
> disclosures ÷ required disclosures, per holding, with availability itself a `sr()` PRNG draw. The GRI
> standard structure (universal + 26 topic standards with correct disclosure counts) is real and
> accurate; the per-company availability is synthetic. There is no materiality-tier weighting (`wₖ`) in
> the computation.

### 7.1 What the module computes

The GRI standards taxonomy is hard-coded correctly (GRI 1/2/3 universal + 26 topic standards). For each
portfolio holding, applicability and data availability are seeded:

```js
sr(seed, off) = frac(sin(seed+off+1)×10⁴)
applicableStds = ALL_TOPIC_STDS.filter((_,i) => sr(s, i+10) > 0.25)     // ~75% applicable
availDisc = Σ round( std.disclosures × (0.2 + sr(s, hashStr(std.id))×0.75) )  // 20–95% available
totalDisc = Σ std.disclosures  (over applicable standards)
coverage  = totalDisc>0 ? (availDisc/totalDisc)×100 : 0                  // the DCS proxy
topGaps   = 3 standards with largest (disclosures − available)
```

`hashStr` (`Math.imul(31, a) + charCode`) gives each GRI standard a stable per-standard seed offset so
availability is deterministic per (company, standard).

### 7.2 Parameterisation — GRI standards (real structure)

| Universal | Disclosures | Topic (examples) | Cat | Disclosures |
|---|---|---|---|---|
| GRI 1 Foundation | 0 | GRI 305 Emissions | Env | 7 |
| GRI 2 General | 30 | GRI 403 OH&S | Social | 10 |
| GRI 3 Material Topics | 6 | GRI 302 Energy | Env | 5 |

The 26 topic standards carry **accurate disclosure counts** (GRI 305 Emissions = 7, GRI 403 OH&S = 10,
GRI 207 Tax = 4…), spanning Economic (201–207), Environmental (301–308), Social (401–418).
`TOTAL_DISCLOSURES` sums to the correct GRI universal + topic disclosure total.

**Cross-framework maps** (real, curated): `GRI_ISSB_MAP` (GRI 305→SASB E01 GHG "Direct", GRI 304→E06
"Partial"…), `GRI_BRSR_MAP` (Indian BRSR principles), plus ESRS/TCFD/SFDR interoperability flags —
these drive the dual-reporting efficiency view.

### 7.3 Calculation walkthrough

Portfolio holdings (from `GLOBAL_COMPANY_MASTER` / localStorage `ra_portfolio_v1`) each get an
applicable-standard set (~75% of the 26), per-standard availability, and a coverage %. KPIs aggregate:
`avgStds` (mean applicable count), `avgDataAvail` (mean coverage), `fullAlign` (% of holdings at full
alignment), category-level averages (env/soc/eco). The interoperability tab counts how many of the 26
standards map to each of {GRI, ISSB/SASB, CSRD/ESRS, TCFD, SFDR}.

### 7.4 Worked example (one holding)

Suppose 4 applicable environmental standards: GRI 302 (5 disc), 303 (5), 305 (7), 306 (5) — total 22.
With seeded availability fractions 0.8, 0.6, 0.9, 0.5:

| Std | Disc | Avail = round(disc × frac) | Gap |
|---|---|---|---|
| GRI 302 | 5 | round(5×0.8)=4 | 1 |
| GRI 303 | 5 | round(5×0.6)=3 | 2 |
| GRI 305 | 7 | round(7×0.9)=6 | 1 |
| GRI 306 | 5 | round(5×0.5)=3 | 2 (topGap) |

```
availDisc = 4+3+6+3 = 16 ;  totalDisc = 22
coverage  = 16/22 × 100 = 72.7%
topGaps   = [GRI 303, GRI 306, GRI 302]  (largest gaps first)
```

A 72.7% coverage sits below the guide's 85% "with reference" threshold — the holding would be flagged
as not yet "in accordance", with GRI 303/306 as priority gaps.

### 7.5 Data provenance & limitations

- **Per-company availability is synthetic** — `sr()`/`hashStr` seed which standards apply and how much
  data exists. The GRI *taxonomy* (standards, disclosure counts, cross-framework maps) is real and
  correct.
- Coverage is **unweighted** (available/required), not the materiality-tier-weighted DCS the guide
  describes — a 1-disclosure standard counts equally per disclosure with a 10-disclosure one.
- No actual document parsing: "availability" does not check whether a disclosure's mandatory content
  elements (governance/management approach/metrics/targets) are present.

### 7.6 Framework alignment

**GRI Universal Standards 2021 (GRI 1/2/3)** — Foundation, General Disclosures (30), Material Topics
(6); encoded exactly. **GRI Topic Standards (300/400 series)** — 26 standards with correct disclosure
counts. **GRI "in accordance" vs "with reference"** — requires reporting all disclosures for material
topic standards; the page's coverage % proxies progress toward this. **ISSB S1/S2 & SASB** — the
`GRI_ISSB_MAP` reflects the real GRI-ISSB interoperability MOU, marking which GRI disclosures satisfy a
SASB metric (Direct/Partial). **CSRD/ESRS & TCFD** — interoperability flags support dual-use reporting.
GRI itself derives "in accordance" status by checking each material-topic disclosure's mandatory
content elements — the deeper check the §7.5 note flags as not yet implemented.

*(No §8 model spec required: this is a disclosure-completeness checker over a fixed, correctly-encoded
standards taxonomy. Its one quantitative output — coverage % — is a transparent ratio; its limitation
(unweighted, seeded availability) is documented above rather than requiring a bespoke production model.)*

## 9 · Future Evolution

### 9.1 Evolution A — Materiality-weighted completeness over real disclosure data (analytics ladder: rung 1 → 2)

**What.** §7 credits the GRI taxonomy as real and correct (GRI 1/2/3 universal + 26 topic standards, with disclosure counts and cross-framework maps), but flags two gaps: per-company applicability and data availability are `sr()`/`hashStr`-seeded, and there is no materiality-tier weighting (`w_k`) in the completeness computation despite the guide's `DCS = Σ(Complete_k·w_k)/Σ w_k × 100`. Evolution A implements the weighted DCS over real disclosure data: assess each GRI disclosure's completeness (mandatory content elements: governance, management approach, metrics, targets) from actual company reports, weight by materiality tier, and compute the DCS per §5 — so the 85% 'with reference' and 100% 'in accordance' thresholds mean something real.

**How.** (1) Replace seeded applicability/availability with a materiality assessment (which topic standards are material to the company/sector) and a completeness check per disclosure against real report content. (2) Apply the materiality-tier weights `w_k` in the DCS, per §5 (currently absent). (3) The cross-framework maps (already real) support mapping GRI disclosures to ESRS/ISSB for interoperability.

**Prerequisites.** Real company disclosure documents to assess completeness; a materiality-tier assignment per topic standard; the seeded availability replaced. **Acceptance:** DCS computes as a materiality-weighted completeness reproducing §5 (weights applied, not a flat count); the 'with reference'/'in accordance' thresholds derive from real completeness; no `sr()` availability feeds the score.

### 9.2 Evolution B — GRI reporting-readiness copilot (LLM tier 2)

**What.** A copilot for sustainability reporting teams: "what's our GRI disclosure completeness, which material topic standards have gaps, and what do we need for 'in accordance'?" tool-calls the Evolution A completeness endpoint, decomposes the DCS by topic standard, and lists the outstanding mandatory content elements.

**How.** Tier-2 tool-calling over the completeness/materiality endpoints; the grounding corpus is §5/§7, which correctly encode the GRI taxonomy, the DCS formula, and the cross-framework maps. The LLM's assessment of disclosure completeness against report text is part of the analytical layer, grounded by the mandatory-content-element checklist. Guardrail, pre-Evolution-A: availability is seeded and weighting absent, so it must refuse company-specific completeness claims. Every DCS and gap figure validated against tool output.

**Prerequisites.** Evolution A (weighted DCS and real assessment); document access; corpus embedding. **Acceptance:** post-Evolution-A, every DCS and gap figure traces to a tool call and cites the disclosure's missing content elements; pre-Evolution-A the copilot answers only on the real GRI taxonomy and declines company-specific completeness.