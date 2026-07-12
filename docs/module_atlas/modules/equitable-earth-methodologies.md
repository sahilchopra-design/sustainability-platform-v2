# Equitable Earth Methodologies
**Module ID:** `equitable-earth-methodologies` · **Route:** `/equitable-earth-methodologies` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements justice-based climate transition frameworks incorporating indigenous rights, community free prior informed consent, gender equity, and distributive justice principles into ESG and climate analytics. Aligns with the Equitable Earth principles, UNDRIP, and emerging just transition taxonomies from ILO, OECD, and the LSE Grantham Institute. Provides scoring, documentation, and narrative analytics for impact-first investors and development finance institutions.

> **Business value:** Enables impact investors, DFIs, and project developers to demonstrate and document genuine justice-based transition practices, satisfy emerging just transition bond frameworks, and build social licence that reduces project delay and reputational risk.

**How an analyst works this module:**
- Activate the Equitable Earth methodology module and select applicable justice frameworks (UNDRIP, ILO, LSE).
- Complete the project justice assessment questionnaire covering rights, equity, community, and governance dimensions.
- Review JTS dashboard with pillar breakdown and compare against peer projects and sector benchmarks.
- Generate just transition narrative report for DFI board approval, green/social bond framework, or investor ESG questionnaire.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_KEYS`, `Badge`, `Card`, `DualInput`, `Kpi`, `PILLARS`, `PROJECTS`, `STANDARDS`, `Section`, `TIER_COLORS`, `TIME_SERIES`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PILLARS` | 6 | `name`, `abbr`, `weight`, `color`, `desc`, `keys`, `labels`, `subWeights` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `(n) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : fmt(n);` |
| `overall` | `PILLARS.reduce((s, p) => s + (scores[p.id] \|\| 0) * p.weight, 0);` |
| `netRate` | `Math.max(0, baselineRate - projectRate); // projects exceeding baseline yield 0 credits, not phantom positive credits` |
| `grossAnnual` | `netRate * area;` |
| `grossTotal` | `grossAnnual * creditingPeriod;` |
| `leakageDeduction` | `grossTotal * (leakagePct / 100);` |
| `afterLeakage` | `grossTotal - leakageDeduction;` |
| `bufferDeduction` | `afterLeakage * (bufferPct / 100);` |
| `afterBuffer` | `afterLeakage - bufferDeduction;` |
| `uncertaintyDeduction` | `afterBuffer * (uncertaintyPct / 100);` |
| `netCredits` | `Math.max(0, afterBuffer - uncertaintyDeduction);` |
| `qualityMultiplier` | `pillarResult.overall / 100;` |
| `adjustedCredits` | `Math.round(netCredits * qualityMultiplier);` |
| `cobCredits` | `Math.round(adjustedCredits * cobenefitMult);` |
| `base` | `std.score + (sr(i * 13) - 0.5) * 20;` |
| `names` | `['Amazon Mosaic Reserve','Kalimantan Peatland Complex','Mekong Floodplain Forest','Madre de Dios NF Buffer','Mt. Kenya Watershed','Congo Basin REDD+','Chocó Rainforest Corridor','Borneo Orangutan Habitat','Nam Et-Phou Lo` |
| `waterfallData` | `useMemo(() => [ { name: 'Gross', value: creditResult.grossTotal, fill: T.teal }, { name: 'Leakage', value: -creditResult.leakageDeduction, fill: T.red }, { name: 'Buffer', value: -creditResult.bufferDeduction, fill: T.amber }, { name: 'Uncertainty', value: -creditResult.uncertaintyDeduction, fill: T.purple }, { name: 'Net (Pre-Q)', value:` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PILLARS`, `STANDARDS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FPIC Documentation Score (%) | — | UNDRIP / IFC PS7 | Completeness of free, prior, and informed consent documentation; 100% required for projects affecting indigenous territories. |
| Local Employment Ratio (%) | — | ILO / Project Records | Proportion of project jobs filled by local and affected community workers; key equity and community benefit metric. |
| Benefit-Sharing Rate (% of revenue) | — | Equitable Earth Standard | Proportion of project revenue shared with host communities through direct payments, infrastructure, or equity stakes. |
| Gender Equity Index (0â€“100) | — | UN Women / IFC | Composite measuring women's participation in employment, leadership, and benefit-sharing within the transition project. |
- **Project FPIC documentation and community consultation records** → Classify against UNDRIP article checklist; score completeness and authenticity → **FPIC compliance score and documentation gap log**
- **Employment and procurement records** → Disaggregate by gender, community origin, and income quintile → **Local employment ratio and gender equity index**
- **Revenue and benefit-sharing agreements** → Map contractual commitments to Equitable Earth benefit-sharing tiers → **Benefit-sharing rate and community revenue flow ($)**

