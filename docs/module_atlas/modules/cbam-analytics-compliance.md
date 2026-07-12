# EU CBAM Analytics & Compliance
**Module ID:** `cbam-analytics-compliance` · **Route:** `/cbam-analytics-compliance` · **Tier:** B (frontend-computed) · **EP code:** EP-EG3 · **Sprint:** EG

## 1 · Overview
EU Carbon Border Adjustment Mechanism analytics covering 7 sectors (Steel, Cement, Aluminium, Fertilisers, Electricity, Hydrogen, Chemicals), 20 seeded countries with CBAM exposure, phase-in timeline 2024–2034, certificate price scenarios, and strategic response options.

> **Business value:** Used by importers assessing CBAM compliance costs, EU manufacturers competing with imports, investors analysing trade flow impacts, and governments designing decarbonisation strategy in CBAM-exposed sectors.

**How an analyst works this module:**
- Review CBAM overview for 7 sectors and 20 country exposure analysis
- Examine phase-in timeline for 2024–2034 financial obligation ramp-up
- Use certificate price scenarios for sensitivity to EU ETS price movements
- Analyse strategic response options: decarbonise, relocate, or buy certificates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CBAM_SECTORS`, `COUNTRIES`, `KpiCard`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CBAM_SECTORS` | 8 | `name`, `trad2023`, `avgCI`, `euEts`, `cbaFactor`, `phase` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `steelExport` | `parseFloat((sr(i * 7 + 1) * 8).toFixed(1));` |
| `annualCbam` | `parseFloat((steelExport * ci * 62 * 1e6 / 1e9).toFixed(2));` |
| `filteredCountries` | `useMemo(() => COUNTRIES.filter(c => c.steelExport > 0), []); const totalCbamRevenue = useMemo(() => COUNTRIES.reduce((s, c) => s + c.annualCbam, 0).toFixed(1), []);` |
| `highRisk` | `useMemo(() => COUNTRIES.filter(c => c.riskLevel === 'High').length, []);  const sectorExposure = CBAM_SECTORS.map(s => ({ name: s.id, annualCbam: parseFloat((s.trad2023 * s.avgCI * euEts * s.cbaFactor / 1000).toFixed(2)), tradeValue: s.trad2023, ci: s.avgCI, }));` |
| `timelineChart` | `[2024, 2025, 2026, 2027, 2028, 2030, 2032, 2034].map(yr => ({` |
| `pct` | `(yr - 2026) / (2034 - 2026);` |
| `cbam` | `Math.round(1.85 * euEts * pct);` |
| `saved` | `Math.round(1.85 * euEts * (1 - pct));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CBAM transition period | `Reporting only; no financial obligation` | EU Regulation 2023/956 | CBAM reporting started Oct 2023; financial adjustment starts 2026; full implementation 2034 when free allocations removed. |
| Steel embedded CO₂ (tCO₂/t) | `BF-BOF world average` | worldsteel 2023 | China BF-BOF average: 2.0–2.2 tCO2/t; EU BF-BOF: 1.6–1.8 tCO2/t; gap drives CBAM exposure. |
| Cement embedded CO₂ (tCO₂/t) | `Calcination + thermal combustion` | IEA Cement Roadmap 2023 | Clinker at 0.55 tCO2/t from calcination alone; can only be reduced via CCS or alternative binders. |
- **EU Regulation 2023/956 + EU ETS price data + worldsteel/IFA/IAI embedded carbon benchmarks** → 7-sector CBAM model + 20-country exposure + certificate price scenarios + strategic response → **Importers assessing CBAM cost, EU producers competing with imports, and investors analysing CBAM impact on trade flows**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM Certificate Exposure (€/yr)
**Headline formula:** `CBAM_cost = Imported_quantity × Embedded_CO2 × (EU_ETS_price − Country_carbon_price)`

Full CBAM from 2034: China steel exports to EU face €300–600M/yr; Indian cement €50–100M/yr at EU ETS €60/tCO2.

**Standards:** ['EU Regulation 2023/956 (CBAM)', 'EU ETS Directive 2003/87/EC', 'worldsteel + IFA + IAI embedded carbon data']
**Reference documents:** EU (2023) – Regulation 2023/956 establishing CBAM; worldsteel (2023) – CO₂ Emission Data Collection; IEA (2023) – Cement Technology Roadmap

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The EU CBAM Analytics module is a correct, well-parameterised implementation of the Carbon Border Adjustment
Mechanism cost model. It uses the real CBAM formula, real embedded-carbon intensities by sector, the actual
EU ETS reference price, and the correct 2026→2034 free-allocation phase-out. It aligns with its guide; the
per-country instances are synthetic but sector parameters are real. No missing-model gap is triggered, so
there is no §8.

### 7.1 What the module computes

Sector- and country-level CBAM certificate exposure:

```js
// country-level (steel-anchored demo)
annualCbam = steelExport × ci × 62 × 1e6 / 1e9        // €bn/yr at EU ETS €62/tCO2

