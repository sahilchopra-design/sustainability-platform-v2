## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (partial).** The guide cites **DEFRA/BEIS Conversion Factors 2023** and a
> Carnegie Mellon-style **EEIO model** with category emission factors in kgCO₂e/£. The code does not
> reference DEFRA factors, does not use £ (it's USD, `amount_usd`), and uses just **5 flat,
> hand-picked category multipliers** (0.8/1.2/0.5/0.3/0.15 kgCO₂e per $) rather than a granular
> multi-sector EEIO table. The category set (`Food, Transport, Home, Shopping, Entertainment`) is
> also coarser than the real GHG Protocol Scope 3 Category 1 taxonomy the guide references.

### 7.1 What the module computes

For demo data (used whenever the user has no saved wallet in `localStorage['ra_carbon_wallet_v1']`),
`generateDemoTransactions()` builds ~8–15 transactions/month × 12 months, each with:

```
amount_usd = 5 + sr()×150                                    // $5–155
carbonBase = {Food:0.8, Transport:1.2, Home:0.5, Shopping:0.3, Entertainment:0.15}[category]
carbon_kg  = amount_usd × carbonBase × (0.5 + sr())            // ±50% noise band around carbonBase
```

Real (non-demo) transactions carry whatever `amount_usd`/`carbon_kg` the wallet import already
assigned — this module's own carbon-factor logic only applies to synthetic demo data.

### 7.2 Parameterisation

| Category | `carbonBase` (kgCO₂e/$) | Provenance |
|---|---|---|
| Transport | 1.20 | Synthetic; directionally consistent with transport being carbon-intensive per dollar, but not a DEFRA-sourced coefficient |
| Food | 0.80 | Synthetic |
| Home | 0.50 | Synthetic |
| Shopping | 0.30 | Synthetic |
| Entertainment | 0.15 | Synthetic |
| Noise band | `×(0.5+sr())` | ±50% multiplicative noise around each category's base factor |
| `budget15C` | 2,300 kgCO₂e/person/year | Hardcoded — this is a real, defensible order-of-magnitude figure (widely cited 1.5°C-consistent per-capita 2030 carbon budget is ~2.1–2.3 tCO₂e), but the code comment marks it "approximate," and it is not attributed to a specific IPCC/Global Carbon Project publication |

### 7.3 Calculation walkthrough

1. **Ingestion** — `transactions` load from `localStorage` or fall back to synthetic demo data.
2. **`analyzeSpendingPatterns`** — groups into `byCategory` (Σ spend, Σ carbon, `intensity =
   total_carbon/total_usd` guarded by `>0`) and `byMonth` (same, keyed by `YYYY-MM`).
3. **Headline KPIs** — `totalSpend`, `totalCarbon` (simple sums), `carbonPerDollar = totalCarbon /
   totalSpend` (guarded `totalSpend>0`).
4. **Best/worst month** — `monthlyData.reduce` picks the lowest/highest `intensity` month.
5. **Mismatch chart** — `spendPct` vs. `carbonPct` per category, `mismatch = carbonPct − spendPct`
   highlights categories whose carbon share exceeds their spend share (i.e. carbon-inefficient
   categories) — a genuinely useful derived metric even though the underlying factors are synthetic.
6. **What-if calculator** — four sliders (beef reduction %, transport switch %, energy reduction %,
   shopping reduction %) each multiply a **fixed** annual saving constant from `TRANSITION_PATHS`
   (`beefSave = beefReduction/100 × 1310kg`, etc.) — these constants (1310/835/500/178 kg) are the
   `carbon_save_annual_kg` values from specific named `TRANSITION_PATHS` rows (Beef→Plant-based,
   Drive→Train, etc.), reused generically rather than computed from the user's actual transaction mix.
7. **Reduction-needed** — `reductionNeeded = annualCarbon>budget15C ? (annualCarbon−budget15C)/
   annualCarbon×100 : 0`, i.e. the % cut required to reach the 2,300kg/yr 1.5°C-consistent per-capita
   budget from the user's current annualised footprint.
8. **Peer benchmarks** — `PEER_BENCHMARKS` is a hand-typed table of 9 countries' average annual
   footprint (tonnes) and carbon intensity — plausible real-world orders of magnitude (USA 14.7t,
   India 1.9t, Global Avg 4.7t — broadly consistent with published per-capita territorial emissions,
   though the intended scope — production, consumption, or spend-based — is not specified) used only
   for a comparison bar, not joined into any calculation.

### 7.4 Worked example

Demo generator, first transaction of month 1 (`_sc` starts at 1000): `count=15` transactions this
month; first transaction resolves `category='Shopping'`, `amount_usd = 5+sr(1002)×150 = $13.36`,
`carbon_kg = 13.36×0.3×(0.5+sr(1004)) = 5.03kg` → implied intensity `5.03/13.36 ≈ 0.376 kgCO₂e/$`,
within the Shopping category's designed [0.15, 0.45] range (`0.3×[0.5,1.5]`).

If this user's `totalCarbon` (annualised) were, say, 9,200kg vs. the 2,300kg budget:
`reductionNeeded = (9200−2300)/9200×100 ≈ 75%` — a 75% cut needed to reach the cited 1.5°C-consistent
per-capita budget.

### 7.5 Companion analytics

- **Category/monthly breakdown, scatter, day-of-week heatmap** — all straightforward aggregations of
  the same `carbon_kg`/`amount_usd` fields; no additional modelling.
- **Transition recommendations** — 11 named lifestyle-swap options (beef→plant-based, drive→train,
  etc.) each with a fixed `carbon_save_annual_kg` and `cost_save_annual_usd` — these are plausible,
  literature-consistent orders of magnitude (e.g. beef→plant-based ≈1,310kg/yr is in the range of
  published dietary-shift LCA studies) presented as fixed constants, not computed per-user.
- **CSV export** — raw transaction-level export with computed per-transaction intensity.

### 7.6 Data provenance & limitations

- Demo-mode carbon intensities are **entirely synthetic** (5 flat category multipliers ± noise);
  real (imported) transactions inherit whatever `carbon_kg` value the upstream import process
  assigned — this module does not itself apply DEFRA or any EEIO table to real transaction data.
- No granularity below 5 broad categories — real EEIO-based spend footprinting (e.g. DEFRA's ~50+
  category factor table) would materially change both totals and category rankings.
- `PEER_BENCHMARKS` figures are plausible but their measurement basis (territorial vs. consumption vs.
  spend-based) is undocumented, making direct comparison to a spend-based user footprint
  methodologically inconsistent (apples-to-oranges scope mismatch).
- `TRANSITION_PATHS` savings constants are generic literature-style values, not computed from the
  specific user's transaction history — the "Beef 2×/week → Plant-based 2×/week" saving of 1,310kg/yr
  applies identically regardless of how much the user actually spends on beef.

**Framework alignment:** GHG Protocol Scope 3 Category 1 (guide-referenced category framing, coarser
5-category taxonomy in code) · DEFRA/BEIS Conversion Factors (named in guide, not implemented) ·
IPCC/Global Carbon Project 1.5°C per-capita carbon budget (~2.3tCO₂e/yr by 2030, the basis for the
hardcoded `budget15C` constant).
