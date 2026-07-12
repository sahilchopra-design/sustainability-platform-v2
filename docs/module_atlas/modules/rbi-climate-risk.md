# RBI Climate Risk Directions 2025
**Module ID:** `rbi-climate-risk` · **Route:** `/rbi-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-IN1 · **Sprint:** IN

## 1 · Overview
India-specific climate risk compliance module implementing RBI's Climate Risk and Sustainable Finance Directions 2025 for all Scheduled Commercial Banks, Small Finance Banks, AIFIs, and Top/Upper Layer NBFCs. Covers CRAR capital adequacy (9% CET1 vs Basel 8%), D-SIB buffers, NGFS scenario analysis with India-specific GDP/carbon price paths, financed emissions attribution using CEA grid factors, physical risk exposure across 15 Indian states, and BRSR Core alignment with ESRS crosswalk.

> **Business value:** This module is essential for every Indian bank, NBFC, and financial institution navigating RBI's mandatory climate risk integration requirements. It provides: (1) A compliance checklist mapped to RBI's 4-pillar framework with 25 sub-requirements; (2) India-specific capital adequacy modeling using CRAR 9% CET1 with D-SIB surcharges; (3) NGFS scenario analysis calibrated for India's GDP, carbon price, and energy transition trajectory; (4) Lending book emissions attribution using official CEA grid emission factors; (5) Physical risk exposure mapping across Indian states; (6) BRSR Core alignment tracking for the 15 mandatory assurance KPIs.

**How an analyst works this module:**
- Start at Compliance Dashboard to see which banks are in scope and their current readiness status
- Climate Risk Framework tab shows the 25 sub-requirements across 4 RBI pillars — use as a compliance checklist
- CRAR & Capital tab models Indian bank capital with RBI 9% CET1 minimum and D-SIB buffers — use the carbon price slider to stress-test
- NGFS Scenarios tab runs 6 scenarios with India-specific GDP, carbon price, and temperature paths
- Financed Emissions tab computes bank lending book emissions by sector using CEA grid factors
- Physical Risk tab maps bank exposure across 15 Indian states with flood, cyclone, heatwave, drought hazards
- BRSR Core Alignment tab maps 15 mandatory BRSR KPIs to ESRS with assurance readiness percentage
- Disclosure Timeline tab tracks phased requirements from FY 2025-26 through FY 2028-29

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_REQ_ITEMS`, `BANKS`, `BANK_NAMES`, `BANK_TYPES`, `DISCLOSURE_PHASES`, `LENDING_SECTORS`, `NGFS_SCENARIOS`, `PHYSICAL_STATES`, `RBI_PILLARS`, `SECTOR_EF`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RBI_PILLARS` | 31 | `items`, `id`, `req`, `mandatory` |
| `NGFS_SCENARIOS` | 7 | `name`, `type`, `carbonPrice2030`, `carbonPrice2050`, `gdpImpact2050`, `tempTarget`, `description` |
| `DISCLOSURE_PHASES` | 5 | `milestone`, `items`, `color` |
| `PHYSICAL_STATES` | 16 | `flood`, `cyclone`, `heatwave`, `drought` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => typeof v === 'number' ? (v >= 1e9 ? (v/1e9).toFixed(1)+'B' : v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toFixed(1)) : v;` |
| `pct` | `(n, d) => d > 0 ? +((n / d) * 100).toFixed(1) : 0;` |
| `guard` | `(n, d, fb = 0) => d > 0 ? n / d : fb;` |
| `BANKS` | `BANK_NAMES.map((name, i) => {` |
| `totalAssets_cr` | `Math.round(200000 + sr(s) * 4500000);` |
| `cet1` | `+(9.5 + sr(s + 1) * 6).toFixed(2);` |
| `at1` | `+(1.0 + sr(s + 2) * 2).toFixed(2);` |
| `tier2` | `+(1.5 + sr(s + 3) * 3).toFixed(2);` |
| `crar` | `+(cet1 + at1 + tier2).toFixed(2);` |
| `npa_pct` | `+(isPSB ? 2.5 + sr(s + 4) * 6 : 0.8 + sr(s + 4) * 2.5).toFixed(2);` |
| `lendingBook_cr` | `Math.round(totalAssets_cr * (0.55 + sr(s + 5) * 0.15));` |
| `financedEmissions_mtco2` | `+(lendingBook_cr * 0.000012 * (0.6 + sr(s + 6) * 0.8)).toFixed(2);` |
| `climateRiskIntegration` | `Math.round(30 + sr(s + 7) * 60);` |
| `brsrReady` | `Math.round(40 + sr(s + 8) * 55);` |
| `ngfsScenarios` | `Math.floor(2 + sr(s + 9) * 5);` |
| `governanceScore` | `Math.round(35 + sr(s + 10) * 55);` |
| `strategyScore` | `Math.round(30 + sr(s + 10) * 60);` |
| `riskMgmtScore` | `Math.round(25 + sr(s + 11) * 65);` |
| `metricsScore` | `Math.round(20 + sr(s + 12) * 65);` |
| `disclosureComposite` | `Math.round(guard(governanceScore + strategyScore + riskMgmtScore + metricsScore, 4));` |
| `pslExposure_cr` | `Math.round(lendingBook_cr * (0.38 + sr(s + 13) * 0.06));` |
| `powerSectorExp_pct` | `+(12 + sr(s + 14) * 18).toFixed(1);` |
| `steelCementExp_pct` | `+(4 + sr(s + 15) * 10).toFixed(1);` |
| `oilGasExp_pct` | `+(3 + sr(s + 16) * 8).toFixed(1);` |
| `reSectorExp_pct` | `+(2 + sr(s + 17) * 6).toFixed(1);` |
| `transportExp_pct` | `+(3 + sr(s + 18) * 7).toFixed(1);` |
| `realEstateExp_pct` | `+(8 + sr(s + 19) * 12).toFixed(1);` |
| `pcafDqs` | `+(1 + sr(s + 20) * 3.5).toFixed(1);` |
| `floodExp_pct` | `+(5 + sr(s + 21) * 25).toFixed(1);` |
| `cycloneExp_pct` | `+(2 + sr(s + 22) * 15).toFixed(1);` |
| `heatwaveExp_pct` | `+(8 + sr(s + 23) * 20).toFixed(1);` |
| `droughtExp_pct` | `+(3 + sr(s + 24) * 18).toFixed(1);` |
| `physicalRiskComposite` | `+((+floodExp_pct + +cycloneExp_pct + +heatwaveExp_pct + +droughtExp_pct) / 4).toFixed(1);` |
| `brsrCoreKpis` | `Math.floor(7 + sr(s + 25) * 9);` |
| `assuranceReady_pct` | `Math.round(20 + sr(s + 26) * 70);` |
| `disclosureYear` | `sr(s + 27) > 0.5 ? 'FY 2025-26' : 'FY 2026-27';` |
| `climateAddon_bps` | `Math.round(10 + sr(s + 28) * 80);` |
| `SECTOR_EF` | `[0.82, 1.95, 2.10, 0.45, 0.22, 0.35, 0.28, 0.65]; // tCO2e per crore lending` |
| `complianceChartData` | `useMemo(() => [...filteredBanks].sort((a, b) => b.disclosureComposite - a.disclosureComposite) .map(b => ({ name: b.name.length > 15 ? b.name.slice(0, 15) + '..' : b.name, score: b.disclosureComposite, type: b.type })), [filteredBanks]);` |
| `crarWaterfall` | `useMemo(() => [...filteredBanks].sort((a, b) => b.totalAssets_cr - a.totalAssets_cr).slice(0, 10).map(b => ({ name: b.name.length > 12 ? b.name.slice(0, 12) + '..' : b.name, CET1: b.cet1, AT1: b.at1, Tier2: b.tier2, CRAR: b.crar, climateAddon: b.climateAddon_bps / 100, })), [filteredBanks]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BANK_NAMES`, `BANK_TYPES`, `DISCLOSURE_PHASES`, `LENDING_SECTORS`, `NGFS_SCENARIOS`, `PHYSICAL_STATES`, `RBI_PILLARS`, `SECTOR_EF`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Banks in Scope | — | RBI Directions 2025 | All Scheduled Commercial Banks, Small Finance Banks (separate directions), All India Financial Institutions, Top/Upper Layer NBFCs |
| CRAR Minimum | — | RBI Master Circular | India: 9% CET1 vs Basel: 8% — 100bps higher minimum for Indian banks |
| D-SIB Banks | — | RBI D-SIB Framework | SBI: 0.6% surcharge, HDFC Bank: 0.4%, ICICI Bank: 0.4% |
| Compliance Deadline | — | RBI | Climate risk integration into existing risk management frameworks mandatory from FY 2025-26 |
| CEA Grid Factor | — | CEA v19 | 22 state-level grid factors from 0.10 (Sikkim/hydro) to 0.90 (Jharkhand/coal) |
| BRSR Core KPIs | — | SEBI | Assurance required for top 500 companies FY 2025-26; mapped to ESRS E1-E5, S1, G1 |
- **Bank lending book by sector + CEA grid factors** → PCAF financed emissions calculation → **Attributed Scope 1+2 emissions for the lending portfolio**
- **NGFS scenario parameters (India-specific)** → Climate stress test engine → **Portfolio loss, VaR, capital impact under 6 scenarios**
- **State-level physical hazard data** → Physical risk aggregation → **Bank branch and borrower exposure by flood/cyclone/heatwave/drought**
- **BRSR Core 15 KPIs + ESRS crosswalk** → Compliance gap analysis → **Assurance readiness % and disclosure completeness**

