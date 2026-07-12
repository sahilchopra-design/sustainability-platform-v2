## 7 · Methodology Deep Dive

Geothermal Direct Heat Analytics (EP-DV5, badged EP-DV4 in the page header) models two heat systems:
a **ground-source heat-pump (GHP) COP economics** engine and a **district-heating LCOH** engine, plus
a Lindal-diagram cascade design and CO₂-savings comparison. The maths is genuine engineering
economics — no guide↔code mismatch, no PRNG in the load-bearing calculations.

### 7.1 What the module computes

**GHP economics** (`calcGhpEconomics`):
```js
annualElec     = heatingLoad / cop;                 // kWh electricity to deliver heat
annualElecCost = annualElec * electricityPrice;
gasEquivCost   = heatingLoad * gasPrice;            // incumbent fossil cost
annualSaving   = gasEquivCost - annualElecCost;
netInstall     = installCost * (1 - subsidyPct/100);
payback        = annualSaving > 0 ? netInstall/annualSaving : Infinity;
npvSavings     = annualSaving * (1 - (1+w)^-lifetime)/w;   // present-value annuity of savings
npv            = npvSavings - netInstall;
```

**District heating** (`calcDistrictHeating`):
```js
totalCapex = capexWell*wellsMw + capexNetwork*transmissionKm;
annRevenue = numBuildings*avgBuildingKw/1000 * heatPrice * 8760 * 0.85 / 1e6;  // 85% load factor
capexAnn   = totalCapex * w/(1 - (1+w)^-lifetime);        // CRF annuity
lcoh       = capexAnn / (numBuildings*avgBuildingKw/1000 * 8760 * 0.85);  // $/unit heat
```

**CO₂ savings**: `gasEmissions = heatingLoad×0.204` (kgCO₂/kWh gas), `elecEmissions =
heatingLoad/cop×0.233` (grid EF); saving = difference.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Gas emission factor | 0.204 kgCO₂/kWh | Natural-gas combustion EF (≈ DEFRA/EPA) |
| Grid emission factor | 0.233 kgCO₂/kWh | Grid electricity EF (UK/EU-typical) |
| DH load factor | 0.85 | 85% capacity utilisation (typical DH) |
| DH capexWell / capexNetwork | $1.2M/MW / $0.8M/km | EGEC market-report benchmarks |
| DH opex / wacc / lifetime | 3% / 7% / 30 yr | Standard DH finance assumptions |
| Default COP | 4.5 | GSHP coefficient of performance |
| Cascade tiers | 200→100→70→40→20 °C | Lindal-diagram temperature cascade |

Default sliders: heatingLoad 20,000 kWh, COP 4.5, gas $0.08/kWh, elec $0.12/kWh, install $18,000,
subsidy 30%, lifetime 25, discount 7%.

### 7.3 Calculation walkthrough

1. GHP sliders → electricity to deliver load (load/COP) → cost vs gas-equivalent → annual saving.
2. Subsidy reduces install cost; payback = net install / saving; NPV via annuity of savings.
3. DH sliders → capex (well + network) → CRF annuity → LCOH per unit heat at 85% load.
4. `paybackByCarbonPrice` adds a carbon bonus (`co2Saving×cp/1000`) to the annual saving and
   recomputes payback across carbon prices $0–200.
5. `copCompare` sweeps COP 2.5–6.0 to show electricity cost and saving sensitivity.

### 7.4 Worked example (default GHP)

heatingLoad 20,000 kWh, COP 4.5, gas $0.08, elec $0.12, install $18,000, subsidy 30%, w=7%, n=25.

| Step | Computation | Result |
|---|---|---|
| Annual electricity | 20,000 / 4.5 | 4,444 kWh |
| Electricity cost | 4,444 × 0.12 | $533 |
| Gas-equivalent cost | 20,000 × 0.08 | $1,600 |
| Annual saving | 1,600 − 533 | **$1,067** |
| Net install | 18,000 × 0.70 | $12,600 |
| Payback | 12,600 / 1,067 | **11.8 yr** |
| CO₂ saving | 20,000×0.204 − (20,000/4.5)×0.233 | 4,080 − 1,036 = **3,044 kg** |

Add a $100/tCO₂ carbon price: bonus = 3,044/1000 × 100 = $304 → effective saving $1,371 → payback
12,600/1,371 = **9.2 yr**. Carbon pricing materially shortens payback, the module's headline insight.

### 7.5 Data provenance & limitations

- **All techno-economic constants are curated benchmarks** (EGEC/IEA), not project-specific.
- The COP is treated as constant (no seasonal/ambient-temperature degradation).
- Grid EF is a single scalar (0.233) — real GHP savings depend on live/marginal grid intensity.
- DH LCOH uses an 85% flat load factor; real DH demand is seasonal.
- No dry-well or drilling-risk contingency in the DH capex (deterministic).

**Framework alignment:** *EGEC European Geothermal Market Report* — DH capex/LCOH benchmarks. *IEA
Geothermal Heat Roadmap* — direct-use COP advantage and industrial-heat temperature ranges. *Lindal
diagram* — the cascade tiers map resource temperature to end-use (power → process heat → greenhouse →
aquaculture). *EU RED III* — district-heating renewable-share context. Emission factors follow
standard DEFRA/EPA combustion and grid EFs.

*(No §8 model specification required — the module runs real GHP and district-heating economics
consistent with EGEC/IEA methodology.)*
