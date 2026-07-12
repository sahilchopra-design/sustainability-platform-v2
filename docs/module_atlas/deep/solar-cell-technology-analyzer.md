## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most modules in this batch, `TECHNOLOGIES` (8 rows: PERC, TOPCon, HJT, IBC, Perovskite-Si Tandem, BSF
Monofacial, CdTe, CIGS) is **entirely hand-curated from real published sources** — the file's own header
comment cites NREL record efficiencies (TOPCon 26.1%, HJT 26.8%, IBC 26.7%, Tandem 33.9%), the PERC→TOPCon
2022→2024 market-share transition, and Wright's Law at a 24% learning rate. The platform's `sr()` PRNG
function is defined in this file but **never called** — every efficiency, cost, temperature-coefficient,
bifaciality, degradation, and market-share figure is a manually entered constant, not randomly generated.
`EFFICIENCY_ROADMAP` (2010–2025, 9 vintage years × 6 technologies) similarly traces real NREL Best Research-
Cell Efficiency Chart progression.

### 7.2 Parameterisation

| Field | Values (illustrative rows) | Provenance |
|---|---|---|
| `efficiencyRecord` | PERC 24.5%, TOPCon 26.1%, HJT 26.8%, IBC 26.7%, Tandem 33.9%, CdTe 22.3%, CIGS 23.4% | NREL Best Research-Cell Efficiency Chart (cited in-file) |
| `commercialEff` | consistently 1.5–5.4pp below `efficiencyRecord` | realistic lab-to-commercial gap, hand-set per technology |
| `costPerWp` | $0.14 (BSF, legacy) – $0.45 (Tandem, pre-commercial) | plausible BNEF-consistent cost ordering, not cited to a specific BNEF report edition |
| `tempCoeff` | −0.20%/°C (Tandem) to −0.40%/°C (BSF) | consistent with published module datasheets (HJT/TOPCon typically outperform PERC/BSF on temp coefficient) |
| `marketShare2024` | PERC 35%, TOPCon 40%, HJT 8%, IBC 3%, Tandem 0.1%, BSF 10%, CdTe 3%, CIGS 1% | matches the file header's cited PERC→TOPCon transition narrative |
| `maturity` (1–5) / `trl` (1–9) | hand-set, e.g. Tandem maturity=2/trl=6 vs PERC/TOPCon maturity=5/trl=9 | qualitative technology-readiness judgment, not a formal TRL assessment methodology |

### 7.3 Calculation walkthrough

- **Radar chart** (Technology Comparison tab): derives 5 axes from the raw fields via hand-set linear
  rescalings, not sourced constants:
  ```
  Bifaciality axis    = bifaciality (as-is, 0-100 already)
  Maturity axis        = maturity × 20                              (1-5 scale → 20-100)
  Low-Degradation axis = max(0, 100 − degradationYr × 60)            (0.38%/yr → ~77; 1.20%/yr → 28)
  Low-TempCoeff axis    = max(0, 100 + tempCoeff × 150)               (−0.20 → 70; −0.40 → 40)
  ```
  These rescaling constants (×20, ×60, ×150) are chosen so each axis spans roughly 0–100 given the observed
  data range — a cosmetic normalisation, not a benchmarked scoring methodology.
- **Cost-efficiency scatter**: plots `costPerWp` vs `commercialEff` sized/coloured by `marketShare2024` — a
  direct, unmodified visualisation of the input data (no derived calculation).
- **Efficiency Roadmap**: line chart of `EFFICIENCY_ROADMAP` by technology across the 9 vintage years —
  again a direct rendering of curated historical data, not a projection or fit.

### 7.4 Worked example

HJT technology radar scores:

| Axis | Formula | Result |
|---|---|---|
| Efficiency | `commercialEff` | 24.5 |
| Bifaciality | as-is | 92 |
| Maturity | `4 × 20` | 80 |
| Low Degradation | `100 − 0.40×60` | 76 |
| Low TempCoeff | `100 + (−0.24)×150` | 64 |

HJT scores strongly on bifaciality and degradation, moderately on temp coefficient — consistent with the
technology's real-world reputation for high bifacial gain and low mid-life degradation (LeTID resistance),
even though the specific numeric transform is a hand-tuned display convenience rather than a cited formula.

### 7.5 Data provenance & limitations

- **This is one of the more evidence-grounded modules in the batch** — all headline technology figures
  trace to real, named, citable sources (NREL efficiency chart, market-share transition narrative) rather
  than a PRNG.
- The radar-axis rescaling constants (×20, ×60, ×150) are **not published benchmarks** — they are cosmetic
  linear transforms chosen to fit the observed data into a 0–100 display range, and would need re-tuning if
  new technologies with more extreme values were added (e.g. a hypothetical >2%/yr degradation technology
  would drive the Low-Degradation axis negative before the `max(0,·)` floor).
- No live data refresh mechanism — NREL/BNEF figures will drift from the platform's snapshot over time
  without a documented update cadence.
- `maturity`/`trl` scores are qualitative judgments, not derived from a formal technology-readiness-level
  assessment framework (e.g. DOE TRL definitions applied criterion-by-criterion).

### 7.6 Framework alignment

- **NREL Best Research-Cell Efficiency Chart** — the primary source for all `efficiencyRecord` values;
  correctly and consistently applied.
- **IEA Technology Roadmap: Solar PV (2023) / Haegel et al. (2023) Terawatt-Scale Photovoltaics** — cited in
  the guide as supporting references for the market-transition and learning-rate narrative; the Wright's Law
  24% learning rate mentioned in the file header is **descriptive context, not applied in any calculation**
  in this file (contrast with `solar-module-manufacturing-economics`, which does implement a learning curve).
- **IEC 60904-5 (temperature coefficient measurement standard)** — the guide cites this for
  `tempCoeff`; the module reports the values but does not perform or simulate the measurement.