## 5 · Intermediate Transformation Logic
**Methodology:** RBI CRAR Capital Framework + NGFS India Scenario Engine
**Headline formula:** `CRAR = (CET1 + AT1 + Tier2) / RWA_climate_adjusted; Climate_Addon = Σ(sector_exposure × climate_multiplier)`

The module implements RBI's four-pillar climate risk framework (Governance, Strategy, Risk Management, Metrics & Targets) with India-specific capital calculations. CRAR uses RBI's 9% CET1 minimum (vs Basel 8%) with D-SIB surcharges for SBI (0.6%), HDFC Bank (0.4%), ICICI Bank (0.4%). Climate risk add-on computed from sector-level exposure weighted by emission intensity and transition risk multiplier. Physical risk modeled across 15 Indian states for flood, cyclone, heatwave, and drought using state-level vulnerability indices.

**Standards:** ['RBI Climate Risk Directions 2025', 'RBI Master Circular on Basel III Capital (CRAR)', 'NGFS Phase IV Scenarios', 'CEA CO2 Baseline Database v19', 'SEBI BRSR Core Framework']
**Reference documents:** RBI Directions on Climate Risk and Sustainable Finance, 2025; RBI Master Circular on Basel III Capital Regulations (CRAR); RBI Framework for D-SIBs (Domestic Systemically Important Banks); RBI Directions on Climate Risk for Small Finance Banks, 2025; SEBI BRSR Core Framework — Circular SEBI/HO/CFD/CFD-SEC-2/P/CIR/2023/122; CEA CO2 Baseline Database for Indian Power Sector v19 (2024); NGFS Climate Scenarios Phase IV (January 2025)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module operationalises the **RBI's climate-risk and disclosure framework for Indian banks**. It
combines genuinely accurate reference/regulatory content (RBI Directions 2025 pillars, phased
disclosure timeline, NGFS-India scenarios, imported CEA grid factors, BRSR mapping) with a
**synthetic panel of 20 real Indian banks** whose quantitative metrics (CRAR components, financed
emissions, physical risk, climate capital add-on) are `sr()`-seeded heuristics. The Basel capital
identity is correct; the financed-emissions and capital-add-on numbers are not modelled.

