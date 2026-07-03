# Green Ammonia Shipping & Terminal Infrastructure
**Module ID:** `green-ammonia-shipping-storage` · **Route:** `/green-ammonia-shipping-storage` · **Tier:** B (frontend-computed) · **EP code:** EP-EE2 · **Sprint:** EE

## 1 · Overview
Green ammonia maritime logistics and terminal infrastructure. Covers VLGC freight dynamics, 5 key export-import trade routes, terminal CAPEX benchmarking, NH3 cracking energy penalty for H2 reconversion, and IMO safety framework.

> **Business value:** Used by shipping companies, terminal operators, green ammonia developers, DFIs, and commodity traders to evaluate supply chain infrastructure requirements and economics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `TABS`, `TERMINALS`, `TRADE_ROUTES`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `TERMINALS`, `TRADE_ROUTES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| VLGC Freight Rate ($/tonne NH3) | `Spot + time-charter for 90,000 DWT VLGC` | Clarkson Research / Baltic Exchange | Australia→Japan $80-90/t; Chile→Rotterdam $90-110/t; Middle East→Japan $50-70/t; fleet needs to grow 200+ vess |
| NH3 Cracking Energy Penalty (%) | `H2_delivered / H2_input_as_NH3 - 1` | CSIRO Hydrogen Cracking Study 2023 | Requires 0.5-0.7 kWh/Nm³ H2; adds $50-100/t NH3 to delivered H2 cost. |
| Terminal CAPEX ($/t annual capacity) | `CAPEX / annual_throughput` | H2Global / Wuppertal Institut | Greenfield vs brownfield (LPG conversion) 40% CAPEX reduction. |
- **VLGC fleet data + terminal capacity + freight rates + cracking efficiency** → Logistics cost model (freight + terminal + cracking) + trade route optimization → **Green ammonia supply chain cost from production to consumer, informing offtake pricing**

## 5 · Intermediate Transformation Logic
**Methodology:** NH3 Logistics Cost & Cracking Penalty
**Headline formula:** `Total_cost = LCOA + freight + terminal_handling + cracking_penalty`
**Standards:** ['IMO Ammonia Marine Fuel Safety Guidelines', 'SIGTTO NH3 Shipping Standards', 'H2Global Shipping Cost Study 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).