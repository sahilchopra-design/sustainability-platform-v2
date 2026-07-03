# Ocean CDR Finance Platform
**Module ID:** `ocean-cdr-finance` · **Route:** `/ocean-cdr-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH4 · **Sprint:** EH

## 1 · Overview
Ocean carbon dioxide removal finance: OAE, kelp/macroalgae, electrochemical CDR, artificial upwelling, and ocean iron fertilisation. 18 seeded projects with operator profiles (Running Tide, Ebb Carbon, Planetary, Equatic), MRV challenge radar, permanence landscape, and frontier investor/buyer intelligence.

> **Business value:** Used by ocean CDR developers securing advance purchase contracts, frontier carbon buyers (Stripe Frontier) evaluating ocean removal quality, marine scientists designing MRV protocols, and investors in pre-commercial CDR.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_APPROACHES`, `KpiCard`, `MARKET_SIZING`, `MRV_CHALLENGES`, `PROJECTS`, `Pill`, `TABS`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CDR_APPROACHES`, `MRV_CHALLENGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| OAE theoretical LCOC ($/tCO₂) | `Mineral cost + shipping + application − co-benefits` | Ebb Carbon + Planetary field data | Principal uncertainty: measurement of actual alkalinity uptake in open ocean; field trials ongoing 2024–2025. |
| Kelp CDR permanence (yr) | `Depends on sinking depth and ocean current` | Running Tide + Woods Hole Oceanographic | Kelp burial at >200m: decades to centuries; at >2km: centuries to millennia; highly location-dependent. |
| Ocean CDR market maturity | `No major registry methodology approved as of 2024` | ICVCM + Verra + Gold Standard | No ocean CDR credits in voluntary market at scale; Stripe Frontier advance purchases fund R&D; expected first  |
- **Nature OAE framework + Running Tide/Ebb Carbon/Planetary field data + Stripe Frontier terms** → MRV challenge radar + 18 operator profiles + permanence analysis + investor intelligence → **Ocean CDR developers, frontier carbon buyers, ocean scientists, and climate investors evaluating pre-commercial CDR**

## 5 · Intermediate Transformation Logic
**Methodology:** Ocean Alkalinity Enhancement CDR
**Headline formula:** `ΔDIC = (TA_added × Revelle_factor) / seawater_volume; net_CDR = ΔDIC × verification_factor`
**Standards:** ['Nature (2024) – OAE Verification Framework', 'Ebb Carbon Field Trial Data', 'NOAA Ocean Acidification MRV Guidelines']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).