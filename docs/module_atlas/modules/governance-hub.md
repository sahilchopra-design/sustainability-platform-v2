# Governance Analytics Hub
**Module ID:** `governance-hub` · **Route:** `/governance-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive board composition, audit quality, executive remuneration, and shareholder rights analytics across portfolio holdings, enabling governance factor integration into ESG scoring and active ownership strategies. Covers ISS and Glass Lewis proxy voting alignment, board independence, gender diversity, and remuneration-sustainability linkage metrics.

> **Business value:** Supports active ownership teams in prioritising engagement and proxy voting on governance matters, quantifying governance risk contribution to portfolio ESG scores, and meeting ESRS G1 disclosure requirements on business conduct and board oversight of sustainability matters.

**How an analyst works this module:**
- Filter the portfolio by governance score decile to identify holdings with material governance deficiencies.
- Review the board composition tab to assess independence, diversity, and tenure concentration risks.
- Analyse remuneration linkage to sustainability KPIs and compare against say-on-pay vote outcomes.
- Export engagement priorities ranked by governance score gap and portfolio weight for stewardship team.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANNUAL`, `COMPANIES`, `GOV_WEIGHTS`, `NAMES`, `PAGE`, `REGIONS`, `SECTORS`, `TABS`, `VOTES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Emerging Markets'];` |
| `clamp` | `(v,lo,hi)=>Math.min(hi,Math.max(lo,v));` |
| `diversity` | `clamp(c.womenPct*2,0,100);` |
| `payAlignment` | `clamp(100-c.payRatio/5+(c.esgPay?10:0)+(c.clawback?10:0),0,100);` |
| `shareholderRights` | `clamp(50+(c.sepChair?15:0)+(c.proxyAccess?15:0)-c.antiTakeover*10,0,100);` |
| `riskAccountability` | `clamp(100-c.riskScore-c.controversies*5-c.overboarded*5,0,100);` |
| `composite` | `Object.keys(GOV_WEIGHTS).reduce((sum,k)=>sum+subscores[k]*GOV_WEIGHTS[k],0);` |
| `raw` | `{id:i+1,name:NAMES[i],sector:SECTORS[Math.floor(sr(i*3)*SECTORS.length)],region:REGIONS[Math.floor(sr(i*7)*REGIONS.length)],` |
| `ANNUAL` | `Array.from({length:8},(_,i)=>({year:2018+i,avgBoard:+(sr(i*83)*2+9).toFixed(1),avgWomen:+(sr(i*89)*5+25).toFixed(1),avgIndep:+(sr(i*97)*5+60).toFixed(1),esgLinked:+(sr(i*101)*10+15).toFixed(1),sepChair:+(sr(i*103)*5+35).` |
| `VOTES` | `Array.from({length:20},(_,i)=>{const types=['Say-on-Pay','Board Election','Share Buyback','ESG Proposal','Anti-Takeover','Proxy Access','Climate Resolution','Diversity Policy','Executive Comp','Audit Committee'];` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));if(filterSect!=='All')d=d.filter(c=>c.sector===filterSect);if(filterReg!=='All')d=d.filter(c=>c.region===filterReg);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,s` |
| `votesF` | `useMemo(()=>{let d=[...VOTES];if(vSearch)d=d.filter(v=>v.proposal.toLowerCase().includes(vSearch.toLowerCase())\|\|v.company.toLowerCase().includes(vSearch.toLowerCase()));d.sort((a,b)=>vDir==='asc'?((a[vSort]>b[vSort])?1:-1):((a[vSort]<b[vSort])?1:-1));return d;},[vSearch,vSort,vDir]);  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `kpis` | `useMemo(()=>{if(!filtered.length)return{count:0,avgGov:'0.0',avgWomen:'0.0',avgIndep:'0.0',sepChairs:0};return{count:filtered.length,avgGov:(filtered.reduce((s,c)=>s+parseFloat(c.govScore),0)/ Math.max(1, filtered.length` |
| `sectDist` | `useMemo(()=>{const m={};SECTORS.forEach(s=>m[s]=0);filtered.forEach(c=>m[c.sector]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NAMES`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Board Independence (%) | — | ISS / Proxy filings | Proportion of independent non-executive directors; best practice threshold is 50% (UK Code) to 2/3 (ISS policy); below 50% flags governance concern. |
| Gender Diversity (%) | — | MSCI Women on Boards | Female representation on the board; EU gender balance directive targets 40% for listed companies by 2026. |
| ESG Pay Linkage (%) | — | Remuneration report analysis | Proportion of executive long-term incentive plan linked to quantified ESG/sustainability metrics; above 25% associated with stronger E&S outcomes. |
| Audit Committee Independence (%) | — | SOX / UK Corporate Governance Code | Best practice requires fully independent audit committee; deviations require explain-or-comply disclosure. |
- **Board composition data (BoardEx / Proxy filings)** → Compute independence, diversity, tenure, and skill matrix metrics → **Board quality scores by issuer**
- **Remuneration reports (annual reports)** → Extract ESG pay linkage percentage and LTIP ESG KPIs → **Remuneration sustainability alignment scores**
- **ISS / Glass Lewis proxy research** → Map voting recommendations to portfolio holdings → **Say-on-pay and ESG resolution alignment**

