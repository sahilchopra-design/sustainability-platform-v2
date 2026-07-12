# Spending Carbon
**Module ID:** `spending-carbon` · **Route:** `/spending-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Personal and corporate spend-based carbon footprint calculator that converts expenditure categories into GHG emissions using environmentally extended input-output (EEIO) coefficients.

> **Business value:** Spend-based footprinting enables rapid Scope 3 estimation where activity data is unavailable; suitable for SMEs and personal carbon budgets.

**How an analyst works this module:**
- Ingest spend data by category (finance system or manual entry)
- Map categories to EEIO emission factors
- Compute category-level and total emissions
- Benchmark against sector peers and national averages
- Generate reduction recommendations by highest-impact category

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PEER_BENCHMARKS`, `PIE_COLORS`, `SEASONAL_LABELS`, `TRANSITION_PATHS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TRANSITION_PATHS` | 11 | `to`, `carbon_save_annual_kg`, `cost_save_annual_usd`, `difficulty`, `health_impact`, `category` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `count` | `8 + Math.floor(sr(_sc++) * 8);` |
| `cat` | `cats[Math.floor(sr(_sc++) * cats.length)];` |
| `desc` | `descs[cat][Math.floor(sr(_sc++) * descs[cat].length)];` |
| `amt` | `+(5 + sr(_sc++) * 150).toFixed(2);` |
| `carbon` | `+(amt * carbonBase * (0.5 + sr(_sc++))).toFixed(2);` |
| `totalSpend` | `useMemo(() => transactions.reduce((s, t) => s + (t.amount_usd \|\| 0), 0), [transactions]);` |
| `totalCarbon` | `useMemo(() => transactions.reduce((s, t) => s + (t.carbon_kg \|\| 0), 0), [transactions]);` |
| `carbonPerDollar` | `totalSpend > 0 ? totalCarbon / totalSpend : 0;` |
| `categoryData` | `useMemo(() => Object.entries(byCategory) .map(([name, d]) => ({ name, totalCarbon: +d.total_carbon.toFixed(2), totalUsd: +d.total_usd.toFixed(2), intensity: +d.intensity.toFixed(3), count: d.count })) .sort((a, b) => b.intensity - a.intensity), [byCategory]);` |
| `pieData` | `useMemo(() => categoryData.map(c => ({ name: c.name, value: c.totalCarbon })), [categoryData]);` |
| `monthlyData` | `useMemo(() => Object.entries(byMonth) .sort(([a], [b]) => a.localeCompare(b)) .map(([month, d]) => ({ month, usd: +d.usd.toFixed(0), carbon: +d.carbon.toFixed(1), count: d.count, intensity: d.usd > 0 ? +(d.carbon / d.usd).toFixed(3) : 0 })), [byMonth]);` |
| `bestMonth` | `useMemo(() => monthlyData.reduce((best, m) => (!best \|\| m.intensity < best.intensity) ? m : best, null), [monthlyData]); const worstMonth = useMemo(() => monthlyData.reduce((worst, m) => (!worst \|\| m.intensity > worst.intensity) ? m : worst, null), [monthlyData]);` |
| `lowestCat` | `categoryData.length > 1 ? categoryData[categoryData.length - 1] : null;` |
| `scatterData` | `useMemo(() => transactions.map(t => ({` |
| `sortedByIntensity` | `useMemo(() => transactions.filter(t => t.amount_usd > 0).map(t => ({ ...t, intensity: t.carbon_kg / t.amount_usd })).sort((a, b) => b.intensity - a.intensity), [transactions]);` |
| `whatIfSaving` | `useMemo(() => { const beefSave = (beefReduction / 100) * 1310;` |
| `transportSave` | `(transportSwitch / 100) * 835;` |
| `energySave` | `(energyReduction / 100) * 500;` |
| `shopSave` | `(shoppingReduction / 100) * 178;` |
| `annualCarbon` | `totalCarbon; // approximate from data period` |
| `forecastCarbon` | `annualCarbon * forecastYears;` |
| `budget15C` | `2300; // kg CO2e per person for 1.5C pathway annual` |
| `reductionNeeded` | `annualCarbon > budget15C ? (((annualCarbon - budget15C) / annualCarbon) * 100).toFixed(0) : 0;` |
| `potentialSavings` | `TRANSITION_PATHS.reduce((s, t) => s + t.carbon_save_annual_kg, 0);` |
| `rows` | `transactions.map(t => `${t.date},"${t.description}",${t.category},${t.amount_usd},${t.carbon_kg},${t.amount_usd > 0 ? (t.carbon_kg / t.amount_usd).toFixed(3) : ''}`).join('\n');` |
| `blob` | `new Blob([header + rows], { type: 'text/csv' });` |
| `avgTxn` | `catTxns.length > 0 ? (cat.totalUsd / catTxns.length).toFixed(2) : 0;` |
| `avgCarbon` | `catTxns.length > 0 ? (cat.totalCarbon / catTxns.length).toFixed(2) : 0;` |
| `pct` | `totalCarbon > 0 ? ((cat.totalCarbon / totalCarbon) * 100).toFixed(1) : 0;` |
| `monthlyAvg` | `monthlyData.length > 0 ? (cat.totalCarbon / monthlyData.length).toFixed(1) : 0;` |
| `monthlyActual` | `catData ? catData.total_carbon / monthCount : 0;` |
| `dayData` | `dayNames.map(name => ({` |
| `spendPct` | `totalSpend > 0 ? (cat.totalUsd / totalSpend) * 100 : 0;` |
| `carbonPct` | `totalCarbon > 0 ? (cat.totalCarbon / totalCarbon) * 100 : 0;` |
| `mismatch` | `carbonPct - spendPct;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `TRANSITION_PATHS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Footprint | — | EEIO Model | Sum of all category emissions; benchmark against national per-capita average of 10–12 tCO2e. |
| Highest Category | — | Spend Ledger | Category contributing largest share of footprint; primary reduction lever. |
| Emission Intensity | — | DEFRA EF 2023 | Weighted average emission factor across all spend; lower is greener. |
- **Spend Ledger / Bank Feed** → Category mapping + EEIO coefficient lookup → **Category footprint breakdown, reduction roadmap**

