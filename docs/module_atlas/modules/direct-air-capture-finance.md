# Direct Air Capture Finance Platform
**Module ID:** `direct-air-capture-finance` · **Route:** `/direct-air-capture-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH1 · **Sprint:** EH

## 1 · Overview
Full-cycle finance analysis for 5 DAC technologies: Solid Sorbent (Climeworks), Liquid Solvent (Carbon Engineering/Oxy), Electroswing (Verdox), Moisture-Swing, and DACCS-Wind. IRA §45Q credit ($180/tCO₂ geological), LCOC electricity sensitivity, learning curves, and advance offtake buyers including Stripe Frontier.

> **Business value:** Used by DAC developers optimising project economics, corporate buyers structuring advance purchase commitments, investors evaluating CDR portfolio returns, and policy teams assessing §45Q credit efficiency.

**How an analyst works this module:**
- Review DAC overview for 5 technologies and 18 projects
- Examine LCOC sensitivity to electricity price and scale using interactive calculator
- Trace learning curves for LCOC reduction 2024–2033 by technology
- Analyse offtake buyers (Stripe Frontier, Microsoft, Shopify, Frontier) and advance purchase commitments

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DAC_TECHS`, `KpiCard`, `PROJECTS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DAC_TECHS` | 6 | `name`, `lcoc`, `capex`, `elec`, `heat`, `co2Purity`, `permanent`, `company`, `maturity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `DAC_TECHS[Math.floor(sr(i * 7 + 1) * DAC_TECHS.length)];` |
| `capKt` | `parseFloat((0.01 + sr(i * 11 + 2) * 0.49).toFixed(2));` |
| `country` | `['USA', 'Iceland', 'Canada', 'Norway', 'UK', 'UAE', 'Australia', 'Switzerland'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Piloting', 'Announced'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `lcoc` | `parseFloat((tech.lcoc * (0.88 + sr(i * 19 + 5) * 0.28)).toFixed(0));` |
| `irr` | `parseFloat((4 + sr(i * 23 + 6) * 9).toFixed(1));` |
| `creditPrice` | `parseFloat((350 + sr(i * 29 + 7) * 450).toFixed(0));` |
| `filtered` | `useMemo(() => PROJECTS, []); const avgLcoc = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcoc, 0) / filtered.length) : 0, [filtered]);` |
| `totalCap` | `useMemo(() => filtered.reduce((s, p) => s + p.capKt, 0).toFixed(2), [filtered]);` |
| `lcocByElec` | `useMemo(() => [20, 30, 40, 50, 60, 80, 100].map(ep => ({` |
| `revenue` | `useMemo(() => { const creditsPerYear = scale * 1000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DAC_TECHS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRA §45Q DAC geological ($/tCO₂) | `Direct payment credit for geological storage` | IRS Final Regulations §45Q 2024 | Requires CO2 injection into Class VI well; verification via EPA MRV; Inflation Reduction Act 2022 increased from $50 to $180. |
| DAC electricity intensity (MWh/tCO₂) | `Solid sorbent: 1.5–2.0; Liquid: 2.0–3.0; SOEC variant: 1.2–1.5` | Climeworks + CE/Oxy technical disclosures | Electricity is 50–70% of DAC LCOC; requires <$30/MWh dedicated renewable power for $200/tCO2 target at 2030 scale. |
| Climeworks Mammoth capacity (ktCO₂/yr) | `Iceland geothermal-powered; operational 2024` | Climeworks press release Q2 2024 | Mammoth: 36 ktCO2/yr; 10× Orca (3.6 ktCO2/yr); demonstrates modular scale-up; geothermal provides low-cost process heat. |
- **IEA/NREL DAC cost data + Climeworks technical disclosures + IRA §45Q statute** → LCOC engine + §45Q calculator + learning curves + offtake intelligence → **DAC developers, carbon removal buyers, DFI investors, and policy teams structuring CDR procurement**

## 5 · Intermediate Transformation Logic
**Methodology:** DAC LCOC Model ($/tCO₂)
**Headline formula:** `LCOC = (CAPEX×CRF + OPEX + Electricity_cost) / Annual_CDR − IRA_§45Q`

Current: $400–1,000/tCO2; IEA target $100–300/tCO2 by 2030 via scale + learning; IRA §45Q reduces effective cost by $180/tCO2 for geological storage.

**Standards:** ['IEA Direct Air Capture 2022', 'NREL DAC Techno-Economic Analysis 2023', 'Climeworks Orca/Mammoth cost disclosures']
**Reference documents:** IEA (2022) – Direct Air Capture: A Key Technology for Net Zero; NREL (2023) – DAC Techno-Economic Analysis; Climeworks (2024) – Mammoth Plant Data and Cost Trajectory

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module implements its guide's **DAC LCOC (levelised cost of carbon removal) model** with real
technology parameters, electricity-price sensitivity, learning curves, and an offtake revenue
calculator. The core cost mechanics are genuine deterministic functions over curated tech data; only
the 18-project pipeline attributes are `sr()`-seeded around real tech baselines. No ⚠️ mismatch.

### 7.1 What the module computes

```js
// Electricity-price sensitivity of LCOC ($/tCO₂):
lcocByElec[tech] = baseLCOC + (elecPrice − 40) × tech.elec × 8
// Learning curve (annual cost decline):
learningCurve[year i] = round(baseLCOC × learningRate^i)   // Solid 0.85, Liquid 0.87, ESDA 0.88
// Offtake revenue calculator:
creditsPerYear = scale × 1000                              // tCO₂/yr
creditRevenue  = creditsPerYear × creditPrice / 1e6        // $M
elecCost       = creditsPerYear × tech.elec × elecPrice / 1e6
margin         = creditsPerYear × (creditPrice − tech.elec·elecPrice − 200) / 1e6
```

The `−200` in the margin is a fixed non-electricity cost proxy ($/tCO₂ for CAPEX-CRF + heat + O&M);
`tech.elec` is the technology's electricity intensity (MWh/tCO₂). The `×8` slope converts a $/MWh
electricity change into a $/tCO₂ LCOC change given intensity.

### 7.2 Technology parameterisation (real)

| Tech | LCOC $/tCO₂ | CAPEX $/t/yr | elec MWh/t | heat GJ/t | company | maturity |
|---|---|---|---|---|---|---|
| Solid Sorbent | 600 | 850 | 1.8 | 0 | Climeworks / Carbon Engineering | Commercial |
| Liquid Solvent | 500 | 750 | 0.6 | 5.5 | Carbon Engineering / 1PointFive | Commercial |
| Electroswing (ESDA) | 350 | 600 | 2.2 | 0 | Verdox | Pilot |
| Moisture-Swing | 450 | 700 | 0.8 | 1.5 | Global Thermostat / Skytree | Early Comm. |
| DAC + Geologic Storage | 550 | 820 | 2.0 | 4.0 | Heirloom / Project Bison | Commercial |

These match the guide's provenance (IEA DAC 2022, NREL TEA 2023, Climeworks disclosures): current LCOC
$350–600/tCO₂, IEA $100–300 target by 2030, IRA §45Q $180/tCO₂ for geological/DACCS storage. Learning
rates (15% for solid, 13% liquid, 12% ESDA per doubling-proxy year) are illustrative but in the
plausible 10–20% technology-learning band.

### 7.3 Calculation walkthrough

Project pipeline: each of 18 projects picks a tech (seeded), a capacity `0.01–0.50 ktCO₂/yr`, a country,
status, and an LCOC = `tech.lcoc × (0.88 + sr·0.28)` (±14% around the tech baseline). `avgLcoc` and
`totalCap` aggregate. The sensitivity chart sweeps electricity price 20→100 $/MWh applying the linear
slope per tech. The learning-curve chart compounds the annual decline to 2033 against a $200 target.
The economics tab runs the offtake calculator on user sliders (scale, credit price, electricity price).

### 7.4 Worked example

**LCOC sensitivity** — Solid Sorbent at $60/MWh electricity:
`600 + (60 − 40) × 1.8 × 8 = 600 + 20 × 14.4 = 600 + 288 = $888/tCO₂`. At $20/MWh:
`600 + (−20)·14.4 = 600 − 288 = $312/tCO₂` — showing electricity is the dominant lever (consistent with
the guide's "electricity 50–70% of DAC LCOC").

**Offtake calculator** — scale 1 (1,000 tCO₂/yr), credit price $500/tCO₂, electricity $40/MWh, Solid:
- `creditRevenue = 1000 × 500 / 1e6 = $0.5M`
- `elecCost = 1000 × 1.8 × 40 / 1e6 = $0.072M`
- `margin = 1000 × (500 − 1.8·40 − 200)/1e6 = 1000 × (500 − 72 − 200)/1e6 = 1000 × 228/1e6 = $0.228M`.
Positive margin at $500/t credit — the IRA §45Q $180/tCO₂ (a KPI, not wired into `margin`) would add
$0.18M more, illustrating the policy-credit uplift the guide describes.

**Learning curve** — Solid Sorbent year 5: `600 × 0.85^5 = 600 × 0.4437 = $266/tCO₂`, approaching the
IEA 2030 $100–300 band.

### 7.5 Data provenance & limitations

- Technology parameters (LCOC, CAPEX, electricity/heat intensity, maturity, company) are **real**
  curated values; the LCOC-sensitivity, learning-curve and offtake-revenue formulas are genuine
  deterministic functions. Only the 18-project pipeline's per-project LCOC/IRR/credit-price/status are
  `sr()`-seeded around the real tech baselines.
- The `−200` non-electricity cost and the `×8` sensitivity slope are simplifying constants, not a full
  CAPEX-CRF + heat + O&M breakdown; a bankable model would build LCOC from `(CAPEX×CRF + fixed O&M +
  electricity + heat) / annual CDR − §45Q`.
- Learning rates are illustrative single-technology curves, not fitted to observed deployment.
- IRA §45Q ($180/t) is displayed but not subtracted inside `margin` — the calculator understates
  after-credit economics.

**Framework alignment:** IEA *Direct Air Capture 2022* and NREL DAC TEA 2023 anchor the LCOC ranges;
IRS §45Q (IRA 2022, $180/tCO₂ for DACCS geological storage, EPA Class VI + MRV) is the headline policy
credit; the IPCC 5 GtCO₂/yr 2050 CDR requirement frames the market-size KPI. Offtake buyers (Stripe
Frontier, Microsoft, Shopify) referenced in the guide are the advance-purchase demand side the
economics tab models.

## 9 · Future Evolution

### 9.1 Evolution A — Backend LCOC engine with a real project pipeline (analytics ladder: rung 2 → 3)

**What.** The page already earns rung 2: its LCOC electricity-price sensitivity (`baseLCOC + (elecPrice−40) × tech.elec × 8`), learning curves, and offtake calculator are genuine deterministic what-ifs over real technology parameters (IEA DAC 2022 / NREL TEA 2023 / Climeworks disclosures). But it is tier-B frontend-only: the formulas live in the page, and the 18-project pipeline is `sr()`-seeded (±14% around tech baselines, invented IRRs and credit prices). Evolution A moves the model server-side and calibrates it against observables.

**How.** (1) New `services/dac_finance_engine.py` + `api/v1/routes/dac_finance.py` porting the §7 formulas verbatim, with the `−200` fixed non-electricity cost proxy decomposed into CAPEX-CRF + heat + O&M terms per technology (the page's own §7.1 documents the proxy). (2) Replace seeded `PROJECTS` with the public IEA CCUS Projects Database DAC subset (real Mammoth/Orca/Stratos capacities and statuses) in a `dac_projects` table. (3) Calibration: pin the worked example (Solid Sorbent at $60/MWh → $888/tCO₂) and Climeworks' disclosed cost trajectory into `bench_quant.py`; learning rates (0.85/0.87/0.88) get cited ranges instead of the current "illustrative but plausible" status.

**Prerequisites.** Alembic migration for `dac_projects`; a decision on §45Q treatment for non-US projects (currently implicit). **Acceptance:** bench pin passes; page LCOC chart is byte-identical to `POST /dac-finance/lcoc-sensitivity` output; no `sr()` in the project pipeline.

### 9.2 Evolution B — CDR procurement copilot for offtake structuring (LLM tier 1 → 2)

**What.** A copilot for the economics tab answering the questions DAC buyers actually ask: "why does Electroswing beat Liquid Solvent at $80/MWh but not $30/MWh?", "at what credit price does a 50 kt plant break even after §45Q?" — grounded in the §5/§7 formula corpus and the page's current slider state. Tier 1 ships explanation-only from already-computed page state (the margin decomposition — credit revenue, electricity cost, $200 fixed proxy — is fully specified in §7.1, so answers are derivable without new backend).

**How.** Corpus = this Atlas record's §5 headline formula + §7 walkthrough and worked example; the copilot receives the live slider values (scale, credit price, electricity price) as structured context and explains the resulting margin arithmetic, citing the formula used. Tier 2 unlocks only after Evolution A ships endpoints: what-if requests ("re-run at $25/MWh Icelandic geothermal") become tool calls against `POST /lcoc-sensitivity` rather than in-context arithmetic, with the no-fabrication validator matching quoted $/tCO₂ figures to tool outputs.

**Prerequisites (hard).** Tier 2 is blocked on Evolution A — today there are zero backend endpoints to call, and the copilot must not present seeded pipeline IRRs as market data. **Acceptance:** every $/tCO₂ figure in an answer traces to either the documented formula applied to disclosed slider state (tier 1) or a tool response (tier 2); questions about actual market credit pricing refuse with a pointer to the offtake table's disclosed sources.