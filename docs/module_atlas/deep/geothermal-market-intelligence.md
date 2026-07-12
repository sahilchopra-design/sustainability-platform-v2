## 7 · Methodology Deep Dive

Geothermal Market Intelligence (EP-DV3) is a **descriptive market-tracker**: installed capacity,
project pipeline, developer landscape, capacity history and investment flows by country. The
"calculation engine" is a simple capacity-share metric; the value is in the curated, largely-real
dataset (partly wired to the platform's public IRENA seed). No guide↔code mismatch.

### 7.1 What the module computes

```js
IRENA_GEOTHERMAL = (IRENA_RENEWABLE_CAPACITY_2023||[]).filter(c => c.geothermal_gw > 0).map(...);
totalInstalled   = COUNTRIES.reduce((s,c) => s + c.installed, 0);   // sum MW
totalPipeline    = COUNTRIES.reduce((s,c) => s + c.pipeline, 0);
top3             = [...COUNTRIES].sort((a,b) => b.installed - a.installed).slice(0,3);
// implied capacity share: c.installed / totalInstalled × 100 (guide formula)
```

The only formula is **capacity share** = country GW / global total GW × 100. Everything else is
aggregation and ranking over the seed tables.

### 7.2 Parameterisation & data provenance

| Dataset | Rows | Key fields | Provenance |
|---|---|---|---|
| `COUNTRIES` | 16 | `installed` MW, `pipeline`, `resource` MW, `heatFlow` mW/m², `risk`, `ipo` | **Largely real** — USA 3,706 MW, Indonesia 2,356, Philippines 1,918, Turkey 1,682, Kenya 990 match IRENA/ThinkGeoEnergy 2023 |
| `IRENA_GEOTHERMAL` | derived | filtered from `IRENA_RENEWABLE_CAPACITY_2023` public seed | **Real** — platform reference-data layer |
| `DEVELOPERS` | 10 | `company, mw, listed, market, focus` | **Real** — Ormat (NYSE:ORA), KenGen, Pertamina (IDX:PGEO), Fervo, Eavor |
| `CAPACITY_HISTORY` | 12 | `installed, heat` 2000–2050 | Historical real to 2023; 2025–2050 are projections |
| `INVESTMENT_FLOWS` | 7 | `investment, pipeline, growth` | Synthetic/illustrative |

The installed-capacity and developer tables are among the most genuinely-sourced datasets in the
atlas — real projects (The Geysers, Olkaria, Larderello), real listed developers with tickers.

### 7.3 Calculation walkthrough

1. Sum `installed` and `pipeline` across 16 countries for headline totals.
2. Sort by installed → top-3 leaders + capacity-share bar chart.
3. `CAPACITY_HISTORY` drives the 2000→2050 growth line (power + direct-use heat GWth).
4. Developer table ranks operators by MW; IPO column flags listed vs private.
5. Direct-use thermal (~90–107 GWth) shown alongside power (installed MW) to contextualise scale.

### 7.4 Worked example (USA capacity share)

`installed_USA = 3,706 MW`. If `totalInstalled ≈ 15,900 MW` (sum of the 16 rows ≈ global 2023):

```
USA share = 3,706 / 15,900 × 100 ≈ 23.3%
```

USA holds ~23% of global installed geothermal capacity — the largest single fleet, matching IRENA's
2023 ranking (USA #1, Indonesia #2, Philippines #3).

### 7.5 Data provenance & limitations

- **Country installed/pipeline and developer tables are real** (IRENA/ThinkGeoEnergy 2023); the
  `IRENA_GEOTHERMAL` derivation reads the platform's public reference-data seed.
- `CAPACITY_HISTORY` beyond 2023 and `INVESTMENT_FLOWS` are projections/illustrative, not measured.
- The single `sr()` PRNG import is unused in the load-bearing aggregations (present for any chart
  jitter only).
- No probability-weighting of the pipeline (all pipeline MW counted equally regardless of FID stage) —
  the sibling *country-intelligence* module adds completion-probability weighting.

**Framework alignment:** *IRENA Renewable Capacity Statistics 2023* — installed-capacity figures and
the capacity-share metric follow IRENA's country accounting. *ThinkGeoEnergy Top-10 Geothermal
Countries* — ranking methodology. *IGA World Geothermal Congress* — the ~90 GWth direct-use figure.
The module is a market-intelligence tracker, so it *reports* rather than *models* these standards.

*(No §8 model specification required — the module is a descriptive tracker over largely-real market
data, not a risk/financial model producing synthetic quantities.)*
