# ESG Metrics Data Architecture
**Module ID:** `metrics-data-architecture` · **Route:** `/metrics-data-architecture` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Platform canonical ESG data model defining the entity-metric-value-source-period architecture for time-series ESG data management. Covers unit harmonisation (MWh to GJ, tCO2e to kgCO2e), provider-agnostic schema, version control for reported vs restated values, and data lineage from raw source to published KPI.

> **Business value:** Used by ESG data engineers, CDOs, and sustainability reporting leads to ensure data consistency, auditability, and provider-agnostic portability across the ESG reporting technology stack.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CONTEXT_DIMS`, `CROSSWALK`, `INTEROP_METRICS`, `KPI`, `KPI_TEMPLATE_FIELDS`, `L1_STRATEGIC`, `L2_SECTIONS`, `TABS`, `TOTAL_L3`, `TOTAL_L4`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `li * 100 + si * 11 + 300;` |
| `TOTAL_L3` | `L2_SECTIONS.reduce((s, l) => s + l.l3Count, 0);` |
| `TOTAL_L4` | `L2_SECTIONS.reduce((s, l) => s + l.metricCount, 0);` |
| `seed` | `i * 37 + 600;` |
| `metrics` | `['GHG Scope 1','GHG Scope 2','GHG Scope 3','Energy Use','Water Withdrawal','Waste Generated','LTIR','Gender Pay Gap','Board Independence','Anti-Corrup` |
| `seed` | `contextMetric.length * 17 + 99;` |
| `seed` | `l2.id.charCodeAt(3) * 100 + k * 17;` |
| `avg` | `secs.length > 0 ? Math.round(secs.reduce((s, x) => s + x.qualityScore, 0) / secs.length) : 0;` |
| `seed` | `i * 50 + di * 11 + 777;` |
| `score` | `Math.round(40 + sr(seed) * 60);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONTEXT_DIMS`, `INTEROP_METRICS`, `KPI_TEMPLATE_FIELDS`, `L1_STRATEGIC`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Schema Coverage Rate | `mapped_ESG_metrics / total_platform_ESG_metrics × 100` | Internal schema registry | Target >95% coverage; gaps indicate data model gaps requiring new metric definitions or source integration. |
| Unit Harmonisation Accuracy | `correctly_converted_values / total_unit_conversion_operations × 100` | Test suite against reference conversions | Must be 100% for regulatory disclosure; unit errors are the most common data quality failure in ESG reporting. |
| Restatement Frequency | `COUNT(restatement_events) per entity per year` | Version control log | High restatement frequency (>3/year) indicates immature data collection processes; tracked as a data quality g |
- **Multiple ESG data providers + company disclosures → raw ingestion** → Entity matching → unit harmonisation → version control → canonical schema → **Provider-agnostic ESG time-series database for regulatory reporting and analytics**

## 5 · Intermediate Transformation Logic
**Methodology:** Canonical ESG Data Model
**Headline formula:** `normalised_value = raw_value × conversion_factor / intensity_denominator`
**Standards:** ['GHG Protocol Corporate Standard 2015', 'ISO 14064-1 GHG Reporting', 'XBRL ESG Taxonomy (IFRS Foundation)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).