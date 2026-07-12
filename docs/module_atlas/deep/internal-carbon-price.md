## 7 · Methodology Deep Dive

This is a **tier-A module backed by a genuine, well-referenced engine** (`internal_carbon_price_engine.py`).
The guide is accurate. The backend holds authoritative reference data — the actual EU ETS Phase-4 and
ETS2 price trajectories, IPCC AR6 WG3 SBTi price corridors, and five ICP mechanism designs — and the
page exposes real `POST /api/v1/internal-carbon-price/*` endpoints (`design-mechanism`,
`abatement-cost-curve`, `carbon-budget-tracking`, `ets-shadow-exposure`). The frontend's *default*
`trajectoryData` and abatement figures are curated/seeded placeholders shown before an API call.

### 7.1 What the module computes

**ICP mechanism design** (engine): the internal carbon price is set as the higher of a regulatory
floor and an escalated reference price, per mechanism type:

```
ICP_t = max( RegulatoryFloor_t , ReferencePrice_t )        // shadow / fee-dividend / budget / ETS-shadow
```

**Scope cost allocation** (page): applies the chosen carbon price to each business unit's Scope 1/2/3:

```js
total  = scope1Cost + scope2Cost + scope3Cost              // per BU, = tonnes × carbonPrice
pctEbitda = (totalCarbonCost / totalEbitda) × 100          // carbon-cost intensity of earnings
```

**Abatement cost curve** (page + engine): measures ranked by €/t vs the ICP:

```js
vsIcp = carbonPrice − measure.cost         // >0 ⇒ measure is in-the-money at the internal price
cumulativeAbatement = Σ measure.abatement
```

**ETS shadow trajectory** (engine): the real EU ETS/ETS2 settlement-curve path; the page's default
`trajectoryData` (euETS `65 + 3.8·i + seed`, etc.) is a seeded stand-in until the engine responds.

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| EU ETS Phase-4 path | 2024 €65 → 2030 €133 → 2050 €250 | `EU_ETS_PRICE_TRAJECTORY` — EEX settlement + ICF/ICIS consensus + IPCC AR6 |
| ETS2 path | 2027 €45 → 2030 €68 → 2050 €135 | `ETS2_PRICE_TRAJECTORY` — Directive (EU) 2023/959 |
| SBTi 1.5 °C corridor | 2025 min €50/rec €100 → 2030 €135/€200 → 2050 €250/€350 | `SBTI_ICP_GUIDANCE` — IPCC AR6 WG3 C1 pathway; SBTi NZ Standard v1.1 |
| SBTi WB2C corridor | 2030 €75/€120 → 2050 €175/€240 | IPCC AR6 WG3 C3 pathway |
| Mechanism types (5) | shadow / fee-dividend / budget / implicit / ETS-shadow | `ICP_MECHANISM_TYPES` with typical €/t and regulatory refs |
| `buUnits` (5 BUs) | Manufacturing…Data Centres, scope1/2/3 + ebitda | Curated page constants |
| `carbonPrice` default | €85/t | Page constant |
| Page `trajectoryData`, `irr`, `payback`, `carbonLiability` | `seed()`-generated | Synthetic placeholders pre-API |

### 7.3 Calculation walkthrough

1. **Mechanism design** — user selects a mechanism; engine returns its design, cash-flow-impact flag,
   SBTi-recommended status, and a starting ICP (`typical_icp_eur_t`) escalated along the reference
   path with the regulatory floor as a lower bound.
2. **Scope cost allocation** — each BU's Scope 1/2/3 tonnes × carbonPrice → per-BU carbon cost;
   `pctEbitda` = total carbon cost / total EBITDA.
3. **Carbon budget tracking** — cumulative actual vs allocated budget; remaining budget and
   `annualReductionRequired` to hit a target.
4. **Abatement cost curve** — measures sorted by €/t; `vsIcp` flags which are economic at the ICP;
   cumulative abatement summed.
5. **Net-zero economics** — NPV waterfall of abatement investment vs avoided carbon cost.

### 7.4 Worked example (Manufacturing BU at €85/t ICP)

Manufacturing: Scope1 12.4, Scope2 8.7, Scope3 31.2 (MtCO₂e), EBITDA €145M.

| Step | Computation | Result |
|---|---|---|
| Scope 1 cost | 12.4M t × €85 | €1,054M |
| Scope 2 cost | 8.7M t × €85 | €740M |
| Scope 3 cost | 31.2M t × €85 | €2,652M |
| Total BU carbon cost | 1,054 + 740 + 2,652 | **€4,446M** |
| % of EBITDA (BU) | 4,446 / 145 × 100 | very high (illustrates Scope-3 dominance) |

(The BU tonnages are in Mt, so at €85/t the Scope-3 cost dwarfs EBITDA — a deliberate illustration of
value-chain carbon exposure.) SBTi gap example: `gap = sbtiMin15(2030 = €135) − currentICP(€85) =
€50/t` shortfall to the 1.5 °C minimum.

### 7.5 Companion analytics on the page

- **Scope cost allocation** — per-BU Scope 1/2/3 carbon cost and % of EBITDA.
- **Carbon budget tracking** — actual vs budget, variance, exhaustion year, required annual reduction.
- **Abatement cost curve** — measure ranking, in/out-of-money vs ICP, cumulative abatement.
- **Net-zero economics** — NPV waterfall, IRR, payback (seeded placeholders until the API returns).

### 7.6 Data provenance & limitations

- **Backend reference data is authoritative** — real EU ETS/ETS2 trajectories and IPCC AR6/SBTi
  corridors with directive-level citations.
- The **frontend defaults are curated (`buUnits`) or seeded (`trajectoryData`, IRR/payback/liability)**
  and act as placeholders before the engine call; flag any view that never issued an API request.
- The €85/t default ICP and 5-BU emissions are illustrative, not client data.

**Framework alignment:** *SBTi Corporate Net-Zero Standard* — the ICP corridors (`SBTI_ICP_GUIDANCE`)
map to SBTi's recommended minimum internal prices, derived from IPCC AR6 WG3 C1 (1.5 °C) and C3 (WB2C)
carbon-price pathways. *EU ETS Phase 4 / ETS2* — trajectories encode Directives 2003/87/EC (as amended
2023/958) and 2023/959. *TCFD Metrics & Targets* — ICP is a TCFD-recommended transition metric.
*US EPA SCC* — the guide references the €190/tCO₂e central estimate as the shadow-price anchor. Because
the engine implements the ICP = max(floor, escalated reference) methodology over authoritative
reference data, no separate production model specification is required for this module.