## 5 · Intermediate Transformation Logic
**Methodology:** Governance Quality Score
**Headline formula:** `GQS = w_1 × BoardInd + w_2 × AuditQuality + w_3 × RemunAlign + w_4 × ShareholderRights`

Constructs a composite governance quality score from four sub-pillars weighted by empirical association with long-run shareholder returns. Board independence and audit quality account for 55% of the composite; remuneration alignment to sustainability targets accounts for 15%, reflecting increasing regulatory emphasis on ESG-linked pay.

**Standards:** ['ISS Governance Quality Score Methodology', 'MSCI Governance Pillar', 'ICGN Global Governance Principles 2021']
**Reference documents:** ICGN Global Governance Principles (2021); ISS Governance Quality Score Methodology (2023); MSCI ESG Governance Pillar Methodology (2022); EU Corporate Sustainability Reporting Directive â€” ESRS G1 (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a weighted composite: `GQS = w1×BoardInd +
> w2×AuditQuality + w3×RemunAlign + w4×ShareholderRights`, with board independence + audit quality
> at 55% and remuneration alignment at 15%. **No such weighted formula exists in the code.** Every
> company's `govScore` (and every other metric — independence %, women %, pay ratio, say-on-pay
> support, risk score) is drawn **independently** from the seeded PRNG with its own hard-coded
> range; `govScore` is never computed *from* board independence, audit quality, or remuneration —
> the four inputs are statistically unrelated to their supposed composite output. There is also no
> audit-committee-independence or ISS/Glass Lewis vote-alignment data field at all despite being
> named in the guide. Sections below document the code as it actually behaves.

### 7.1 What the module computes

60 synthetic companies (real, well-known names — Apple, Microsoft, JPMorgan, etc. — reused only as
labels) each get 18 independently-drawn governance attributes, e.g.:

```js
govScore   = sr(i*31)*30 + 60      // 60.0 – 90.0, uniform
indepPct   = sr(i*13)*40 + 50      // 50.0 – 90.0%
womenPct   = sr(i*17)*30 + 10      // 10.0 – 40.0%
payRatio   = floor(sr(i*29)*300 + 50)   // 50 – 350 : 1
sayOnPay   = sr(i*53)*30 + 60      // 60.0 – 90.0%
riskScore  = sr(i*73)*40 + 20      // 20.0 – 60.0
sepChair   = sr(i*37) > 0.4        // boolean, 60% true
esgPay     = sr(i*41) > 0.3        // boolean, 70% true
```

Each field uses a distinct seed multiplier (13, 17, 29, 31...) so the 18 attributes per company are
mutually independent draws — there is no causal or correlational structure linking `govScore` to
`indepPct`/`womenPct`/`esgPay`, contrary to the guide's composite-score claim.

### 7.2 Parameterisation — ranges and their provenance

