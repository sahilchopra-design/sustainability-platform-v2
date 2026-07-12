# Procurement Climate Risk Analytics
**Module ID:** `procurement-climate-risk` · **Route:** `/procurement-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DN2 · **Sprint:** DN

## 1 · Overview
Analyses climate physical and transition risks embedded in procurement portfolios. Identifies supply chain disruption probability from climate events, carbon cost pass-through from carbon-intensive suppliers, and regulatory exposure from EUDR and CS3D supply chain due diligence requirements.

> **Business value:** Required for corporate procurement and sustainability teams managing CS3D compliance, CFOs stress-testing carbon cost pass-through, and supply chain risk managers. Provides systematic risk-weighted procurement climate analysis and regulatory compliance gap reporting.

**How an analyst works this module:**
- Map procurement categories by climate risk type
- Calculate carbon pass-through exposure
- Identify EUDR and CS3D compliance gaps in supply base
- Prioritise supplier engagement by spend and risk
- Generate CS3D-compliant due diligence risk report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CATEGORIES`, `CAT_TYPES`, `KpiCard`, `REGIONS`, `RISK_LEVELS`, `RiskBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Risk Dashboard', 'Physical Risk', 'Transition Risk', 'Concentration Analysis', 'Category Deep-Dive', 'Regional Heat Map', 'Mitigation Playbook', 'Scenarios'];` |
| `composite` | `(c.physicalRisk + c.transitionRisk) / 2;` |
| `totalSpend` | `useMemo(() => CATEGORIES.reduce((a, c) => a + c.spendMn, 0), []);` |
| `avgPhysical` | `useMemo(() => CATEGORIES.reduce((a, c) => a + c.physicalRisk, 0) / Math.max(1, CATEGORIES.length), []);` |
| `avgTransition` | `useMemo(() => CATEGORIES.reduce((a, c) => a + c.transitionRisk, 0) / Math.max(1, CATEGORIES.length), []);` |
| `criticalCount` | `useMemo(() => CATEGORIES.filter(c => (c.physicalRisk + c.transitionRisk) / 2 >= 7.5).length, []);` |
| `highHhiCount` | `useMemo(() => CATEGORIES.filter(c => c.concentrationHhi > 0.4).length, []);  const regionalBreakdown = useMemo(() => REGIONS.map(r => { const cats = CATEGORIES.filter(c => c.region === r);` |
| `spend` | `cats.reduce((a, c) => a + c.spendMn, 0);` |
| `avgPR` | `cats.length ? cats.reduce((a, c) => a + c.physicalRisk, 0) / cats.length : 0;` |
| `avgTR` | `cats.length ? cats.reduce((a, c) => a + c.transitionRisk, 0) / cats.length : 0;` |
| `typeBreakdown` | `useMemo(() => CAT_TYPES.map(t => {` |
| `avgCI` | `cats.length ? cats.reduce((a, c) => a + c.carbonIntensity, 0) / cats.length : 0;` |
| `top10ByRisk` | `useMemo(() => [...CATEGORIES].sort((a, b) => ((b.physicalRisk + b.transitionRisk) / 2) - ((a.physicalRisk + a.transitionRisk) / 2)).slice(0, 10), []);` |
| `top10BySpend` | `useMemo(() => [...CATEGORIES].sort((a, b) => b.spendMn - a.spendMn).slice(0, 10), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAT_TYPES`, `REGIONS`, `RISK_LEVELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Supply Chain Disruption Cost | — | McKinsey SCRI 2022 | Average annual supply chain disruption cost for large corporations — climate events driving 30%+ of disruptions |
| Carbon Pass-Through Rate | — | IEA Carbon Pricing and Industry 2023 | Manufacturing suppliers pass 40–70% of carbon cost increases to buyers via price increases |
| CS3D Due Diligence Scope | — | EU CS3D Directive 2024/1760 | CS3D requires due diligence across direct and indirect supply chain for >500 employee EU companies |
- **Procurement data by supplier, category, and geography** → Risk scoring → **Spend-weighted climate risk by procurement category**
- **Supplier carbon intensity data (CDP, sector averages)** → Carbon pass-through calculation → **Expected price impact from carbon cost pass-through**
- **EUDR/CS3D regulatory requirements** → Compliance gap analysis → **Supplier compliance status and due diligence action plan**

## 5 · Intermediate Transformation Logic
**Methodology:** Procurement Climate Risk Score
**Headline formula:** `ProcurRisk = Σ [SpendShare_i × (PhysicalRisk_i + TransitionRisk_i + RegulatoryRisk_i)]; CarbonPassThrough = Σ [Spend_j × CarbonIntensity_j × CarbonPrice × PassThroughRate]`

Spend-weighted risk aggregates three risk types; carbon pass-through models upstream carbon pricing absorbed by buyer — relevant for CBAM-exposed imports

**Standards:** ['EU Corporate Sustainability Due Diligence Directive (CS3D) 2024', 'EUDR Regulation 2023/1115', 'Supply Chain Risk Institute Framework', 'Science Based Targets initiative Scope 3 Guidance']
**Reference documents:** EU Corporate Sustainability Due Diligence Directive (CS3D) 2024/1760; EU Deforestation Regulation (EUDR) 2023/1115; McKinsey Global Supply Chain Risk Index 2022; OECD Due Diligence Guidance for Responsible Business Conduct (2018)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The guide advertises two formulas —
> `ProcurRisk = Σ[SpendShareᵢ × (Physᵢ + Transᵢ + Regᵢ)]` (spend-weighted, three-component) and
> `CarbonPassThrough = Σ[Spendⱼ × CarbonIntensityⱼ × CarbonPrice × PassThroughRate]`. **Neither is
> implemented.** The code's composite risk is an **unweighted simple mean of just two components**,
> `(physicalRisk + transitionRisk)/2` — regulatory exposure is displayed but not folded into the
> composite, and there is no spend-weighting. The carbon pass-through calculation (with a carbon price
> and pass-through rate) does not exist; carbon cost pass-through appears only as a mitigation-action
> label and scenario narrative. All 70 categories are `sr()`-seeded.

### 7.1 What the module computes

**Composite category risk** (drives the RiskBadge, top-10 ranking, filters):

```js
composite = (physicalRisk + transitionRisk) / 2                 // 1–10 scale, simple mean
level     = composite ≥ 7.5 ? 'Critical' : ≥ 5.5 ? 'High' : ≥ 3.5 ? 'Medium' : 'Low'
```

**Portfolio KPIs** (all unweighted means / counts over 70 categories):

```js
totalSpend    = Σ spendMn                              // → "$B" headline
avgPhysical   = Σ physicalRisk / 70
avgTransition = Σ transitionRisk / 70
criticalCount = #{ (phys+trans)/2 ≥ 7.5 }
highHhiCount  = #{ concentrationHhi > 0.4 }
avgCarbonInt  = Σ carbonIntensity / 70                 // tCO₂e/$M spend
```

**Regional / type breakdowns** average `physicalRisk`, `transitionRisk`, `carbonIntensity` within a
group; regional composite = `(avgPR + avgTR)/2`, sorted descending.

**Scenario tab** applies **hard-coded** NGSF-labelled adjustments (not derived from the data):

| Scenario | physAdj | transAdj | spendImpact |
|---|---|---|---|
| Orderly (1.5 °C) | −0.5 | +2.0 | +8% |
| Disorderly (2 °C) | +1.0 | +3.5 | +18% |
| Hot House (3.5 °C+) | +4.5 | −0.5 | +35% |

### 7.2 Parameterisation / provenance

| Field | Formula | Provenance |
|---|---|---|
| physicalRisk | `sr(i·11+3)·9 + 1` (1–10) | **synthetic seeded** |
| transitionRisk | `sr(i·13+4)·9 + 1` (1–10) | **synthetic seeded** |
| spendMn | `sr(i·17+5)·30 + 1` ($1–31M) | synthetic seeded |
| concentrationHhi | `sr(i·23+7)·0.6 + 0.1` (0.1–0.7) | synthetic seeded |
| carbonIntensity | `sr(i·29+8)·200 + 10` | synthetic seeded |
| regulatoryExposure | `sr(i·41+11)·9 + 1` | synthetic; **not in composite** |
| Composite thresholds | 7.5 / 5.5 / 3.5 | in-code rubric |
| Scenario adjustments | table above | hand-authored (NGSF-labelled) |
| HHI critical cutoff | 0.4 | in-code (loosely maps to "moderately concentrated") |

### 7.3 Calculation walkthrough

1. `CATEGORIES` seeds 70 procurement categories with independent `sr()` draws per attribute.
2. Filters (region/type/risk-level) subset; the risk-level filter recomputes `(phys+trans)/2` per
   category then buckets by the 7.5/5.5/3.5 thresholds.
3. KPI strip: sums spend, averages the two risk axes and carbon intensity, counts critical / high-HHI.
4. Regional & type breakdowns re-average within groups.
5. Scenario tab: displays base avg physical/transition + the fixed per-scenario adjustment and a
   flat % spend impact (no per-category propagation).

### 7.4 Worked example (KPI strip + one category)

Take a seeded category with `physicalRisk = 8.2`, `transitionRisk = 6.4`, `spendMn = 24.0`,
`concentrationHhi = 0.52`:

| Metric | Computation | Result |
|---|---|---|
| Composite | (8.2 + 6.4)/2 | **7.3** → **High** (below 7.5) |
| HHI flag | 0.52 > 0.40 | high concentration ✓ |

Under **Disorderly (2 °C)**: displayed adjusted physical = base avg + 1.0, transition = base avg +
3.5, headline "spend impact +18%". Note the scenario spend impact is a **single flat %** applied to
the narrative, not `Σ spend × carbon × price` — a category's own carbon intensity does not change its
scenario cost.

### 7.5 Data provenance & limitations

- **All 70 categories are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)` with distinct
  prime multipliers per field, so attributes are mutually independent (a high-carbon category need
  not carry high transition risk).
