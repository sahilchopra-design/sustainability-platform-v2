# Energy Security & Transition
**Module ID:** `energy-security-transition` · **Route:** `/energy-security-transition` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the tension between national energy security objectives and the pace of low-carbon transition, integrating geopolitical energy dependency scores with NDC ambition and fossil fuel import exposure. Produces country-level energy trilemma assessments covering security, equity, and sustainability dimensions. Informs sovereign risk analysis, infrastructure investment screening, and policy scenario planning.

> **Business value:** Enables sovereign analysts, infrastructure investors, and policy advisors to quantify the energy security-transition trade-off, identify countries where transition acceleration could destabilise energy supply, and structure resilient green infrastructure investment theses.

**How an analyst works this module:**
- Select countries or custom regional grouping for comparative trilemma assessment.
- Apply NGFS or IEA NZE scenario to project energy mix evolution and recalculate future trilemma scores.
- Review security vs. sustainability trade-off scatter plot to identify countries at highest transition-security conflict.
- Export country profiles for sovereign debt risk analysis or infrastructure investment screening report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHOKEPOINTS`, `COLORS`, `COUNTRIES_50`, `PIPELINE_ROUTES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CHOKEPOINTS` | 9 | `name`, `oil`, `lng`, `countries`, `risk`, `alternativeRoute`, `dailyBbl` |
| `PIPELINE_ROUTES` | 11 | `name`, `from`, `to`, `capacity`, `status`, `type`, `utilization` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tabs` | `['Energy Security Index','Fossil Fuel Dependency','Renewable Self-Sufficiency','Investment Implications'];` |
| `countries` | `useMemo(()=>{ return COUNTRIES_50.map((c,i)=>{ const s1=sr(i*19+7);const s2=sr(i*23+11);const s3=sr(i*29+13);const s4=sr(i*31+17);const s5=sr(i*37+19);const s6=sr(i*41+23);` |
| `renewShare` | `Math.floor(s3*60)+5;` |
| `gasFromRussia` | `region==='Europe'?Math.floor(s4*50):Math.floor(s4*10);` |
| `reserveDays` | `Math.floor(s2*180)+10;` |
| `gridReliability` | `80+Math.floor(s5*20);` |
| `hhiImports` | `+(s6*8000+500).toFixed(0);` |
| `fuelDiversity` | `+(1-s4*0.6).toFixed(2);` |
| `securityIndex` | `Math.round((100-Math.abs(importDep)*0.3+reserveDays*0.15+renewShare*0.5+gridReliability*0.2-hhiImports*0.005)*0.5);` |
| `regions` | `[...new Set(countries.map(c=>c.region))];` |
| `investmentNeeds` | `useMemo(()=>{ return['Grid Modernization','Renewable Capacity','Storage (Battery+Pump)','Hydrogen Infrastructure','LNG Terminals','Nuclear New Build','Interconnectors','EV Charging'].map((cat,i)=>({ category:cat, investBn:Math.floor(sr(i*143+41)*500)+50, gap:Math.floor(sr(i*149+43)*60)+10, timeline:`${2025+Math.floor(sr(i*151+47)*5)}-${20` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHOKEPOINTS`, `COLORS`, `COUNTRIES_50`, `PIPELINE_ROUTES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Import Dependency Ratio (%) | — | IEA Energy Statistics | Net energy imports as % of gross inland consumption; >70% flags high geopolitical exposure. |
| Supply Diversity (HHI) | — | IEA/BP Statistical Review | Herfindahl-Hirschman Index of energy source and supplier concentration; HHI >2,500 indicates high concentration risk. |
| Renewable Share of Power Mix (%) | — | IRENA / IEA | Share of variable renewables and hydro in electricity generation; key sustainability pillar driver. |
| Energy Trilemma Score (0â€“100) | — | WEC Trilemma Index | Composite country score; higher = better balance across security, equity, sustainability dimensions. |
- **IEA energy statistics (production, imports, consumption by source)** → Compute import dependency and HHI by country and fuel type → **Security sub-score per country**
- **IRENA renewable capacity and generation data** → Calculate renewable share and year-on-year trajectory → **Sustainability sub-score with NZE gap**
- **World Bank energy access and affordability data** → Normalise access rate and household energy burden → **Equity sub-score for trilemma composite**

## 5 · Intermediate Transformation Logic
**Methodology:** Energy Trilemma Score
**Headline formula:** `ETS = w₁×Security + w₂×Equity + w₃×Sustainability`

Composite score aggregating three normalised pillars each scored 0â€“100. Security pillar incorporates import dependency ratio, diversity of supply (HHI), and strategic reserve adequacy. Equity pillar covers affordability and access rates. Sustainability pillar uses carbon intensity of the energy mix and renewable share trajectory.

**Standards:** ['World Energy Council Trilemma Index', 'IEA World Energy Outlook 2024', 'REPowerEU']
**Reference documents:** World Energy Council Trilemma Index 2024; IEA World Energy Outlook 2024; REPowerEU Plan, European Commission 2022; IRENA World Energy Transitions Outlook 2024; IMF Working Paper â€” Energy Security and Climate Policy Trade-offs 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the three-pillar trilemma on real IEA/IRENA/World Bank series (analytics ladder: rung 1 → 2)

**What.** The §7 flag: the guide's WEC-style `ETS = w₁·Security + w₂·Equity + w₃·Sustainability` is not implemented — there is no Equity pillar (no affordability, access, or household-burden term anywhere), just a bespoke `securityIndex` blending five inputs, and all 50 countries' attributes are `sr()` draws (with a lone hand-set net-exporter override for the Gulf three). The genuinely valuable data is geopolitical: the 9-chokepoint table (with daily bbl volumes and alternative routes) and 11 pipeline routes are real facts. The §8 spec for the proper trilemma already exists on this page; Evolution A implements it.

**How.** (1) `services/energy_trilemma_engine.py`: Security from IEA import-dependency and supplier-HHI statistics (IEA free-tier country balances; EIA as fallback — both already platform ETL sources), Sustainability from IRENA renewable shares and carbon intensity, the missing Equity pillar from World Bank energy-access (EG.ELC.ACCS.ZS) and affordability series — all public, keyless. (2) Documented pillar weights with the WEC index as the external anchor: validate rank correlation of the computed ETS against the published WEC Trilemma rankings and report it (that check is the module's credibility test). (3) Chokepoints/pipelines move to reference tables and gain the scenario hook the module's premise demands (rung 2): "close Hormuz / cut Russian gas 80%" recomputes affected countries' import HHI and security scores through real flow shares.

**Prerequisites.** Country-series ingester (IEA/IRENA/WB); deletion of the 50 synthetic rows in the same release. **Acceptance:** a fixture country's three pillars reproduce from sourced series; ETS rank correlation vs WEC published index reported; the Hormuz scenario changes exactly the chokepoint-dependent countries' scores.

### 9.2 Evolution B — Sovereign energy-shock briefing analyst (LLM tier 2)

**What.** A tool-calling analyst for the module's users (sovereign analysts, infrastructure investors): "brief me on Egypt: trilemma position, chokepoint exposure, and what a Suez disruption does to its security score and import bill." It chains Evolution A's endpoints — country profile, chokepoint-dependency lookup, shock recompute — and drafts the sovereign brief with the trade-off framing the module is named for: where transition acceleration would strain security (high renewables ambition + low grid reliability + high import HHI), stated from computed pillar components.

**How.** Tools: `get_trilemma(country)`, `get_chokepoint_exposure(country)`, `run_shock(scenario, countries)`, `compare_countries(list)`. Grounding corpus = this Atlas record's §5 pillar definitions and the chokepoint reference table (real volumes and alternative routes make the briefings concrete). Every score, HHI, and bbl figure validator-checked against tool outputs; geopolitical *interpretation* is clearly framed as analysis over the computed exposure, and the brief cites data vintages (energy-balance years lag — disclose it).

**Prerequisites (hard).** Evolution A — briefing on seeded country attributes would hand a sovereign analyst fabricated import dependencies for 50 named countries. **Acceptance:** a golden country brief's every numeric traces to a tool response; the shock scenario's affected-country list matches the chokepoint table's `countries` field; unavailable pillars (missing WB access data) are disclosed, not imputed.