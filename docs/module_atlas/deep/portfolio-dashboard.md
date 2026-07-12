## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** There is no MODULE_GUIDES entry for this route (guide = null). The page is
> a synthetic holdings dashboard: it generates a random 150-name book and shows descriptive analytics
> (returns, sector/country allocation, ESG overlay). The tier-A backend PCAF engine
> (`portfolio_analytics_engine.py`) is **not called** — all data is `sr()`-seeded in the frontend.

### 7.1 What the module computes

Descriptive aggregates over `filtered` holdings, plus formatting helpers:

```js
stats.count      = filtered.length
stats.totalWeight= Σ r.weightPct
stats.avgRet1D   = Σ r.return1D / n      (||0 guard)
stats.avgRetYTD  = Σ r.returnYTD / n
sectorAlloc[s]   = { wt: Σ weightPct, ret: Σ returnYTD, esg: Σ esgScore, n }   // then means
countryAlloc[c]  = { wt: Σ weightPct, n }
perfHistory[m]   = { portfolio: (m+1)·0.8 + sr(m·7)·3 − 1.5, benchmark: (m+1)·0.6 + sr(m·11)·2.5 − 1.2 }
```

`fmt()` renders B/M/K/T suffixes. `pct(v,t) = t>0 ? v/t·100 : 0` guards allocation shares.

### 7.2 Parameterisation / seed rubric

| Field | Formula | Provenance |
|---|---|---|
| `weight (wt)` | `3 − i·0.025 + sr(i·11)·0.5` | synthetic; declining base + jitter |
| `mktCap` | `sr(i·13)·2000 + 10` ($M) | synthetic demo value |
| `ret1d / ret1m / retYTD / ret1y` | `(sr(i·1x)−0.4x)·[4,10,30,40]` | synthetic; centred returns |
| `esgScore` | `round(sr(i·31)·40 + 50)` | 50–90 synthetic |
| `carbonI` | `round(sr(i·37)·300 + 10)` | 10–310 synthetic |
| `greenRev` | `round(sr(i·41)·50)` | 0–50 % synthetic |
| `perfHistory` | linear trend + `sr()` jitter | synthetic 12-month series |

The return draws are centred slightly positive (offsets 0.48/0.45/0.40/0.35) so the synthetic book
shows a mild upward drift across horizons.

### 7.3 Calculation walkthrough

150 `HOLDINGS` built once; `filtered` applies search + sector + sort. `stats` are means over
`filtered`; `sectorAlloc`/`countryAlloc` bucket the **full** `HOLDINGS` (not filtered) into weight
sums and per-sector ESG/return means. `perfHistory` is a fixed 12-point portfolio-vs-benchmark line.
Pagination slices the table. No risk model, no scenario, no optimisation.

### 7.4 Worked example

Sector "Energy" holds 3 names with weightPct [2.0, 1.5, 2.5] and esgScore [60, 55, 65]:

| Output | Computation | Result |
|---|---|---|
| sectorAlloc.wt | 2.0+1.5+2.5 | 6.0 % |
| sectorAlloc.esg (mean) | (60+55+65)/3 | 60.0 |
| pct of 100 | 6.0/100·100 | 6.0 % |

### 7.5 Data provenance & limitations

- **All holdings and the performance line are synthetic** via `sr(seed)=frac(sin(seed+1)×10⁴)`;
  company names are `COUNTRIES`-tagged template strings.
- No benchmark data feed, no true attribution, no tracking error — the "ESG Analytics" tab overlays
  synthetic ESG/carbon scores only. This is a UI demonstration of a portfolio monitor, not a live
  analytics engine. No financial/risk quantity is model-derived, so §8 is not triggered (the metrics
  are descriptive aggregates of random inputs, not a claimed model output).

**Framework alignment:** none implemented computationally; the dashboard mirrors the *shape* of an
ESG-integrated portfolio monitor (PCAF WACI, MSCI-style ESG overlay) without the underlying
calculations. The real PCAF/WACI methodology exists in the shared backend engine but is not wired to
this page.