- Composite ignores regulatory exposure and spend weight → contradicts the guide's three-component,
  spend-weighted formula. A high-spend Critical category counts the same as a $1M one.
- **No carbon pass-through model**: no carbon price, no pass-through rate, no CBAM cost estimate —
  despite the guide's headline formula and CBAM framing.
- Scenario adjustments are hand-set constants, not NGFS macro-financial paths; they are not
  propagated to individual categories or to spend.

**Framework alignment:** The page references **EU CS3D (2024/1760)** and **EUDR (2023/1115)** as
supply-chain due-diligence drivers and **NGFS** scenario labels, and **CBAM** as a carbon-cost
channel. For reference, CBAM prices embedded emissions of imported steel/cement/aluminium/fertiliser/
electricity at the EU-ETS price — the natural basis for a real pass-through calc. **SBTi Scope 3
guidance** underlies the carbon-intensity framing. None of these frameworks' quantitative methods are
implemented; they inform the taxonomy and narrative only.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a spend-weighted procurement climate-risk score and a carbon-cost
pass-through estimate per category and portfolio, to prioritise supplier engagement and stress-test
CBAM/carbon-price exposure. Coverage: all procurement categories with spend, carbon intensity, and
region.

**8.2 Conceptual approach.** (i) A **spend-weighted multi-factor risk index** (physical + transition
+ regulatory), mirroring McKinsey/Gartner supply-chain risk indices and the CS3D risk-based
prioritisation logic. (ii) A **carbon-cost pass-through model** mirroring CBAM cost estimation and
IEA sector cost pass-through — the buyer's expected price increase from upstream carbon pricing.

