# Polysilicon & Wafer Supply Chain Intelligence
**Module ID:** `polysilicon-wafer-supply-chain` · **Route:** `/polysilicon-wafer-supply-chain` · **Tier:** B (frontend-computed) · **EP code:** EP-ED1 · **Sprint:** ED

## 1 · Overview
Global polysilicon and solar wafer supply chain intelligence. Maps production concentration, quantifies UFLPA compliance risk for Xinjiang-sourced material, calculates HHI market concentration, and compares Siemens vs FBR process economics.

> **Business value:** Used by solar developers, EPCs, project finance lenders, and institutional investors requiring UFLPA-compliant supply chains to assess polysilicon and wafer sourcing risk.

**How an analyst works this module:**
- Review supply landscape for concentration metrics and top producers
- Run UFLPA compliance scoring to identify high-risk suppliers
- Examine cost curve for Siemens vs FBR process economics
- Use geopolitical risk tab for China export restriction scenarios

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PRICE_HISTORY`, `SUPPLIERS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUPPLIERS` | 21 | `manufacturer`, `country`, `annualCapacityGW`, `costUsdKg`, `hhiShare`, `uyghurRisk`, `certs`, `tech`, `region` |
| `PRICE_HISTORY` | 13 | `polysiliconPrice`, `waferPriceCents`, `spotVsContract` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `regions` | `useMemo(() => ['All', ...Array.from(new Set(SUPPLIERS.map(s => s.region)))], []);` |
| `totalCapacity` | `useMemo(() => filteredSuppliers.reduce((a, s) => a + s.annualCapacityGW, 0), [filteredSuppliers]);` |
| `chinaCapacity` | `useMemo(() => SUPPLIERS.filter(s => s.country === 'China').reduce((a, s) => a + s.annualCapacityGW, 0), []);` |
| `chinaPct` | `useMemo(() => { const total = SUPPLIERS.reduce((a, s) => a + s.annualCapacityGW, 0);` |
| `hhi` | `useMemo(() => { const total = filteredSuppliers.reduce((a, s) => a + s.annualCapacityGW, 0);` |
| `avgUyghurRisk` | `useMemo(() => { return filteredSuppliers.length ? (filteredSuppliers.reduce((a, s) => a + s.uyghurRisk, 0) / filteredSuppliers.length).toFixed(1) : '0.0';` |
| `avgCost` | `useMemo(() => { return filteredSuppliers.length ? (filteredSuppliers.reduce((a, s) => a + s.costUsdKg, 0) / filteredSuppliers.length).toFixed(1) : '0.0';` |
| `regionConcentration` | `useMemo(() => { const totCap = SUPPLIERS.reduce((a, s) => a + s.annualCapacityGW, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `PRICE_HISTORY`, `SUPPLIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Polysilicon HHI | `HHI = Σ(MS_i²)` | SEIA UFLPA Risk Assessment 2023 | HHI > 2500 = highly concentrated; dominated by Tongwei, Daqo, GCL. |
| Xinjiang Exposure (%) | `Xinjiang_capacity / China_total` | Horizon Advisory / SEIA UFLPA Tracker | All Xinjiang-sourced material presumed UFLPA violation without full traceability. |
| Siemens vs FBR Cost ($/kg) | `Process cost benchmarking` | BNEF Polysilicon Cost Curve 2024 | FBR lower energy (40 vs 70 kWh/kg); Siemens dominant >80%. |
- **Producer capacity data + Xinjiang sourcing reports + UFLPA entity list + cost benchmarks** → HHI calculation + UFLPA risk scoring + Siemens/FBR cost model → **Supply chain risk assessment for UFLPA-compliant solar procurement**

## 5 · Intermediate Transformation Logic
**Methodology:** Supply Concentration & UFLPA Risk Scoring
**Headline formula:** `HHI = Σ(market_share_i²); UFLPA_risk = f(Xinjiang_sourcing, audit_gaps, traceability)`

Polysilicon: China ~85% global supply 2023; Xinjiang >40% of Chinese production. HHI ~2800 (highly concentrated). UFLPA: US CBP presumption that Xinjiang goods use forced labor.

**Standards:** ['UFLPA Entity List (US CBP)', 'SEIA UFLPA Supply Chain Traceability', 'IEA Solar PV Supply Chain 2023']
**Reference documents:** IEA Solar PV Supply Chain Report 2023; SEIA UFLPA Risk Assessment; Horizon Advisory Xinjiang Solar Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide and code are broadly aligned here: the module genuinely computes the Herfindahl-Hirschman
Index and China/region concentration from a curated 20-supplier dataset. The one gap is that the
**`uyghurRisk` UFLPA score is a hand-assigned 0–9 scalar**, not a `f(Xinjiang_sourcing, audit_gaps,
traceability)` function as the guide's formula implies — so §8 specifies that scoring model.

### 7.1 What the module computes

```js
totalCapacity = Σ_filtered annualCapacityGW
chinaPct      = chinaCapacity / totalCapacity_all × 100
HHI           = Σ_filtered ((annualCapacityGW / total_filtered) × 100)²        // real HHI
avgUyghurRisk = Σ uyghurRisk / n                                              // mean 0–9
avgCost       = Σ costUsdKg / n                                               // $/kg
regionConcentration[r] = capacity_r / total × 100                            // share by region
```

The HHI is the textbook definition — sum of squared **percentage** market shares — so its natural
range is 0–10 000, with >2 500 = highly concentrated. All divisions are guarded (`total ? … : 0`).

### 7.2 Parameterisation — curated supplier data

| Field | Type | Provenance |
|---|---|---|
| `annualCapacityGW` | 3–300 GW per supplier (20 rows) | curated from public capacity announcements (Tongwei 300, GCL 270, Daqo 180…) |
| `costUsdKg` | 5.1–19.2 $/kg | curated; tracks the Chinese-low / Western-high cost split (BNEF-style) |
| `hhiShare` | pre-computed % share (informational; HHI is recomputed live) | curated |
| `uyghurRisk` | integer 0–9 | **hand-assigned heuristic** — Chinese suppliers 6–9, Western 0 |
| `certs` | RBA / OECD / Signatory tags | curated |
| `tech` | Siemens vs FBR | curated |
| `PRICE_HISTORY` | 2014–2025 polysilicon $/kg + wafer ¢/W + spot/contract | curated real price history (2021–22 spike to $38/kg, 2024 crash to $5.4 visible) |

The `sr()` PRNG is imported at the top of the file but the supplier and price datasets are fully
hand-authored — no synthetic seeding drives the numbers shown.

### 7.3 Calculation walkthrough

1. `SUPPLIERS` (20) and `PRICE_HISTORY` (12) load statically.
2. Region/Tech filters produce `filteredSuppliers`.
3. `chinaPct` always uses the **full** universe (denominator not filtered) so it reads true global
   China dominance regardless of the filter.
4. `HHI` uses the **filtered** total as denominator — filtering to one region inflates HHI toward the
   single-supplier ceiling, which is the intended "concentration within selection" reading.
5. `techComparison` groups by Siemens/FBR for the cost/energy comparison chart.

### 7.4 Worked example — HHI

Three suppliers pass a filter with capacities 300, 270, 180 GW (total 750):

| Supplier | share % | share² |
|---|---|---|
| Tongwei | 300/750 = 40.0 | 1600 |
| GCL-Poly | 270/750 = 36.0 | 1296 |
| Daqo | 180/750 = 24.0 | 576 |
| **HHI** | | **3472** |

3 472 > 2 500 → highly concentrated, matching the guide's "~2,800" global figure for the full
universe (which includes the long tail of small Western/Asian suppliers, pulling HHI down).

### 7.5 Data provenance & limitations

- **No synthetic data** — supplier capacities, costs and the 2014–2025 price series are curated from
  public sources; HHI, China %, and region shares are computed live and are methodologically correct.
- **`uyghurRisk` is the weak link**: a single hand-set integer per supplier, not decomposed into
  Xinjiang-sourcing share, audit-gap, and traceability sub-scores. It is descriptive, not auditable.
- No mass-balance traceability, no CBP detention-rate data, no polysilicon-to-module chain-of-custody.

**Framework alignment:** HHI (US DOJ/FTC Horizontal Merger Guidelines — >2 500 highly concentrated) is
implemented exactly · UFLPA (US CBP) — the `uyghurRisk` field nominally proxies CBP's rebuttable
presumption that Xinjiang-origin goods use forced labour, but CBP admissibility actually turns on
documentary traceability (mass-balance / isotopic tracing), which is not modelled · SEIA UFLPA
Traceability Protocol and IEA *Solar PV Supply Chain 2023* are cited as the data lineage for capacity
and Xinjiang-exposure figures.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the scalar `uyghurRisk` with a decomposed **UFLPA detention-probability score** per supplier
and per shipment, so solar developers, EPCs and project-finance lenders can screen procurement for
US CBP admissibility risk. Coverage: polysilicon, ingot, wafer, cell, module tiers.

### 8.2 Conceptual approach
A **weighted forced-labour-exposure index** feeding a **logistic detention-probability model**,
mirroring Horizon Advisory / Sheffield Hallam supply-chain exposure methodology and CBP's own
risk-targeting logic (documentary traceability drives admissibility). Combine an exposure sub-score
(sourcing geography) with a mitigation sub-score (traceability + audits), then map to P(detention).

### 8.3 Mathematical specification
```
Exposure_i   = w_X·XinjiangShare_i + w_U·UpstreamXinjiang_i + w_E·EntityListLink_i
Mitigation_i = m_T·TraceabilityTier_i + m_A·AuditCoverage_i + m_C·CertScore_i
UFLPARisk_i  = clip( Exposure_i × (1 − Mitigation_i), 0, 1 )           // 0–1
P(detention) = 1 / (1 + exp(−(β0 + β1·UFLPARisk_i)))
ShipmentRisk = P(detention) × ShipmentValue × ExpectedDelayCost
```

| Parameter | Calibration source |
|---|---|
| `XinjiangShare`, `UpstreamXinjiang` | Sheffield Hallam *In Broad Daylight* / Horizon Advisory mapping |
| `EntityListLink` | UFLPA Entity List (US CBP/DHS) membership flag |
| `TraceabilityTier` | mass-balance vs isotopic vs none; SEIA Traceability Protocol |
| `AuditCoverage`, `CertScore` | RBA/OECD audit status (already in `certs`) |
| `β0, β1` | fit to historical CBP detention outcomes (CBP UFLPA Statistics dashboard) |
| weights `w_*, m_*` | expert-set, sensitivity-tested; Σw=1, Σm=1 |

### 8.4 Data requirements
`xinjiang_sourcing_share`, `upstream_polysilicon_origin`, `entity_list_flag`, `traceability_tier`,
`audit_status`, `shipment_value`, `expected_delay_cost`. Sources: Sheffield Hallam / Horizon reports
(free), CBP UFLPA statistics (free), supplier chain-of-custody declarations (primary), RBA audit DB.
Platform already stores `certs`, `country`, and capacity; the sourcing-share fields are new.

### 8.5 Validation & benchmarking plan
Backtest `P(detention)` against CBP's published UFLPA enforcement statistics (shipments detained/
released by commodity). Reconcile the exposure ranking against Sheffield Hallam supplier tiers.
Sensitivity-test weights and the logistic β on out-of-sample shipments.

### 8.6 Limitations & model risk
Xinjiang-sourcing data is opaque and self-reported; CBP targeting logic is partly non-public;
detention outcomes are sparse (thin calibration set). Conservative fallback: treat any supplier with
`EntityListLink=1` or `TraceabilityTier=none` as high-risk regardless of the fitted probability.

## 9 · Future Evolution

### 9.1 Evolution A — Formula-based UFLPA scoring and live capacity data (analytics ladder: rung 2 → 3)

**What.** §7 confirms the module is broadly sound: it genuinely computes the Herfindahl-Hirschman Index (textbook `Σ(share%)²`, natural range 0–10,000, >2,500 = concentrated, divisions guarded), China/region concentration, and averages over a well-curated 20-supplier dataset with real capacity announcements (Tongwei 300GW, GCL 270, Daqo 180), real cost splits ($5.1–19.2/kg), and real price history (the 2021–22 spike to $38/kg and 2024 crash to $5.4 both visible). The one gap: `uyghurRisk` is a hand-assigned 0–9 scalar (Chinese 6–9, Western 0), not the `f(Xinjiang_sourcing, audit_gaps, traceability)` function the guide's formula implies. §8 specifies that scoring model. Evolution A builds it and refreshes the curated data.

**How.** (1) Implement the UFLPA-risk formula as a real composite: Xinjiang-sourcing share (the module already knows China %), audit-gap indicator (from the `certs` field — RBA/OECD signatory status), and traceability score — so a supplier's risk responds to its actual sourcing and certification rather than a hand-assigned integer. Ground it in the SEIA UFLPA Traceability protocol and CBP Entity List (both named in §5) — CBP publishes the actual UFLPA Entity List, so a supplier's presence on it is a hard input, not a guess. (2) Refresh capacity/cost from IEA Solar PV Supply Chain data (named in §5) on a schedule rather than hand-maintaining. (3) The HHI and concentration math are correct — keep them.

**Prerequisites.** CBP UFLPA Entity List ingestion (public); SEIA traceability criteria; IEA capacity data refresh. The HHI is textbook-correct — pin it in `bench_quant`. **Acceptance:** UFLPA risk reproduces from sourcing/audit/traceability inputs (and Entity-List membership is a hard flag), not a hand-assigned integer; capacity data refreshes from IEA; HHI matches the pinned reference.

### 9.2 Evolution B — Supply-chain-diligence copilot for solar financiers (LLM tier 2)

**What.** A copilot for the developer/EPC/lender users §1 targets: "what's the polysilicon market HHI and top producers?", "which suppliers are UFLPA-high-risk and why?", "compare Siemens vs FBR process economics", "model a China polysilicon export restriction" — executed against the HHI/concentration engine and the (Evolution-A) UFLPA-scoring function, decomposing each supplier's risk into its sourcing/audit/traceability components.

**How.** Tool calls to endpoints wrapping the HHI, concentration, and UFLPA-scoring functions; system prompt from this Atlas page's §5 formulas and the CBP UFLPA / SEIA / IEA references named in §5. The UFLPA-risk explanation cites the specific driver (Xinjiang sourcing %, missing RBA cert, Entity-List presence) rather than an opaque score — auditable for a lender's compliance file; the geopolitical-scenario tab (§1) recomputes concentration under supply shocks. Fabrication validator matches every HHI/risk/cost figure to a tool response; the copilot must ground UFLPA determinations in the CBP Entity List, not infer forced-labor claims beyond the data.

**Prerequisites.** Compute endpoints; Evolution A for the formula-based UFLPA score (HHI/concentration work today on curated data). **Acceptance:** every HHI/concentration/cost figure traces to a tool call; UFLPA-risk explanations cite specific sourcing/audit drivers and Entity-List status; the copilot avoids unsupported forced-labor assertions.