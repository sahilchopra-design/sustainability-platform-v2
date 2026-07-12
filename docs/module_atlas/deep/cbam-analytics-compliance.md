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
