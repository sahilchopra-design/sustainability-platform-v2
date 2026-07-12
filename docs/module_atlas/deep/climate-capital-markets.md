## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DD6) promises market-flow analytics:
> `Market Penetration = GSS+ Issuance / Total Bond Issuance × 100` and a
> `Demand Pressure Index = Order Book Coverage × Green Investor Share × −Greenium`, plus a
> regulatory pipeline tracker (EU GBS, SEC climate rules). **None of these are computed.** There is
> no total-bond-issuance denominator, no order-book data, no demand-pressure index, and the
> "Intelligence Hub" regulatory insights are eight hard-coded prose strings. What the code actually
> implements is a synthetic 100-instrument GSS+ browser with filter-reactive aggregates, a
> hard-coded 20-row ESG index table, 30 synthetic investors, and a heuristic "Alpha Signals"
> screen. §8 specifies the demand/pricing model the guide describes.

### 7.1 What the module computes

**Instrument universe** — 100 bonds cycling through 6 label types × 8 sectors × 5 regions:

```js
notional       = 0.1 + sr(i*7)  * 4.9          // $0.1–5.0Bn
yield          = 1.5 + sr(i*11) * 4.5          // 1.5–6.0%
spread         = 20  + sr(i*13) * 200          // 20–220 bp
greenium       = −(2 + sr(i*17) * 22)          // −2 to −24 bp (always negative)
volume30d      = 5   + sr(i*19) * 995          // $5–1,000M
bidAskBps      = 1   + sr(i*23) * 15
liquidityScore = max(10, 100 − bidAskBps×4 − sr(i*29)×20)
impactScore    = 40  + sr(i*31) * 55           // 40–95
```

**KPIs on the filtered set:** `totalIssuance = Σ notional`, `totalVolume = Σ volume30d`, and
unweighted means of greenium, impact and liquidity (all length-guarded). The "Avg Greenium" card
is labelled "Market-weighted" but is an **equal-weighted** mean.

**Alpha Signals (tab 7)** — for the first 15 filtered instruments:

```js
greeniumMomentum = g − g×(1 + sr(id*7)×0.1 − 0.05)   // = −g×(sr×0.1 − 0.05), ±5% of greenium
ratingMig  = sr(id*13) > 0.75 ? 'Upgrade' : sr(id*13) > 0.9 ? 'Downgrade' : 'Stable'
liquidityAlpha = liquidityScore > 70 ? impactScore × 0.05 : 0
signal = momentum < −0.5 || Upgrade ? 'BUY' : momentum > 0.5 || Downgrade ? 'SELL' : 'HOLD'
```

Note the **unreachable branch**: `sr > 0.9` can never be tested because `sr > 0.75` already
captured it — so `'Downgrade'` (and therefore the migration-driven SELL path) can never fire.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Label taxonomy | Green, Sustainability, SLB, Blue, Transition, Social | ICMA GSS+ label families (labels only) |
| Greenium range | −2 to −24 bp | synthetic; brackets published CBI/ICMA estimates (typically −1 to −10 bp) but 2–3× too wide at the deep end |
| Liquidity score | `100 − 4×bidAsk − noise`, floor 10 | synthetic heuristic |
| BUY/SELL momentum gate | ±0.5 bp | synthetic demo value |
| Liquidity-alpha gate | score > 70 → `impact × 0.05` | synthetic demo value |
| `ESG_INDICES` (20 rows) | real index/fund names with AUM $38–312Bn, YTD 3.6–6.3%, greenium −6.8 to −11.2 bp, CI 22–58 | hard-coded; **not** actual vendor figures |
| `INVESTORS` (30 rows) | AUM $5–500Bn, ESG mandate 40–95%, green alloc = mandate×(0.1+sr×0.4) | synthetic |

### 7.3 Calculation walkthrough

Filters (type/sector/region) subset `INSTRUMENTS` → KPI strip and `pricingCurve` (20 lowest-yield
instruments, with `liquidityAdj = liquidityScore/100 × impactScore`) recompute reactively.
`typeBreakdown` and `sectorFlows` aggregate over the **unfiltered** universe (a subtle
inconsistency: charts ignore the active filters while KPIs respect them). `issuancePipeline`
seeds 12 monthly expected values ($20–50Bn) with actuals only for Jan–Apr. `indexPerformance`
sorts the 20 hard-coded indices by YTD return.

### 7.4 Worked example (instrument i = 0, id = 1, "Horizon Green 2025")

All seeds `0×k = 0` collapse to `sr(0) = 0.7098`:

| Quantity | Computation | Result |
|---|---|---|
| notional | 0.1 + 0.7098×4.9 | **$3.58Bn** |
| yield | 1.5 + 0.7098×4.5 | **4.69%** |
| greenium | −(2 + 0.7098×22) | **−17.6 bp** |
| bidAskBps | 1 + 0.7098×15 | 11.65 |
| liquidityScore | 100 − 11.65×4 − 0.7098×20 | **39.2** |
| impactScore | 40 + 0.7098×55 | **79.0** |
| momentum (alpha tab) | −(−17.6)×(sr(7)×0.1 − 0.05) = 17.6×(0.0582−0.05) | **+0.1 bp** |
| ratingMig | sr(13)=0.074 → not >0.75 | **Stable** |
| liquidityAlpha | 39.2 ≤ 70 | **0** |
| signal | 0.1 ∈ [−0.5, 0.5], Stable | **HOLD** |

