# LP Reporting
**Module ID:** `lp-reporting` · **Route:** `/lp-reporting` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Standardised ESG reporting module for private equity and real assets fund managers preparing investor (LP) sustainability reports aligned with ILPA ESG Data Convergence Initiative (EDCI), UN PRI, and AIFMD Article 23 requirements. Aggregates portfolio company-level ESG data, computes fund-level KPIs, and generates investor-ready report packs. Supports GHG intensity, diversity, and governance metric benchmarking against EDCI cohort data.

> **Business value:** Enables private equity managers to meet ILPA EDCI, UN PRI, and AIFMD LP reporting obligations efficiently, with standardised GHG, diversity, and safety KPIs that allow LPs to compare fund performance across the private markets universe.

**How an analyst works this module:**
- Configure fund profile with vintage year, strategy, geography, and AIFMD classification
- Upload or connect portfolio company ESG data using the EDCI standardised template
- Review fund-level KPI computation with imputation flags for companies with incomplete data
- Benchmark fund KPIs against EDCI cohort medians by strategy and vintage year
- Generate LP report pack with fund ESG summary, company-level data annex, and PRI alignment statement

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLLECTION_STATUS`, `Card`, `EDCI_METRICS`, `EDCI_VALUES`, `FRAMEWORKS`, `FUNDS`, `LS_CONFIG`, `LS_TEMPLATES`, `PAI_INDICATORS`, `PIE_COLORS`, `SDG_MAP`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FUNDS` | 13 | `name`, `type`, `commitment_mn`, `nav_mn` |
| `EDCI_METRICS` | 11 | `category`, `metric`, `unit`, `aggregation` |
| `PAI_INDICATORS` | 15 | `indicator`, `category`, `value`, `coverage` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `selectAllFunds` | `() => setSelectedFunds(FUNDS.map(f => f.id));` |
| `selFunds` | `useMemo(() => FUNDS.filter(f => selectedFunds.includes(f.id)), [selectedFunds]); const totalCommit = useMemo(() => selFunds.reduce((s,f) => s + f.commitment_mn, 0), [selFunds]);` |
| `totalPossible` | `selFunds.length * 10;` |
| `completeness` | `totalPossible > 0 ? (metricsCollected / totalPossible * 100) : 0;` |
| `edciCompliance` | `completeness > 0 ? Math.min(completeness + 5, 100) : 0;` |
| `yoyData` | `useMemo(() => EDCI_METRICS.map(m => {` |
| `change` | `v.prior ? ((v.current - v.prior) / Math.abs(v.prior) * 100) : null;` |
| `radarData` | `useMemo(() => { return ['GHG Intensity','Renewables %','Board Diversity','Engagement','Injury Rate'].map((label, i) => { const keys = ['EDCI-2','EDCI-3','EDCI-4','EDCI-7','EDCI-6'];` |
| `normCurrent` | `i === 4 ? Math.max(0, 100 - v.current * 20) : Math.min(100, v.current * (i === 0 ? 1 : 1));` |
| `normBench` | `i === 4 ? Math.max(0, 100 - (v.benchmark\|\|0) * 20) : Math.min(100, (v.benchmark\|\|0) * (i === 0 ? 1 : 1));` |
| `sdgMatrix` | `useMemo(() => { const sdgs = Array.from({ length:17 }, (_, i) => i + 1);` |
| `rows` | `yoyData.map(d => `${d.id},${d.category},"${d.metric}",${d.current},${d.prior},${d.benchmark??''},${d.change?.toFixed(1)??''},${d.quality}`).join('\n');` |
| `blob` | `new Blob([header + rows], { type:'text/csv' });` |
| `exportPDF` | `() => { exportHTML(); /* Triggers print-friendly HTML; user can print to PDF */ };` |
| `pct` | `(st.collected / st.total * 100);` |
| `missing` | `st.total - st.collected;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EDCI_METRICS`, `FRAMEWORKS`, `FUNDS`, `PAI_INDICATORS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 1+2 GHG Intensity (tCO2e/$M rev) | — | EDCI / portfolio company data | AUM-weighted portfolio GHG intensity; enables LP-to-LP comparability via EDCI cohort |
| EDCI Data Coverage (%) | — | ILPA EDCI data submission | Proportion of portfolio companies reporting all six core EDCI KPIs |
| Board Gender Diversity (%) | — | EDCI Diversity KPI | Proportion of portfolio company board seats held by women across the fund |
| Lost-Time Injury Rate (per 200k hrs) | — | EDCI Health & Safety KPI | Employee injury frequency rate normalised to 200,000 working hours across portfolio |
- **Portfolio company ESG survey / EDCI template submissions** → Validate against EDCI schema; flag gaps; apply sector-median imputation for missing values → **Standardised portfolio company ESG data set with coverage and imputation flags**
- **EDCI cohort benchmark database** → Match fund strategy and vintage to peer cohort; extract quartile distributions per KPI → **Benchmark percentile ranking for each fund KPI against EDCI cohort**
- **PRI reporting templates** → Map fund and portfolio data to PRI module questions; assess alignment score → **PRI module responses and fund-level responsible investment assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** Fund-Level GHG Intensity
**Headline formula:** `GHG_fund = Σᵢ (GHGᵢ / Revenueᵢ) × (AUMᵢ / AUM_fund)`

Fund-level GHG intensity is the AUM-weighted average of portfolio company Scope 1+2 intensity (tCO2e per USD million revenue). Missing company data is addressed by applying sector EDCI median estimates with disclosure of imputation rate. Board diversity and health & safety metrics follow EDCI standardised definitions and collection templates.

**Standards:** ['ILPA EDCI Metrics 2023', 'UN PRI Reporting Framework 2023', 'GHG Protocol Private Equity Guidance', 'AIFMD Regulation EU 231/2013']
**Reference documents:** ILPA ESG Data Convergence Initiative Metrics v1.3 2023; UN PRI Limited Partners Responsible Investment DDQ 2023; GHG Protocol Private Equity Guidance 2023; AIFMD Regulation EU 231/2013 and ESG disclosure requirements; EVCA / Invest Europe ESG Reporting Guidelines 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — EDCI intake and fund KPIs that actually recompute (analytics ladder: rung 1 → 2)

**What.** A PRNG-free but static configurator: §7 documents that `EDCI_VALUES` is one fixed set of ten numbers wholly independent of the fund toggle — selecting 1 fund vs all 12 changes completeness and SDG coverage but never the displayed GHG intensity, diversity or injury-rate metrics, so the guide's AUM-weighted `GHG_fund = Σ (GHGᵢ/Revᵢ)·(AUMᵢ/AUM_fund)` is never recomputed. The `edciCompliance = completeness + 5` bonus has no cited basis. The real assets: authentic ILPA EDCI metric definitions, PAI indicator structure, and a sensible report-pack UX. Evolution A builds the missing data spine: portfolio-company EDCI submissions (company × metric × period × value × data-quality flag) via the standardised template the §1 workflow already names, fund-level KPIs computed per the §5 aggregation rules (AUM-weighted intensity, coverage-weighted means) that genuinely respond to fund selection, and sector-median imputation *with disclosed imputation rate* per the lineage description.

**How.** (1) Tables `edci_submissions`, `fund_holdings`; `GET /lp-reporting/fund-kpis?funds=` computing each EDCI metric per its `aggregation` rule (the metric table already carries the aggregation type — the engine just has to honour it). (2) Imputation as an explicit step: missing company values filled from sector medians with per-metric imputation-rate disclosure, mirroring EDCI's own convention. (3) The +5 bonus deleted; EDCI compliance re-defined as core-KPI coverage. (4) Cohort benchmarks stored with vintage (EDCI publishes aggregate benchmarks to members; a labeled internal-cohort fallback otherwise).

**Prerequisites.** Company-level data intake (template upload); fund/holding structure joined to the platform portfolio spine. **Acceptance:** toggling funds changes every KPI; each metric shows coverage % and imputation rate; the AUM-weighted intensity reproduces by hand from stored submissions.

### 9.2 Evolution B — LP report-pack generator with imputation candour (LLM tier 2)

**What.** The module's terminal artifact — the LP report pack (fund ESG summary, company annex, PRI alignment statement) — is a document-generation task over the Evolution A data: "generate the FY25 LP pack for Climate Transition Fund I", "explain to an LP why our GHG intensity rose 12% YoY" (decomposition: portfolio change vs company performance vs coverage change — a genuinely subtle attribution the copilot can compute and narrate), "draft the AIFMD Article 23 ESG paragraph."

**How.** Tier 2 over the fund-KPI routes; the pack template maps to EDCI/PRI section structures with every figure tool-validated. The distinguishing discipline is imputation candour: any KPI with imputed inputs carries its imputation rate in the narrative ("GHG intensity: 142 tCO₂e/$M, 30% of NAV imputed at sector medians") — LP reporting that hides estimation quality is the trust-destroying failure mode in private markets ESG. YoY explanations must decompose mechanically (same-company delta vs composition effect) from the stored periods, not narrate plausible causes. PRI alignment statements map to the actual PRI module questions with per-question evidence status.

**Prerequisites (hard).** Evolution A's intake and computed KPIs (a generated LP pack over static demo values would be fabricated investor reporting); Phase 2 tooling. **Acceptance:** pack figures 100% tool-traceable; imputation rates present wherever imputation occurred; YoY narratives reproduce from the logged decomposition.