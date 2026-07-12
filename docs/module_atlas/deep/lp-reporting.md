## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula
> `GHG_fund = Σᵢ (GHGᵢ/Revenueᵢ) × (AUMᵢ/AUM_fund)` implies fund-level GHG intensity is recomputed as
> an AUM-weighted average of the **currently selected funds'** portfolio companies. **The code never
> recomputes this.** `EDCI_VALUES` (the GHG intensity, renewables %, diversity, injury-rate figures
> shown in the YoY table and benchmark radar) are a **single fixed set of 10 numbers**, entirely
> independent of the `selectedFunds` toggle state — selecting 1 fund vs all 12 changes `totalCommit`,
> `metricsCollected`, `completeness`, and `sdgCoverage`, but the actual EDCI metric values displayed
> never change. Sections below document the code as it actually behaves.

### 7.1 What the module computes

An LP (Limited Partner) reporting configurator over 12 real-style named funds (Climate Transition
Fund I, European Real Estate Fund III, Asia Infrastructure Fund II, etc. across PE/RE/Infra/
Credit/VC/Listed asset classes) with **entirely static, hand-authored** ESG data — this module is
notable among its siblings for having **no `sr()`/random-PRNG call anywhere in the file**. Every
number is a fixed literal:

```js
completeness   = metricsCollected(selFunds) / (selFunds.length × 10) × 100
edciCompliance = min(completeness + 5, 100)                    // arbitrary +5 bonus, no cited basis
sdgCoverage    = |⋃ SDG_MAP[fund.id] for fund in selFunds|      // union of SDGs touched by selected funds
change (YoY)   = (current − prior) / |prior| × 100              // per EDCI metric, real % change
```

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `FUNDS` (12) | Name, asset class (PE/RE/Infra/Credit/VC/Listed FI/Listed Equity), commitment $M, NAV $M | Static, plausible fictional portfolio — not real named LP funds |
| `EDCI_METRICS` (10) | Real ILPA EDCI metric IDs and definitions (GHG Scope 1+2 total & intensity, renewable %, board/C-suite diversity, injury rate, engagement score, net hires, ESG policy Y/N, ESG incidents) | **Real** — matches the actual ILPA ESG Data Convergence Initiative's 6-8 core KPI set |
| `EDCI_VALUES` | current/prior/benchmark/quality per metric — fixed regardless of fund selection | Static demo values; `quality` field (High/Medium/Low) is itself hard-coded per metric, not computed from actual data-completeness |
| `PAI_INDICATORS` (14) | Real SFDR PAI indicator names, category, static value, coverage % | **Real** SFDR Annex I indicator names, though this module implements only 14 of the mandatory 18 (PAI 15-18, e.g. real-estate-specific indicators, are absent) |
| `SDG_MAP` | Per-fund list of SDGs "touched" | Static, hand-assigned — no evidenced linkage methodology |
| `COLLECTION_STATUS` | Per-fund `collected`/`total` (out of 10) plus a named contact | Static demo values |
| `radarData` normalisation | `i===4` (injury rate) inverted via `100 − value×20`; all other metrics via `min(100, value×1)` | Ad-hoc, unscaled — treats a raw tCO2e/$M intensity value or a renewables % directly as a 0-100 "score" with no denominator/benchmark-max normalisation, so any metric exceeding 100 in its native unit would silently clip |

### 7.3 Calculation walkthrough

- **Fund selector**: toggling `selectedFunds` recomputes `totalCommit` (Σ commitment_mn),
  `metricsCollected` (Σ `COLLECTION_STATUS[fund].collected`), `completeness`, `edciCompliance`, and
  `sdgCoverage` (union of SDGs across selected funds) — these 5 outputs **do** respond correctly to
  the fund selection.
- **YoY EDCI table** (`yoyData`): computes real percentage change per metric
  (`(current−prior)/|prior|×100`), and flags "better" direction per metric — correctly inverting the
  sign for metrics where lower is better (EDCI-6 injury rate, EDCI-10 ESG incidents) vs higher-is-
  better for the rest. This table's **inputs, however, never vary with fund selection** (§ mismatch
  flag above).
- **Benchmark Radar**: plots portfolio vs benchmark for 5 metrics using the unscaled normalisation
  described in §7.2 — e.g. GHG intensity (EDCI-2, current=68 tCO2e/$M) is plotted directly as
  "68/100," conflating a physical-unit intensity value with a percentile score.
- **SDG Matrix**: 17×N grid (17 SDGs × selected funds) marking "Direct"/"None" per
  fund-SDG pair from the static `SDG_MAP` lookup — a real, correctly-implemented set-membership
  render, though the underlying SDG linkages themselves are not evidenced.

### 7.4 Worked example

With all 12 funds selected: `metricsCollected = Σ COLLECTION_STATUS[f].collected` =
`8+9+6+7+10+5+9+10+4+7+6+9 = 90`; `totalPossible = 12×10 = 120`; `completeness = 90/120×100 = 75.0%`;
`edciCompliance = min(75+5, 100) = 80.0%`. Deselecting all funds except `F005` (Impact Ventures Fund
I, `collected:10`): `completeness = 10/10×100 = 100%`, `edciCompliance = min(105,100) = 100%` — a
correct recomputation. But the EDCI-1 "Total Scope 1+2 emissions" figure shown in the YoY table
remains **12,400 tCO2e** either way, even though a genuine fund-level aggregate for a 1-fund
selection should differ substantially from a 12-fund aggregate.

### 7.5 Data provenance & limitations

- **The core ESG metric values (`EDCI_VALUES`, `PAI_INDICATORS`) do not respond to the fund
  selector** — this is the module's most significant functional gap relative to its own guide and
  its own UI affordance (a fund multi-select that visually implies scope-sensitive reporting).
- `edciCompliance`'s `+5` bonus over raw completeness has no stated methodological basis.
- PAI coverage is 14 of the SFDR-mandated 18 indicators (missing PAI 15-18).
- Radar normalisation directly plots raw metric values as 0-100 scores without a denominator,
  which will silently misrepresent any metric whose natural scale exceeds 100 in its native unit.
- All fund, metric-value, and SDG-linkage data is static demo content, not derived from any real
  portfolio-company ESG survey submission.

**Framework alignment:** ILPA EDCI metric definitions are genuinely and correctly represented (10 of
the ILPA core KPI set). SFDR PAI indicator names and categories (Climate/Biodiversity/Water/Waste/
Social/Governance) are correctly drawn from Annex I, with the caveat of incomplete indicator
coverage (14/18). UN SDGs (17, correctly enumerated) are used descriptively. AIFMD is named in the
guide as the disclosure driver but has no operationalised compliance check in code.
