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
