## 7 · Methodology Deep Dive

The guide describes a segment P&L decomposition with a transition score per segment — implemented as
written. One small discrepancy: the guide's data-point says "5 segments (upstream, midstream,
downstream, renewables, retail)", but the code models **three** segments only — Upstream, Midstream,
Downstream (renewables/retail appear as *within*-downstream detail, e.g. EV chargers, biofuel blend).
The module is a static, transparent decomposition dashboard with one live calculation.

### 7.1 What the module computes

Hand-authored segment financials (`SEGMENTS`), 6-year revenue trend, and per-segment operational
detail (`UPSTREAM_DETAIL`, `MIDSTREAM_DETAIL`, `DOWNSTREAM_DETAIL`). The only render-time computation
is the internal-carbon-price cost overlay:

```js
cost = SEGMENTS[segment].emissions_mt × carbonPrice / 1000        // $B carbon cost
```

`transition_score` per segment is a **stored** attribute (Upstream 32, Midstream 55, Downstream 48),
not computed from a taxonomy assessment as the guide's formula suggests.

### 7.2 Parameterisation / scoring rubric

| Segment | Revenue $B | EBITDA $B | CapEx $B | Emissions Mt | Transition score |
|---|---|---|---|---|---|
| Upstream (E&P) | 42.5 | 18.2 | 12.8 | 28.4 | 32 |
| Midstream (transport) | 18.7 | 8.9 | 4.2 | 5.1 | 55 |
| Downstream (refining+retail) | 56.3 | 6.1 | 8.5 | 18.7 | 48 |

Detail objects carry realistic operational metrics:

| Segment | Key detail |
|---|---|
| Upstream | reserves 8,420 mmboe, R/P 11.2 yr, production 1,840 mboed, decline 4.8%/yr, decline curve to 2040 |
| Midstream | 12,400 km pipeline, 78% utilisation, LNG 18.5 mtpa cap / 14.8 throughput |
| Downstream | 1,250 kbd refinery, 82% util, 2,400 EV chargers, 8.5% biofuel blend, 8,200 retail sites |

`CROSS_SEGMENT.internal_carbon_price = 85` ($/tCO₂), `transfer_pricing_adj = 2.4`. All values are
editorial (integrated-major-plausible), not a live feed.

### 7.3 Calculation walkthrough

Load static segment data → the overview shows revenue/EBITDA/CapEx/emissions per segment and the
transition-score radar → the detail tabs render each segment's operational metrics and time series →
the cross-segment tab applies the internal carbon price to each segment's emissions to show the carbon
cost burden. EBITDA margin is read directly (e.g. Downstream 6.1/56.3 = 10.8% vs Upstream 18.2/42.5 =
42.8%), illustrating upstream's higher margin but higher emissions intensity.

### 7.4 Worked example

Internal carbon-price cost for **Upstream** at the default `carbonPrice = 85` $/tCO₂:
```
cost = 28.4 Mt × 85 / 1000 = 28.4 × 85 / 1000 = $2.41B
```
Against Upstream EBITDA of $18.2B, an $85 internal carbon price consumes ≈13% of segment EBITDA —
the module's central message that upstream carries the largest transition-cost exposure (28.4 Mt vs
midstream 5.1 Mt). Downstream at the same price: `18.7 × 85/1000 = $1.59B`, ≈26% of its thinner $6.1B
EBITDA.

### 7.5 Companion analytics

- **Transition-readiness radar:** the 7-point `TRANSITION_RADAR` series compares segment scores across
  dimensions; Midstream scores highest (55) reflecting infrastructure repurposing optionality.
- **Decline curve (upstream):** production 1,840 → 858 mboed by 2040 at ~4.8%/yr — the natural
  depletion pathway even absent transition policy.
- **Downstream buildout:** EV chargers 200 → 2,400 and biofuel blend 3.2% → 8.5% (2020–2025) — the
  retail-network transition.

### 7.6 Data provenance & limitations

- **All data is static editorial** (no PRNG); magnitudes are integrated-major-plausible but not a real
  company.
- `transition_score` is a **stored heuristic**, not computed from taxonomy/SBTi assessment despite the
  guide's "taxonomy assessment weighted by segment revenue" formula.
- Only three operating segments are modelled (not the guide's five); renewables/retail are embedded as
  downstream detail rather than standalone segments.

**Framework alignment:** **IEA World Energy Outlook** — the upstream/midstream/downstream value-chain
framing and the decline-curve/utilisation concepts; **internal carbon pricing** (TCFD-recommended) —
the $85/tCO₂ shadow price applied to segment emissions is the standard shadow-cost technique for
stress-testing transition exposure. Company-filing segment reporting (IFRS 8 operating segments)
underpins the P&L decomposition structure.
