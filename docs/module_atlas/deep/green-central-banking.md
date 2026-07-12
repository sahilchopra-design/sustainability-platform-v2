## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a **Green QE Tilting Score** —
> `Tilt = (GreenShare_portfolio − GreenShare_market)/GreenShare_market × 100`. **No tilt score is
> computed in the code.** There is no portfolio green-share, no market benchmark, no tilt ratio. The page
> is a **cross-central-bank scorecard**: it ranks ~central banks on a set of pre-assigned dimension
> scores (green score, taxonomy adoption, supervisory expectation, macroprudential, reserve greening,
> green-bond purchase), computes simple averages and a radar profile, and shows a seeded 24-month trend.
> Sections below document the scorecard; §8 specifies the actual QE-tilt model.

### 7.1 What the module computes

The core dataset `CBS` holds per-central-bank fields; the page produces:
```js
kpis:  avg(k) = ⌊ Σ CBS[k] / CBS.length ⌋   for each dimension
       ngfs = count(ngfsMemb == 'Yes')
       activeQe = count(greenQe == 'Active')
       mandatory = count(disclosure mandatory)
regChart:  per-region mean greenScore
qeDist:    histogram of greenQe status
radarData: 6-dimension portfolio-average profile
           (greenScore, taxonomyAdoption, supervisoryExpect, macroprudential,
            reserveGreening, greenBondPurchase)
```
Every headline is a **mean or count over the CBS scorecard** — there is no derived monetary-policy metric.

### 7.2 Parameterisation / provenance

| Element | Nature | Provenance |
|---|---|---|
| `CBS` dimension scores | pre-assigned 0–100 per central bank | curated/synthetic scorecard (values not code-visible here) |
| `ngfsMemb`, `greenQe`, disclosure flags | categorical labels | curated against NGFS/ECB public status |
| `QE_DATA` (6 rows) | instrument, volume, share, growth | static reference table |
| `TREND` (24 months) | `greenQeVol = 100+i·15+sr·80`; `cbsActive = 8+i·0.6+sr·3`; `stressTests` | **seeded** synthetic trend |
| `radarData` | mean of 6 dimensions | derived from CBS |

The scorecard *labels* (NGFS membership, active green QE) map to real public status; the numeric dimension
scores are an analyst scoring, and the time trend is seeded, not observed.

### 7.3 Calculation walkthrough

`CBS` → filter (search/region), sort → paged table. KPIs average the dimension columns and count
categorical flags. `regChart` groups by region and means `greenScore`. `radarData` averages the 6
dimensions across all central banks for the composite profile. The `TREND` chart is independent seeded data.

### 7.4 Worked example

Suppose the filtered CBS set has `greenScore` values {80, 60, 70, 90, 50} across 5 banks.
`avg(greenScore) = ⌊(80+60+70+90+50)/5⌋ = ⌊350/5⌋ = 70`. If 4 of 5 have `ngfsMemb == 'Yes'`, the NGFS KPI
shows 4; if 2 have `greenQe == 'Active'`, `activeQe = 2`. The radar plots 70 on the greenScore axis
alongside the means of the other five dimensions. These are transparent descriptive statistics — accurate
as displayed, but they are inputs a human assigned, not a computed monetary-policy quantity.

### 7.5 Data provenance & limitations

- Dimension scores are a **curated/analyst scorecard**; the 24-month `TREND` is **synthetic seeded** data
  (`sr(seed)=frac(sin(seed+1)·10⁴)`).
- The guide's flagship tilt score is **not implemented** — the module cannot say how green a central
  bank's asset purchases are versus the market.
- No collateral-eligibility computation, no reserve-greening quantification beyond a score.

**Framework alignment:** NGFS *Recommendations for Central Banks and Supervisors* (2021) — the membership
and supervisory-expectation flags; ECB Climate Action Plan (2021) — the CSPP green-tilt context the guide's
metric targets; BIS green-QE working papers; BoE CBES. A real "green tilt" is the deviation of a purchase
programme's green weight from a market-cap-neutral benchmark (ECB's post-2021 CSPP tilt is the canonical
example) — specified in §8.

## 8 · Model Specification — Central-Bank Green-QE Tilt & Collateral-Greenness Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify, per central bank, (a) the green tilt of its asset-purchase programme relative to a market-neutral
benchmark, and (b) the greenness of its eligible-collateral universe — to track green monetary policy and
anticipate funding-cost effects for green vs brown issuers.

### 8.2 Conceptual approach
Portfolio-attribution of green weight against a benchmark, mirroring **ECB CSPP tilt disclosure** and
**NGFS "greening monetary policy" analysis**: compute the programme's holdings-weighted green share, compare
to the eligible-universe (market-cap-neutral) green share, and express the difference as a tilt; repeat for
collateral eligibility.

### 8.3 Mathematical specification
```
GreenShare_portfolio = Σ_i w_i^port · green_i        (w = market value weights, green_i∈{0,1} or [0,1])
GreenShare_market    = Σ_i w_i^mkt · green_i         (market-cap-neutral eligible universe)
Tilt = (GreenShare_portfolio − GreenShare_market) / GreenShare_market · 100      (%)
Carbon-intensity tilt = WACI_portfolio − WACI_market                             (tCO₂e/$M)
Collateral greenness = eligible-green MV / total-eligible MV
Funding-cost effect (indicative) = −κ · Tilt · duration    (spread compression for green issuers)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `w^port` | programme holdings weights | central-bank holdings disclosure (CSPP/APP) |
| `w^mkt` | market-neutral eligible weights | index provider / eligible-universe data |
| `green_i` | green label / taxonomy alignment | CBI/ICMA labels, EU Taxonomy |
| `WACI` | weighted avg carbon intensity | issuer emissions / EVIC (PCAF) |
| `κ` | tilt→spread sensitivity | event studies on CSPP tilt announcements |

### 8.4 Data requirements
Programme holdings (ISIN-level MV), eligible-universe composition, green labels and issuer carbon
intensity, collateral hairc60t schedules. Sources: central-bank holdings disclosures (free), index data
(vendor), CBI/ICMA labels, emissions (Trucost/CDP). The platform holds green-label taxonomies and
issuance seeds; holdings-level data is not present.

### 8.5 Validation & benchmarking plan
Reconcile computed ECB tilt against ECB's own published CSPP tilt; validate WACI against PCAF-consistent
issuer emissions; sensitivity of tilt to green-label definition (labelled-only vs taxonomy-aligned);
event-study the spread effect around tilt announcements.

### 8.6 Limitations & model risk
Green labelling choice (labelled bonds vs taxonomy alignment) swings the tilt materially — report both.
Holdings disclosures lag and are partial. The funding-cost link `κ` is empirically weak. Conservative
fallback: report GreenShare_portfolio and GreenShare_market separately when the benchmark universe is
uncertain, rather than a single tilt number.
