## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DP3) describes a health co-benefit
> engine — `HealthCoBenefit = ΔPM2.5 × PopulationExposed × DoseResponse × VSL` with WHO
> dose–response functions, World Bank VSLs and a clean-cooking NPV model. **None of that is in the
> code.** There is no ΔPM2.5 intervention input, no population-exposure term, no dose–response
> coefficient, no VSL and no NPV. The one genuine formula the page implements is a *pollution drag
> on returns*: `adjReturn = grossReturn × (1 − pm25/200)`. Everything else is a synthetic 55-region
> exposure browser with a pollutant finance matrix and a static policy-alignment list. The guide
> should be rewritten; the sections below document the code as shipped.

### 7.1 What the module computes

A single seed block builds **55 regions** (real city names, Beijing → Hanoi) with the platform PRNG
`sr(s) = frac(sin(s+1)×10⁴)`:

```js
pm25       = 5 + sr(i·7)·145                    // 5–150 µg/m³
no2        = 10 + sr(i·11)·90
pm10       = pm25 · (1.2 + sr(i·13)·1.3)        // coupled to PM2.5
healthCost = 0.1 + sr(i·17)·14.9                // $Bn/yr, independent draw
adjReturn  = (3 + sr(i·19)·5) · (1 − pm25/200)  // THE model: linear pollution drag
cleanAirInv= 0.05 + sr(i·23)·2.95               // $Bn investment gap
premDeaths = round(100 + sr(i·29)·4900)
whoExceed  = pm25 > 15
```

and a 6-row **`POLLUTANT_FINANCE`** matrix (PM2.5/PM10/NO₂/SO₂/O₃/CO) with global burden
$10–500Bn, mitigation capex $1–50Bn, return penalty 0.5–5 %, average level and exceedance rate —
all `sr()` draws except the WHO limit column.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Pollution drag denominator | 200 µg/m³ (`1 − pm25/200`) | Synthetic: a region at 200 µg/m³ PM2.5 would have its return fully erased; at 100 µg/m³ the drag is 50 % |
| Gross return band | 3–8 % (`3 + sr·5`); Tab 3 displays a flat "6.5 %" gross label | Synthetic demo values (the 6.5 % label does not equal the per-region gross draw — display simplification) |
| WHO exceedance threshold | PM2.5 > 15 µg/m³ | WHO AQG 2021 *24-hour* guideline (annual guideline is 5); KPI subtitle says "WHO limit: 15" |
| `whoLimit` per pollutant | PM2.5 15 · PM10 45 · NO₂ 40 · SO₂ 20 · O₃ 100 · CO 4 | Mixed basket: 15/45 are WHO 24-h guidelines, 20 (SO₂ 24-h) and 100 (O₃ 8-h) match AQG 2021; NO₂ 40 is the *older 2005 annual* guideline (2021 value is 10) |
| Severity colour bands | PM2.5 > 75 red, > 35 amber, > 15 gold, ≤ 15 sage | Approximates WHO interim targets IT-1 (35) and the 24-h guideline (15); 75 is a demo cut |
| PM2.5 slider | 0–100 µg/m³ min-filter | UI control |
| Policy list (Tab 8) | WHO AQG 2021, EU Clean Air Policy Package, CCAC, World Bank Clean Air Fund … each with status/bond tag | Hardcoded descriptive rows (real initiatives, no computation) |

### 7.3 Calculation walkthrough

All six headline KPIs recompute over the filtered set (region-type dropdown + min-PM2.5 slider):

1. **Avg PM2.5** — `Σ pm25 / n` (guarded for empty filter).
2. **Health Cost** — `Σ healthCost` ($Bn, sum not average).
3. **Premature Deaths** — `Σ premDeaths`.
4. **Health-Adj Return** — `Σ adjReturn / n`; since `adjReturn` embeds the drag formula, this KPI
   falls as the slider raises the minimum PM2.5 — the page's one live cause→effect behaviour.
5. **Clean Air Finance** — `Σ cleanAirInv`.
6. **WHO Exceedances** — count of `pm25 > 15`.

Tabs then re-slice the same 55 rows: Overview ranks the top-15 most polluted plus the pollutant
finance summary; PM2.5 Burden and NO2 Analysis are card grids; Health-Adjusted Returns shows
gross-vs-adjusted per region; Clean Air Finance ranks regions by `cleanAirInv` with a
Priority/Standard tag driven by `whoExceed`; Pollutant Matrix renders `POLLUTANT_FINANCE` with
red highlighting where `avgLevel > whoLimit`; Investment Screener lists only exceeding regions;
Policy Alignment is a static framework table.

### 7.4 Worked example (region i = 0, Beijing)

| Step | Computation | Result |
|---|---|---|
| pm25 | `5 + sr(0)·145` = 5 + 0.8415·145 | **127.0 µg/m³** |
| no2 | `10 + sr(0)·90` (seed `0·11 = 0` collides with `0·7 = 0`) | **85.7** |
| pm10 | `127.0 × (1.2 + 0.8415·1.3)` | **291.3** |
| Gross return draw | `3 + 0.8415·5` | 7.21 % |
| Drag factor | `1 − 127.0/200` | 0.365 |
| adjReturn | `7.21 × 0.365` | **2.63 %** |
| healthCost | `0.1 + 0.8415·14.9` | **$12.64 Bn** |
| premDeaths | `round(100 + 0.8415·4900)` | **4,223** |
| whoExceed | 127.0 > 15 | **true → "Priority"** |

(At i = 0 all seeds `i·k` collapse to `sr(0) = 0.8415`, so Beijing's fields are perfectly
correlated — a seed-collision artefact; from i = 1 the draws diverge.)

### 7.5 Data provenance & limitations

- **All 55 regions and the pollutant matrix are synthetic** `sr()` output attached to real city
  names; no satellite, monitor, IEA or World Bank data is loaded.
- The pollution drag `(1 − pm25/200)` is an invented linear haircut with no cited elasticity;
  production practice would map PM2.5 to productivity/mortality costs via published
  dose–response and damage functions (e.g. World Bank *Cost of Air Pollution* 2022).
- `healthCost` and `premDeaths` are drawn independently of `pm25`, so region cards can show high
  pollution with low health cost and vice versa.
- The guide's headline figures (7M deaths/yr, $2.45Tn co-benefits, $4.5Bn clean-cooking gap) are
  real citations (WHO, IPCC AR6 WGIII, IEA WEO 2023) but appear nowhere in the code.
- No backend, persistence, or cross-module data flow.

### 7.6 Framework alignment

- **WHO Global Air Quality Guidelines 2021** — the exceedance flag and per-pollutant limits
  partially encode AQG levels (with the NO₂ value one revision stale); WHO derives these from
  pooled epidemiological evidence with interim targets for staged compliance.
- **Health-adjusted return** — no standard framework defines this; it is the module's own
  construct, conceptually similar to integrating externality costs into expected returns
  (impact-weighted accounts à la HBS IWAI), but implemented as a single linear factor.
- **EU Taxonomy / Green bonds** — invoked only as labels in the Policy Alignment tab ("EU Taxonomy
  aligned", "Green Bond eligible"); no eligibility logic is computed.
- **CCAC / World Bank Clean Air Fund** — real initiatives listed descriptively; the module does
  not model their finance windows.
