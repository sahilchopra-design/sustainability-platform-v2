## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two independent pieces: (1) a 34-year (1990–2023) OWID-styled CO₂ emissions time-series per country,
and (2) a PCAF-standard EVIC (Enterprise Value Including Cash) calculator for a synthetic universe
of tickers, feeding a WACI (Weighted Average Carbon Intensity) and financed-emissions proxy.

```
EVIC              = marketCap + totalDebt + minorityInt − cash          // PCAF Standard v2 definition
WACI              = (scope1 + scope2) / (EVIC / 1000) × 100             // tCO2e / $M EVIC
finEmissions       = (scope1 + scope2) / 1000 × (marketCap / EVIC)       // ktCO2e attributed by equity share
```

This is an exact match to the guide's stated formula (`EVIC = MarketCap + Debt + MinorityInterest −
Cash`) and PCAF's own attribution-factor logic (`AFᵢ = Investmentᵢ / EVICᵢ`, here proxied by the
equity ownership share `marketCap/EVIC`).

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `marketCap` | $80–2,480B | Synthetic demo value |
| `totalDebt` | 10–70% of market cap | Synthetic demo value |
| `cash` | 5–25% of market cap | Synthetic demo value |
| `minorityInt` | 0–5% of market cap | Synthetic demo value |
| `scope1`/`scope2` | 50–5,050 / 20–2,020 ktCO₂e | Synthetic demo value |
| CO₂ time-series `base`/`perCap`/`trend` (13 countries) | seed table | Styled on OWID Our World in Data structure; values are illustrative, not a live OWID pull despite the tab label "OWID CO₂ Time-Series" |

### 7.3 Calculation walkthrough

1. **EVIC build** (`EVIC_DATA`): for each of N tickers, market cap, debt, cash, and minority
   interest are drawn independently via `sr(i×3+k)`, then summed per the PCAF formula to `evic`.
2. **WACI**: `(scope1+scope2)/(evic/1000)×100` — note the denominator is *EVIC in $B → $M
   equivalent* (÷1000 converts $B to a per-$M-of-EVIC basis), producing tCO₂e per $M EVIC, matching
   the guide's stated unit.
3. **Financed emissions proxy**: `(scope1+scope2)/1000 × (marketCap/evic)` uses the *equity-value
   share* of EVIC as a stand-in attribution factor — this is the correct PCAF concept
   (`AF = investment/EVIC`) applied at the company's own equity-vs-EVIC ratio rather than a specific
   investor's position size, i.e. it shows "if you owned 100% of the equity tranche, this is your
   financed-emissions share of total EVIC" rather than a portfolio-specific number.
4. **Sector WACI aggregation** (`sectorWaci`): simple unweighted mean of `waci` across companies in
   each sector (`items.reduce(...)/items.length`), guarded against empty sector subsets.
5. **Data Quality Monitor tab** (`DQ_SOURCES`, 9 rows): completeness/freshness/latency/coverage
   metadata per source table — descriptive metadata, not a computed score.

### 7.4 Worked example

A ticker with `marketCap=$420B`, `totalDebt=$180B` (43% of cap), `cash=$62B` (15%), `minorityInt=$8B`
(2%), `scope1=1,800 ktCO₂e`, `scope2=650 ktCO₂e`:

| Step | Computation | Result |
|---|---|---|
| EVIC | 420 + 180 + 8 − 62 | **$546B** |
| WACI | (1,800+650) / (546,000/1000) × 100 | (2,450 / 546) × 100 = **448.7 tCO₂e/$M** |
| Equity share of EVIC | 420 / 546 | 76.9% |
| Financed emissions (100%-owner proxy) | 2,450 × 0.769 | **1,884 ktCO₂e** |

### 7.5 Data provenance & limitations

- **All company financials and emissions are synthetic demo data** (`sr(seed)`); the CO₂
  time-series, despite being labelled "OWID CO₂ Time-Series," is generated the same way (a linear
  interpolation between a seed `base` value and per-capita/trend parameters with noise), not
  fetched from the real Our World in Data CO₂ dataset.
- The `finEmissions` metric is a *company-level* equity-attribution illustration, not a real
  investor-position PCAF calculation (a genuine portfolio calculation needs actual investment $ and
  the investor's specific AF, computed in the dedicated `pcaf-financed-emissions` and
  `pcaf-universal-attributor` modules).
- No missing-data proxy hierarchy is implemented here despite the guide's `userInteraction` item
  "handle missing data via proxy estimation hierarchy" — EVIC/emissions fields are always populated
  by the PRNG, so there's no gap-filling logic to inspect.

**Framework alignment:** PCAF Standard v2 (2022) EVIC definition — correctly implemented; SFDR
Delegated Regulation Annex I attribution-factor concept — reflected structurally via
`marketCap/evic` but not computed for an actual investor position; TCFD carbon-intensity metrics
(WACI) — correctly labelled and unit-consistent (tCO₂e/$M EVIC).
