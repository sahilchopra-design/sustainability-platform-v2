## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CQ4) describes an *index performance
> tracking engine* computing `ExcessReturn = GreenBondIndex_return − BloombergAgg_return` over the
> CBI certified universe. **The code computes nothing.** Every figure on the page — the 750-bond /
> $750B universe, the +6.8% YTD return, the "+100 bps outperformance", the $155B Q1 pipeline — is a
> hard-coded literal. There is no return calculation, no index constituent data, no excess-return
> arithmetic anywhere in the 182-line file. The page is a static dashboard mock-up over five small
> hand-typed seed tables. §8 specifies the tracking model the guide implies.

### 7.1 What the module displays (no formulas exist)

Five module-level constant arrays drive all six tabs; none are transformed beyond direct plotting:

| Seed table | Rows | Content |
|---|---|---|
| `PERF` | 6 | Green vs conventional index levels, rebased to 100 at Jan-24 (green ends 106.8, conv 105.8 at Mar-25) |
| `SECTORS` | 6 | Sector allocation: Energy 38%/$285B, Transport 22%/$165B, Buildings 18%/$135B, Water 10%, Waste 7%, Land Use 5% |
| `GEO` | 5 | Europe 48%/$360B, Asia-Pacific 22%, North America 18%, Supranational 8%, LatAm & Africa 4% |
| `ISSUANCE` | 6 | Monthly new issuance Oct-24…Mar-25 ($28–55B/month) |
| `NEW_DEALS` | 4 | France €8B 15y 2.95%, KfW $5B 10y 2.65%, Apple $2.5B 7y 3.15% (uncertified), IFC $3B 5y 2.80% |

The only in-component values are `totalUniverse = 750` and `totalAmountBn = 750`, both literals.
The single interactive element beyond tab switching is a cosmetic watchlist toggle
(`useState(false)`); Export/Bookmark buttons have no handlers.

### 7.2 Parameterisation

There are no model parameters. Provenance of the hard-coded values: the sector split (Energy ≈ 38%,
Transport ≈ 22%, Buildings ≈ 18%) and Europe-dominant geography broadly echo published CBI market
intelligence proportions, but no source is cited in code and no figure is traceable — treat all of
them as **synthetic demo values shaped to look CBI-plausible**. The footer names reference sources
(CBI Market Intelligence, Bloomberg MSCI / ICE BofA / S&P green bond indices, CBI Certification
Standard v4.0) as text only; nothing is fetched.

### 7.3 Calculation walkthrough

Input → output flow is trivial: seed table → Recharts component. `PERF` feeds both the Index
Dashboard line chart and the Performance tab area chart (domain fixed at [99, 108]); `SECTORS`/`GEO`
feed pie + bar pairs; `ISSUANCE` feeds a bar chart; `NEW_DEALS` renders as a table with a
certified/pending badge (`d.certified ? 'Yes' : 'Pending'` — the only conditional logic on data).

### 7.4 Worked example — reconciling the "+100 bps" KPI

The KPI card prints the literal string `'+100 bps'`. The number the guide's formula *would*
produce from the page's own `PERF` table at the last point (Mar-25):

```
ExcessReturn = (106.8 − 100) − (105.8 − 100) = 6.8% − 5.8% = 1.0 pp = 100 bps
```

So the hard-coded KPI happens to be arithmetically consistent with the hard-coded series — but the
subtraction is performed nowhere in code; editing `PERF` would silently desynchronise the KPI.
Similarly "New Issuance (Q1) $155B" equals `ISSUANCE` Jan+Feb+Mar (52+48+55) yet is typed as a
literal, not summed.

### 7.5 Data provenance & limitations

- **All data is hard-coded synthetic demo content** (not even PRNG-seeded — the platform's
  `sr()` generator is absent from this file). No API calls, no reference-data hooks.
- No total-return methodology: real index tracking needs constituent-level dirty prices, coupon
  reinvestment, currency hedging and rebalancing rules; none are represented.
- The comparison pair (a green bond index vs Bloomberg Global Aggregate) is not duration- or
  currency-matched, so even conceptually the displayed "outperformance" conflates rates beta with
  any greenium effect.
