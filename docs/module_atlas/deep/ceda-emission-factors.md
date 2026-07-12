## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful. This module is a genuine **EEIO emission-factor explorer** over a
real dataset: `data/ceda-2025.json` holds **149 countries × 400 sectors** of supply-chain emission
intensities (kgCO₂e/USD), served via `CedaContext` with O(1) lookup maps, currency conversion, and a
spend-based Scope-3 calculator. The page header explicitly states "No non-deterministic PRNG" — and
indeed the calculation path is deterministic; the only `sr()` in the file is unused decoration. This
is one of the platform's genuinely data-backed modules.

### 7.1 What the module computes

**Emission-factor lookup** (`getEmissionFactor`): direct O(1) map read of country-sector EF
(kgCO₂e/USD), with regional-average fallback when the country-sector pair is missing.

**Spend-based Scope-3** (`calculateSpendEmissions`):
```
if country EF exists:  kgCO2e = EF_country_sector · spendUSD;  tCO2e = kgCO2e/1000
else fall back to regional EF for the sector
total tCO2e = Σ_lines EF_line · spend_line / 1000
```
This is the GHG Protocol Scope-3 spend-based method: `Σ (spend_category · EF_category)`.

**Currency conversion** (`convertCurrency`): `amountUSD · fx_rate(country, year)` from the 148-country
exchange-rate table (year-indexed), so spend can be entered in local currency.

**Explorer aggregates:** country/sector averages, top emitters, histogram buckets (max 15
kgCO₂e/USD, 20 bins), regional radar, industry-group heatmap ratios.

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| Emission factors | 149 countries × 400 sectors, kgCO₂e/USD | **`ceda-2025.json`** — CEDA 2025 v1 (Carnegie Mellon EIO-LCA), Exiobase 3.8.2, WIOD 2016 |
| Sector codes | BEA/ISIC-style (e.g. `1111A0` Oilseed farming) | CEDA sector taxonomy |
| Regional EFs | 21 regions | CEDA regional aggregation |
| Exchange rates | 148 countries, year-indexed | CEDA FX table |
| Histogram bucket ceiling | 15 kgCO₂e/USD | Display parameter |

No synthetic seeded data drives any output — the `sr()` helper is present but unused in calculations.

### 7.3 Calculation walkthrough

The user selects a country and sector; `getEmissionFactor` returns the EF from the country map, or
the regional average if absent. The spend-based calculator maps purchase categories to sectors and
multiplies each spend line by its EF, converting kg→t. The currency tool converts local-currency spend
to USD first via the year-indexed FX rate. Comparison tabs compute cross-country/cross-sector ratios,
and the data-quality tab reports coverage (which country-sector cells have EFs vs fall back to regional).

### 7.4 Worked example (spend-based Scope-3)

A US company spends $2M with an Indian steel supplier (EEIO EF ≈ 3.0 kgCO₂e/USD for basic iron &
steel) and $500k with a German electronics supplier (EF ≈ 0.4):
- Steel line: `3.0 · 2,000,000 = 6,000,000 kgCO₂e = 6,000 tCO₂e`
- Electronics line: `0.4 · 500,000 = 200,000 kgCO₂e = 200 tCO₂e`
- **Total Scope-3 (spend-based) ≈ 6,200 tCO₂e**

If the electronics purchase were entered in EUR, `convertCurrency` first applies the year's USD/EUR
rate before the EF multiply. Where a country-sector cell is empty, the regional EF substitutes and the
data-quality tab flags the line as regionally-sourced.

### 7.5 Data provenance & limitations
- **Real EEIO reference data** (CEDA 2025, 149×400) — no PRNG in the calculation path.
- Spend-based EEIO is inherently coarse: it estimates category-average intensity, not
  supplier-specific footprints; it cannot distinguish a low-carbon supplier from a sector-average one.
- EF vintage/deflation: intensities are base-year values; the module does not re-deflate spend to the
  EF base year beyond the FX conversion.
- EEIO systematically diverges from process LCA (guide notes ~40–60% average divergence); best for
  Scope-3 categories 1/2/4/5/6/7/8/11/12, weaker for 10/13/14/15.

**Framework alignment:** **GHG Protocol Corporate Value Chain (Scope 3) Standard** — the spend-based
method (`spend · EF`) is implemented directly. **CEDA 2025 v1** (Carnegie Mellon EIO-LCA) is the EF
source, derived by solving the Leontief input-output model with environmental extensions
`EF = f·(I−A)⁻¹` (direct-emission vector × Leontief inverse). **Exiobase 3.8.2** and **WIOD 2016**
underpin the multi-region tables; **ISO 14069** governs the Scope-3 category mapping. This module is a
faithful, data-backed EEIO explorer.
