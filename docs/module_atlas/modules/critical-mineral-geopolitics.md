# Critical Mineral Geopolitics
**Module ID:** `critical-mineral-geopolitics` · **Route:** `/critical-mineral-geopolitics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses supply chain concentration risk for critical transition minerals including lithium, cobalt, nickel, rare earth elements, and copper across extraction, processing, and refining stages. Computes geopolitical supply risk scores, chokepoint exposure, and portfolio vulnerability to supply disruption.

> **Business value:** Enables investment analysts and supply chain risk managers to identify portfolio exposure to critical mineral geopolitical risk, assess EU CRM Act compliance requirements, and evaluate supply chain diversification strategies for transition-critical materials.

**How an analyst works this module:**
- Select mineral from the periodic-table-style grid to view full supply chain analysis
- Country Concentration tab shows production/processing HHI with interactive treemap
- Geopolitical Risk tab maps extraction country governance scores and conflict exposure
- Portfolio Exposure tab links supply chain concentration to specific portfolio holdings
- Scenario Analysis models supply shock impact on portfolio companies under disruption scenarios
- EU CRM Act Compliance tab checks strategic stock and sourcing diversification requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COMPANIES_80`, `COMP_NAMES_M`, `COUNTRIES_40`, `EXPORT_CONTROLS`, `FRIENDSHORING_POLICIES`, `MINERALS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MINERALS` | 46 | `name`, `symbol`, `mining`, `Chile`, `Australia`, `China`, `Argentina`, `Other` |
| `EXPORT_CONTROLS` | 11 | `country`, `minerals`, `type`, `date`, `priceImpact`, `substitution`, `status` |
| `FRIENDSHORING_POLICIES` | 9 | `policy`, `country`, `minerals`, `target`, `investment`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMP_NAMES_M` | `['Tesla Inc','BYD Auto','CATL','LG Energy','Samsung SDI','Panasonic','SK Innovation','Northvolt','SVOLT Energy','Gotion High-Tech',` |
| `mineralHHI` | `useMemo(()=>{ return MINERALS.map(m=>{ const miningVals=Object.values(m.mining);` |
| `mHHI` | `miningVals.reduce((a,v)=>a+v*v,0);` |
| `pHHI` | `processVals.reduce((a,v)=>a+v*v,0);` |
| `topMiner` | `Object.entries(m.mining).sort((a,b)=>b[1]-a[1])[0];` |
| `friendshoringByMineral` | `useMemo(()=>{ return mineralHHI.map(m=>({ name:m.symbol,mineral:m.name, alliedPct:100-(m.processing.China\|\|0), chinaDepPct:m.processing.China\|\|0, reshoreTarget:Math.min(100,Math.floor((100-(m.processing.China\|\|0))*1.5)), reshoreGapPct:Math.max(0,Math.floor((m.processing.China\|\|0)-30)), costPremium:`+${Math.floor((m.processing.China\|\|0)*0.` |
| `sectors` | `[...new Set(COMPANIES_80.map(c=>c.sector))];` |
| `pagedCompanies` | `filteredCompanies.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filteredCompanies.length/PAGE_SIZE);` |
| `rows` | `filteredCompanies.map(c=>[c.name,c.sector,c.topMineral,c.concentrationRisk,c.chinaProcessingDep,c.diversificationScore,c.friendshoringReady,c.geoRiskScore,c.supplierCount,c.exportControlExposure].join(','));` |
| `blob` | `new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);` |
| `miningData` | `Object.entries(m.mining).map(([k,v])=>({country:k,pct:v})).sort((a,b)=>b.pct-a.pct);` |
| `processData` | `Object.entries(m.processing).map(([k,v])=>({country:k,pct:v})).sort((a,b)=>b.pct-a.pct);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COMPANIES_80`, `COMP_NAMES_M`, `COUNTRIES_40`, `EXPORT_CONTROLS`, `FRIENDSHORING_POLICIES`, `MINERALS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Lithium Production HHI | — | USGS Mineral Commodity Summaries | High concentration; Australia and Chile account for >80% of production |
| REE Processing Concentration | — | IEA Critical Minerals 2024 | China’s dominance of rare earth processing creates critical chokepoint risk |
| Portfolio Critical Mineral Exposure | — | Supply chain mapping | Proportion of portfolio companies with high exposure to critical mineral supply chain risk |
| Supply Disruption Probability (5yr) | — | Oxford Economics / IEA | Probability of >20% supply shock for cobalt or lithium within 5 years |
| EU CRM Act Strategic Stock Requirement | — | EU CRM Act 2024 | EU requirement for strategic stocks of critical raw materials to buffer supply disruptions |
- **USGS / BGS mineral production data** → Compute production HHI by country per mineral → **Production concentration score**
- **World Bank WGI governance scores** → Weight production share by governance risk index → **Geopolitical supply risk score per mineral**
- **Portfolio supply chain mapping** → Link company inputs to mineral supply, compute exposure → **Portfolio-level critical mineral exposure score**

## 5 · Intermediate Transformation Logic
**Methodology:** Geopolitical Supply Risk Index
**Headline formula:** `GSRI = Σ_i (HHI_i × Governance_Risk_i × Trade_Concentration_i) / n`

HHI (Herfindahl-Hirschman Index) measures production concentration across supplying countries. Governance risk weights use World Bank Worldwide Governance Indicators (WGI) â€” rule of law and political stability dimensions. Trade concentration multiplier reflects reliance on a single processing country (e.g., China processes >80% of global rare earths). Score >2500 = highly concentrated; >4000 = critical chokepoint.

**Standards:** ['IEA Critical Minerals Report 2024', 'European Critical Raw Materials Act', 'EC Supply Chain Resilience Strategy']
**Reference documents:** IEA Critical Minerals and Clean Energy Transition Report 2024; European Critical Raw Materials Act (EU) 2024/1252; USGS Mineral Commodity Summaries 2024; World Bank Worldwide Governance Indicators

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The guide states a **Geopolitical Supply Risk Index**
> `GSRI = Σ_i (HHI_i × Governance_Risk_i × Trade_Concentration_i) / n`. **The HHI half is genuinely
> computed** — the code calculates the Herfindahl-Hirschman Index correctly from real per-country mining
> and processing shares (`HHI = Σ share²`). **But the full GSRI product is not formed:** the governance-
> risk term is `sr()`-seeded (not World Bank WGI), the trade-concentration multiplier is not multiplied
> in, and no single `GSRI` score is produced. The 80 downstream companies are fully seeded. So this is the
> strongest of the three critical-mineral modules — a real concentration analysis on real data — but the
> governance-weighted composite the guide describes is only half-built. §8 specifies the complete GSRI.

### 7.1 What the module computes

The real computation is per-mineral HHI over curated country shares, plus friendshoring/reshoring metrics:

```js
miningHHI     = Σ_c share_mining(c)²          // Herfindahl-Hirschman Index, 0–10,000
processingHHI = Σ_c share_processing(c)²
chinaProcess  = processing.China || 0
friendshoreScore = 100 − chinaProcess
// friendshoring detail:
alliedPct    = 100 − processing.China
reshoreTarget= min(100, floor((100 − chinaProcess) × 1.5))
reshoreGapPct= max(0, floor(chinaProcess − 30))
costPremium  = floor(chinaProcess × 0.4) + '%'
```

`governanceScore = floor(sr(country.length·17+3)·80 + 20)` — **seeded**, keyed only to country name length,
so it is not a real governance measure. The 80 companies' risk fields (`concentrationRisk`,
`chinaProcessingDep`, `diversificationScore`, `geoRiskScore`…) are all `sr()`-seeded.

### 7.2 Parameterisation / scoring rubric

**Curated mineral data (15 minerals, real per-country shares):**

| Mineral | Mining (top) | Processing China | Supply risk |
|---|---|---|---|
| Rare Earths | China 60%, Myanmar 12% | 90% | Critical |
| Graphite | China 65%, Mozambique 12% | 93% | Critical |
| Gallium | China 80% | 98% | Critical |
| Cobalt | DRC 74% | 73% | Critical |
| Tungsten | China 82% | 85% | Critical |
| Lithium | Chile 28%, Australia 24% | 65% | High |
| PGMs (Pt) | South Africa 72% | 55% | Medium |

| Field | Formula | Provenance |
|---|---|---|
| `miningHHI`, `processingHHI` | `Σ share²` | **Real HHI** over curated shares |
| `friendshoreScore`, `reshoreTarget`, `costPremium` | derived from `chinaProcess` | Real transforms |
| `governanceScore` | `floor(sr(len·17+3)·80+20)` | **Synthetic seeded PRNG** |
| 80 companies' risk fields | `floor(sr·range)` | Synthetic seeded PRNG |

`EXPORT_CONTROLS` (11) are real events (China Ga/Ge/graphite licensing 2023, Indonesia nickel ore ban 2020,
DRC cobalt royalty 3.5→10% 2024, Russia sanctions…) with real price-impact estimates.

### 7.3 Calculation walkthrough

1. `mineralHHI` computes mining and processing HHI per mineral from the curated share maps, sorts by
   processing HHI (most concentrated first).
2. `friendshoringByMineral` derives allied/China-dependence, a reshore target (×1.5 of allied share,
   capped), a reshore gap (China share − 30), and a cost premium (China share × 0.4%).
3. KPIs: 15 minerals, 40 countries, avg China processing, critical-risk count, avg processing HHI, avg
   2030 demand multiple.
4. The 80-company table (seeded) is filterable/sortable/paginated for portfolio mineral risk.

### 7.4 Worked example

Rare Earths processing shares `{China: 90, Estonia: 2, Japan: 2, Other: 6}`:
`processingHHI = 90² + 2² + 2² + 6² = 8100 + 4 + 4 + 36 = 8,144` — far above the 4,000 "critical
chokepoint" threshold, correctly flagging REE as the most concentrated. Its `friendshoreScore = 100 − 90 =
10`; `reshoreTarget = min(100, floor(10 × 1.5)) = 15`; `reshoreGapPct = max(0, 90 − 30) = 60`;
`costPremium = floor(90 × 0.4) = 36%`. Gallium (98% China processing) gives
`processingHHI = 98² + 1 + 1 = 9,606` — the highest chokepoint. These HHI values are **real**; the
per-country `governanceScore` shown in the radar (e.g. China `floor(sr(5·17+3)·80+20)`) is seeded.

### 7.5 Companion analytics on the page

Four tabs: concentration dashboard (mining vs processing HHI bars, China-processing ranking, demand-growth
ranking), friendshoring & de-risking (allied vs China, reshore targets, cost premiums), export controls &
nationalism (the 11 real events + 9 friendshoring policies), and portfolio mineral risk (80 seeded
companies). No backend engine or route — client-side.

### 7.6 Data provenance & limitations

- **Mineral shares and HHI are real** — 15 minerals with curated USGS/IEA-consistent per-country mining and
  processing shares; the HHI computation is a correct `Σ share²`. Export controls are real events.
- **Governance scores and the 80 companies are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. The
  governance term is keyed only to country-name length — meaningless as a governance measure.
- **The full GSRI product is not formed** — HHI is computed but not multiplied by governance and trade
  concentration into the guide's `Σ(HHI × Gov × Trade)/n` index; the module stops at HHI + friendshoring.

**Framework alignment:** *HHI* (Herfindahl-Hirschman Index) — correctly implemented; >2,500 concentrated,
>4,000 critical chokepoint, exactly as the guide states. *IEA Critical Minerals Report 2024* and *USGS*
underpin the share data. *EU Critical Raw Materials Act* frames the reshore/de-risking targets. *World Bank
WGI* (rule of law, political stability) is cited as the governance-weight source but **not used** — the
governance term is seeded instead. The GSRI composite completing this is specified below.

---

## 8 · Model Specification — Geopolitical Supply Risk Index (GSRI)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Complete the guide's GSRI: combine the (already-computed) HHI with real supplier-governance risk and trade
concentration into one 0–10,000-scaled index per mineral, and roll it up to portfolio exposure. Coverage:
the 15 curated minerals and any portfolio mapped to them.

### 8.2 Conceptual approach
Extend the working HHI with a **share-weighted World Bank WGI** governance term and a single-processor
trade-concentration multiplier, per the guide's product form and the **EU CRMA** supply-risk methodology
(concentration × governance × substitutability). This is the standard supply-risk index construction
(IEA, EU CRMA, British Geological Survey risk list).

### 8.3 Mathematical specification
```
HHI_proc_m   = Σ_c share_proc(c)²                               (already computed)
Gov_m        = Σ_c share_proc(c)/100 · (1 − WGI_norm(c))        WGI_norm ∈ [0,1]
Trade_m      = max_c share_proc(c) / 100                        (single-processor reliance)
GSRI_m       = HHI_proc_m · (1 + Gov_m) · (1 + Trade_m) / scale
Portfolio GSRI = Σ_m exposure_m · GSRI_m / Σ exposure_m
Bands: >2500 concentrated · >4000 critical chokepoint (on HHI leg)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Processing shares | `share_proc` | USGS/IEA (already curated) |
| Governance | `WGI_norm(c)` | World Bank WGI rule-of-law + political-stability, min-max normalised |
| Trade concentration | `Trade_m` | Dominant-processor share |
| Scale | `scale` | Normalise GSRI to interpretable range |

### 8.4 Data requirements
The curated processing/mining share vectors (present) and a WGI table per supplier country (free, World
Bank — replaces the seeded `governanceScore`). Portfolio exposure by mineral (the 80-company table would
supply real weights once its fields are sourced).

### 8.5 Validation & benchmarking plan
Reconcile GSRI rankings against EU CRMA and BGS risk-list orderings (REE, gallium, graphite should top);
backtest whether high-GSRI minerals saw the largest supply disruptions / export controls (the
`EXPORT_CONTROLS` events). Sensitivity on the governance and trade weights.

### 8.6 Limitations & model risk
HHI ignores stockpiles, recycling, and substitution — pair with the constraint module's recycling/
substitution data as mitigants. WGI is slow-moving and can miss sudden export controls (overlay the real
`EXPORT_CONTROLS`). Governance keyed to name-length (current code) must be replaced with real WGI.
Conservative fallback: report HHI + China-processing share directly (as the module already does correctly)
so the concentration signal is not obscured by an uncertain governance weight.

## 9 · Future Evolution

### 9.1 Evolution A — Finish the GSRI: real governance term, de-seeded company layer (analytics ladder: rung 2 → 3)

**What.** §7 calls this "the strongest of the three critical-mineral modules": the
HHI half of `GSRI = Σ(HHI × Governance × TradeConcentration)/n` is genuinely computed
(`Σ share²` over real curated mining/processing shares for 15 minerals), and the
friendshoring transforms are real. Two seeded layers remain: the governance score is
`sr()` keyed to *country-name length* — not World Bank WGI — and all 80 downstream
companies' risk fields (`concentrationRisk`, `chinaProcessingDep`,
`diversificationScore`) are seeded. Evolution A completes the composite and grounds
the company layer.

**How.** (1) Governance term: WGI rule-of-law and political-stability percentiles
per country as a curated refdata table (the guide's own stated source), production-
share-weighted per mineral — replacing the name-length seed. (2) Form the full GSRI
product with the trade-concentration multiplier (China-processing share, already
real) and publish per-mineral scores against the guide's documented thresholds
(>2500 concentrated, >4000 critical chokepoint — consistent with the HHI scale the
module already uses). (3) Company layer: replace seeded fields with a
disclosure-derived mapping — which minerals each company's segments depend on
(curated sector→mineral intensity as the honest first pass, per-company disclosure
extraction later) — or show honest nulls; real company names must stop carrying
random risk scores. (4) EU CRM Act tab: check the real Art. 5 benchmarks (10/40/25/
65) against the module's computed concentration data. (5) Share the HHI engine with
`critical-mineral-geo-risk` per that module's Evolution A.

**Prerequisites (hard).** Seeded company-field purge; WGI curation; single
source of truth for country shares across the three CM modules. **Acceptance:**
gallium (China 80% mining/98% processing, single-source) tops the GSRI ranking via
arithmetic, not assertion; the governance term cites WGI vintage; zero `sr()` calls
feed rendered scores.

### 9.2 Evolution B — CRM Act compliance and diversification advisor (LLM tier 1 → 2)

**What.** The module's EU CRM Act tab and its computed concentration data set up the
question corporates actually face: "are we exposed to a strategic-raw-material
dependency the CRM Act's benchmarks flag, and what diversification is realistic?"
Evolution B answers per mineral: the computed GSRI decomposition, the specific
chokepoint (mining vs processing stage — the module distinguishes them), which
`FRIENDSHORING_POLICIES` and `EXPORT_CONTROLS` entries bear on it, and the
diversification arithmetic (what share shift drops HHI below 2500) — a computation
the HHI engine can serve directly as a what-if.

**How.** Tier 1 grounds on the computed GSRI payloads, the curated policy datasets,
and the CRM Act text (Reg. 2024/1252 in refdata); tier 2 exposes the HHI/GSRI engine
as an endpoint so "what if Australia doubles lithium processing share?" becomes a
tool call re-running `Σ share²` on the adjusted vector — deterministic, auditable
what-if analysis, the cheapest genuine tier-2 win in the critical-minerals family.

**Prerequisites.** Evolution A (the governance term and de-seeded company layer);
the HHI engine served server-side for tier 2. **Acceptance:** diversification
what-ifs reproduce by hand-computing the adjusted HHI; CRM Act benchmark citations
match the regulation's Article 5 numbers; company-specific advice appears only for
companies with grounded (non-seeded) exposure mappings.