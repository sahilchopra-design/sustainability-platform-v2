## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **ESG Pay Alignment Score**
> `EPAS = w_m·Materiality + w_r·Rigour + w_t·Transparency + w_i·Incentive_Weight`, plus a pay-ESG
> performance correlation and SBTi-linkage flag. **None of these scores exist in the code.** The module
> is a **seeded comparison table** of 80 real company names with entirely synthetic compensation figures
> (CEO pay, pay ratio, ESG-linked %, TSR, clawback flags). The only real computation is the CEO:median
> pay ratio arithmetic on the synthetic inputs. Documented below.

### 7.1 What the module computes

`COS` fabricates 80 issuers; the pay economics are seeded:

```js
ceoPay       = sr(i·7)·25 + 5           // $5–30M
medianPay    = round(sr(i·11)·80 + 40)  // $40–120K
payRatio     = round(ceoPay·1000 / medianPay)   // real arithmetic on synthetic inputs
esgLinkedPct = round(sr(i·13)·40)       // 0–40% of variable pay
sti = ceoPay·0.3 + sr()·3 ;  lti = ceoPay·0.5 + sr()·5 ;  base = ceoPay·0.15
tsr1y = (sr(i·51) − 0.3)·40 ;  tsr3y = (sr(i·53) − 0.25)·60
yearly[y] = { ceoPay − 2 + y·0.8 + jitter, ratio, esgPct }   // 5-year trend, seeded slope
```

Aggregates (`stats`): mean CEO pay, mean pay ratio, mean ESG-linked %, mean say-on-pay, clawback count,
max pay — all over the seeded set. `sectorPay` averages by sector.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| Company names | 80 real large-caps (Apple, JPMorgan, Shell, Nestlé, TSMC…) | **Real names** |
| Sector map | per-company GICS-style sector | Real classification |
| `ceoPay`, `medianPay`, `esgLinkedPct`, `tsr`, `sti/lti/base`, `clawback`, `holdingReq`, `severance`, `pension`, `sayOnPay` | seeded | **All synthetic** `sr()` |
| `payRatio` | `ceoPay·1000/medianPay` | Real CEO-pay-ratio formula (Dodd-Frank §953(b) style) on synthetic pay |
| ESG-linked band | 0–40% | Consistent with real market range (guide notes <10% = low integration) |

No real remuneration-report data is ingested; the names are decorative labels on random pay.

### 7.3 Calculation walkthrough

1. `COS` generates 80 issuers with seeded compensation and a 5-year seeded trend.
2. `filtered` applies search + sector filter + sort; `paged` slices 12 per page.
3. `stats` averages the headline metrics; `sectorPay` averages by sector.
4. Detail panel shows pay structure (base/STI/LTI/pension pie) and the 5-year pay-vs-ratio line.
5. `CEO Pay vs TSR` scatter plots the (synthetic) pay-performance relationship.

### 7.4 Worked example (company i = 7 → "JPMorgan")

| Step | Computation | Result |
|---|---|---|
| ceoPay | sr(49)·25 + 5 | ≈ 0.58·25+5 = $19.4M |
| medianPay | round(sr(77)·80 + 40) | ≈ $95K |
| payRatio | round(19.4·1000/95) | **204:1** |
| esgLinkedPct | round(sr(91)·40) | ≈ 22% |

A 204:1 pay ratio with 22% ESG-linked pay — plausible-looking, but the underlying $19.4M and $95K are
random, so the ratio conveys no information about the actual company. The ratio *formula* is correct;
the *inputs* are fabricated.

### 7.5 Data provenance & limitations

- **All compensation data is synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`); only the issuer names are real.
- **No EPAS composite**: materiality, rigour, transparency, and incentive-weight sub-scores from the
  guide have no code. There is no assessment of ESG-metric quality.
- **No pay-ESG correlation or SBTi linkage**: the guide's manipulation-detection analytics are absent.
- The `payRatio` and averaging arithmetic are genuine, but operate on random pay.

**Framework alignment:** The pay-ratio concept follows **Dodd-Frank §953(b)** CEO-pay-ratio disclosure;
ESG-linked-pay framing references the guide's **UK Corporate Governance Code (Provision 40)**, **EU CSRD
Article 29c**, **ISS/Glass Lewis** voting thresholds (<10% ESG weight = low integration), and **PRI
Active Ownership 2.0**. The intended-but-absent artefact is the four-factor EPAS quality score.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's EPAS, pay-ESG correlation, and SBTi
linkage are absent; all pay data is seeded. Below is the production ESG-pay-quality model.

**8.1 Purpose & scope.** Score the *quality* of ESG integration in executive remuneration to drive
say-on-pay voting and remuneration-committee engagement, from real remuneration-report data.

**8.2 Conceptual approach.** A rubric-based quality score mirroring **ISS/Glass Lewis** compensation
analysis and **PRI Active Ownership 2.0** — assessing whether ESG pay metrics are material, rigorously
targeted, transparent, and materially weighted, not merely present.

**8.3 Mathematical specification.**

```
Per company:
  Materiality   = fraction of ESG pay metrics mapped to TCFD/ESRS material topics
  Rigour        = weighted flags {SBTi-linked, independently verified, stretch vs BAU}  (0–1)
  Transparency  = disclosure completeness {metric defined, target disclosed, outcome disclosed}
  IncentiveWt   = ESG % of total variable pay / benchmark (e.g. /20%)
  EPAS = w_m·Materiality + w_r·Rigour + w_t·Transparency + w_i·min(IncentiveWt,1)   ×100
Pay-ESG correlation ρ = corr(ESG-linked payout %, realised ESG KPI improvement) over 5y
Vote flag: EPAS < 50 → against (for ESG-mandated portfolios)
```

| Parameter | Source |
|---|---|
| Material-topic map | TCFD / ESRS materiality per issuer |
| SBTi linkage | SBTi target registry |
| ESG pay weight, targets, outcomes | Remuneration reports (NLP extraction) |
| Weights w | Stewardship policy, documented |

**8.4 Data requirements.** Remuneration reports (metric names, weights, targets, outcomes); SBTi registry;
CDP climate data; historical pay outcomes vs ESG KPI actuals. Platform holds `GLOBAL_COMPANY_MASTER`;
needs a remuneration-report parser.

**8.5 Validation & benchmarking plan.** Reconcile ESG-pay weights against issuers' published proxy
statements; compare EPAS ranking against ISS/Glass Lewis assessments; backtest that low pay-ESG
correlation flags precede target-ratcheting cases.

**8.6 Limitations & model risk.** NLP extraction of pay metrics is error-prone — require human review of
low-confidence extractions. Rigour flags are judgemental. Conservative fallback: unverified ESG targets
score 0 on the Rigour dimension rather than assumed credible.
