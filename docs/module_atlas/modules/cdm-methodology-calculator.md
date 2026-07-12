# CDM Methodology Calculator
**Module ID:** `cdm-methodology-calculator` · **Route:** `/cdm-methodology-calculator` · **Tier:** B (frontend-computed) · **EP code:** EP-DQ1 · **Sprint:** DQ

## 1 · Overview
Implements the UN Clean Development Mechanism (CDM) methodology suite for calculating emission reductions. Covers ACM0002 (grid electricity), ACM0014 (industrial energy efficiency), AMS-I.D (grid-connected renewables), TOOL07 project emissions tool, and real-time carbon registry pricing for CER, ERU, and voluntary offsets.

> **Business value:** Essential for project developers seeking CDM/Article 6.4 registration, carbon credit buyers conducting due diligence, and carbon market analysts. Provides UNFCCC-grade emission reduction calculations using TOOL07 v4 with IPCC AR6 GWP100 values.

**How an analyst works this module:**
- Select CDM methodology (ACM0002, ACM0014, AMS-I.D)
- Input project capacity, technology, and grid region
- Calculate TOOL07 combined margin emission factor
- Derive annual emission reductions (ER_y)
- Price CERs against registry spot and forward curves

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Badge`, `COUNTRIES_DATA`, `FormulaBox`, `GRID_EF`, `GWP_TABLE`, `KpiCard`, `METHODOLOGIES`, `PRICE_CURVES`, `PROJECTS`, `PROJ_NAMES`, `REGISTRIES`, `REG_PRICE`, `RegBox`, `SECTORS`, `SliderRow`, `TABS`, `VVBs`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GRID_EF` | 21 | `om`, `bm`, `cm`, `year`, `type` |
| `GWP_TABLE` | 9 | `formula`, `ar4`, `ar5`, `ar6` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGIES` | `['ACM0002','ACM0001','ACM0014','ACM0022','ACM0018','AMS-I.D','AMS-I.F','AMS-II.C','AMS-III.F','AMS-III.G','AR-ACM0003','AM0029','AM0031','AM0067','AMS-III.AU'];` |
| `SECTORS` | `['Energy Industries','Energy Distribution','Energy Demand','Manufacturing','Chemical Industries','Construction','Transport','Mining/Mineral','Metal Production','Fugitive Emissions','Waste Handling & Disposal','Afforestat` |
| `PROJ_NAMES` | `['Rajasthan Wind Farm Bundle','Sichuan Hydropower CDM','Amazon REDD+ Conservation','Rift Valley Geothermal','Sumatra Biogas Recovery','Mekong Solar Irrigation','Yucatan Landfill Gas','Dhaka Cookstoves Programme','Antioqu` |
| `price` | `base + sr(i * 7 + 3) * range;` |
| `annualER` | `5000 + sr(i * 11 + 2) * 195000;` |
| `creditingYrs` | `7 + Math.floor(sr(i * 5 + 1) * 14);` |
| `vintage` | `2016 + Math.floor(sr(i * 3 + 4) * 9);` |
| `issued` | `annualER * (1 + Math.floor(sr(i * 9 + 6) * 6)) * (0.88 + sr(i * 17 + 1) * 0.1);` |
| `TABS` | `['Portfolio Dashboard','ACM0002 Calculator','ACM0014 Waste Sector','AMS Small-Scale Suite','IPCC GWP & EFs','Vintage & Pricing','Monitoring Compliance','Registry & Issuance'];` |
| `fmt` | `(n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });` |
| `fmtM` | `n => `$${(n / 1e6).toFixed(2)}M`;` |
| `kpis` | `useMemo(() => { const totalER  = PROJECTS.reduce((s, p) => s + p.annualER_tCO2e, 0);` |
| `totalWgt` | `PROJECTS.reduce((s, p) => s + p.annualER_tCO2e * p.carbonPrice_USD, 0);` |
| `acm2` | `useMemo(() => { const beY = egY * efGrid;` |
| `erY` | `beY - peY - leY;` |
| `base` | `wasteTonnes * docFraction * DOCf * F * (16 / 12) * mcf * (1 - oxidFactor);` |
| `amsCalcs` | `useMemo(() => ({ amsID:   Math.max(0, amsEg * amsEf - 500), amsIIC:  Math.max(0, (amsBec - amsPec) * 0.00065 * amsHours), amsIIIF: amsAnimals * amsVs * amsB0 * amsMcf * 27.9 * 0.9 * 0.67 * 365 / 1000, }), [amsEg, amsEf, amsBec, amsPec, amsHours, amsAnimals, amsVs, amsB0, amsMcf]);` |
| `portfolioNPV` | `useMemo(() => PROJECTS.map(p => { let npv = 0;` |
| `totalNPV` | `portfolioNPV.reduce((s, p) => s + p.npv, 0);` |
| `efCm` | `parseFloat((wOm * countryEf.om + (1 - wOm) * countryEf.bm).toFixed(4));` |
| `monStatus` | `MON_CHECKS.map((_, ci) => sr(monIdx * 100 + ci) > 0.25);` |
| `pct` | `((row.ar6 / row.ar4 - 1) * 100).toFixed(1);` |
| `spot` | `parseFloat((d.p * (0.9 + sr(i * 7 + reg.length) * 0.2)).toFixed(2));` |
| `submitted` | `p.issuedCredits + p.pendingCredits;` |
| `verified` | `Math.round(submitted * (1 - p.uncertainty_pct / 100));` |
| `net` | `Math.round(verified  * (1 - p.uncertainty_pct / 200));` |
| `prefix` | ``${p.registry}-${p.vintageYear}-${p.id}`;` |
| `issuMo` | `String(Math.floor(sr(i * 59) * 12 + 1)).padStart(2,'0');` |
| `issuYr` | `2020 + Math.floor(sr(i * 53) * 6);` |
| `maxV` | `Math.max(...vintageByYear.map(([, v]) => v));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_DATA`, `GRID_EF`, `GWP_TABLE`, `METHODOLOGIES`, `MON_CHECKS`, `PROJ_NAMES`, `REGISTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDM Registered Projects | — | UNFCCC CDM Registry 2024 | CDM registered 8,200+ projects issuing 2.1Bn CERs — Africa 3%, Asia 82%, Latin America 14% |
| CER Current Price | — | ERCX Carbon Markets 2024 | CERs tradeable on secondary markets at $0.5–2/tCO2e — Article 6.4 mechanism successor prices $5–30 |
| TOOL07 Accuracy | — | CDM Methodological Tool TOOL07 v4 | TOOL07 combined margin method accuracy for grid emission factor — requires ≥3yr operating margin data |
- **National grid generation mix by fuel + output data** → TOOL07 combined margin EF → **Grid emission factor OM, BM, CM (tCO2e/MWh)**
- **Project metered generation data (MWh/yr)** → Emission reduction calculation → **Annual ER_y by project with uncertainty range**
- **CER/ERU/VCU registry price feeds** → Carbon revenue modelling → **Project carbon revenue NPV under spot and forward prices**

## 5 · Intermediate Transformation Logic
**Methodology:** CDM Emission Reduction
**Headline formula:** `ER_y = BE_y - PE_y - LE_y; BE_y = EG_y × EF_grid,y; EF_grid,y = (OM_y × w_OM + BM_y × w_BM) / (w_OM + w_BM)`

Baseline emissions (BE) computed using TOOL07 v4 combined margin; project emissions (PE) from TOOL07; leakage (LE) from displaced generation; OM/BM weighted by grid dispatch data

**Standards:** ['CDM EB47 Annex II — Combined Margin Methodology', 'IPCC AR6 GWP100 Values (CH4=27.9, N2O=273)', 'ACM0002 v20 Grid Electricity Methodology', 'TOOL07 v4 — Tool to Calculate the Emission Factor for an Electricity System']
**Reference documents:** UNFCCC CDM EB47 Annex II — Combined Margin Methodology (2009); CDM Methodology ACM0002 v20 — Consolidated Methodology for Grid-Connected Electricity; TOOL07 v4 — Tool to Calculate the Emission Factor for an Electricity System; IPCC AR6 GWP100 Table 7.SM.7 (2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful and detailed: the code implements CDM emission-reduction
calculators (ACM0002 grid electricity via TOOL07 combined-margin, ACM0014 waste-sector FOD, an
AMS small-scale suite), an IPCC GWP table (AR4/AR5/AR6), a grid-EF database, and a portfolio NPV. The
calculators are genuine CDM formulas; the 50-project portfolio is synthetic.

### 7.1 What the module computes

**ACM0002 grid electricity** (`acm2`):
```
BE_y = EG_y · EF_grid                       // baseline emissions
ER_y = BE_y − PE_y − LE_y                    // net emission reduction
EF_grid (combined margin) = w_OM·OM + (1−w_OM)·BM
```

**ACM0014 / waste (FOD baseline)** — the IPCC first-order landfill methane:
```
base = wasteTonnes · DOC · DOCf · F · (16/12) · MCF · (1 − oxidFactor)
```

**AMS small-scale suite** (`amsCalcs`):
```
amsID   = max(0, EG · EF − 500)                              // I.D grid renewable, minus baseline
amsIIC  = max(0, (BEC − PEC) · 0.00065 · hours)              // II.C demand-side EE
amsIIIF = animals · VS · B0 · MCF · 27.9 · 0.9 · 0.67 · 365 / 1000   // III.F manure methane
```

**Registry issuance netting:** `verified = submitted·(1−unc%)`, `net = verified·(1−unc%/2)`.

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| GWP100 (AR6) | CH₄ 27.9, N₂O 273 | `GWP_TABLE` — code/guide cite IPCC AR6 (note: 27.9, biogenic-inclusive) |
| Grid EF OM/BM/CM | India 0.820/0.740/0.780, China 0.680/0.610/0.650, Brazil 0.140/0.120/0.130 tCO₂/MWh | `GRID_EF` — realistic 2022 combined-margin values |
| Combined-margin weights | w_OM user-set (default 0.5/0.5) | CDM TOOL07 (0.5/0.5 for wind/solar) |
| FOD factors (DOC, DOCf, F 0.5, 16/12, MCF, oxid) | user-set | IPCC 2019 Waste |
| Registry price bands | CDM $2–3, GS $15–20, VCS $8–10 | `REG_PRICE` — realistic VCM/CER spot |
| 50 `PROJECTS` (ER, price, DQ, issued) | `sr()`-seeded | **Synthetic** PRNG demo data |

### 7.3 Calculation walkthrough

ACM0002 multiplies annual generation by a combined-margin grid EF (user-weighted OM/BM), then nets
project and leakage emissions. The country grid-EF row supplies OM/BM/CM. The waste calculator runs
the IPCC FOD baseline. The AMS suite computes three small-scale methodologies from their respective
inputs. The GWP tab shows AR4→AR6 percentage shifts (`(ar6/ar4−1)·100`). The portfolio NPV discounts
each project's carbon revenue over its crediting period. Monitoring-compliance status is `sr()`-gated.

### 7.4 Worked example (ACM0002, Indian wind farm)

`EG_y = 300,000 MWh`, India combined-margin EF (w_OM=0.75 for wind per TOOL07):
`EF_grid = 0.75·0.820 + 0.25·0.740 = 0.800 tCO₂/MWh`.

| Step | Computation | Result |
|---|---|---|
| Baseline BE_y | 300,000·0.800 | 240,000 tCO₂e |
| Project PE_y (wind ≈ 0) | — | ~0 |
| Leakage LE_y | ~0 | ~0 |
| **ER_y** | 240,000 − 0 − 0 | **240,000 tCO₂e/yr** |
| Carbon revenue (CER $2.5) | 240,000·2.5 | $600,000/yr |
| NPV (7 yr, ~5% disc, annuity 5.79) | 600,000·5.79 | ≈ **$3.47M** |

The ER matches the CDM ACM0002 baseline-minus-project logic exactly; the low CER price reflects the
guide's noted $0.5–2/tCO₂e CDM spot reality.

### 7.5 Data provenance & limitations
- Grid-EF and GWP tables are **real reference data**; the 50-project portfolio and monitoring status
  are **synthetic `sr()`-seeded** demo data.
- Combined margin is a user-weighted OM/BM, not a data-derived dispatch-based OM (TOOL07's "simple
  OM" vs "dispatch data OM"); build margin is a single value, not a 5-most-recent-capacity sample.
- No vintage-specific EF decay, no suppressed-demand adjustment for AMS methodologies, and leakage is
  user-entered rather than modelled.

**Framework alignment:** **CDM ACM0002 v20** (grid-connected electricity) and **TOOL07 v4**
(combined-margin grid EF) — the `w_OM·OM + (1−w_OM)·BM` structure is TOOL07's core. **CDM EB47 Annex
II** defines the combined-margin method. **IPCC AR6 GWP100** populates the GWP table. **AMS-I.D /
II.C / III.F** small-scale methodologies are implemented in `amsCalcs`. The Article 6.4 successor
(higher $5–30 prices noted in the guide) is referenced but not modelled.

## 9 · Future Evolution

### 9.1 Evolution A — Article 6.4 transition layer with published grid EFs (analytics ladder: rung 1 → 3)

**What.** §7 confirms genuine CDM formula implementations — ACM0002 via TOOL07
combined margin, an ACM0014/FOD waste baseline, the AMS small-scale suite, a real
AR4/AR5/AR6 GWP table — with only the 50-project portfolio synthetic. Two honest
limits: the 21-row `GRID_EF` seed is a static snapshot (grid EFs are the module's
single most consequential input), and the CDM is transitioning to the Article 6.4
mechanism (A6.4ERs), which changes crediting-period rules and applies corresponding
adjustments. Evolution A grounds the grid EFs in the published UNFCCC/IFI harmonized
dataset with vintage tracking, and adds the 6.4 transition math: crediting-period
eligibility per the CMA rules, host-country corresponding-adjustment flags, and the
CER→A6.4ER label distinction in the registry-netting path (`verified = submitted·(1−unc)`).

**How.** (1) `ref_grid_ef_cdm(country, om, bm, cm, source, vintage)` refdata table
replacing the seed; each calculation displays its EF source and year. (2) Transition
rules as a deterministic eligibility function (activity type, registration date,
crediting-period end) sourced to the A6.4 rulebook in §5's reference lineage.
(3) Bench-pin the three calculator families (ACM0002, FOD, AMS trio) with worked
examples from the actual UNFCCC methodology documents — making this a calibration
anchor for the platform's other CDM-adjacent modules.

**Prerequisites.** The AMS-I.D hard-coded `−500` baseline constant needs a documented
justification or parameterisation; guide already faithful, so no mismatch to clear.
**Acceptance:** UNFCCC worked-example inputs reproduce published ER_y within rounding;
an activity past its crediting window is flagged ineligible with the rule cited.

### 9.2 Evolution B — Methodology-selection analyst (LLM tier 2)

**What.** The module already spans multiple methodologies, making "which methodology
fits my project?" its natural LLM question. A tier-2 assistant interviews the user
(sector, scale, host country), recommends ACM0002 vs AMS-I.D vs III.F with the
size-threshold rules cited, then executes the chosen calculator with the user's
parameters — client-side tool calls over `acm2`, the FOD function, and `amsCalcs`,
since this is a frontend-computed module with no API routes.

**How.** Tool schemas for the three calculator families plus the GWP-table lookup;
per the tier-2 no-fabrication contract, every ER_y, BE_y, and CER figure in an answer
must match a logged invocation; methodology-rule citations come from the §5 reference
corpus (ACM0002 v20, TOOL07 v4, EB47 Annex II).

**Prerequisites.** Evolution A's EF sourcing, so recommendations cite real
country factors; small-scale threshold rules (15MW etc.) encoded, not recalled.
**Acceptance:** a recommendation names the binding eligibility rule; the subsequent
calculation reproduces the page's output for identical inputs; price questions answer
only from the seeded curves, labelled as illustrative.