### 7.1 What the module computes

**Capital adequacy** (correct Basel III identity), seed `s = i·47+11`:

```js
crar = cet1 + at1 + tier2                       // CET1 + AT1 + Tier2 = total CRAR (%)
npa_pct = PSB ? 2.5 + sr(s+4)·6 : 0.8 + sr(s+4)·2.5   // seeded, PSB-vs-private tiered
lendingBook_cr = totalAssets_cr × (0.55 + sr(s+5)·0.15)
```

**Financed emissions** (flat intensity heuristic, not PCAF attribution):

```js
financedEmissions_mtco2 = lendingBook_cr × 0.000012 × (0.6 + sr(s+6)·0.8)
```

i.e. ≈12 tCO₂e per ₹Cr of lending book × a random 0.6–1.4 factor — **no borrower emissions, no
EVIC/attribution, no sector split**.

**Disclosure composite** (mean of four TCFD-pillar sub-scores, each seeded):

```js
disclosureComposite = round( (governance + strategy + riskMgmt + metrics) / 4 )
```

**Physical risk composite** (mean of four India hazards):

```js
physicalRiskComposite = (flood% + cyclone% + heatwave% + drought%) / 4
```

**NGFS scenario cost impact** (transition proxy): `costImpact_cr = financedEmissions × carbonPrice2030 × 10`.
**Climate capital add-on** = seeded `climateAddon_bps = 10 + sr(s+28)·80` (10–90 bps) — a stand-in,
not derived from RWA or scenario loss.

