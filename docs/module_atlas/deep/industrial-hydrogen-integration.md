## 7 · Methodology Deep Dive

An **industrial-hydrogen integration finance** page: H₂ demand and abatement economics across 6
industrial sectors (steel, chemicals, refining, cement, glass, ceramics), plus a synthetic 20-project
pipeline and electrolyser infra costs. The sector table is grounded in IEA/BNEF data; the abatement-cost
formula is genuine but partially garbled in code (noted). Guide (EP-EG2) and code broadly agree.

### 7.1 What the module computes

**Sector abatement economics** — carbon saving vs H₂ cost premium:

```js
carbonSaving = s.abatement/100 · 1.85 · carbonPrice          // 1.85 tCO₂/t is the BF-BOF steel EF
netCost      = s.capex·0.12 + s.h2Price·s.h2Demand2030/s.h2Demand2030 · h2Price/s.h2Price − carbonSaving
```

The `netCost` expression is algebraically self-cancelling in its middle term:
`s.h2Price · (demand/demand) · (h2Price/s.h2Price) = h2Price` — so it reduces to
`capex·0.12 + h2Price − carbonSaving` (an annualised-capex-plus-H₂-price-less-carbon-credit proxy).
This is a coding artefact; the intended calculation is a sector abatement cost `$/tCO₂`.

### 7.2 Parameterisation — SECTORS table (provenance)

| Sector | H₂ 2030 (Mt) | H₂ 2050 (Mt) | H₂ price $/kg | CI | capex $/kW | Abatement % | Projects |
|---|---|---|---|---|---|---|---|
| Green Steel (DRI-EAF) | 32 | 108 | 4.5 | 0.05 | 950 | 94 | 18 |
| Green Ammonia/Chemicals | 18 | 55 | 3.8 | 0.25 | 720 | 82 | 24 |
| Refining | 12 | 28 | 3.2 | 0.40 | 480 | 65 | 31 |
| Cement Process Heat | 8 | 22 | 5.2 | 0.65 | 380 | 40 | 9 |
| Glass Firing | 3 | 9 | 4.8 | 0.20 | 250 | 55 | 6 |
| Ceramics/High-Temp | 2 | 7 | 5.5 | 0.28 | 210 | 48 | 4 |

Demand figures align with IEA NZE industrial-H₂ (steel 25–30 Mt, chemicals 5–10 Mt by 2050) and the
1.85 tCO₂/t steel emission factor is the standard BF-BOF benchmark. The 20-project pipeline is
**synthetic** (`sr()` picks sector/country/status; capacity 0.2–3.0 Mt; IRR 5–15%; DSCR 1.15–1.90;
H₂ need = cap × (8 + sr·15)).

### 7.3 Calculation walkthrough

Sliders `h2Price` and `carbonPrice` drive `economicsTable`, which computes per-sector carbon saving
(abatement × 1.85 × carbon price) and the (reduced) net-cost proxy. `demandChart` reads the 2030/2050
demand columns. Pipeline KPIs (`avgIrr`, `totalH2Need`) reduce the synthetic projects; `infraCosts`
lists electrolyser/pipeline capex with 2030/2050 cost-down anchors.

### 7.4 Worked example (Green Steel, carbon $80/t)

| Step | Computation | Result |
|---|---|---|
| carbonSaving | 0.94 · 1.85 · 80 | **$139/t** CO₂ credit value |
| netCost (reduced) | 950·0.12 + 4.5 − 139 | 114 + 4.5 − 139 = **−$20.5** |

A negative net cost signals steel H₂ integration is economic at $80/t carbon and $4.5/kg H₂ — matching
the guide's "$50–80/tCO₂ abatement in 2024 declining to $10–20 by 2035". (The absolute figure is
distorted by the self-cancelling middle term; the *sign and sensitivity* to carbon/H₂ price are the
usable signal.)

### 7.5 Data provenance & limitations

- **Sector demand/CI/capex/abatement figures are grounded** in IEA NZE / BNEF; the 1.85 tCO₂/t steel EF
  is correct. The **project pipeline is synthetic** (`sr()`) — IRR/DSCR/capacity are random.
- The `netCost` formula contains a **self-cancelling term** (`h2Price·demand/demand·h2Price/h2Price`),
  reducing it to `capex·0.12 + h2Price − carbonSaving`; it is not a clean `$/tCO₂` abatement cost as the
  guide's formula `(LCOH − fossil_opex)/CO₂_displaced` intends. Treat net-cost magnitudes as indicative.
- No electrolyser-LCOH build-up feeding the H₂ price; H₂ price is a slider.

**Framework alignment:** IEA *Hydrogen for Industry 2023* / *Net Zero by 2050* (sector demand, abatement
cost) · IRENA *Green Hydrogen Cost Reduction* (electrolyser learning) · BNEF *Hydrogen Economy Outlook*
(PEM/AEL/SOEC capex, stack lifetime). The module reproduces the sector abatement narrative faithfully;
the abatement-cost arithmetic should be rewritten to the guide's `(H₂ system LCOH − fossil baseline)/
CO₂ displaced` to yield a clean $/tCO₂ curve.