## 5 · Intermediate Transformation Logic
**Methodology:** Just Transition Score
**Headline formula:** `JTS = w_r × Rights + w_e × Equity + w_c × Community + w_g × Governance`

Composite score across four justice dimensions each scored 0â€“100. Rights dimension covers FPIC documentation, indigenous land recognition, and legal remedy access. Equity dimension assesses distribution of transition costs and benefits across income quintiles. Community dimension tracks local employment, procurement, and benefit-sharing ratios. Governance dimension scores participatory decision-making processes.

**Standards:** ['UNDRIP 2007', 'ILO Just Transition Guidelines 2015', 'LSE Grantham Just Transition Framework 2023']
**Reference documents:** UN Declaration on the Rights of Indigenous Peoples (UNDRIP) 2007; ILO Guidelines for a Just Transition 2015; LSE Grantham Institute Just Transition Finance Framework 2023; World Bank Environmental and Social Framework 2018; Climate Investment Funds Just Transition Methodology 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Just Transition Score**
> (`JTS = w_r·Rights + w_e·Equity + w_c·Community + w_g·Governance`) built on UNDRIP/ILO/LSE-Grantham
> justice dimensions, FPIC documentation scores, gender-equity indices and benefit-sharing rates.
> **That four-pillar JTS does not exist in the code.** What the module actually implements is an
> **Equitable Earth carbon-credit quality & issuance engine**: a 5-pillar weighted quality score
> (Ecological / Community / Additionality / Permanence / MRV) feeding a full credit-issuance waterfall
> (gross → leakage → buffer → uncertainty → quality-adjusted → co-benefit). "Community Outcomes" and
> FPIC survive as *one* of the five pillars, which is likely the source of the guide confusion. The
> issuance maths is genuine and grounded in VCS/AFOLU accounting; only the demo *inputs* are seeded.

### 7.1 What the module computes

**(a) Pillar quality score** (`calcPillarScores`): each of 5 pillars aggregates 5 sub-indicators by
fixed sub-weights, then pillars roll up by pillar weight:

```js
scores[p] = clamp(Σ_i inputs[key_i] × subWeight_i, 0, 100)
overall   = Σ_p scores[p] × weight_p          // weights sum to 1.00
tier      = overall≥85 Gold · ≥70 Silver · ≥55 Bronze · else Ineligible
```

**(b) Credit issuance waterfall** (`calcCredits`) — the real accounting core:

```js
netRate  = max(0, baselineRate − projectRate)        // no phantom credits if project > baseline
grossAnnual = netRate × area                          // tCO₂e/yr
grossTotal  = grossAnnual × creditingPeriod
afterLeakage= grossTotal × (1 − leakagePct/100)
afterBuffer = afterLeakage × (1 − bufferPct/100)
netCredits  = max(0, afterBuffer × (1 − uncertaintyPct/100))
qualityMultiplier = pillarResult.overall / 100        // couples quality → issuance
adjustedCredits   = round(netCredits × qualityMultiplier)
cobCredits        = round(adjustedCredits × cobenefitMult)
```

