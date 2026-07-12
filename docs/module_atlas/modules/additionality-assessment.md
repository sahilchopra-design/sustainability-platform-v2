# Additionality Assessment
**Module ID:** `additionality-assessment` · **Route:** `/additionality-assessment` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPACITY_EVIDENCE`, `DFI_NAMES`, `DIMENSIONS`, `DIM_COLORS`, `FINANCIAL_EVIDENCE`, `GEOGRAPHIES`, `INV_PREFIXES`, `INV_SUFFIXES`, `POLICY_EVIDENCE`, `SECTORS`, `STRATEGIC_EVIDENCE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INV_SUFFIXES` | `['Fund I','Fund II','Fund III','Project A','Project B','Initiative','Venture','Co-Inv','Direct','Platform'];` |
| `FINANCIAL_EVIDENCE` | `['Below-market return accepted','Concessionary terms offered','First-loss tranche provided','Longer tenor than market','Higher risk tolerance than commercial','Catalytic capital deployed'];` |
| `pIdx` | `Math.floor(s1*INV_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*INV_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `geoIdx` | `Math.floor(sr(i*37+730)*GEOGRAPHIES.length);` |
| `financialScore` | `Math.round(sr(i*31+740)*60+30);` |
| `strategicScore` | `Math.round(sr(i*43+750)*60+25);` |
| `policyScore` | `Math.round(sr(i*53+760)*60+20);` |
| `capacityScore` | `Math.round(sr(i*67+770)*60+25);` |
| `compositeScore` | `Math.round((financialScore*0.35+strategicScore*0.25+policyScore*0.2+capacityScore*0.2));` |
| `investedM` | `Math.round((sr(i*71+780)*60+5)*10)/10;` |
| `projectIRR` | `Math.round((sr(i*29+790)*15+2)*100)/100;` |
| `benchmarkIRR` | `Math.round((sr(i*23+800)*8+5)*100)/100;` |
| `irrGap` | `Math.round((projectIRR-benchmarkIRR)*100)/100;` |
| `financialEvidence` | `FINANCIAL_EVIDENCE.filter((_,ei)=>sr(i*17+ei*31+810)>0.45);` |
| `strategicEvidence` | `STRATEGIC_EVIDENCE.filter((_,ei)=>sr(i*19+ei*29+820)>0.5);` |
| `policyEvidence` | `POLICY_EVIDENCE.filter((_,ei)=>sr(i*23+ei*37+830)>0.55);` |
| `capacityEvidence` | `CAPACITY_EVIDENCE.filter((_,ei)=>sr(i*29+ei*41+840)>0.5);` |
| `dfiComparison` | `DFI_NAMES.slice(0,3).map((d,di)=>({name:d,score:Math.round(sr(i*13+di*43+850)*40+40)}));` |
| `engagement` | `{boardSeat:sr(i*37+860)>0.5,technicalAssistance:sr(i*41+870)>0.4,governanceImprovement:sr(i*43+880)>0.45,capacityBuilding:sr(i*47+890)>0.35};` |
| `csv` | `[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `kpis` | `useMemo(()=>[ {label:'Investments',value:investments.length}, {label:'Avg Composite',value:investments.length?Math.round(investments.reduce((a,i)=>a+i.compositeScore,0)/investments.length):0}, {label:'A-Rated',value:investments.filter(i=>i.rating==='A').length}, {label:'Catalytic Capital',value:investments.filter(i=>i.catalytic==='Yes').l` |
| `avgByDim` | `DIMENSIONS.map(d=>({dimension:d,avg:investments.length?Math.round(investments.reduce((a,i)=>a+i[`${d.toLowerCase()}Score`],0)/investments.length):0}));` |
| `ratingDist` | `['A','B','C','D'].map(r=>({rating:r,count:investments.filter(i=>i.rating===r).length}));` |
| `dfiAvg` | `investments.length?Math.round(investments.reduce((a,inv)=>{const comp=inv.dfiComparison.find(c=>c.name===d);return a+(comp?comp.score:50);},0)/investments.length):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPACITY_EVIDENCE`, `DFI_NAMES`, `DIMENSIONS`, `DIM_COLORS`, `FINANCIAL_EVIDENCE`, `GEOGRAPHIES`, `INV_PREFIXES`, `INV_SUFFIXES`, `POLICY_EVIDENCE`, `SECTORS`, `STRATEGIC_EVIDENCE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ No MODULE_GUIDES entry exists for this route; this deep dive is grounded entirely in
> `AdditionalityAssessmentPage.jsx`.

### 7.1 What the module computes

A development-finance **additionality scorecard** for a portfolio of 60 synthetic impact
investments across 10 sectors (Clean Energy … Digital Infrastructure) and 10 emerging-market
geographies. Each investment is scored 0–100 on four additionality dimensions and combined:

```
compositeScore = 0.35·Financial + 0.25·Strategic + 0.20·Policy + 0.20·Capacity
rating         = A if ≥75 · B ≥60 · C ≥45 · else D
```

The weighting encodes the DFI convention that **financial additionality** (would the investment
have happened without concessional/catalytic capital?) is the primary test, with strategic
(non-financial value-add), policy and capacity additionality as secondary channels.

### 7.2 Parameterisation / evidence rubric

**Dimension score generation (synthetic):**

| Dimension | Formula | Range |
|---|---|---|
| Financial | `round(sr(i·31+740)·60+30)` | 30–90 |
| Strategic | `round(sr(i·43+750)·60+25)` | 25–85 |
| Policy | `round(sr(i·53+760)·60+20)` | 20–80 |
| Capacity | `round(sr(i·67+770)·60+25)` | 25–85 |

**Evidence checklists** — each dimension has a 6-item evidence library; items attach to an
investment when an independent PRNG draw exceeds a threshold (so richer evidence lists are
random, not derived from the scores):

| Dimension | Threshold | Example items |
|---|---|---|
| Financial (>0.45) | Below-market return accepted · Concessionary terms · First-loss tranche · Longer tenor · Higher risk tolerance · Catalytic capital |
| Strategic (>0.50) | Board seat · Technical assistance · ESG governance improved · Supply-chain development · Market linkages · Management capacity |
| Policy (>0.55) | Policy advocacy · Regulatory framework improved · Standards developed · Public goods · Demonstration effect · Replication enabled |
| Capacity (>0.50) | Skills transferred · Institutional capacity · Knowledge shared · Training delivered · Local leadership · Systems strengthened |

**Financial-additionality economics:** `projectIRR = sr·15+2` (2–17%), `benchmarkIRR = sr·8+5`
(5–13%), `irrGap = projectIRR − benchmarkIRR`. A *negative* gap (accepting below-benchmark
returns) is the classic financial-additionality evidence; the seed ranges make both signs
common. Other attributes: `investedM` $5–65M, vintage 2018–2024, tenor 3–10y, instrument from
{Equity, Debt, Mezzanine, Guarantee, TA Grant}, `concessionality` (p≈0.6 Yes),
`catalytic` (p≈0.5 Yes). Each investment also carries a 3-DFI comparison panel (from IFC,
MIGA, AfDB) with peer scores `sr·40+40` (40–80).

### 7.3 Calculation walkthrough

1. **Scorecard (Tab 1):** filter (search/sector/rating) → sortable table with per-dimension
   badge colouring at ≥65 green / ≥45 amber / else red; top-30 composite bar chart coloured on
   the A/B/C/D cut-offs; CSV export of the flattened scorecard.
2. **Portfolio KPIs:** count, `avgComposite = Σ composite / n`, A-rated count, catalytic count,
   `totalInvested = Σ investedM`.
3. **Aggregates:** `avgByDim` = portfolio mean per dimension (guarded for empty portfolio);
   `ratingDist` = counts per rating; `dfiAvg` = mean peer score per DFI across all
   investments' comparison panels (defaults a missing peer to 50).
4. **Detail panel:** clicking a row opens the evidence lists, engagement booleans (board seat,
   TA, governance, capacity building) and the DFI comparison for that investment.

### 7.4 Worked example — composite score and rating

Investment with Financial 72, Strategic 58, Policy 44, Capacity 66:

| Dimension | Score | Weight | Contribution |
|---|---|---|---|
| Financial | 72 | 0.35 | 25.20 |
| Strategic | 58 | 0.25 | 14.50 |
| Policy | 44 | 0.20 | 8.80 |
| Capacity | 66 | 0.20 | 13.20 |
| **Composite** | | | **round(61.70) = 62** |

62 falls in [60, 75) → rating **B**. If its `projectIRR = 6.1%` against `benchmarkIRR = 9.4%`,
`irrGap = −3.3pp` — supporting financial additionality (concessional return acceptance) even
though the composite is mid-tier.

### 7.5 Data provenance & limitations

- **Entirely synthetic:** all 60 investments, scores, IRRs, evidence lists and DFI peer scores
  are generated by the platform PRNG `sr(seed) = frac(sin(seed+1)×10⁴)` with fixed offsets
  (700–940 block), so the portfolio is deterministic across reloads but represents no real
  transactions.
- Evidence items are drawn independently of the dimension scores, so a high Financial score
  does not imply more financial-evidence items — an internal-consistency gap a production
  system would enforce (scores should be *derived from* evidence).
- The composite weights (0.35/0.25/0.20/0.20) and rating cut-offs (75/60/45) are platform
  choices without an inline citation — treat as synthetic demo calibration, though the
  dimension taxonomy itself tracks DFI practice.
- No counterfactual modelling: real additionality assessment requires an explicit
  without-investment baseline; here additionality is asserted through scored evidence only.

### 7.6 Framework alignment

- **OECD DAC Blended Finance Principles (Principle 2 — additionality/minimum concessionality)**
  — the financial dimension's evidence set (below-market returns, first-loss, longer tenor)
  operationalises DAC's test that concessional capital should not crowd out commercial finance.
- **IFC/MDB "Harmonized Framework for Additionality" (2018)** — the multilateral banks split
  additionality into *financial* (risk mitigation, own-account terms) and *non-financial*
  (standards-setting, knowledge, policy work). The module's Financial vs
  Strategic/Policy/Capacity split mirrors that two-pillar structure, subdividing the
  non-financial pillar into three scored channels.
- **Impact-management practice (Impact Frontiers / former IMP "investor contribution")** —
  evidence categories like "signal that impact matters", "engage actively" and "grow new or
  undersupplied markets" map to the Strategic and Policy evidence lists.
- **DFI benchmarking** — the IFC/MIGA/AfDB comparison panel imitates how DFIs benchmark
  additionality claims against peer institutions; scores here are synthetic placeholders.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-derived scoring with a counterfactual baseline (analytics ladder: rung 1 → 2)

**What.** The module is tier-B frontend-only: 60 synthetic investments generated by the
platform PRNG (offset block 700–940), with the §7.5-documented internal-consistency gap
that evidence checklists are drawn **independently** of the dimension scores — a high
Financial score implies no extra financial-evidence items, the inverse of how DFI practice
works. Evolution A builds the first backend vertical: an `additionality_assessments` table
storing real deals, and a scoring engine where dimension scores are **computed from**
checked evidence items (per-item weights within each 6-item library) plus the IRR-gap test
(`projectIRR − benchmarkIRR < 0` boosting Financial), replacing free-floating PRNG draws.
A simple counterfactual field ("without-investment scenario" narrative + probability
weight) addresses the no-counterfactual limitation head-on.

**How.** `POST /api/v1/additionality/assess` accepting the four evidence arrays, IRR pair,
instrument and concessionality flags; engine preserves the page's composite
`0.35·Fin + 0.25·Strat + 0.20·Pol + 0.20·Cap` and A/B/C/D cut-offs (75/60/45) but sources
the inputs from evidence; `GET /api/v1/additionality/benchmarks` serves DFI peer
distributions (initially the IFC Harmonized Framework categories as a structured reference
table rather than the current synthetic IFC/MIGA/AfDB scores). Rung 2 via sensitivity: how
the rating moves as evidence items toggle.

**Prerequisites.** Alembic migration; the composite weights and cut-offs need an inline
rationale note since §7.5 flags them as uncited platform choices. **Acceptance:** the §7.4
worked example (72/58/44/66 → 62 → B) reproduces when equivalent evidence is entered;
removing all financial-evidence items measurably lowers the Financial score — impossible in
the current independent-draw design.

### 9.2 Evolution B — Deal-memo evidence extractor feeding the scorecard (LLM tier 2)

**What.** The highest-value LLM fit here is upstream of the scorecard: an analyst pastes a
deal memo or IC paper, and the copilot extracts additionality evidence into the module's
exact four checklists ("First-loss tranche provided", "Board seat", "Policy advocacy",
"Skills transferred"…), proposes the IRR-gap inputs it finds, and submits the structured
draft to Evolution A's `POST /assess` for the analyst to confirm — the engine scores, the
LLM only classifies text into the fixed 24-item evidence taxonomy.

**How.** Tool schema over `POST /api/v1/additionality/assess` plus a read tool for the DFI
benchmark endpoint; extraction prompt enumerates the evidence libraries verbatim from this
Atlas page (§7.2 table) with per-item definitions, and requires a supporting quote from the
memo for every checked item (span-grounded extraction, no inference of unchecked items).
A confirmation UI shows item → quote pairs before anything is scored; unmatched claims land
in a "needs analyst review" bucket rather than being silently checked.

**Prerequisites (hard).** Evolution A must exist — today the module has zero backend
endpoints, so there is nothing for a tier-2 agent to call; the synthetic 60-deal book
stays clearly labelled demo data until real assessments accumulate. **Acceptance:** every
checked evidence item in an LLM-drafted assessment carries a verbatim source quote from the
input document; a memo containing no financial-additionality language yields zero checked
Financial items and the copilot says so.