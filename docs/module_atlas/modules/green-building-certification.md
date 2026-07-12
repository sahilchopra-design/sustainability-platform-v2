# Green Building Cert Manager
**Module ID:** `green-building-certification` · **Route:** `/green-building-certification` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the end-to-end certification workflow for BREEAM, LEED, WELL, and NABERS across a real estate portfolio, tracking assessment stages, assessor assignments, evidence uploads, and certification renewal deadlines. Provides portfolio-level certification pipeline reporting and automated renewal alerts to prevent certificate lapse.

> **Business value:** Reduces certification lapse risk through automated renewal tracking, streamlines evidence collection workflows across multiple certification schemes, and provides portfolio-level certification pipeline visibility for ESG reporting and EU Taxonomy alignment management.

**How an analyst works this module:**
- Add assets to the certification pipeline and assign the target certification scheme, target rating, and assessment deadline.
- Upload evidence documents against each credit or feature category and track completion percentage by section.
- Assign assessors and review their progress dashboards for credits under assessment.
- Monitor the renewal calendar and initiate renewal workflows for certificates approaching expiry.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `LEVELS`, `SCHEMES`, `SCHEME_COLORS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*5)];const city=CITIES[Math.floor(s2*CITIES.length)];` |
| `area` | `Math.floor(1000+s3*48000);const yearBuilt=Math.floor(1990+s4*35);` |
| `numCerts` | `Math.floor(s5*3.5);const certs=[];` |
| `idx` | `Math.floor(sr(i*31+c*7)*allSchemes.length);` |
| `levels` | `LEVELS[scheme];const level=levels[Math.floor(sr(i*37+c*11)*levels.length)];` |
| `certYear` | `Math.floor(2018+sr(i*41+c*13)*7);` |
| `expiryYear` | `certYear+3+Math.floor(sr(i*43+c*17)*3);` |
| `rentPsf` | `Math.floor((type==='Office'?45:type==='Retail'?35:type==='Residential'?28:type==='Industrial'?12:38)*(certified?1.08+s6*0.12:0.85+s6*0.15));` |
| `capRate` | `+(certified?4.2+s3*1.5:5.0+s3*2.0).toFixed(2);` |
| `vacancy` | `+(certified?3+s4*7:6+s4*14).toFixed(1);` |
| `value` | `Math.floor(area*rentPsf/(capRate/100));` |
| `schemeData` | `SCHEMES.map((scheme,i)=>{` |
| `totalCertified` | `useMemo(()=>certBuildings.filter(b=>b.certified).length,[]); const schemeDist=useMemo(()=>SCHEMES.map(s=>({scheme:s,count:filtered.filter(b=>b.certifications.some(c=>c.scheme===s)).length})),[filtered]);` |
| `premiumScatter` | `useMemo(()=>filtered.map(b=>({name:b.name,numCerts:b.numCerts,rentPsf:b.rentPsf,capRate:b.capRate,vacancy:b.vacancy,certified:b.certified?1:0,area:b.area})),[filtered]);` |
| `premiumByScheme` | `useMemo(()=>SCHEMES.map(s=>{` |
| `avgWith` | `withScheme.length?Math.floor(withScheme.reduce((sum,b)=>sum+b.rentPsf,0)/withScheme.length):0;` |
| `avgWithout` | `without.length?Math.floor(without.reduce((sum,b)=>sum+b.rentPsf,0)/without.length):0;` |
| `phases` | `[{phase:'Pre-Assessment',months:2,cost:sd.costPerSqm*0.15},{phase:'Design & Documentation',months:Math.floor(sd.timeMonths*0.3),cost:sd.costPerSqm*0.25},{phase:'Implementation',months:Math.floor(sd.timeMonths*0.4),cost:s` |
| `vals` | `[sd.costPerSqm,sd.timeMonths,`${sd.marketRecognition}/100`,sd.renewalYears,sd.globalProjects.toLocaleString(),schemeDist.find(d=>d.scheme===s)?.count\|\|0];` |
| `fit` | `Math.floor(50+sr(i*17+TYPES.indexOf(plannerType)*7)*50);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `SCHEMES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Certification Pipeline Value (€M) | — | Asset register | Aggregate GAV of assets currently in active certification process across all schemes; tracks workflow progress by certification stage. |
| Evidence Completion (%) | — | Workflow tracking system | Average percentage of required certification evidence items submitted across assets in the pipeline. |
| Renewal Risk Assets | — | Certificate expiry dates | Share of certified assets with certificates expiring within 12 months requiring renewal assessment initiation. |
| WELL Feature Compliance (%) | — | WELL Building Standard v2 | Percentage of WELL health and wellbeing features currently met; 50+ features required for WELL Silver certification. |
- **Asset energy and water performance data** → Map to credit categories for target certification scheme → **Credit compliance scorecard by asset**
- **Certification scheme credit requirements (BREEAM/LEED/WELL)** → Define evidence requirements per credit, assign to workflow tasks → **Evidence requirement checklist**
- **Certificate expiry register** → Calculate days to expiry, trigger renewal workflow for <365 day assets → **Renewal risk dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Certification Readiness Index
**Headline formula:** `CRI = Σ_i (evidence_i × w_i) / Σ_i w_i × (1 - days_to_deadline / 365)`

