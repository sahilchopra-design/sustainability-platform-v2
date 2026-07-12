## 7 · Methodology Deep Dive

### 7.1 What the module computes

150 synthetic buildings across 6 types and 15 cities each carry independent operational,
embodied-carbon, certification, resilience and tenant-engagement attributes. Unlike the guide's
formula `WLC = OperationalCarbon + EmbodiedCarbon`, **the code never sums the two into a
whole-life-carbon figure** — `intensity` (operational, kWh/m²) and `embodiedCarbon` (kgCO₂e/m²)
remain separate fields reported independently on the dashboard; no `wholeLifeCarbon` variable
exists anywhere in the file. This is a partial guide↔code gap (methodology headline present, the
literal combination step absent) rather than a full mismatch — the underlying operational and
embodied figures genuinely exist and are independently meaningful.

```js
value      = area × sectorPricePerM2 × (0.8 + s3×0.4)
intensity  = sectorBaseIntensity × (0.5 + s×0.8)                    // kWh/m²/yr, operational
crremAligned = intensity < 100                                       // flat threshold, all sectors
strandingYear = crremAligned ? 2045+floor(s4×5) : 2026+floor(s2×12)
embodiedCarbon = 200 + s×200                                         // kgCO2e/m² — separate metric
gresbScore = 40 + s×50
co2        = intensity × area × 0.21 / 1000                          // tCO2/yr, UK grid-ish factor
insurancePrem = value × 0.003 × (1 + riskScore/100)
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Sector price/m² | Office £4,500, Retail £3,200, Residential £5,500, Industrial £1,800, Logistics £2,100, Mixed-Use £3,800 | Synthetic demo values, directionally plausible UK ranking (residential > office > mixed-use > retail > logistics > industrial) |
| Sector base intensity (kWh/m²) | Office 180, Retail 220, Residential 120, Industrial 280, Logistics 150, Mixed-Use 200 | Synthetic — same ranking direction as CIBSE/BEIS benchmark tables but not the actual published values |
| CRREM-aligned threshold | `intensity < 100 kWh/m²` (flat, all sectors) | Synthetic simplification — a genuine CRREM check needs a **sector-specific** pathway budget (as correctly implemented in the sibling `real-estate-carbon-analytics` module's `CRREM` table); this module collapses all 6 sectors to one cutoff |
| `co2` grid factor | `0.21` (implicit kgCO2/kWh) | Roughly UK grid average c.2022 (DESNZ/DEFRA conversion factors ≈0.19–0.23 kgCO2e/kWh over recent years) — plausible but unattributed in code |
| Insurance premium rate | `0.3%` of value, loaded by `(1+riskScore/100)` | Synthetic — up to 2× base premium at `riskScore=100` |
| GRESB score | `40 + s×50` (40–90) | Synthetic — GRESB's real scale is 0–100 with published percentile bands; range plausible, unsourced |

### 7.3 Calculation walkthrough

1. **Per-building seed** (150 rows, 6 independent `sr()` draws each): type, city, EPC grade,
   area, year built, value, operational intensity, CRREM-flat-alignment flag + stranding year,
   certification scheme/level, embodied carbon, resilience score, physical risk score, green
   lease flag, tenant count, occupancy, retrofit cost/status, GRESB score, CO2, insurance premium.
2. **Portfolio KPIs** (`kpis`, computed once at module scope — not filtered/interactive): 12 cards
   — value sum, avg EPC (index-averaged then mapped back to a letter, see caveat below), % CRREM
   aligned, % certified, avg resilience, % green lease, total CO2, avg GRESB, avg intensity, avg
   embodied carbon, retrofit pipeline £ (sum of `retrofitCost` where status ≠ Completed), building
   count.
3. **20 hard-coded alerts** (`alerts` array): fixed narrative strings by severity (critical/high/
   medium/low) tagged to one of 5 sub-modules (AS1–AS5) — descriptive content, not derived from
   the 150-building dataset (e.g. "12 buildings stranding by 2028" is a fixed string, not
   `buildings.filter(...).length`).
4. **Trend series** (`gresbTrend`, `crremTrend`, `certTrend`, all 6-year 2020–2025 arrays):
   independently seeded synthetic time series, not backward-computed from the current 150-building
   snapshot.
5. **Distributions**: `epcDist`, `typeDist` — counts of `buildings` by category; `portfolioRadar`
   — 4–5 dimension scores (Energy = `100 − avgIntensity/3`, Certification = `%certified`,
   Resilience = `avgResilience`, plus others) mixing genuinely-normalised and ad-hoc-scaled metrics
   on one 0–100 radar.
6. **Board report** (`boardSections`): auto-generated narrative strings built from the same
   aggregate figures (portfolio value, avg intensity, etc.) — a templated executive summary, not
   an independent calculation.

### 7.4 Worked example

Building `i=0`: `s=sr(3)`, `s2=sr(5)`, `s3=sr(7)`, `s4=sr(11)`, `s5=sr(13)`, `s6=sr(17)`.

| Step | Value (illustrative from `sr()` outputs) |
|---|---|
| `s3=sr(7)≈0.9906` | `type=TYPES[floor(0.988×6)]` → near end of list, e.g. **Mixed-Use** |
| `area` | `floor(500+s4×49,500)` → e.g. **32,000 m²** |
| `value` | `32,000 × 3,800 × (0.8+0.9906×0.4)` ≈ `32,000×3,800×1.196` ≈ **£145.6M** |
| `intensity` | `200 × (0.5+s×0.8)`, `s=sr(3)` | ≈ **150–280 kWh/m²** range depending on draw |
| `crremAligned` | `intensity < 100` | **false** for any Mixed-Use draw above 100 (base alone is 200) |
| `strandingYear` | not aligned → `2026+floor(s2×12)` | **2026–2037** |
| `embodiedCarbon` | `200+s×200` | ≈ **200–400 kgCO2e/m²** |
| `co2` | `intensity×area×0.21/1000` | at intensity=200: `200×32,000×0.21/1000` = **1,344 tCO2/yr** |
| `insurancePrem` | `value×0.003×(1+riskScore/100)` | at riskScore=60: `145.6M×0.003×1.6` ≈ **£698k/yr** |

### 7.5 Portfolio-level rubric

| Metric | Rule |
|---|---|
| CRREM aligned | flat `intensity < 100 kWh/m²` — **not** sector-differentiated (contrast: sibling module uses per-sector budgets 35–60 kgCO₂/m²) |
| Certified | `s6 > 0.38` (≈62% of the seed population) |
| Green lease | `s4 > 0.35` (≈65%) |

### 7.6 Companion analytics

Executive Dashboard (12 KPIs + trend charts + radar), Portfolio Overview (filterable building
table with EPC colour coding), Engagement & Capex Pipeline (retrofit status funnel, tenant
engagement), Board Report (auto-narrative). Five documented "sub-modules" (AS1–AS5) are UI
navigation cards only — they do not correspond to separate calculation engines within this file.

### 7.7 Data provenance & limitations

- **All 150 buildings are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; names are
  templated (`{city} {type} {n}`), not real assets.
- The flat 100 kWh/m² CRREM threshold ignores sector-specific decarbonisation budgets — a
  logistics building and an office are judged against the same bar despite materially different
  real CRREM pathways (the platform's own `real-estate-carbon-analytics` module gets this right).
- `WLC = Operational + Embodied` (the guide's own formula) is never actually summed in code —
  operational (`intensity`, kWh/m²) and embodied (`embodiedCarbon`, kgCO2e/m²) are also in
  different units (energy vs carbon) and would need the same EPC→carbon-factor conversion used
  elsewhere before they could be combined.
- The 20 alert strings and Board Report narrative are static/templated text, not computed
  triggers off the live 150-building dataset — e.g. counts quoted in alert text will not track
  actual filtered totals.
- 6-year trend series (GRESB, CRREM alignment, certifications) are independently seeded, not a
  time-evolution of the current snapshot — portfolio composition implicitly "improves" over the
  trend regardless of the underlying 150-building draw.

**Framework alignment:** RICS Whole-Life Carbon Assessment / EN 15978 — named but the operational+
embodied summation step is not executed · CRREM — used as a binary flag, not the multi-sector
pathway model CRREM actually publishes (10-year budget decline curves per property type/region) ·
GRESB — portfolio score modelled as a single synthetic 40–90 figure, not GRESB's actual weighted
aspect-score methodology (Management, Performance, Development components) · EU EPBD recast /
MEES — referenced only in the static alert text, not computed against the building set's own EPC
distribution.
