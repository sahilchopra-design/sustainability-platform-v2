## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (units/parameterisation).** The guide states a **daily** base
> emission factor `EF₀ = 1.30 kg CH₄/ha/day` with a multiplicative IPCC scaling chain
> `EF = EF₀·SF_w·SF_s·SF_o·t_season` and GWP100 = 29.8. The code instead uses **seasonal** emission
> factors (`ef_baseline` in kg CH₄/ha/season, 200–500) applied per-season, a **single** water-regime
> scaling factor (`awd_scaling`), and GWP100 = **27.2**. The SF_s/SF_o soil/organic-amendment factors
> from the guide are folded into per-region `soil_correction`/`variety_factor` multipliers rather than
> applied explicitly at the daily level. The science is directionally correct (AWD roughly halves
> paddy CH₄); the parameterisation differs from the guide's daily-EF formulation. Code documented below.

### 7.1 What the module computes

**Rice CH₄** (`calcRiceCH4`):
```
ch4_bl (tCO2e) = ef_baseline · area_ha · seasons · 1e-6 · GWP_CH4   // kg→t via 1e-6
ch4_pj         = ch4_bl · awd_scaling                                // project water regime
gross          = ch4_bl − ch4_pj = ch4_bl·(1 − awd_scaling)
net            = gross · (1 − buffer_pct/100)
```
`awd_scaling` is the ratio of project to baseline emissions — 1.0 for continuous flooding, 0.5 for
AWD, 0.35 for dry seeding. Reduction fraction = `1 − awd_scaling`.

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| GWP100 CH₄ | 27.2 | Code comment: IPCC AR6 GWP-100 |
| Water-regime scaling | CF 1.0, AWD 0.5, Dry-Seeding 0.35 | `WATER_REGIMES` — IPCC SF_w-consistent (AWD ~0.5) |
| Yield impact | CF 0, AWD −3%, DS −8% | `WATER_REGIMES` — agronomic literature |
| Regional EF_mid | SE Asia 375, S Asia 325, E Asia 290, SSA 250, LatAm 270, Med 210 kg CH₄/ha/season | `REGIONAL_EF` — IPCC-range midpoints |
| soil_correction / variety_factor | 0.80–1.0 / 0.90–1.10 by region | `REGIONAL_EF` — proxies for IPCC SF_s/cultivar effect |
| Buffer | 12% default | UI-set |

The 8 portfolio `PROJECTS` (area, ef_baseline, credits) are **synthetic** (`sr()` PRNG).

### 7.3 Calculation walkthrough

The user sets a baseline seasonal EF, area, number of seasons/yr, project water-regime scaling, and
buffer. `calcRiceCH4` converts baseline kg CH₄ → tCO₂e (×1e-6 ×GWP), applies the project scaling to
get project emissions, differences them for gross reductions, and haircuts by the buffer. A waterfall
array visualises baseline → project → gross → buffer → net. Result pushes to `CarbonCreditContext` as
`methodology:'AMS-III.AU'`. The regional-benchmark tab computes an adjusted EF per region as
`ef_mid · soil_correction · variety_factor`.

### 7.4 Worked example (AWD, two seasons)

Defaults: `ef_baseline=350` kg CH₄/ha/season, `area=15,000 ha`, `seasons=2`, `awd_scaling=0.5`,
GWP=27.2, buffer=12%.

| Step | Computation | Result |
|---|---|---|
| Baseline CH₄ | 350·15,000·2·1e-6·27.2 | **285.6 ktCO₂e** |
| Project CH₄ | 285,600·0.5 | 142,800 tCO₂e |
| Gross reduction | 285,600 − 142,800 | 142,800 tCO₂e |
| Net (12% buffer) | 142,800·0.88 | **≈ 125,664 tCO₂e** |
| Per ha (2 seasons) | 125,664/15,000 | **≈ 8.4 tCO₂e/ha/yr** |

The AWD reduction is exactly 50% of baseline (`1−0.5`) before buffer, matching the guide's "AWD
reduces paddy methane by ~48–50%." The per-hectare yield (8.4 tCO₂e/ha/yr across 2 seasons) is high
relative to the guide's 0.8–1.8 range because the example uses a large seasonal EF (350) and 2
seasons; at a single season and lower EF the per-ha figure falls into the guide's band.

### 7.5 Data provenance & limitations
- Portfolio rows are **synthetic seeded demo data** (`sr()`); calculator inputs are user-set.
- Single lumped `awd_scaling`, not the explicit IPCC SF_w × SF_s × SF_o × pre-season chain; no
  organic-amendment (SF_o) input, no pore-water-tube compliance verification of AWD.
- Seasonal (not daily) EF means season-length is fixed in the EF, losing the guide's t_season lever.
- No N₂O trade-off accounting (AWD can raise N₂O), which real VM0042 monitoring captures.

**Framework alignment:** **CDM AMS-III.AU** (rice cultivation methane, filed as the methodology) and
**Verra VM0042** — both quantify ER = (baseline − project EF)·area·GWP, the code's exact structure.
**IPCC 2019 Refinement Agriculture Ch.5** supplies the EF ranges and the SF_w water-regime scaling
that `awd_scaling` embodies. **IRRI AWD guidelines** define the 15-cm pore-water re-flood trigger the
project regime represents.
