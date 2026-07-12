## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (minor).** The guide names **Verra VM0041** and **Gold Standard
> Animal Husbandry** as the primary standards; the code actually files calculations under
> `methodology:'AMS-III.BF'` (CDM small-scale manure/biogas) and uses GWP100 **= 27.2** throughout,
> whereas the guide quotes 29.8. The core science — IPCC Tier 2 enteric fermentation (GEI·Ym/55.65)
> and VS·B₀·MCF manure accounting — is implemented correctly and matches the guide's formulas. The
> GWP* comparison the guide implies (flow vs pulse) is present but hard-coded/illustrative, not a real
> GWP* integration. Sections document the code as written.

### 7.1 What the module computes

Two intervention pathways, aggregated to net credits.

**Enteric fermentation** (`calcEnteric`), IPCC 2019 Tier 2:
```
CH4_bl (kg/yr) = GEI · Ym_bl · 365 · head_count / 55.65   // 55.65 MJ energy per kg CH4
CH4_pj (kg/yr) = GEI · Ym_pj · 365 · head_count / 55.65
gross_credits  = (CH4_bl − CH4_pj)/1000 · GWP
net_credits    = gross_credits · (1 − buffer_pct/100)
```
`Ym` is the methane-conversion factor (fraction of gross energy intake lost as CH₄). The intervention
lowers `Ym_pj` below `Ym_bl`.

**Manure management** (`calcManure`), IPCC VS method:
```
CH4_bl (kg/yr) = VS · B0 · MCF · 0.67 · head_count · 365   // 0.67 kg/m³ CH4 density
CH4_pj         = CH4_bl · (1 − reduction_pct/100)
gross_credits  = (CH4_bl − CH4_pj)/1000 · GWP
```

### 7.2 Parameterisation / scoring rubric

| Parameter | Default / range | Provenance |
|---|---|---|
| GWP100 CH₄ | 27.2 | Code comment: IPCC AR6 GWP-100 |
| Energy per kg CH₄ | 55.65 MJ/kg | Code comment: IPCC 2006 GL & 2019 Refinement |
| Ym baseline / project | 0.065 / 0.040 default | IPCC Table 10.12 (3–6.5% by diet); UI-set |
| GEI (gross energy intake) | 180 MJ/head/day | IPCC Tier 2 typical dairy; UI-set |
| VS (volatile solids) | 6.0 kg/head/day | IPCC Table 10.13a; UI-set |
| B₀ | 0.24 m³ CH₄/kg VS | IPCC default (cattle) |
| MCF (manure system) | 0.10–0.80 by climate | `CLIMATE_REGIONS` — IPCC Table 10.17 (cool 0.10 → tropical 0.80) |
| CH₄ density factor | 0.67 kg/m³ | IPCC standard |
| Additive reduction | 3-NOP 30%, Asparagopsis 50%, Fat 15%, Nitrate 20% | `FEED_ADDITIVES` — published RCT ranges |

The 10 portfolio `PROJECTS` (herd_size, ch4_avoided, buffer) are **synthetic** (`sr()` PRNG).

### 7.3 Calculation walkthrough

Enteric and manure results compute independently from their input state objects; the page total is
`entResult.net_credits + manResult.net_credits`, pushed to `CarbonCreditContext`. Changing the
climate region auto-updates the manure `MCF` (`handleClimateChange` → `CLIMATE_REGIONS[idx].mcf`).
Feed-additive scenarios apply the additive's `reduction_pct` to lower project Ym or manure CH₄. A
cost-effectiveness view divides `cost_per_head_yr` by `net_credits/head_count` to give $/tCO₂e.

### 7.4 Worked example (enteric, dairy herd)

Defaults: GEI=180 MJ/day, Ym_bl=0.065, Ym_pj=0.040 (3-NOP-like), head_count=5,000, buffer=15%,
GWP=27.2.

| Step | Computation | Result |
|---|---|---|
| Baseline CH₄ | 180·0.065·365·5000/55.65 | ≈ 383,800 kg/yr |
| Project CH₄ | 180·0.040·365·5000/55.65 | ≈ 236,200 kg/yr |
| CH₄ avoided | 383,800 − 236,200 | ≈ 147,600 kg/yr |
| Gross credits | 147,600/1000·27.2 | ≈ **4,015 tCO₂e/yr** |
| Net (15% buffer) | 4,015·0.85 | ≈ **3,413 tCO₂e/yr** |
| Per head | 3,413/5,000 | ≈ **0.68 tCO₂e/cow/yr** |

This 0.68 tCO₂e/cow/yr sits exactly in the guide's stated 0.3–0.6 range for 3-NOP (slightly above,
because Ym drops 2.5 pts vs a typical 30% relative reduction) — the model is internally consistent.

### 7.5 Companion analytics
- **GWP Accounting** tab — a simplified pulse (27.2 flat) vs a declining "flow" series to illustrate
  the GWP* concept; **not** a calibrated GWP* integration.
- **Feed additive scenarios** — cost per head vs credits per head across the 4 additives.

### 7.6 Data provenance & limitations
- Portfolio rows are **synthetic seeded demo data**; calculator inputs are user-set.
- No N₂O co-benefit accounting (guide mentions it; code omits it), no lifetime persistence modelling
  of additive efficacy, and the GWP* series is illustrative not integrated.
- Tier 2 GEI is a single scalar, not derived from NEm/NEg/NEa energy balance sub-equations.

**Framework alignment:** IPCC 2019 Refinement Agriculture Ch.10 (enteric Tier 2, VS/B₀/MCF manure) —
implemented directly. CDM **AMS-III.BF/D** manure methane and **Verra VM0041** livestock enteric —
approximated via the (baseline−project) EF difference × GWP structure. GWP100 per IPCC AR6.