Weights evidence completion by credit category importance and discounts by time-to-deadline proximity to produce a readiness score between 0 and 1. Assets with CRI above 0.75 are on track for certification; assets below 0.50 with deadlines within 90 days trigger escalation alerts.

**Standards:** ['BREEAM Assessor Manual 2018', 'LEED Reference Guide v4.1', 'WELL Building Standard v2', 'NABERS Energy Rating Methodology']
**Reference documents:** BREEAM Assessor Manual (2018); LEED Reference Guide v4.1 (2019); WELL Building Standard v2 (2020); NABERS Energy Rating Methodology (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (title "Green Building Cert Manager")
> describes a **Certification Readiness Index** — `CRI = Σ(evidence_i·w_i)/Σ w_i × (1 − days_to_deadline
> /365)` — with evidence-completion tracking, assessor assignment and renewal-workflow escalation.
> **None of that workflow logic exists in the code.** There is no CRI, no evidence weighting, no
> deadline discounting, no assessor model. The page instead **seeds a synthetic building portfolio**,
> randomly attaches certifications, and computes **rent-premium / valuation analytics** and a
> scheme-comparison table. Sections below document the code; §8 specifies the CRI/pipeline model.

### 7.1 What the module computes

Each synthetic building draws a type, city, area, year built, and 0–3 certifications; certified buildings
get a rent uplift and lower cap rate, which drives an income valuation:

```js
rentPsf = base(type) · (certified ? 1.08 + s6·0.12 : 0.85 + s6·0.15)   // +8–20% if certified
capRate = certified ? 4.2 + s3·1.5 : 5.0 + s3·2.0                       // % — tighter if certified
vacancy = certified ? 3 + s4·7    : 6 + s4·14                           // %
value   = ⌊ area · rentPsf / (capRate/100) ⌋                            // direct-cap valuation
```

The headline analytic is the **green premium by scheme** (`premiumByScheme`): for each of the certification
schemes, `avgWith = mean(rentPsf | building has scheme)` vs `avgWithout = mean(rentPsf | not)`; the premium
is their difference/ratio. `premiumScatter` plots `numCerts` vs `rentPsf`/`capRate`/`vacancy`.

### 7.2 Parameterisation / seed rubric

| Field | Generator | Provenance |
|---|---|---|
| `type` | `TYPES[⌊s·5⌋]` (Office/Retail/Residential/Industrial/Mixed-Use) | synthetic |
| `area` | `⌊1000 + s3·48000⌋` m² | synthetic demo value |
| `yearBuilt` | `⌊1990 + s4·35⌋` | synthetic |
| `numCerts` | `⌊s5·3.5⌋` (0–3) | synthetic |
| `scheme` | `allSchemes[⌊sr(i·31+c·7)·L⌋]` | synthetic pick |
| `level` | `levels[⌊sr(i·37+c·11)·L⌋]` | synthetic pick within scheme ladder |
| `certYear` / `expiryYear` | `2018+sr·7` / `certYear+3+sr·3` | synthetic; ~3–6 yr validity |
| `rentPsf` base | Office 45, Retail 35, Residential 28, Industrial 12, Mixed 38 ($/sf) | synthetic anchors, plausible RE ranges |
| cap-rate / vacancy deltas | certified vs not | synthetic; encodes the green-premium thesis |

The certified-vs-uncertified spreads (`+8–20%` rent, tighter cap rate, lower vacancy) are the
*assumption* that produces the green premium; they are hand-set, not measured.

### 7.3 Calculation walkthrough

Seed N buildings → assign certs → derive `rentPsf`, `capRate`, `vacancy`, `value`. `filtered` responds to
scheme/type filters. `totalCertified = count(certified)`; `schemeDist` counts buildings per scheme;
`premiumByScheme` computes the with/without rent gap; `value` feeds portfolio GAV. A cost-of-certification
view (`phases`) splits a scheme's total cost/time across Pre-Assessment (15%), Design (30%),
Implementation (40%)… from a `SCHEME_DETAILS`-style cost table.

### 7.4 Worked example

Certified Office, `s6 = 0.5`, `s3 = 0.4`, `area = 20,000 m²`:
`rentPsf = 45·(1.08 + 0.5·0.12) = 45·1.14 = $51.3/sf`; `capRate = 4.2 + 0.4·1.5 = 4.8%`;
`value = ⌊20000·51.3 / (4.8/100)⌋ = ⌊1,026,000 / 0.048⌋ = ⌊21,375,000⌋ ≈ $21.4M`. An otherwise
identical *uncertified* office (`rentPsf = 45·(0.85+0.5·0.15)=45·0.925=$41.6`, `capRate=5.0+0.4·2.0=5.8%`)
values at `⌊20000·41.6/0.058⌋ ≈ $14.3M`. The certified building is worth ~49% more — but the entire gap is
baked into the seed multipliers, not derived from any market regression.

### 7.5 Data provenance & limitations

- **Entire portfolio is synthetic**, generated by `sr(seed)=frac(sin(seed+1)·10⁴)`. Certification
  attachment and levels are random draws, not linked to any building attribute (a Grade-A office is no
  more likely to be LEED Platinum than a warehouse).
- The green premium is **not measured** — it is the arithmetic consequence of the certified/uncertified
  seed multipliers, so the module cannot distinguish certification value from selection bias.
- No evidence tracking, no readiness scoring, no renewal workflow — the guide's operational CRI system is
  entirely absent.
- Direct-cap valuation only; no lease-level cash flows, no CRREM stranding.

**Framework alignment:** BREEAM / LEED / WELL / NABERS (scheme + level ladders); EU Taxonomy real-estate
alignment is the intended reporting anchor. The *green premium* concept traces to MSCI/JLL certified-vs-
uncertified rent studies, but is asserted here rather than estimated. The guide's CRI (evidence-weighted,
deadline-discounted readiness) is a workflow construct, specified in §8.