**8.3 Mathematical specification.**
Spend share: `wᵢ = spendᵢ / Σ spend`.
Category risk: `Rᵢ = α·physᵢ + β·transᵢ + γ·regᵢ`, weights α+β+γ=1 (default 0.4/0.4/0.2).
Portfolio risk: `ProcurRisk = Σᵢ wᵢ · Rᵢ`.
Pass-through cost: `PTᵢ = spendᵢ · carbonIntensityᵢ · CarbonPrice_s · passRateᵢ`;
portfolio `PT = Σᵢ PTᵢ`; scenario-conditioned via `CarbonPrice_s` from NGFS.
CBAM subset: restrict to CBAM commodities, `CBAMcostᵢ = importVolᵢ · embeddedEFᵢ · (ETSprice − originCarbonPrice)`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Component weights | α,β,γ | expert / CS3D materiality (default 0.4/0.4/0.2) |
| Carbon price path | `CarbonPrice_s` | NGSF Phase IV shadow carbon; EU-ETS for CBAM |
| Pass-through rate | `passRateᵢ` | IEA sector pass-through (40–70% industrials) |
| Carbon intensity | `carbonIntensityᵢ` | CDP supplier data / sector EF (EPA/IEA) |
| Embedded EF (CBAM) | `embeddedEFᵢ` | EU CBAM default values by commodity |