## 5 · Intermediate Transformation Logic
**Methodology:** Spend-Based Emission Factor
**Headline formula:** `Emissions = Spend (×) EF (kgCO2e/£)`

Multiply spend in each category by the corresponding EEIO emission factor to derive tCO2e.

**Standards:** ['GHG Protocol Scope 3 Cat 1', 'DEFRA EEIO 2023']
**Reference documents:** GHG Protocol Corporate Value Chain Standard; DEFRA/BEIS Conversion Factors 2023; Carnegie Mellon EEIO Model

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real DEFRA/EEIO factor table applied to actual transactions (analytics ladder: rung 1 → 2)

**What.** The §7 flag shows the module doesn't do what its guide claims: it cites DEFRA/BEIS 2023 factors and a Carnegie Mellon EEIO model in kgCO₂e/£, but the code uses **5 flat hand-picked USD multipliers** (Food 0.8, Transport 1.2, Home 0.5, Shopping 0.3, Entertainment 0.15) with ±50% noise, and applies them only to synthetic demo transactions — real imported transactions inherit whatever `carbon_kg` the upstream import assigned, so the module's own factor logic never touches real data. The `budget15C` = 2,300 kgCO₂e constant is a defensible 1.5°C per-capita figure but uncited. Evolution A implements the real EEIO footprinting the guide promises.

**How. **(1) Ingest a real EEIO factor table (DEFRA/BEIS conversion factors, ~50+ categories, free and published) keyed by spend category and currency, replacing the 5 flat multipliers and removing the ±50% noise. (2) Apply the factors to real imported transactions via a category mapping, so a user's actual spend produces an auditable spend-based Scope 3 estimate — the module's core promise. (3) Refine the category taxonomy from 5 broad buckets to the GHG Protocol Scope 3 Category 1 structure the guide references. (4) Cite `budget15C` to a specific IPCC/Global Carbon Project source, and fix the peer-benchmark scope mismatch (territorial vs consumption vs spend-based, currently undocumented, so comparisons are apples-to-oranges). (5) Make `TRANSITION_PATHS` savings a function of the user's actual category spend, not a flat constant.

**Prerequisites.** DEFRA/EEIO table ingestion and a category-mapping layer; multi-currency EF handling (module is USD, DEFRA is GBP). **Acceptance:** a real transaction's carbon derives from a sourced EEIO factor; changing spend in a category changes both total and the reduction recommendation; benchmarks are scope-matched to the spend-based user footprint.

### 9.2 Evolution B — Personal/SME carbon-budget copilot (LLM tier 1)

**What.** A copilot for the SME/personal-budget user: "where's most of my footprint coming from?", "how do I get under the 1.5°C per-capita budget?", "what would switching my commute save?" — answered from the real EEIO-computed category footprint and the transition-path savings, grounded in the user's actual transaction history.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/spending-carbon/ask`, corpus = this Atlas record (the EEIO methodology, the carbon-budget basis, GHG Protocol Cat 1 framing) plus the user's computed category footprint. Reduction recommendations are ranked by the user's real highest-impact categories (post-Evolution-A) and cite the sourced saving; budget answers compare the user's total to the cited 1.5°C figure. Privacy note: the copilot operates on the user's own wallet data only.

**Prerequisites.** Evolution A's real factors and per-user savings so recommendations reflect actual spend rather than the current flat "beef → plant-based saves 1,310kg regardless of consumption." **Acceptance:** every emissions figure traces to an EEIO-factored transaction; the top reduction recommendation matches the user's actual highest-impact category; the budget comparison cites the per-capita source.