| Field | Range | Provenance |
|---|---|---|
| `govScore` | 60–90 | Arbitrary uniform band; not derived from any sub-score |
| `indepPct` | 50–90% | Range brackets real-world practice (UK Code 50%, ISS policy ~2/3) but not tied to any named company's actual filings |
| `womenPct` | 10–40% | Overlaps EU Gender Balance Directive's 40% target band, but random per company |
| `payRatio` | 50:1–350:1 | Plausible S&P 500 CEO pay-ratio range, uniformly random |
| `esgPay`, `clawback`, `proxyAccess` | Boolean, threshold on `sr()` | Fixed incidence rates (70%/75%/60%) with no link to sector or region |
| `ANNUAL` trend (2018–2025) | `avgWomen +(sr()*5+25)`, `avgIndep +(sr()*5+60)` etc. | Independent per-year draws, not a smoothed real trend series |
| `VOTES` (20 proxy items) | `forPct 50–90%`, `outcome = sr()>0.3?'Passed':'Failed'` | Synthetic 70% pass-rate, unrelated to `forPct`/`againstPct` shown alongside it |

### 7.3 Calculation walkthrough

1. **Screener KPIs** (`kpis`): simple arithmetic means over the *filtered* company set —
   `avgGov = Σgovscore / filtered.length` (guarded: `Math.max(1, filtered.length)`), similarly for
   `avgWomen`, `avgIndep`; `sepChairs` is a boolean count.
2. **Sector distribution**: a tally of `filtered` companies by `sector`, feeding the overview pie
   chart — pure counting, no weighting by market cap or AUM (none is modelled).
3. **Governance radar** (per expanded company row): plots six raw fields directly — `govScore`,
   `indepPct`, `womenPct×2` (doubled purely for radar visual scaling, not a real transformation),
   `sayOnPay`, `votingPower`, `100-riskScore` — i.e. the radar visually implies a weighted
   composite but is just six independent numbers plotted together.
4. **Voting tab**: `votesF` filters/sorts the static 20-row `VOTES` array; per-item pie chart splits
   `forPct`/`againstPct`/`abstainPct` (the three always sum to <100 by construction since each is
   drawn independently — no guarantee of summing to 100%).
5. **CSV export**: generic `exportCSV(data, filename)` — serialises whatever array is passed,
   no calculation.

### 7.4 Worked example

Company index `i=6` ("JPMorgan Financials Corp", `sector = Financials`):

| Field | Formula | Result |
|---|---|---|
| `govScore` | `sr(6×31)*30+60 = sr(186)*30+60` | e.g. `sr(186)=0.71` → `81.3` |
| `indepPct` | `sr(6×13)*40+50 = sr(78)*40+50` | e.g. `sr(78)=0.55` → `72.0%` |
| `womenPct` | `sr(6×17)*30+10 = sr(102)*30+10` | e.g. `sr(102)=0.30` → `19.0%` |
| `riskScore` | `sr(6×73)*40+20 = sr(438)*40+20` | e.g. `sr(438)=0.22` → `28.8` |
| Radar "Low Risk" axis | `100 - riskScore` | `71.2` |

None of `govScore=81.3` is *built from* `indepPct=72.0` or `womenPct=19.0` — a company could score
81.3 on `govScore` while independence and diversity sit at the low end of their own ranges, because
the six seeds (`31`, `13`, `17`, `73`, ...) are unrelated multipliers of the same base index `i`.

### 7.5 Companion analytics

- **Board size distribution / tenure distribution / independence-vs-women scatter** — histogram and
  scatter views of the same independently-drawn fields; no additional calculation.
- **Vote outcomes by type** — counts `Passed`/`Failed` per proposal type across the static 20-item
  `VOTES` array.

### 7.6 Data provenance & limitations

- **All data is synthetic**, generated by `sr(s)=frac(sin(s+1)×10⁴)`. Company names are real listed
  issuers reused as display labels only; none of the governance metrics reflect actual board
  filings, proxy statements, or ISS/Glass Lewis research.
- No linkage between `govScore` and its claimed drivers — the headline "Governance Quality Score"
  cannot be reconstructed or audited from the other displayed fields, which a model-risk reviewer
  would flag as a fabricated composite (see §8 for the production design).
