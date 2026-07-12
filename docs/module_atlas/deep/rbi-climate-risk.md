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