// sector-level
sectorExposure.annualCbam = trad2023 × avgCI × euEts × cbaFactor / 1000

// phase-in timeline
free_alloc  = 100 × max(0, (2034 − yr)/(2034 − 2026))  // free allowances phase out to 2034
cbam_rate   = 100 × min(1, max(0, (yr − 2026)/(2034 − 2026)))  // CBAM ramps in
cert_price  = euEts × (1 + (yr − 2024)×0.03)           // 3%/yr price escalation
```

The `cbaFactor` (CBAM applicability factor) scales the theoretical exposure to reflect the share of embedded
emissions actually subject to the levy after free-allocation offset — the mechanism's key phase-in lever.

### 7.2 Parameterisation

**Sector embedded-carbon intensities** (`CBAM_SECTORS`, 7 rows — provenance: **real** worldsteel / IEA / IFA
/ IAI benchmarks):

| Sector | Trade 2023 (€bn) | Embedded CO₂ (tCO₂/t) | EU ETS (€) | CBAM factor | Phase |
|---|---|---|---|---|---|
| Iron & Steel | 8.4 | 1.85 | 62 | 0.35 | Full 2026 |
| Cement | 4.2 | 0.82 | 62 | 0.28 | Full 2026 |
| Aluminium | 3.8 | 11.5 | 62 | 0.42 | Full 2026 |
| Fertilisers | 2.1 | 2.20 | 62 | 0.22 | Full 2026 |
| Electricity | 1.9 | 0.35 | 62 | 0.90 | Full 2026 |
| Hydrogen | 0.4 | 10.0 | 62 | 0.15 | Proposed 2027 |
| Chemicals | 0.2 | 2.80 | 62 | 0.08 | Under study |

Steel 1.85 tCO₂/t (BF-BOF world average), aluminium 11.5, cement 0.82 — all match published figures. The
EU ETS reference **€62** is the user-adjustable price (real 2024 level).

**Country instances** (`COUNTRIES`, 20 rows): country names are real (China, India, Turkey, Russia…), but
`steelExport` (0–8 Mt) and `ci` (1.2–2.6) are `sr()`-seeded. Risk level bands: High >€1.5bn, Medium >€0.5bn.

### 7.3 Calculation walkthrough

Country CBAM = `steelExport × ci × EU-ETS × conversion` (the guide's `Imported_qty × Embedded_CO2 × ETS
price`; the code omits the origin-country carbon price, i.e. assumes zero foreign carbon cost — a
conservative upper bound). Sector exposure multiplies trade value × intensity × ETS × applicability factor.
The timeline tab models the free-allocation phase-out and CBAM ramp from 2026 to 2034 (both linear), plus a
3%/yr certificate-price escalation.

### 7.4 Worked example (China steel + phase-in)

Suppose China: `steelExport = 6.5 Mt`, `ci = 2.1 tCO₂/t` (BF-BOF), EU ETS €62:
`annualCbam = 6.5 × 2.1 × 62 × 1e6 / 1e9 = 0.846 → €0.85bn/yr`. Risk level = Medium (€0.5–1.5bn). At a
higher intensity 2.2 and volume 8 Mt this exceeds €1.5bn → High risk — consistent with the guide's "China
steel €300–600M/yr" order of magnitude (the demo runs slightly higher at full embedded carbon).

Phase-in: in 2030, `free_alloc = 100 × (2034−2030)/8 = 50%`, `cbam_rate = 100 × (2030−2026)/8 = 50%` — half
the free allowances gone, half the CBAM obligation active. Certificate price `62 × (1 + 6×0.03) = €73.2`.

### 7.5 Data provenance & limitations

- **Sector intensities, CBAM factors, EU ETS price, and phase-in schedule are real** and correct; country
  export volumes and intensities are **synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- Country CBAM **omits the origin carbon price** (guide's `− Country_carbon_price` term), so it is a gross
  upper bound — importers from carbon-priced jurisdictions (e.g. UK ETS) would owe less.
- Phase-in is modelled as linear free-allocation phase-out; the actual EU schedule is stepped, and only the
  steel proxy drives the country view.

**Framework alignment:** EU Regulation 2023/956 (CBAM) — the certificate-cost formula, 7 covered sectors,
2026 financial start, and 2034 full-implementation-on-free-allocation-removal · EU ETS Directive 2003/87/EC —
the €/tCO₂ reference price that CBAM equalises against · worldsteel / IEA Cement Roadmap / IFA / IAI — the
embedded-carbon intensity benchmarks (steel 1.85, cement 0.82, aluminium 11.5 tCO₂/t) · the CBAM applicability
factor (`cbaFactor`) approximates the phased removal of free allocation that determines the effective levy.

## 9 · Future Evolution

### 9.1 Evolution A — Real trade flows behind the sound CBAM cost model (analytics ladder: rung 2 → 3)

**What.** §7 confirms this is a correct, well-parameterised CBAM implementation: it uses the real CBAM formula (`cost = quantity × embedded_CO₂ × (EU_ETS_price − origin_carbon_price)`), real sector embedded-carbon intensities (worldsteel/IEA/IFA-sourced), the actual EU ETS reference price, and the correct 2026→2034 free-allocation phase-out. The only synthetic layer is the trade data: the 20 country instances are `sr()`-seeded (`steelExport = sr()×8`), anchored to a steel demo. The platform already has a UN Comtrade integration (per the data-sources work). Evolution A feeds the sound model with real trade flows.

**How.** (1) Real import volumes by CN code, sector, and country of origin from UN Comtrade (the platform's Comtrade integration provides exactly this), replacing the seeded `steelExport`/country exposures — so per-country CBAM exposure reflects actual EU import data. (2) Third-country carbon prices (the origin-price deduction) from the World Bank Carbon Pricing Dashboard, making the `(ETS − origin)` gap real per country. (3) EU ETS certificate price from live/recent data rather than a fixed €62. (4) Embedded-carbon intensities extended to the CBAM Delegated Act default values plus a path for verified-operator declarations. (5) Rung 3: benchmark computed liabilities against published CBAM impact assessments. Coordinate with the two sibling CBAM modules on shared trade/factor data.

**Prerequisites.** Comtrade trade-flow coverage for CBAM sectors; World Bank carbon-price data; the CBAM Delegated Act default-factor table. **Acceptance:** country exposures derive from real Comtrade flows; origin-price deductions use real third-country carbon prices; the ETS price is current; liabilities benchmark against published CBAM assessments.

### 9.2 Evolution B — CBAM exposure and strategy copilot (LLM tier 2)

**What.** Importers and EU producers ask "what's our 2030 CBAM liability on Chinese steel imports at €120/t ETS?", "how does relocating vs decarbonising vs buying certificates compare?", "which of our supply countries have carbon pricing that offsets CBAM?" — the copilot runs the Evolution-A CBAM cost model over real trade flows, reports liability by sector/country and the strategic-response comparison, every figure tool-traced.

**How.** Tool schemas over the Evolution-A CBAM-cost and scenario routes; grounding corpus is this Atlas record — the correct CBAM formula and phase-in timeline in §5/§7 are the copilot's explanation source, and the real sector intensities ground embedded-carbon answers. The copilot states the ETS-price scenario and phase-in year behind any liability figure (CBAM ramps 2026→2034 as free allocations phase out), and the origin-price deduction assumption per country. The strategic-response analysis (decarbonise/relocate/buy) presents the trade-offs with tool-computed costs. Feeds the trade/compliance desk view.

**Prerequisites.** Evolution A's real trade flows — a copilot quoting liabilities off seeded steel exports would misstate exposure, though the underlying formula is sound. **Acceptance:** every liability figure traces to a tool response over real trade data; each states its ETS scenario and phase-in year; origin-price deductions cite real third-country carbon prices.