- KPIs are not derived from the tables they sit beside (see §7.4) — a maintenance hazard.

**Framework alignment:** *Climate Bonds Initiative Certification (Climate Bonds Standard v4.0)* —
certification requires pre- and post-issuance verification by an approved verifier against
sector-specific criteria aligned to 1.5 °C pathways; the module only mirrors this as a boolean
`certified` badge. *Bloomberg MSCI Green Bond Index* — real eligibility screens use MSCI ESG
Research assessment of use-of-proceeds against the Green Bond Principles' project categories; the
module name-drops the index without any constituent logic. *ICMA Green Bond Principles* — implied
by the certified/pending distinction but not implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Give fixed-income PMs and treasury teams a defensible green-vs-conventional performance and
greenium monitor over the CBI-certified universe, supporting allocation decisions and green bond
new-issue relative-value screening. Coverage: labelled green bonds certified under the Climate
Bonds Standard, IG and HY, all currencies hedged to a base currency.

### 8.2 Conceptual approach

Two components mirroring vendor practice: (i) a **matched-pair greenium estimator** in the style
of the Climate Bonds Initiative's own *Green Bond Pricing in the Primary Market* series and
AFME/ICMA greenium studies — each green bond is paired with same-issuer conventional curve
interpolation; and (ii) a **total-return index engine** following Bloomberg Fixed Income Index
methodology (market-value weighting, monthly rebalance, coupon reinvested at the index level).

### 8.3 Mathematical specification

```
Constituent return:  r_i(t) = [P_i(t) + AI_i(t) + C_i(t)] / [P_i(t−1) + AI_i(t−1)] − 1
Index return:        R(t)   = Σ_i w_i(t−1) · r_i(t),   w_i = MV_i / Σ MV   (rebalanced monthly)
Excess return:       XR(t)  = R_green(t) − R_bench_DM(t)
                     where R_bench_DM = duration/currency-matched conventional sleeve:
                     each green bond i matched to issuer curve yield ŷ_i^conv(T_i) by
                     linear interpolation of ≥2 conventional bonds within ±2y maturity
Greenium:            g_i    = y_i^green − ŷ_i^conv(T_i)          (bp, negative = greenium)
Index greenium:      G(t)   = Σ_i w_i · g_i
NIP/demand:          NIP_i  = launch spread − secondary curve; oversubscription = book/deal
```

| Parameter | Value / source |
|---|---|
| Universe filter | Climate Bonds Standard v4.0 certified list (CBI, free) |
| Pricing | Bloomberg BVAL or ICE evaluated prices (vendor); FINRA TRACE / ECB CSDB partial free fallback |
| Matching tolerance | ±2y maturity, same seniority & currency — per CBI pricing-report methodology |
| Rebalance | Monthly, month-end, per Bloomberg index conventions |
| FX hedge | 1-month forward hedge to base ccy, rolled monthly |
| Benchmark | Bloomberg Global Aggregate (duration-matched sleeve, not headline index) |

### 8.4 Data requirements

ISIN-level: price, accrued, coupon schedule, amount outstanding, issuer ID, certification flag &
date, use-of-proceeds category. Sources: CBI certified bond database (free), Bloomberg/ICE
(vendor). Platform fit: the `NEW_DEALS` schema (issuer, amount, coupon, tenor, certified) is a
subset of the required primary-market feed; the platform's `reference_data` layer (CBI ingest
already present per project reference-data notes) can host the certified list.

### 8.5 Validation & benchmarking plan

- Reconcile monthly index returns against published Bloomberg MSCI Green Bond Index returns
  (target tracking difference < 15 bp/yr from methodology differences).
- Greenium output benchmarked to CBI *Green Bond Pricing* half-yearly reports (sign and order of
  magnitude, typically −1 to −5 bp IG EUR).
- Stability: jackknife by sector; matching-tolerance sensitivity (±1y vs ±3y).

### 8.6 Limitations & model risk

Issuer-curve matching fails for debut/single-bond issuers (≈20% of universe) — fall back to
sector-rating curve with a wider uncertainty band; evaluated prices embed vendor model risk for
illiquid lines; greenium estimates are regime-dependent (supply waves compress/expand it), so
report rolling 6-month windows, never a single spot number.