### 7.5 Companion analytics on the page

Investor Universe tab lists the 30 synthetic institutions with preferred label/region and a
boolean `impactRequired`; the ESG Index Engine ranks the 20-row index table; the Intelligence Hub
renders 8 static narrative cards tagged Bullish/Watch/Opportunity — editorial content, not output.

### 7.6 Data provenance & limitations

- **Everything numeric is synthetic** — instruments, investors and the pipeline via
  `sr(seed) = frac(sin(seed+1)×10⁴)`; the index table is hand-typed with real product names but
  invented AUM/return/greenium figures. No API calls or reference-data hooks.
- Greenium is imposed (always negative, up to −24 bp) rather than estimated from a conventional
  comparator — the module cannot exhibit the positive "greenium" episodes seen in real data.
- The alpha screen's momentum is pure noise around the seeded greenium (±5%), so BUY/SELL flags
  carry no information; the Downgrade branch is dead code (§7.1).
- Aggregation inconsistency: type/sector charts ignore active filters.

**Framework alignment:** *ICMA Green/Social/Sustainability Bond Principles & SLB Principles* —
supply the six label definitions; real SLBs carry KPI/SPT step-ups which this module does not
model. *EU Green Bond Standard (Reg. 2023/2631)* — mentioned only in a static insight card; EU GBS
requires 85%+ Taxonomy-aligned use of proceeds and pre/post-issuance external review. *CBI market
intelligence* — the $185Bn quarterly issuance style of statistic is mimicked in hard-coded text.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Provide syndicate desks and ESG PMs with (i) a measured greenium per bond, (ii) a primary-market
demand-pressure index, and (iii) label-market penetration statistics — the three quantities the
guide names. Coverage: global GSS+ labelled bonds, IG + crossover, primary and secondary.

### 8.2 Conceptual approach

(i) Greenium via **issuer-matched curve interpolation** (CBI *Green Bond Pricing in the Primary
Market* methodology; also AFME/Barclays research practice). (ii) Demand pressure via
**book-building statistics regression**, mirroring Bloomberg NI league analytics and dealer
new-issue-premium (NIP) models. (iii) Penetration = labelled share of total issuance from a full
issuance tape (Dealogic/Bloomberg; free proxy: CBI + BIS debt securities statistics).

### 8.3 Mathematical specification

```
Greenium:        g_i = y_i^green − ŷ_i^conv(T_i),  ŷ from ≥2 same-issuer conventional bonds
                 within ±2y maturity, same ccy/seniority (else sector-rating curve fallback)
Demand pressure: DPI_i = z(cov_i) + z(tight_i) + z(−NIP_i)
                 cov_i = orderbook/deal size; tight_i = (IPT spread − final spread) in bp
                 z(·) = cross-sectional z-score over trailing 90 days, same rating bucket
Penetration:     Pen_m = Σ labelled issuance_m / Σ total issuance_m   (monthly, by ccy & sector)
Momentum:        Δg_i(t) = g_i(t) − median[g_i(t−60d..t)]   (signed, bp — replaces noise screen)
```

| Parameter | Calibration source |
|---|---|
| Matching tolerance ±2y | CBI pricing-report convention |
| z-score window 90d | dealer NIP-model practice; sensitivity-tested 60/120d |
| Rating buckets | AAA–AA / A / BBB (Bloomberg composite) |
| Issuance denominator | BIS debt securities statistics (free) or Dealogic DCM (vendor) |
| Book/coverage data | Bloomberg NI screens, IFR/GlobalCapital deal reports (vendor) |

### 8.4 Data requirements

Deal-level: ISIN, label, IPT vs final spread, book size, allocations by investor type; secondary:
evaluated mid yields for green and conventional curves. Free: CBI labelled-bond lists, BIS
aggregates; vendor: Bloomberg/ICE pricing, Dealogic books. Platform fit: the instrument schema
here (type, notional, yield, spread, rating, region) already matches the required bond master;
CBI reference ingest exists in the platform's reference-data layer.

### 8.5 Validation & benchmarking plan

- Greenium output vs CBI half-yearly pricing reports (sign/magnitude by ccy-rating bucket).
- DPI ranked-correlation with realised 1-month post-issue spread performance (target IC > 0.05).
- Penetration series reconciled to CBI annual GSS+ volumes (±5%).
- Stability: re-estimate with ±1y matching tolerance; jackknife by issuer.

### 8.6 Limitations & model risk

Curve matching unavailable for debut issuers (fallback widens error bands ~2×); book sizes are
self-reported by syndicates (inflate coverage); greenium confounds liquidity and index-eligibility
effects — report with a liquidity control (bid/ask decile) and never as a pure "green preference"
estimate. Conservative fallback: suppress DPI where book data is missing rather than imputing.
