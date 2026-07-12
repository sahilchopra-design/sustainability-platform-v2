## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a three-pillar **WEC Energy Trilemma**:
> `ETS = w₁·Security + w₂·Equity + w₃·Sustainability`, with an affordability/access *Equity* pillar.
> **The code computes no Equity pillar and no three-pillar composite.** It builds a single bespoke
> `securityIndex` from five security-and-sustainability inputs — there is no affordability, energy
> access, or household-burden term anywhere. The chokepoint and pipeline datasets are real
> geopolitical facts; the 50 country attribute rows are synthetic. Documented below as written; the
> proper WEC-style trilemma model is specified in §8.

### 7.1 What the module computes

For 50 countries, all attributes are PRNG draws (`sr(s)=frac(sin(s+1)×10⁴)`) except the region label
and a hand-set net-exporter override for the three Gulf states (i = 30–32, Saudi/UAE/Qatar get a
negative import dependency):

```js
importDep      = (i∈30..32) ? −floor(s1·200) : floor(s1·85)+5    // % (negative = net exporter)
renewShare     = floor(s3·60)+5
reserveDays    = floor(s2·180)+10
gridReliability= 80 + floor(s5·20)
hhiImports     = s6·8000 + 500
```

The headline **security index**:
```js
securityIndex = round( (100 − |importDep|·0.3 + reserveDays·0.15 + renewShare·0.5
                        + gridReliability·0.2 − hhiImports·0.005) × 0.5 )
securityIndex = clamp(securityIndex, 10, 95)
```

### 7.2 Parameterisation / scoring rubric

Security-index term weights (bespoke, not WEC):

| Term | Coefficient | Direction | Interpretation |
|---|---|---|---|
| base | +100 | — | anchor |
| `|importDep|` | −0.30 | penalty | import reliance hurts |
| `reserveDays` | +0.15 | bonus | strategic reserves help |
| `renewShare` | +0.50 | bonus | domestic renewables help most |
| `gridReliability` | +0.20 | bonus | grid resilience |
| `hhiImports` | −0.005 | penalty | supplier concentration hurts |
| overall scale | ×0.5, clamp 10–95 | — | keeps index in band |

**Real geopolitical reference data (hand-authored, accurate):**

| Object | Content | Real? |
|---|---|---|
| `CHOKEPOINTS` (8) | Hormuz 21 Mb/d, Malacca 16, Suez 9, Bab el-Mandeb 6.2 (Houthi), Turkish/Danish Straits, Panama (drought) | ✓ realistic flows |
| `PIPELINE_ROUTES` (11) | Nord Stream (destroyed), TurkStream 78%, Yamal 15%, Baltic Pipe 88%, ESPO 95% | ✓ post-2022 reality |
| country attributes | import%, HHI, renew share, sovSpreadPremium, gridInvestNeed | ✗ synthetic |

`investmentNeeds` (Grid, Renewables, Storage, Hydrogen, LNG, Nuclear, Interconnectors, EV) are also
`sr()` draws for $bn and gap.

### 7.3 Calculation walkthrough

Generate 50 countries → compute `securityIndex` per the weighted sum → clamp to 10–95 → rank/sort by
the chosen column → the four tabs render: security index ranking, fossil-fuel dependency (import
splits + chokepoint/pipeline exposure), renewable self-sufficiency (`renewPotential` vs
`currentDeployment`), and investment implications (`gridInvestNeedBn`, hydrogen hubs). A `yearSlider`
and `scenarioToggle` exist but drive display context, not the core index.

### 7.4 Worked example

Country **i = 0** (Germany, Europe). Seeds `s1=sr(7)`, `s2=sr(11)`, `s3=sr(13)`, `s5=sr(19)`,
`s6=sr(23)`. Suppose the draws yield `importDep = 62%`, `reserveDays = 90`, `renewShare = 40%`,
`gridReliability = 95`, `hhiImports = 3,500`:
```
securityIndex = round( (100 − 62·0.30 + 90·0.15 + 40·0.50 + 95·0.20 − 3500·0.005) × 0.5 )
             = round( (100 − 18.6 + 13.5 + 20 + 19 − 17.5) × 0.5 )
             = round( 116.4 × 0.5 ) = round(58.2) = 58
```
clamped to [10,95] → **58**. High import dependence (−18.6) and supplier concentration (−17.5) drag
the score, while renewables (+20) and reserves (+13.5) offset — the intended trade-off signal.

