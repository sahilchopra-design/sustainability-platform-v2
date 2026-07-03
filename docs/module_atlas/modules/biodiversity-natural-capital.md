# Biodiversity & Natural Capital Accounting
**Module ID:** `biodiversity-natural-capital` · **Route:** `/biodiversity-natural-capital` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Advanced biodiversity and natural capital accounting analytics covering SEEA EA natural capital stock valuation, ecosystem service flow accounting (provisioning, regulating, cultural), TNFD dependency mapping, MSA footprint calculation, and biodiversity net gain (BNG) metric computation including UK 2024 mandatory BNG units.

> **Business value:** Used by property developers, infrastructure companies, corporates, and natural capital investors to quantify biodiversity dependencies and impacts, comply with UK BNG, and report against TNFD and CSRD ESRS E4 nature-related standards.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIO_STANDARDS`, `ES_CATEGORIES`, `FI_BIO_PRODUCTS`, `GBF_TARGETS`, `SECTOR_DEPENDENCIES`, `TNFD_LEAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalEsHaYr` | `es.reduce((s, c) => s + c.valueUsdHaYr, 0);` |
| `adjustedEsHaYr` | `totalEsHaYr * mult * (biodiversityIndex / 100) * (waterQuality / 100);` |
| `annValue` | `landHa * adjustedEsHaYr;` |
| `disc` | `discountRate / 100;` |
| `annCarbonValue` | `landHa * carbonSeq * 30; // $30/t default` |
| `bioRichness` | `Math.round(biodiversityIndex * 0.85 + sr(landHa % 100) * 15);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIO_STANDARDS`, `ES_CATEGORIES`, `FI_BIO_PRODUCTS`, `GBF_TARGETS`, `SECTOR_DEPENDENCIES`, `TNFD_LEAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Natural Capital Asset Value (USD/ha) | `Σ(service_flow_i × unit_value_i) / asset_area` | TEEB / SEEA EA benefit transfer studies | Global average natural capital value ~$1,000-5,000/ha; tropical forests ~$20,000-100,000/ha when carbon, water |
| MSA Footprint (MSA.ha) | `Σ(pressure_type_i × area_i × MSA_loss_factor_i)` | GLOBIO 4.0 model + land use data | MSA.ha measures biodiversity footprint in terms of habitat area equivalents at pristine condition; lower is be |
| BNG Units (UK Statutory Metric) | `post_development_units − pre_development_units` | Natural England Statutory Biodiversity Metric 4.0 (2024) | Mandatory ≥10% net gain required for UK developments under Environment Act 2021 from January 2024; BNG credits |
- **Land use mapping + GLOBIO pressure data + SEEA EA extent/condition accounts** → Natural capital stock valuation → ecosystem service flow → MSA footprint → BNG metric → **Corporate biodiversity accounting metrics for TNFD reporting, UK BNG compliance, and natural capital investment decisions**

## 5 · Intermediate Transformation Logic
**Methodology:** Natural Capital Stock & Ecosystem Service Flow Accounting
**Headline formula:** `NCA_value = Σ(ecosystem_service_flow_i × unit_value_i × asset_condition_discount)`
**Standards:** ['UN SEEA Ecosystem Accounting (SEEA EA) 2021', 'TEEB (The Economics of Ecosystems and Biodiversity)', 'UK BNG Statutory Metric (Natural England 2024)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).