### 7.2 Parameterisation / provenance

| Quantity | Value | Provenance |
|---|---|---|
| 20 bank names / types | SBI, HDFC, ICICI… + PSB/DSIB tags | **real** (correct DSIB flags) |
| RBI Directions 2025 pillars | Governance/Strategy/Risk/Metrics items | **real** regulatory content |
| Disclosure timeline (4 phases) | FY25-26 → FY28-29 | **real** (accurate phasing) |
| NGFS-India scenarios (6) | carbon prices, GDP impact, temp targets | **real/accurate** (India NDC framing) |
| CEA grid EF | `CEA_NATIONAL_GRID_EF[2024]` | **real** (Central Electricity Authority) |
| PAT benchmarks, BRSR mapping | imported | **real** reference data |
| CRAR (CET1/AT1/Tier2) | seeded ranges | synthetic; **correct identity** |
| Financed emissions | `lendingBook × 1.2e-5 × sr` | **synthetic heuristic** |
| Climate add-on bps | `10 + sr()·80` | **synthetic** |
| Physical hazard % | seeded ranges | synthetic |

### 7.3 Calculation walkthrough

1. `BANKS` seeds 20 banks; CRAR = CET1+AT1+Tier2; NPA tiered by ownership.
2. Financed emissions from lending-book intensity heuristic; PCAF DQ score seeded.
3. Disclosure and physical-risk composites = means of seeded sub-scores/hazards.
4. NGFS tab joins each bank's financed emissions to the real scenario carbon prices → cost impact.
5. Compliance tab checks against the real RBI Directions 2025 pillars; timeline tab shows the real
   phased rollout.

### 7.4 Worked example (one bank)

