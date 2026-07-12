# Theory Of Change
**Module ID:** `theory-of-change` · **Route:** `/theory-of-change` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EVIDENCE_QUALITY`, `INV_PREFIXES`, `INV_SUFFIXES`, `SECTORS`, `STAGE_COLORS`, `TEMPLATES`, `TOC_STAGES`, `VERIFICATION_STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INV_SUFFIXES` | `['Fund I','Fund II','Project Alpha','Project Beta','Initiative','Venture','Partnership','Co-Investment','Direct','Platform'];` |
| `pIdx` | `Math.floor(s1*INV_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*INV_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `stageKPIs` | `TOC_STAGES.map((stage,si)=>{` |
| `items` | `(template[stage.toLowerCase()]\|\|defaultTemplate[stage.toLowerCase()]).map((item,ii)=>({` |
| `invested` | `Math.round((sr(i*67+230)*40+5)*10)/10;` |
| `counterfactualBase` | `Math.round(sr(i*43+240)*30+10);` |
| `withInvestment` | `Math.round(counterfactualBase*(1+sr(i*53+250)*1.5+0.3));` |
| `additionality` | `Math.round(((withInvestment-counterfactualBase)/withInvestment)*100);` |
| `verStatus` | `VERIFICATION_STATUSES[Math.floor(sr(i*37+260)*4)];` |
| `evidenceQ` | `EVIDENCE_QUALITY[Math.floor(sr(i*29+270)*3)];` |
| `csv` | `[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `kpis` | `useMemo(()=>[ {label:'Investments',value:investments.length}, {label:'Avg Progress',value:`${Math.round(investments.reduce((a,i)=>a+i.overallProgress,0)/investments.length)}%`}, {label:'Verified',value:investments.filter(i=>i.verificationStatus==='Verified').length}, {label:'Avg Additionality',value:`${Math.round(investments.reduce((a,i)=` |
| `verCounts` | `VERIFICATION_STATUSES.map(v=>({status:v,count:investments.filter(i=>i.verificationStatus===v).length}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EVIDENCE_QUALITY`, `INV_PREFIXES`, `INV_SUFFIXES`, `SECTORS`, `STAGE_COLORS`, `TOC_STAGES`, `VERIFICATION_STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page generates 30 synthetic "impact investments" and, for each, builds a **5-stage Theory of
Change (ToC) ladder** — Inputs → Activities → Outputs → Outcomes → Impact — plus a counterfactual
additionality calculation and an impact-verification record. There is no backend engine; everything
is produced client-side by `genInvestments(30)` using the platform's seeded PRNG
`sr(s) = frac(sin(s+1)×10⁴)`.

Core formula (displayed verbatim in the UI, Tab "Counterfactual Analysis"):

```
Additionality % = (WithInvestment − CounterfactualBase) / WithInvestment × 100
```

### 7.2 Parameterisation

| Constant | Value / range | Provenance |
|---|---|---|
| `TOC_STAGES` | Inputs, Activities, Outputs, Outcomes, Impact | Standard logic-model taxonomy (Kellogg Foundation / USAID ToC convention) |
| `SECTORS` | 10 impact sectors (Clean Energy, Affordable Housing, Healthcare Access...) | Synthetic demo taxonomy |
| `TEMPLATES` | Per-sector input/activity/output/outcome/impact statement lists for 5 of the 10 sectors | Hand-authored illustrative text; sectors without a template fall back to `defaultTemplate` |
| `invested` | `round((sr(i·67+230)×40+5)×10)/10` → $5M–$45M | Synthetic demo value |
| `counterfactualBase` | `round(sr(i·43+240)×30+10)` → 10–40 impact units | Synthetic demo value |
| `withInvestment` | `round(counterfactualBase×(1+sr(i·53+250)×1.5+0.3))` → base × 1.3–2.8 | Synthetic demo value |
| `VERIFICATION_STATUSES` | Verified / In Progress / Pending / Not Started | Standard impact-reporting statuses |
| `EVIDENCE_QUALITY` | High / Medium / Low | Synthetic demo value |
| `thirdPartyVerifier` | KPMG / PwC / EY / Deloitte / BSR / Sustainalytics (random pick) | Real assurance-provider names, randomly assigned |
| `isae3000` | `sr(i·47+320) > 0.6` (40% true) | ISAE 3000 is the real IAASB assurance standard for non-financial information; the boolean flag is synthetic |

### 7.3 Calculation walkthrough

For each synthetic investment `i` (0–29):
1. Three PRNG draws select a name prefix/suffix and a sector: `pIdx=⌊s1×15⌋`, `sIdx=⌊s2×10⌋`,
   `secIdx=⌊s3×10⌋`.
2. The sector's `TEMPLATES` entry (or `defaultTemplate`) supplies the qualitative statement text
   for each of the 5 ToC stages; each statement gets a synthetic `target`/`actual` pair
   (`Math.round(sr(seed)×1000+100)` / `×900+50`) and a stage-level `progress` score
   (`Math.round(sr(seed)×50+40)`, i.e. 40–90%).
3. `overallProgress = round(Σ stage.progress / 5)` — a simple unweighted mean across the 5 stages.
4. Counterfactual pair (`counterfactualBase`, `withInvestment`) is drawn independently of the ToC
   stage progress — the two halves of the page are **not mathematically linked**, only
   thematically.
5. `additionality = round((withInvestment − counterfactualBase) / withInvestment × 100)`.
6. Verification fields (`verificationStatus`, `evidenceQuality`, `isae3000`, `thirdPartyVerifier`)
   and free-text `risks`/`assumptions` (filtered from fixed candidate lists by a PRNG threshold)
   round out the record; none feed back into the additionality or progress numbers.

### 7.4 Worked example (Investment #1, `i=0`)

| Step | Computation | Result |
|---|---|---|
| Sector draw | `secIdx=⌊sr(120)×10⌋=1` | **Affordable Housing** |
| Name draw | `pIdx=⌊sr(100)×15⌋=3`, `sIdx=⌊sr(110)×10⌋=4` | **"Edu Initiative"** |
| Invested | `round((sr(297)×40+5)×10)/10` | **$11.3M** |
| Counterfactual base | `round(sr(340)×30+10)` | **29 units** |
| With investment | `round(29×(1+sr(350)×1.5+0.3))` | **40 units** |
| Additionality | `(40−29)/40×100` | **28%** |
| Verification status idx | `⌊sr(360)×4⌋=0` | **Verified** |
| Evidence quality idx | `⌊sr(370)×3⌋=0` | **High** |

The additionality of 28% would be read as: "of the 40 impact units observed with the investment in
place, 11 are attributable to the investment; the other 29 would likely have occurred anyway."

### 7.5 Companion analytics

- **Outcome Measurement tab** — bar chart of mean stage progress across all 30 investments, a
  line chart of one investment's 8-quarter progress trajectory (`quarterlyProgress`, each quarter's
  input/output/outcome progress computed independently via further `sr()` draws, not derived from
  the stage progress numbers), and a full sortable table.
- **Counterfactual Analysis tab** — bar chart contrasting `counterfactualBase` vs `withInvestment`
  per investment, sorted by additionality, with an explicit on-page methodology note.
- **Impact Verification tab** — pie charts of verification-status and evidence-quality distribution
  across the portfolio, plus a table cross-referencing ISAE 3000 alignment and named verifier.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 30 investments, their sector assignment, financial size, ToC
  stage progress, counterfactual baselines and verification metadata are generated by the seeded
  PRNG `sr(s)=frac(sin(s+1)×10⁴)` — deterministic across renders but not sourced from any real
  portfolio or evidence base.
- The counterfactual (additionality) block and the ToC stage-progress block are computed from
  **independent PRNG seeds** — in a real impact-measurement system the counterfactual estimate
  should be an input to (or output of) the Outcome stage, not a parallel, disconnected calculation.
- No standard errors, confidence intervals, or sensitivity ranges are attached to the
  additionality estimate, even though real counterfactual/additionality assessment (e.g. IRIS+,
  the Impact Management Project's "what would have happened anyway" test) is inherently uncertain
  and typically reported as a range.
- `isae3000` and `thirdPartyVerifier` are cosmetic flags — no underlying assurance workflow,
  evidence document, or verifier engagement record exists.

### 7.7 Framework alignment

- **Theory of Change methodology** (Kellogg Foundation Logic Model / USAID ADS 201): the
  Inputs→Activities→Outputs→Outcomes→Impact chain is standard nonprofit/impact-investing practice;
  the module implements the ladder structure but not the underlying assumptions-testing rigor
  (explicit causal-pathway validation) a full ToC exercise requires.
- **Counterfactual / additionality analysis** (IMP "Impact Management Norms", GIIN additionality
  guidance): the displayed formula matches the standard definition, but the module's baseline and
  with-investment figures are illustrative, not estimated via comparison-group, matched-cohort, or
  regression-discontinuity methods used in production impact evaluation.
- **ISAE 3000** (International Standard on Assurance Engagements 3000, revised): the real standard
  governs third-party assurance of non-financial/sustainability information; the module only shows
  a binary "aligned" flag with no assurance report or scope statement.

## 9 · Future Evolution

### 9.1 Evolution A — Persisted ToC records with linked, uncertainty-ranged additionality (analytics ladder: rung 1 → 2)

**What.** The module renders a correct additionality formula (`(WithInvestment − CounterfactualBase)/WithInvestment × 100`, §7.1) and a standard 5-stage logic-model ladder, but §7.6 documents that everything is `genInvestments(30)` PRNG output: the counterfactual block and the ToC stage-progress block draw from independent seeds with no mathematical link, additionality carries no uncertainty range despite being inherently an estimate, and the ISAE 3000/verifier fields are cosmetic flags with no assurance record behind them. Evolution A turns the display into a working impact-measurement tool.

**How.** (1) First backend vertical: a `toc_investments` table (the module currently has no endpoints or persistence) storing user-entered investments, per-stage statements with target/actual pairs, and counterfactual estimates — replacing the 30 synthetic records. (2) Link the two halves: the Outcome stage's actual-vs-target becomes the `withInvestment` input, so additionality derives from the same evidence as stage progress instead of a parallel random draw (§7.3 point 4's documented disconnect). (3) Report additionality as a range: user-entered low/central/high counterfactual scenarios per IMP/GIIN convention (§7.6 notes real additionality is always reported with uncertainty), rendered as error bars in the Counterfactual Analysis tab. (4) Verification becomes a record, not a flag: evidence documents attached per stage, verifier engagement dates, ISAE 3000 scope statement text.

**Prerequisites.** None external — this is a self-contained CRUD-plus-arithmetic build; the hand-authored sector `TEMPLATES` (5 of 10 sectors) should be completed for the remaining sectors. **Acceptance:** deleting the PRNG generator breaks nothing; additionality recomputes when an Outcome actual is edited; every "Verified" badge traces to an attached evidence record.

### 9.2 Evolution B — ToC-drafting copilot for impact analysts (LLM tier 1)

**What.** Writing a rigorous Theory of Change is a language task with a strict structure — exactly copilot territory. Given a described investment ("$15M into rural clean-energy mini-grids in East Africa"), the copilot drafts the full Inputs→Activities→Outputs→Outcomes→Impact ladder with measurable indicators per stage, flags the causal assumptions that need testing, and proposes a counterfactual framing question — the assumptions-testing rigor §7.7 notes the current template structure lacks.

**How.** Tier 1: grounding corpus is the sector `TEMPLATES` (hand-authored exemplar statements per stage), the standard taxonomy references (Kellogg logic model, IMP norms, GIIN additionality guidance — named in §7.7), and this Atlas record. The copilot's output is a draft record for the user to edit and save through Evolution A's persistence path — it authors qualitative structure, and must not invent quantitative values: targets, baselines, and counterfactual numbers are left as explicit user-input placeholders, honouring the platform's no-fabrication convention in the one module whose entire subject is estimated numbers. A review mode critiques an existing ToC ("Outcome 2 is an output, not an outcome; no assumption links Activities to Outcomes") using the ladder semantics.

**Prerequisites.** Evolution A's persistence for saving drafts; nothing else. **Acceptance:** drafted ladders always contain five stages with per-stage indicators and explicit assumptions; no numeric target/baseline is ever pre-filled by the copilot; critique mode's classifications are consistent with the stage definitions in the corpus.