### 7.5 Companion analytics

- **Chokepoint exposure:** the 8 maritime chokepoints (real Mb/d flows) contextualise oil-import
  vulnerability — the module's genuine geopolitical layer.
- **Pipeline map:** 11 real routes with post-2022 utilisation (Nord Stream destroyed, Russian gas
  routes reduced) — the Europe-Russia decoupling narrative.
- **Renewable self-sufficiency:** `renewPotential` (untapped) vs `currentDeployment` gap per country.

### 7.6 Data provenance & limitations

- **Country attributes are synthetic**, seeded by `sr()`; only the Gulf-exporter override and the
  region labels are deterministic. **Chokepoints and pipelines are real, accurate reference data.**
- The `securityIndex` is a **bespoke linear composite**, not the WEC Trilemma — it has no equity /
  affordability / access dimension despite the guide, so it measures security+sustainability only.
- `sovSpreadPremium`, `criticalMineralDep`, `gridInvestNeedBn` are illustrative random draws, not
  sourced macro data.

**Framework alignment:** **World Energy Council Trilemma Index** — the intended three-pillar
(Security / Equity / Sustainability) balance, of which only a security-style pillar is built;
**IEA World Energy Outlook** — the import-dependency and HHI concepts; **REPowerEU** — the
Russia-decoupling pipeline narrative the map illustrates. The **HHI** supplier-concentration measure
is genuine in spirit (Herfindahl of supplier shares), though here it is a random proxy rather than a
computed Σ(share²).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute a defensible WEC-style Energy Trilemma score per country across all three pillars, replacing
the bespoke security-only index, to support sovereign-risk and infrastructure-investment screening.

### 8.2 Conceptual approach
Reproduce the **World Energy Council Trilemma Index** methodology (min-max normalised sub-indicators
aggregated per pillar) and cross-check against **IEA WEO** energy-balance data. Import-diversity uses
a true Herfindahl-Hirschman Index of supplier shares, per **IEA/BP Statistical Review** practice.

### 8.3 Mathematical specification
```
Security_c    = norm(1 − importDep_c) ⊕ norm(1/HHI_c) ⊕ norm(reserveDays_c)
Equity_c      = norm(access_rate_c) ⊕ norm(1 − energy_burden_c) ⊕ norm(1/retail_price_c)
Sustain_c     = norm(renewShare_c) ⊕ norm(1 − CI_grid_c) ⊕ norm(NDC_ambition_c)
HHI_c         = Σ_s (supplier_share_{c,s})²                    // 0–10,000
ETS_c         = w₁·Security_c + w₂·Equity_c + w₃·Sustain_c,   Σw = 1 (WEC: ~1/3 each)
norm(x)       = (x − min)/(max − min) across the country panel
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Import dependency | `importDep` | IEA energy balances |
| Supplier HHI | `HHI` | IEA/BP supplier-share data |
| Energy access rate | `access_rate` | World Bank SE4ALL |
| Household energy burden | `energy_burden` | World Bank / IEA affordability |
| Grid carbon intensity | `CI_grid` | IEA electricity statistics |
| Renewable share | `renewShare` | IRENA |
| Pillar weights | `w₁,w₂,w₃` | WEC (balanced ~⅓ each) |

### 8.4 Data requirements
Per country: net energy imports & gross inland consumption, supplier import shares (for HHI), strategic
reserve days, electricity access %, household energy expenditure share, retail energy price, renewable
generation share, grid CO₂ intensity, NDC target. Sources: IEA, IRENA, World Bank (free); platform
already ingests World Bank live series and IRENA reference data.

### 8.5 Validation & benchmarking plan
Reconcile the computed ETS ranking against the published WEC Trilemma Index country grades
(A–D balance scores) for the overlapping country set — Spearman rank correlation should exceed 0.8.
Sensitivity: reweight pillars and confirm rank stability; verify HHI reproduces IEA-published
concentration figures for a benchmark importer (e.g. pre-2022 Germany gas HHI).

### 8.6 Limitations & model risk
Min-max normalisation makes scores panel-relative (adding a country shifts everyone); the Equity
pillar depends on affordability data with poor EM coverage. Conservative fallback: missing Equity
sub-indicators are imputed at the regional median with a data-quality flag, never dropped (which would
silently inflate the composite).