- Audit-committee independence and ISS/Glass Lewis vote-recommendation alignment — both named as
  data points in the guide — are absent from the code entirely.
- Say-on-pay `forPct` in the VOTES table and the per-company `sayOnPay` field in COMPANIES are two
  unrelated random series despite representing the same underlying concept.

**Framework alignment:** the module *names* ICGN Global Governance Principles, ISS Governance
Quality Score methodology, MSCI Governance Pillar, and ESRS G1, but implements none of their actual
scoring logic. See §8 for how a real composite governance score is built under these frameworks.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce an auditable, sub-score-decomposable Governance Quality Score (GQS) per issuer for use in
active-ownership prioritisation, portfolio ESG-score integration, and CSRD/ESRS G1 disclosure
support. Scope: listed equity and credit issuers with available proxy/board disclosure data.

### 8.2 Conceptual approach
A **linear weighted composite of standardised sub-pillar scores**, following the design pattern of
MSCI's ESG Governance Pillar and ISS Governance QualityScore: each sub-pillar (Board, Audit,
Remuneration, Shareholder Rights) is itself a weighted sub-composite of raw metrics, winsorised and
z-scored within sector/region peer groups before aggregation — this cross-sectional normalisation
is the key methodological feature MSCI and ISS both use and the current code omits entirely.

### 8.3 Mathematical specification

```
z_metric = (raw_metric − peer_mean) / peer_stdev        (peer group = sector × region, min n=15)
z_metric_clipped = clip(z_metric, −3, +3)                (winsorise outliers)

BoardInd_score      = 0.5×z(indepPct) + 0.3×z(sepChair) + 0.2×z(−|avgTenure−7|)   [tenure penalises both too-short & too-long]
AuditQuality_score  = 0.6×z(auditCmteIndepPct) + 0.4×z(−restatementCount)
RemunAlign_score    = 0.7×z(esgPayLinkPct) + 0.3×z(sayOnPaySupport)
ShareholderRights_score = 0.4×z(proxyAccess) + 0.3×z(−dualClassFlag) + 0.3×z(−poisonPillFlag)

GQS = 100 × Φ( 0.30×BoardInd + 0.25×AuditQuality + 0.15×RemunAlign + 0.30×ShareholderRights )
   [Φ = standard normal CDF, mapping the weighted z-composite onto a 0–100 percentile score]
```

| Parameter | Calibration source |
|---|---|
| Sub-pillar weights (0.30/0.25/0.15/0.30) | ISS QualityScore publishes indicative pillar weights (board 30%, audit ~20-25%, ranges by market); recalibrate via regression against realised governance-controversy incidence |
| Peer-group z-scoring | Standard MSCI ESG methodology practice — always score relative to sector/region peers, never on an absolute scale |
| Tenure optimum (7 yrs) | UK Corporate Governance Code guidance flags >9yr tenure as independence-impairing; 7yr is a conservative mid-point |
| Φ (CDF) mapping | Converts an unbounded z-composite into an interpretable 0–100 score, standard practice in factor-scoring models |

### 8.4 Data requirements
- **Board composition, tenure, committee membership** — BoardEx (vendor) or company proxy
  statements/DEF 14A filings (free, SEC EDGAR for US issuers).
- **Say-on-pay results, ESG-linked LTIP disclosure** — proxy statements; ISS/Glass Lewis vote
  recommendation data (vendor, not free).
- **Restatement history** — Audit Analytics (vendor) or SEC AAER database (free, partial coverage).
- **Platform integration**: none of this exists yet in `reference_data`; the closest existing asset
  is the `credit-integrity-dd` module's greenwash-flag pattern, which could share peer-grouping
  infrastructure.

### 8.5 Validation & benchmarking plan
- **Backtest**: regress realised governance-controversy incidence (restatements, CEO forced
  departures, activist campaigns) in year t+1 against GQS in year t; a well-calibrated score should
  show monotonically declining controversy incidence across GQS deciles.