The `max(0, …)` guards are deliberate (inline comment: *"projects exceeding baseline yield 0 credits,
not phantom positive credits"*) — a correct additionality safeguard.

### 7.2 Parameterisation / scoring rubric

**Pillar weights** (sum = 1.00):

| Pillar | Weight | Sub-weights |
|---|---|---|
| Ecological Preservation (EP) | 0.28 | 0.30/0.25/0.20/0.15/0.10 |
| Community Outcomes (CO) | 0.24 | 0.30/0.25/0.20/0.15/0.10 (FPIC 0.30) |
| Additionality & Causality (AC) | 0.22 | 0.30/0.25/0.20/0.15/0.10 |
| Permanence & Risk Buffer (PM) | 0.16 | 0.25/0.25/0.20/0.15/0.15 |
| MRV & Data Quality (MV) | 0.10 | 0.30/0.25/0.20/0.15/0.10 |

**Standard-specific accounting parameters** (6 EE methodologies — real AFOLU archetypes):

| Standard | baseline / project rate (tCO₂e/ha/yr) | leakage | buffer | uncertainty | co-benefit × |
|---|---|---|---|---|---|
| EE Native Forests (REDD+) | 18.5 / 2.1 | 10% | 15% | 8% | 1.12 |
| EE Agroforestry/Reforestation (A/R) | 3.2 / −8.5 | 8% | 20% | 12% | 1.08 |
| EE Blue Carbon – Seagrass | 6.8 / 0.4 | 5% | 25% | 18% | 1.15 |
| EE Peatland Mosaic | 55.0 / 5.2 | 12% | 18% | 10% | 1.10 |
| EE Soil Carbon – Grasslands | 1.2 / −2.8 | 6% | 22% | 20% | 1.05 |
| EE Mangrove Complex | 22.4 / 1.8 | 7% | 20% | 14% | 1.13 |

Provenance: baseline/project rates and buffer/uncertainty defaults are curated per-methodology
(REDD+ high baseline, peatland very high, soil carbon low), consistent with VCS/AFOLU literature; the
`baseline_method` fields cite real methodologies (VCS JNR, VM0033, IPCC Tier 3). Negative project
rates (A/R, soil) correctly encode net *sequestration* → higher net credit rate. Buffer % is a
non-permanence pool (VCS AFOLU practice); uncertainty % a deduction (per VCS uncertainty rules).

### 7.3 Calculation walkthrough

1. User sets 25 pillar sub-indicator sliders (default 70) → `calcPillarScores` → `overall`, `tier`.
2. User selects a methodology → loads its default `area`, `creditingPeriod`, baseline/project rates,
   leakage/buffer/uncertainty and co-benefit multiplier into `calcParams`.
3. `calcCredits` runs the waterfall; `qualityMultiplier = overall/100` scales net credits by the
   pillar-quality score, tightly coupling the two engines.
4. A waterfall chart plots Gross → −Leakage → −Buffer → −Uncertainty → Net → quality → co-benefit.
5. A synthetic project book (`base = std.score + (sr(i*13)−0.5)×20`) demonstrates the score
   distribution across ~N sample projects.

### 7.4 Worked example — Native Forests, 50,000 ha, pillar score 78

Inputs: EE Native Forests defaults (baseline 18.5, project 2.1, leakage 10%, buffer 15%,
uncertainty 8%, co-benefit 1.12), area 50,000 ha, crediting period 30 yr, pillar `overall = 78`.

| Step | Computation | Result |
|---|---|---|
| netRate | max(0, 18.5 − 2.1) | 16.4 tCO₂e/ha/yr |
| grossAnnual | 16.4 × 50,000 | 820,000 tCO₂e/yr |
| grossTotal | 820,000 × 30 | 24,600,000 |
| afterLeakage | ×(1−0.10) | 22,140,000 |
| afterBuffer | ×(1−0.15) | 18,819,000 |
| netCredits | ×(1−0.08) | 17,313,480 |
| qualityMultiplier | 78/100 | 0.78 |
| adjustedCredits | 17,313,480 × 0.78 | 13,504,514 |
| cobCredits | ×1.12 | **15,125,056 tCO₂e** |

Every step is deterministic; the pillar score directly shaves ~22% of net credits, which is the
module's design intent (low-quality projects issue fewer credits).

### 7.5 Data provenance & limitations

- **Accounting parameters are curated, not synthetic** — baseline/project rates, buffer/uncertainty
  defaults per methodology reflect real AFOLU archetypes. The only PRNG use is the *demo project book*
  `base = std.score + (sr(i*13)−0.5)×20` (`sr(s)=frac(sin(s+1)×10⁴)`), used purely to populate an
  illustrative score distribution.
- The `cobenefitMult` (1.05–1.15) inflates issuance for co-benefits — this is a design choice, not a
  VCS convention; real registries do *not* increase tonnage for co-benefits (they add labels/premia).
- Baseline is a flat rate × area × period; production REDD+ uses a *dynamic* baseline with
  activity-shifting leakage and jurisdictional nesting, which the module simplifies.
- `qualityMultiplier = overall/100` linearly discounts tonnage by quality — a defensible platform
  convention but not a registry-standard mechanic.

**Framework alignment:** the module operationalises core carbon-integrity concepts — **additionality**
(baseline vs project, financial/activity/barrier tests in `additionality` field), **leakage**
(deduction %), **permanence / non-permanence buffer pools** (VCS AFOLU buffer, `permanenceYrs`
15–50 yr), and **uncertainty deductions** (VCS uncertainty rules). Its 5-pillar quality score
mirrors the **ICVCM Core Carbon Principles** intent — ICVCM assesses ~10 CCPs (additionality,
permanence, robust quantification/MRV, no double counting, sustainable-development safeguards) at the
*program* and *methodology-category* level to award the CCP label; here EP/AC/PM/MV/CO pillars map
onto those same CCP themes, and FPIC/community reflects the **VCMI** claims-integrity and
safeguards dimension. Blue-carbon methodologies cite real standards (**VM0033** tidal wetland,
IPCC Tier 3 peat EFs).

## 9 · Future Evolution

### 9.1 Evolution A — Server-side issuance engine on real registry projects (analytics ladder: rung 2 → 3)

**What.** The §7 flag resolves a naming confusion: the guide's four-pillar Just Transition Score doesn't exist, but what does is arguably better — a genuine Equitable Earth credit quality-and-issuance engine: a 5-pillar weighted quality score (Ecological/Community/Additionality/Permanence/MRV) feeding a complete issuance waterfall (gross → leakage → buffer → uncertainty → quality-adjusted → co-benefit), with a correct honest-nulls guard (`netRate = max(0, baseline − project)` — "no phantom positive credits"). The math is "genuine and grounded in VCS/AFOLU accounting; only the demo inputs are seeded." Evolution A ports it server-side and grounds the inputs.

**How.** (1) `services/ee_issuance_engine.py` porting the waterfall and pillar rollup verbatim, bench-pinned with a worked AFOLU example. (2) Real projects: the platform already seeds Verra registry projects (migration 102) — the engine's demo `PROJECTS` list joins to those rows, so pillar assessments attach to real registry IDs with real areas and crediting periods. (3) Calibration to earn rung 3: leakage and buffer default percentages anchored to the published VCS AFOLU non-permanence buffer tables and methodology-specific leakage factors instead of slider defaults; the co-benefit multiplier documented against the Equitable Earth standard's actual tiering. (4) The seeded per-standard comparison (`base = std.score + (sr−0.5)·20`) replaced by the engine run on shared inputs per standard. (5) Reconcile the guide: either rename the module's documented methodology to match the issuance engine or add the JTS as a distinct sub-score — one truth in MODULE_GUIDES.

**Prerequisites.** Verra seed-data join keys verified; buffer/leakage source tables curated with citations. **Acceptance:** the bench pin reproduces the waterfall by hand; a registry project's issuance uses its real area/crediting period; defaults display their VCS provenance; zero `sr()` in comparisons.

### 9.2 Evolution B — Issuance-structuring copilot for project developers (LLM tier 2)

**What.** A tool-calling copilot for the questions the waterfall exists to answer: "we have 12,000 ha with a 2.1 tCO₂/ha/yr net rate — how many credits survive to issuance, what's the biggest deduction, and what quality-pillar improvement buys the most additional credits?" It runs Evolution A's engine, narrates the waterfall stage by stage (quoting each deduction), and answers the optimization question honestly — by re-running the engine across pillar-score increments and reporting computed deltas, since the quality multiplier makes that a real, differentiable trade-off.

**How.** Tools: `run_issuance(inputs)`, `run_pillar_sensitivity(inputs, pillar, delta)`, `get_buffer_defaults(methodology)`, `get_project(registry_id)`. Grounding corpus = this Atlas record's §7.1 formula chain and the VCS/Equitable Earth references. The copilot's improvement advice is strictly computed ("raising MRV pillar 60→75 yields +2,140 credits via the quality multiplier"), never qualitative hand-waving with numbers attached. The `CarbonCreditContext` bus means results can flow to sibling carbon modules — disclose that propagation in answers.

**Prerequisites (hard).** Evolution A — sensitivity advice over seeded standard comparisons would recommend real methodology choices on fabricated grounds. **Acceptance:** a golden project's narrated waterfall matches the engine stage-for-stage; every sensitivity delta reproduces from re-runs; questions about market price (not modeled here) refuse with a pointer to the carbon-pricing modules.