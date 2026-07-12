## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *hub consolidating 12 portfolio analytics
> sub-modules* with a portfolio ESG composite `ESG_p = Σ(wᵢ·ESGᵢ)/Σwᵢ` and a "Climate Risk Flag" from
> a "Climate Pulse Engine". **The code is a generic filterable list of 50 synthetic portfolios**
> (`ITEMS`) with strategy/region filters and KPI cards. There is no ESG-composite aggregation of real
> holdings and no cross-module scorecard — the "suite" is a directory-style landing table, not an
> analytics engine.

### 7.1 What the module computes

Descriptive KPIs over a filtered list of synthetic portfolios:

```js
ITEMS[i] = { strategy, region, aum: sr(i·11)·5000+100, returnYtd: sr(i·13)·25−5, … }   // 50 rows
kpis = [ Portfolios: filtered.length,
         Total AUM: Σ aum,
         Avg Return: Σ returnYtd / n,
         … ]
fmt(v): B/M/K suffix formatter
```

Filtering is by `strategy` (F1) and `region` (F2); sorting toggles column/direction; a CSV export
serialises the filtered rows.

### 7.2 Parameterisation / seed rubric

| Field | Formula | Provenance |
|---|---|---|
| `aum` | `sr(i·11)·5000 + 100` ($M) | synthetic demo value |
| `returnYtd` | `sr(i·13)·25 − 5` (%) | synthetic; −5 to +20 |
| `strategy` | `F1[floor(sr(i·3)·|F1|)]` | synthetic categorical |
| `region` | `F2[floor(sr(i·7)·|F2|)]` | synthetic categorical |
| `name` | `'Portfolio ' + (i+1)` | template label |

### 7.3 Calculation walkthrough

50 `ITEMS` generated at load; `filtered` applies search + strategy + region + sort; `kpis` reduce over
the filtered set for count, total AUM, and mean return. No sub-module data is fetched or aggregated;
the "12 modules integrated" figure is guide prose, not a live registry read.

### 7.4 Worked example

Filter to 3 portfolios with AUM [2000, 1500, 800] and returnYtd [8.0, −2.0, 12.0]:

| Output | Computation | Result |
|---|---|---|
| Portfolios | count | 3 |
| Total AUM | 2000+1500+800 | $4.3B (fmt) |
| Avg Return | (8.0 − 2.0 + 12.0)/3 | 6.0 % |

### 7.5 Data provenance & limitations

- **All 50 portfolios synthetic** via `sr(seed)=frac(sin(seed+1)×10⁴)`; names are templated.
- No ESG composite, no climate flag, no cross-module scorecard — the guide's analytics-hub role is
  aspirational. This is a list/registry UI showing summary metrics of random portfolios, so no
  production risk-model specification is warranted (§8 not triggered).

**Framework alignment:** MSCI ESG / TCFD — named as the aggregation standards the hub *would* apply,
but the page computes only count/sum/mean over synthetic AUM and return; the portfolio-ESG-composite
formula is not implemented here (it exists in `portfolio-manager` / `portfolio-optimizer`).