Bank with `totalAssets = ₹800,000 Cr`, seeded `cet1 = 12.5`, `at1 = 1.5`, `tier2 = 2.5`:
`crar = 12.5 + 1.5 + 2.5 = 16.5%` (above RBI's ~11.5% incl. CCB). Lending book `= 800,000 × (0.55 +
sr·0.15) ≈ ₹480,000 Cr`. Financed emissions `= 480,000 × 0.000012 × 1.0 ≈ 5.76 MtCO₂e`. Under **Net
Zero 2050 Global** (carbonPrice2030 = ₹130/tCO₂): `costImpact = 5.76 × 130 × 10 = ₹7,488 Cr` proxy.
The arithmetic flows correctly, but the 5.76 Mt is a flat-intensity guess, not a bottom-up PCAF figure.

### 7.5 Data provenance & limitations

- **Regulatory content and scenario data are real and accurate**; the **bank-level quantitatives are
  synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **Financed emissions are a flat lending-book intensity** (≈12 tCO₂e/₹Cr) — not PCAF: no borrower
  Scope 1/2, no attribution, no sector split. Imported PAT/CEA factors are not used in the FE figure.
- **Climate capital add-on is a seeded 10–90 bps**, not derived from climate-stressed RWA or scenario
  loss — so it cannot inform a real ICAAP.
- Physical-risk and disclosure composites are unweighted means of seeded inputs; the `isDSIB` flag is
  tracked but does not adjust the CRAR pass/fail threshold.
- CRAR identity is correct but components are drawn, not from bank filings.

**Framework alignment:** **RBI Disclosure framework on Climate-related Financial Risks (2024/25)** —
the pillar structure (Governance, Strategy, Risk Management, Metrics & Targets) follows TCFD, as does
the phased rollout by bank size. **Basel III** (CRAR = CET1+AT1+Tier2; India min ~11.5% incl. 2.5%
CCB, +DSIB surcharge). **NGFS Phase IV** scenarios (Net Zero / Below 2 °C / Delayed / Divergent /
Current Policies — correctly ordered; India Net-Zero-2070/NDC framing). **PCAF** (referenced for
financed emissions, not implemented). **SEBI BRSR Core** (top-1000 listed firms). The regulatory
scaffolding is faithful; the financed-emissions and capital-add-on quantities need §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (Scopes financed emissions and the
climate-capital add-on; CRAR identity and regulatory content are already sound.)

**8.1 Purpose & scope.** Produce PCAF-aligned financed emissions and a climate-stressed capital add-on
for Indian scheduled commercial banks, supporting RBI disclosure and ICAAP. Coverage: the bank lending
book by sector and counterparty.

**8.2 Conceptual approach.** (i) **PCAF Part-A financed emissions** (business loans / listed equity),
the RBI-referenced standard, with CEA grid factors for power-sector Scope 2. (ii) **Climate-stressed
RWA add-on** via NGFS-scenario PD/LGD uplift on carbon-exposed sectors, mirroring ECB/EBA climate
stress-test capital methodology and NGFS bank guidance.

**8.3 Mathematical specification.**
Financed emissions: `FE = Σ_c (outstanding_c / (debt_c+equity_c)) × (Scope1_c + Scope2_c)`,
Scope 2 via `activity_c × CEA_grid_EF`. Portfolio `FE = Σ FE_c`, `avgDQ = Σ FE_c·DQ_c / Σ FE_c`.
Capital add-on: for carbon-exposed exposures `E_s`, `ΔRWA = Σ_s E_s × RW_s × (m_s − 1)`,
`m_s` = NGFS scenario PD multiplier; `add-on_bps = ΔRWA / RWA_total × requiredCapitalRatio × 10^4`.
Transition cost: `Σ_s E_s × carbonIntensity_s × carbonPrice_{s,2030} × passThrough_s`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Grid EF | CEA_grid_EF | Central Electricity Authority (already imported) |
| Sector intensity | carbonIntensity_s | PAT benchmarks / CDP India |
| NGFS PD multiplier | m_s | NGFS Phase IV India scenarios (already in `NGFS_SCENARIOS`) |
| Risk weights | RW_s | RBI Basel III standardised RW by exposure |
| DQ score | DQ_c | PCAF 5-tier data hierarchy |

**8.4 Data requirements.** Loan register by sector/counterparty, borrower Scope 1/2 (or PAT proxy),
sector RWA. Sources: bank supervisory returns, PAT/CEA, CDP India. Platform holds real CEA/PAT/NGFS
data; needs the actual lending book.

**8.5 Validation & benchmarking.** Reconcile FE against banks' own PCAF disclosures; benchmark capital
add-on against the ECB 2022 climate stress-test outputs and RBI pilot; sensitivity to scenario and
grid-EF vintage.

**8.6 Limitations & model risk.** Indian corporate emissions data is sparse → PAT-sector proxies at
high DQ tiers; NGFS India scenarios are new and uncertain. Conservative fallback: sector-median
intensity, DQ 5 flag, and report the add-on as a scenario range rather than a point estimate.

## 9 · Future Evolution

### 9.1 Evolution A — Disclosed-data bank panel with a modelled capital add-on (analytics ladder: rung 2 → 3)

**What.** The module's regulatory scaffolding is genuinely accurate — RBI 2025 four-pillar framework (31 requirement items), 9% CET1 vs Basel 8%, real D-SIB surcharges (SBI 0.6%, HDFC/ICICI 0.4%), CEA v19 grid factors, NGFS-India scenario parameters, BRSR-ESRS crosswalk — but the 20-bank panel is `sr()`-seeded: CRAR components, financed emissions (`lendingBook × 0.000012 × random`), sector exposures, and the climate add-on (`10 + sr()·80` bps) are heuristics, not models. Evolution A replaces the panel with disclosed data and makes the add-on a real calculation.

**How.** (1) Seed a `ref_indian_bank_financials` table from public Basel Pillar 3 disclosures (CET1/AT1/Tier2, gross NPA, sector exposure from annual reports — all published quarterly by the 20 named banks), refreshed by an ingester with as-of dates. (2) `api/v1/routes/rbi_climate.py`: `POST /climate-addon` implementing the §5 formula honestly — `Σ(sector_exposure × emission_intensity × scenario_multiplier)` using the real `SECTOR_EF` vector and NGFS-India carbon-price paths already on the page, replacing the random bps draw; `POST /financed-emissions` applying CEA state grid factors to the disclosed sector book (PCAF DQ tier reported — currently `pcafDqs` is itself a random number, which inverts the concept). (3) Physical-risk state exposures wired to the digital-twin grids where Indian coverage exists, coarse-flagged where it doesn't.

**Prerequisites.** Pillar-3 ingestion effort (PDF-heavy; scope 20 banks × 4 quarters); the seeded panel demoted to fixtures. **Acceptance:** SBI's CRAR matches its published disclosure for the stated quarter; the climate add-on moves when the carbon-price slider moves via the formula, not a reseed.

### 9.2 Evolution B — RBI-compliance copilot for Indian FIs (LLM tier 1 → 2)

**What.** The 31-item requirement checklist, phased FY 2025-26→2028-29 timeline, and BRSR-ESRS crosswalk are exactly what compliance officers interrogate: "which Pillar 2 items apply to an Upper Layer NBFC this fiscal year?", "map our BRSR Core KPI 7 disclosure to the ESRS datapoint", "draft the board note on scenario-analysis readiness". Evolution B ships this as a tier-1 copilot grounded in the module's regulatory content plus the RBI Directions and SEBI circular texts §5 already cites.

**How.** Copilot router over pgvector chunks of the Atlas record, `RBI_PILLARS` items, `DISCLOSURE_PHASES`, and the source circulars (public documents, chunked with clause anchors). Scope-determination answers cite the applicability clause (SCB vs SFB vs NBFC-UL distinctions the module encodes). Tier-2 upgrade after Evolution A: "stress our CRAR under Disorderly with ₹4,000/t carbon by 2030" becomes a `POST /climate-addon` tool call against the bank's disclosed capital stack. India-specific caveat in the system prompt: RBI guidance is evolving; every answer carries the circular version/date it cites.

**Prerequisites.** Circular texts sourced and versioned; Evolution A for any bank-specific numbers. **Acceptance:** applicability answers cite clause-level anchors; a compliance-gap summary for a bank uses only its stored checklist state and disclosed financials, refusing banks not in the panel.