- **Benchmark reconciliation**: compare GQS rank-order against published MSCI Governance Pillar
  scores and ISS QualityScores for a shared issuer universe; target rank correlation ≥0.6 (governance
  scores are known to diverge more across vendors than E or S pillars, per academic ESG-disagreement
  literature — e.g. Berg, Kölbel & Rigobon 2022).
- **Stability test**: re-score across consecutive fiscal years and confirm GQS does not swing >15
  points absent a disclosed governance event.

### 8.6 Limitations & model risk
- Peer-group z-scoring requires adequate peer-group size (n≥15); thin peer groups (e.g. niche
  sectors) should fall back to a broader regional peer set with a documented flag.
- Governance metrics are inherently harder to standardise than emissions data — disclosure quality
  varies enormously by jurisdiction; the model should carry a data-completeness confidence flag per
  issuer, not present a false-precision single score for issuers with sparse proxy disclosure.
- ISS/Glass Lewis vote-recommendation data is proprietary; where unavailable, the ShareholderRights
  sub-score should fall back to structural flags only (dual-class, poison pill) with a documented
  confidence discount rather than silently zero-filling.

## 9 · Future Evolution

### 9.1 Evolution A — Real governance composite from sourced board/proxy data (analytics ladder: rung 1 → 2)

**What.** §7 flags a fabricated composite: the guide describes `GQS = w1·BoardInd + w2·AuditQuality + w3·RemunAlign + w4·ShareholderRights` (board independence + audit at 55%, remuneration at 15%), but the code draws `govScore` and each of 18 governance attributes independently from the seeded PRNG — the headline score is statistically unrelated to its supposed drivers and cannot be reconstructed from the displayed fields (a model-risk reviewer's red flag). Audit-committee independence and ISS/Glass Lewis vote-alignment are named in the guide but entirely absent, and say-on-pay appears as two unrelated random series. Evolution A builds the real composite: source board composition, audit-committee independence, remuneration-sustainability linkage, and shareholder-rights data per issuer, then compute `GQS` as the documented weighted sum so the score is auditable from its inputs.

**How.** (1) A governance-attributes table per issuer (independence %, women %, tenure, audit-committee independence, say-on-pay outcome, remuneration-KPI linkage) sourced from proxy filings / a governance data provider. (2) Compute `govScore` as the weighted composite of those fields — never an independent draw — so it reconstructs exactly. (3) Add the missing ISS/Glass Lewis vote-alignment and audit-committee-independence fields; reconcile the duplicate say-on-pay series into one.

**Prerequisites.** Real issuer governance data (proxy/ISS feed, or a curated demo set); the 60 seeded companies with real-name labels replaced by actual sourced data (a §7-flagged fabrication where real names sit on random metrics). **Acceptance:** `GQS` recomputes exactly from its four weighted drivers for every issuer; audit-committee independence and vote-alignment fields exist and populate; no `sr()` drives the headline score.

### 9.2 Evolution B — Stewardship and proxy-voting copilot (LLM tier 2)

**What.** A copilot for active-ownership teams: "rank our holdings by governance-score gap and portfolio weight for this proxy season, and flag remuneration misalignments" tool-calls the Evolution A governance endpoints, ranks engagement priorities, and drafts the stewardship brief with each metric sourced from filings.

**How.** Tier-2 tool-calling over the governance-composite and issuer-detail endpoints; the grounding corpus is §5/§7, which name ICGN Global Governance Principles, ISS GQS methodology, MSCI Governance Pillar, and ESRS G1. The copilot's value is turning the composite into a prioritised proxy/engagement agenda tied to say-on-pay outcomes and board deficiencies. Guardrail, pre-Evolution-A: because §7 shows the scores are fabricated and reuse real issuer names, the copilot must refuse issuer-specific governance claims to avoid libel-adjacent fabrication about named companies.

**Prerequisites.** Evolution A (governance metrics on real names must be sourced before an LLM narrates them); RBAC-scoped portfolio; corpus embedding. **Acceptance:** every governance metric in a stewardship brief traces to a sourced tool response; pre-Evolution-A the copilot declines to characterise any named issuer's governance, explaining the data is illustrative.