## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide's NPV formula includes a coastal-protection
> co-benefit term: `NPV = Σ[(Credits×Price + Coastal Protection Value) − Restoration Cost −
> Monitoring Cost]/(1+r)^t`. **The code's actual `calcRestorationNpv` omits both the coastal-
> protection value and the monitoring-cost terms** — it computes NPV purely from carbon-credit
> revenue against restoration capex. The guide's headline co-benefit figure ("$8,400/ha/yr coastal
> protection") is referenced nowhere in the calculation. Sections below document the code as it
> actually behaves; unlike several sibling modules, the core financial math here is genuine and
> correctly implemented.

### 7.1 What the module computes

Two real, correctly-implemented financial formulas applied to a static 5-ecosystem reference table
(Mangroves, Seagrass Meadows, Salt Marshes, Kelp Forests, Coral Reef Ecosystem):

```js
annualCreditRevenue = areaHa × seqTco2HaYr × creditPriceUsd
restorationNPV = PV(annualRevenue, discountRate, lifeYrs) − (areaHa × restCostHa)
  where PV = annRevenue × (1 − (1+r)^−n) / r      // standard ordinary-annuity present value
```
This is a genuine capital-budgeting NPV calculation (annuity-PV of a level annual cashflow minus
upfront capex) — mathematically correct and consistent with standard project-finance practice, even
though it captures only the carbon-revenue side of the guide's stated multi-term formula.

### 7.2 Parameterisation

| Ecosystem | Seq. (tCO₂/ha/yr) | Stock (tCO₂/ha) | Restoration cost/ha | Credit price | Quality | Verra |
|---|---|---|---|---|---|---|
| Mangroves | 6.4 | 840 | $1,800 | $28 | HIGH | ✓ |
| Seagrass Meadows | 2.4 | 140 | $4,200 | $22 | MEDIUM | ✓ |
| Salt Marshes | 4.8 | 620 | $2,600 | $24 | HIGH | ✓ |
| Kelp Forests | 1.1 | 35 | $8,500 | $14 | EMERGING | ✗ |
| Coral Reef Ecosystem | 0.8 | 22 | $12,000 | $18 | EMERGING | ✗ |

- Mangrove sequestration (6.4 tCO₂/ha/yr) is close to the guide's cited 7.2 tCO₂/ha/yr and broadly
  consistent with published mangrove blue-carbon literature (mangroves are the highest-sequestering
  coastal wetland due to deep soil carbon accumulation).
- Salt marsh sequestration (4.8 tCO₂/ha/yr) **exceeds** both the guide's cited range (1.5–3 tCO₂/
  ha/yr) and typical published saltmarsh literature values — worth flagging as an internal
  inconsistency between the guide and the seed data, and against the cited IPCC 2013 Wetlands
  Supplement defaults more broadly.
- `METHODOLOGIES` (5 rows) — real named crediting methodologies: **VCS VM0033** (Verra, mangrove
  restoration), **VCS VM0024** (Verra, coastal blue carbon, multi-ecosystem), **Gold Standard Blue
  Carbon**, **CBCA Coastal Wetland Crediting** (correctly flagged `approved:false` — CBCA blue-carbon
  crediting is indeed still developing), **Plan Vivo Blue Carbon** — all genuine, correctly-named
  standards with accurate approval/permanence-mechanism descriptions.
- `MPA_PROJECTS` (5) — **real, identifiable** blue-carbon/MPA finance deals: the Seychelles debt-for-
  nature swap ($21.9M, a well-documented 2018 Nature Conservancy-brokered transaction), Brazilian
  "Blue Amazon" green bond, Coral Triangle Initiative (a real multilateral Indo-Pacific programme),
  Great Blue Wall (a real African Union-endorsed East African blue-bond initiative), Patagonia Marine
  Reserve — correctly categorised by financing instrument (debt swap, green bond, blended MDB+ODA,
  blue bond, endowment) though specific IRR/credits figures are illustrative.
- `CREDIT_MARKET` (2019-2025) — a static, hand-authored growth trend from $6M to $435M revenue,
  8x volume growth — directionally consistent with the real voluntary blue-carbon market's rapid
  early-stage growth, though the specific figures are not sourced inline.

### 7.3 Calculation walkthrough

- **Project Valuation tab** (interactive): user selects an ecosystem, sets `areaHa` (default 5,000),
  `discountRate` (default 8%), `lifeYrs` (default 30), `creditPrice` (default $25) — the two formulas
  in §7.1 recompute live. This is the module's only genuinely interactive calculation; every other
  tab renders the static reference tables.
- **Overview tab**: `totalGlobalSeq = Σ_ecosystems (globalHaM × 1e6 × seqTco2HaYr) / 1e9` — correctly
  converts each ecosystem's global area (million ha) × per-ha sequestration rate into a portfolio-wide
  GtCO₂/yr figure via consistent unit conversion (ha × tCO₂/ha = tCO₂, then /1e9 for Gt).
- **Methodologies / MPA Finance / Co-Benefits tabs**: reference-table renders of the static datasets,
  no further computation.

### 7.4 Worked example — default Mangrove valuation

`areaHa=5000, seqTco2HaYr=6.4, creditPriceUsd=25, restCostHa=1800, discountRate=8%, lifeYrs=30`:
```
annRevenue = 5000 × 6.4 × 25 = $800,000/yr
capex      = 5000 × 1800 = $9,000,000
annuityFactor = (1 − 1.08^−30) / 0.08 = (1 − 0.0994) / 0.08 = 0.9006/0.08 = 11.258
pvRevenue  = 800,000 × 11.258 = $9,006,000
NPV        = 9,006,000 − 9,000,000 = $6,000  (approximately break-even)
```
This shows the module's honest sensitivity: at default assumptions, a pure carbon-credit-financed
mangrove restoration project is barely NPV-positive — which is realistic and consistent with the
guide's own framing that co-benefit revenue (coastal protection, often exceeding carbon revenue) is
usually necessary to make blue-carbon projects bankable — even though that co-benefit term is not
actually added into this NPV calculation (§ mismatch flag above).

### 7.5 Data provenance & limitations

- **NPV formula is genuine and correctly implemented** (annuity-PV mathematics), a positive
  distinction from most sibling modules in this batch — but it is **narrower than the guide's stated
  formula**, omitting coastal-protection co-benefit value and monitoring cost, both of which the
  guide's own `dataPoints` table cites as material (coastal protection "$8,400/ha/yr... often exceeds
  carbon revenue").
- Salt marsh sequestration rate (4.8 tCO₂/ha/yr) appears inconsistent with both the guide's cited
  range and general published literature; should be reconciled against IPCC 2013 Wetlands Supplement
  region-specific defaults.
- `CREDIT_MARKET` and MPA project IRR/credit figures are illustrative estimates presented without
  inline source citation, despite corresponding to real, identifiable deals.
- No buffer-pool / permanence-risk discount is applied to credit revenue in the NPV calculation,
  despite the Methodologies tab correctly describing each standard's buffer-pool mechanism.

**Framework alignment:** Verra VCS VM0033/VM0024, Gold Standard Blue Carbon, and Plan Vivo are
real, correctly-described crediting methodologies with accurate additionality/permanence mechanism
summaries. IPCC 2013 Wetlands Supplement is named as the sequestration-rate source but the salt-marsh
figure in the seed data does not match its guide-cited range. The 5 MPA finance case studies are
real-world identifiable transactions, giving this module a stronger factual anchor than most peers in
this batch even where specific deal-level figures (IRR, credit volumes) remain illustrative.