## 8 · Model Specification — Certification-Readiness Index & Renewal-Risk Engine

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support the certification-management decision: which assets are ready to submit, which credits are missing,
and which certificates will lapse — for a live real-estate portfolio pursuing BREEAM/LEED/WELL/NABERS.

### 8.2 Conceptual approach
Model readiness as a **weighted evidence-completion score discounted by deadline proximity** (the guide's
CRI), combined with a **survival/renewal model** for certificate expiry. This mirrors how PropTech ESG
platforms (Deepki, Measurabl) and GRESB's certification indicator actually track assets: category-weighted
credit completion against the scheme's own credit map, plus an expiry calendar driving renewal triggers.

### 8.3 Mathematical specification
```
CRI_asset,scheme = ( Σ_c w_{s,c} · complete_c ) / Σ_c w_{s,c} · (1 − max(0, days_to_deadline)/365)
   where complete_c ∈ [0,1] = evidence submitted / evidence required for credit category c
Status: CRI > 0.75 → on-track ; CRI < 0.50 AND days_to_deadline < 90 → escalate
Renewal hazard: P(lapse within 12m) = 1 − exp(−λ·t),  λ from historical renewal-lead-time distribution
Predicted tier: Tier_s = ladder_s( Σ_c w_{s,c}·(e_c/m_c)·100 )   (as green-building-cert §8)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `w_{s,c}` | category weight per scheme | BREEAM/LEED/WELL/NABERS manuals |
| `complete_c` | evidence completeness | workflow tracking system |
| `days_to_deadline` | to target assessment date | asset register |
| `λ` | renewal-lead-time rate | historical certificate renewal data |

### 8.4 Data requirements
Per asset/scheme: credit-category evidence status, target deadline, current certificate + expiry, assessor.
Sources: internal workflow/DMS, scheme registries for expiry. The platform seeds buildings and certs today
but holds none of the evidence/workflow fields — these must be captured.

### 8.5 Validation & benchmarking plan
Backtest CRI at submission-minus-30-days against actual pass/fail; calibrate the escalation thresholds to
historical near-miss deadlines; validate the renewal hazard against realised lapse rates; reconcile
predicted tiers against awarded certificates.

### 8.6 Limitations & model risk
CRI is only as good as evidence-tracking discipline — sparse data biases readiness high. Category weights
are scheme-version specific. Conservative fallback: treat missing evidence as 0 complete and flag assets
with < 60% category coverage as "insufficient data" rather than emitting a false on-track signal.

## 9 · Future Evolution

### 9.1 Evolution A — Build the certification-workflow engine and CRI (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's Certification Readiness Index (`CRI = Σ(evidence_i·w_i)/Σ w_i × (1 − days_to_deadline/365)`) and the whole certification workflow — evidence tracking, assessor assignment, renewal escalation — do not exist; the code renders a synthetic portfolio where certification attachment and levels are random `sr()` draws unlinked to any building attribute (a Grade-A office is no more likely to be certified than a warehouse), and derives a rent uplift / cap-rate valuation from those random certifications. Evolution A builds the actual workflow module: a real asset register with evidence-completion tracking per credit category, the CRI computed per §5, assessor assignment, and deadline-driven renewal alerts — turning a synthetic valuation display into the pipeline-management tool the guide describes.

**How.** (1) An asset/certification table (scheme, stage, assessor, evidence items with weights, renewal deadline). (2) `CRI` computed from evidence completion weighted by credit-category importance and discounted by time-to-deadline; assets >0.75 on-track, <0.50 within 90 days escalate. (3) Certification status driven by actual building attributes and evidence, not random attachment.

**Prerequisites.** A real asset register (user-supplied or imported); credit-category weights per scheme. The random certification attachment (§7-flagged) must be removed. **Acceptance:** CRI computes per the §5 formula from evidence-completion data; escalation alerts fire on the deadline/threshold rule; certification status reflects real building/evidence attributes, not `sr()`.

### 9.2 Evolution B — Certification pipeline copilot (LLM tier 2)

**What.** A copilot for sustainability/asset managers: "which assets are at risk of certificate lapse this quarter, and what evidence is outstanding for BREEAM renewal?" tool-calls the Evolution A CRI and evidence endpoints, ranks at-risk assets, and drafts the assessor-assignment and evidence-collection plan.

**How.** Tier-2 tool-calling over the workflow endpoints; the grounding corpus is §5/§7 (BREEAM/LEED/WELL/NABERS schemes, the CRI definition, renewal-workflow logic). The copilot's value is pipeline triage — surfacing lapse risk and outstanding evidence per asset. Guardrail, pre-Evolution-A: because the portfolio is synthetic with random certifications, it must refuse asset-specific readiness claims. Every CRI and deadline figure validated against tool output.

**Prerequisites.** Evolution A (no workflow engine today); RBAC-scoped asset register; corpus embedding. **Acceptance:** post-Evolution-A, every CRI and evidence-status figure traces to a tool call; the escalation list matches the deadline/threshold rule; pre-Evolution-A, asset-readiness questions are declined.