**8.4 Data requirements.** Per category: spend, supplier carbon intensity (or sector proxy), region,
CBAM-commodity flag + import volume, regulatory-regime applicability. Sources: procurement ERP spend
cube, CDP supplier disclosures, EU CBAM default-value tables, NGSF carbon paths (migration 088).

**8.5 Validation & benchmarking.** Backtest pass-through cost against realised commodity price moves
post-carbon-price changes; sensitivity of ProcurRisk to component weights; reconcile CBAM cost
against declared CBAM certificates for pilot categories.

**8.6 Limitations & model risk.** Supplier-level carbon intensity is sparse → sector proxies dominate;
pass-through rates vary with market power and contract structure. Conservative fallback: sector-median
intensity at flagged low DQ; cap pass-through at 100% of the carbon cost.

## 9 · Future Evolution

### 9.1 Evolution A — Spend-weighted three-component risk with a real pass-through model (analytics ladder: rung 1 → 2)

**What.** §7 shows the code falls short of its own guide twice: the composite is an unweighted `(physicalRisk + transitionRisk)/2` — `regulatoryExposure` is displayed but excluded, and there is no spend-weighting — and the advertised `CarbonPassThrough = Σ[Spend × CarbonIntensity × CarbonPrice × PassThroughRate]` does not exist at all; all 70 categories are `sr()`-seeded, and the scenario tab applies hard-coded adjustments. Evolution A closes the guide↔code gap: implement both formulas as documented, over an uploadable procurement register instead of seeded categories.

**How.** (1) Backend `api/v1/routes/procurement_climate.py`: `POST /portfolio-risk` computing `Σ[SpendShareᵢ × (Physᵢ + Transᵢ + Regᵢ)]` per the guide, and `POST /carbon-pass-through` taking a carbon price ($/tCO₂e), category carbon intensities, and a sector pass-through rate band (the guide's own IEA-cited 40–70% for manufacturing). (2) Category intake via the platform's uploads path (CSV: category, spend, region, supplier country) with intensities defaulted from refdata sector tables when unreported. (3) Physical risk per category region resolved against the digital-twin hazard grids (`ref_*_zones`) rather than a seeded 1–10 draw, following the `global_physical_risk_engine` pattern. (4) Scenario adjustments derived from NGFS carbon-price paths through the pass-through formula, replacing the three hard-coded rows.

**Prerequisites.** Seeded categories retired or flagged demo; hazard-grid lookup for supplier regions (coarse country level is acceptable, tier reported). **Acceptance:** composite changes when spend mix changes at constant risk scores (spend-weighting proven); pass-through output scales linearly with carbon price in a bench case.

### 9.2 Evolution B — CS3D due-diligence copilot (LLM tier 1 → 2)

**What.** The module's regulatory surface (CS3D 2024/1760, EUDR 2023/1115) is where procurement teams need language, not just scores. Evolution B ships a copilot that drafts the CS3D-compliant due-diligence risk report the workflow already promises ("Generate CS3D-compliant due diligence risk report" is a documented analyst step with no generator behind it): "which categories trigger EUDR commodity scope?", "draft the engagement priority memo for our top-10 by risk-weighted spend".

**How.** Tier 1: RAG over this Atlas record plus CS3D/EUDR/OECD-guidance reference texts (§5 names them) via the standard copilot router; category-level numbers injected from Evolution-A endpoint responses as context. Tier 2 upgrade: "re-rank under disorderly scenario with $150/t carbon" becomes `POST /portfolio-risk` + `/carbon-pass-through` tool calls. Guardrails: regulatory-applicability statements must cite the directive article in the corpus; before Evolution A, the copilot must not quote the seeded risk scores as company data — the §7.2 provenance table marks every input synthetic.

**Prerequisites.** Evolution A for any quantitative claims; directive texts chunked with article-level anchors. **Acceptance:** a generated DD report cites specific CS3D articles for each obligation and every risk figure traces to an endpoint response; EUDR questions on non-scoped commodities get a scoped refusal.