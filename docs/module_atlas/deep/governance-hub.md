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
