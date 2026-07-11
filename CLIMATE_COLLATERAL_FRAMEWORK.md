# Climate Risk Factor Integration into the Collateral Framework of a Lending Institution

**Module**: EP-AJ7 — Climate-Adjusted Collateral Framework
**Frontend**: `frontend/src/features/climate-collateral-framework/pages/ClimateCollateralFrameworkPage.jsx`
**Route**: `/climate-collateral-framework` · **Nav group**: Financed Emissions & Climate Banking

This document is the full methodology behind the module: why collateral is the transmission channel
that most banks still leave unadjusted for climate risk, the exact calculation stack the module
implements, the regulatory basis that makes climate-sensitive collateral values a legal requirement
(not a nice-to-have), and the operating model needed to run it in production at any lending institution.

---

## 1. Why Collateral Is a First-Order Climate Transmission Channel

Credit risk decomposes as **EL = PD × LGD × EAD**. Most climate-in-credit work to date has focused on
the **PD channel** (borrower cash-flow stress from carbon prices, physical business interruption).
The **LGD channel — collateral — is structurally different and in several ways more dangerous**:

1. **Collateral is a point-in-space asset.** A borrower can diversify revenue across geographies;
   a pledged warehouse cannot move out of a flood plain. Physical hazard maps apply to collateral
   with a precision they never achieve for corporate cash flows.
2. **Collateral value matters exactly at default.** Climate-correlated defaults cluster (a flood
   event, a MEES deadline, a carbon-price spike), so the bank sells climate-impaired collateral
   into a climate-impaired market — the classic **wrong-way / fire-sale interaction**.
3. **Insurance is the hidden load-bearing wall.** Most collateral frameworks implicitly assume
   damage is an insurance problem. Insurer retreat (non-renewal, exclusions, premium spirals in
   high-hazard zones) transfers that risk back to the bank silently, between annual reviews.
4. **Regulation already binds.** ECB Guide Expectation 8.4, EBA GL/2020/06 §7, CRR Articles 208
   and 229 (and their CRR3 revisions) make prudent, climate-sensitive collateral valuation a legal
   requirement — yet the ECB's 2022 thematic review found **fewer than 15% of significant
   institutions** adjusted collateral values for climate at all.

The framework therefore treats the collateral register — not the borrower — as the unit of analysis,
and pushes climate factors through four outputs: **eligible collateral value → LTV → LGD/ECL → RWA/CET1**.

---

## 2. Scope: Collateral Taxonomy and Climate Sensitivity Map

Nine collateral classes, each with distinct climate vectors and a distinct base prudential haircut:

| # | Class | Base haircut | Physical vector | Transition vector |
|---|-------|-------------|-----------------|-------------------|
| 1 | Residential real estate | 10% | Flood, subsidence, wildfire, coastal | EPC/MEES lettability & buyer discount |
| 2 | Commercial real estate | 15% | All acute + heat (cooling capex, NOI) | EPC/MEES + tenant ESG demand shift |
| 3 | Agricultural land | 20% | Drought, heat, flood (yield capitalisation) | Land-use policy, water rights, nitrogen rules |
| 4 | Industrial real estate | 20% | Flood, storm (single-site concentration) | Carbon lock-in of specialised plant (EPC F/G) |
| 5 | Vessels | 25% | Storm/cyclone (casualty), port disruption | **IMO CII rating A–E** — charter clauses, retrofit or scrap |
| 6 | Aircraft | 25% | Heat (payload/runway limits) | Engine generation vs ICAO CO₂ standard; SAF mandates |
| 7 | Inventory & commodities | 30% | Storage-site hazard, spoilage (heat) | Carbon cost embedded in resale price (steel, aluminium, cement, ICE parts) |
| 8 | Financial collateral | 8% | Negligible directly | **Wrong-way risk**: pledged equity/bonds of carbon-intensive issuers fall when the borrower defaults |
| 9 | Guarantees | 5% | Negligible directly | Guarantor's own transition trajectory (substitution approach inherits the guarantor's climate quality) |

Seven physical hazards are scored 1–5 per item: **river flood, coastal flood, wildfire,
cyclone/storm, heat stress, drought, subsidence** — with book-level default weights
(0.20 / 0.18 / 0.12 / 0.15 / 0.13 / 0.12 / 0.10). Scores must come from **forward-looking,
RCP-conditioned hazard maps at address level**, not historical loss experience (ECB Thematic
Review 2022, good practice 4.3).

---

## 3. The Haircut Stack — Core Calculation

The binding value basis for LTV, eligibility, LGD and remargining is the **climate-adjusted
prudent value**:

```
H_total   = min( 90%, H_base(class) + H_phys + H_trans + H_stale )
V_adj     = V_market × (1 − H_total)
```

### 3.1 Physical add-on (H_phys)

```
composite = Σ_i ( hazard_i × w_i ) / 5                      ∈ [0.2, 1.0]
raw       = max(0, composite − 0.2) / 0.8                   ∈ [0, 1]     (all-1 scores → 0)
H_phys    = raw² × 55% × M_phys(scenario, horizon) × (1 − 0.9 × ins_eff)
```

- **Convex damage function** (`raw²`): damage accelerates with hazard severity — a score-5 asset
  is far more than 25% worse than a score-4 asset. Cap: 55% of value (structural residual survives
  most perils).
- **`M_phys`** is the scenario multiplier (see §5): Hot House 2050 = 1.95× vs ~1.0 today.
- **Effective insurance** `ins_eff = ins × 0.9` normally (10% deductible/dispute friction), but
  **collapses to `ins × 0.35`** once the horizon passes the modelled **insurer-retreat year** for
  items flagged retreat-exposed. Insurance retreat — not gross damage — is the dominant driver of
  the physical add-on in high-hazard zones. This is deliberate and matches observed market dynamics
  (Florida, Australian flood plains, Mediterranean wildfire belts).

### 3.2 Transition add-on (H_trans)

```
H_trans = [ EPC_curve(mees_pathway, band)          (property)
          + CII_addon(rating)                       (vessels:   A 0 · B 2 · C 5 · D 12 · E 22)
          + age_addon(engine_generation)            (aircraft:  ≤5y 1 · ≤10y 4 · ≤15y 8 · >15y 14)
          + min(18%, cInt × carbon_price / 400) ]   (inventory, financial, guarantees)
          × M_trans(scenario, horizon)
```

Four selectable **MEES/EPBD legal pathways** for the EPC curve (haircut % by band A–G):

| Pathway | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| Current Law (EPC E floor) | 0 | 0 | 1 | 3 | 6 | 18 | 26 |
| EPC C by 2028 (Proposed) | 0 | 0 | 2 | 8 | 15 | 24 | 32 |
| EPC B by 2030 (Ambitious) | 0 | 2 | 6 | 12 | 20 | 28 | 36 |
| No Tightening | 0 | 0 | 0 | 2 | 4 | 10 | 15 |

The discontinuity at the letting-prohibition floor (F/G under current law) reflects that a building
which **cannot legally be let** is valued on vacant-possession/retrofit-residual basis, not income basis.

**Wrong-way treatment of financial collateral and guarantees**: pledged equity of a coal utility is
marked down via its issuer carbon sensitivity rather than netted at par — its value is lowest exactly
in the states of the world where the pledging borrower defaults. Guarantees inherit the guarantor's
transition quality under the substitution approach.

### 3.3 Staleness add-on (H_stale)

Valuation age > 12m: +1% · > 24m: +2.5% · > 36m: +4%. This operationalises CRR Art. 208(3)
"more frequent monitoring where market conditions change significantly" — climate re-rating **is**
such a change, and stale valuations must carry a prudence penalty until re-inspected.

---

## 4. Downstream Integration: LTV → LGD → ECL → RWA

1. **LTV**: `LTV_climate = Loan / V_adj`. Origination caps and covenant tests run on the climate
   LTV. Exposure with `LTV_climate > 90%` enters the remargining queue (Trigger T3).
2. **Unsecured slippage**: `max(0, Loan − V_adj)` — the portion of nominally secured exposure that
   is no longer covered; reprices in pricing tools and pre-provisions in watchlist reviews.
3. **LGD** (workout form): `LGD = clamp( 1 − recovery(class) × min(1, V_adj/Loan), 5%, 95% )`,
   scaled by a configurable downturn factor (default +15%). Climate enters ECL **through the LGD
   channel only** in this module, so the delta is cleanly attributable and stackable with the PD
   overlays of EP-AJ5 (Climate Credit Risk Analytics) without double counting.
4. **ECL**: `EL = EAD × PD(class) × LGD_climate` — the base-vs-climate difference is the IFRS 9
   **management overlay candidate** from the collateral framework, with a full 3-scenario ×
   3-horizon sensitivity matrix for the audit file (IFRS 9 B5.5.55).
5. **RWA / CET1**: standardised-approach split — secured portion at the class secured risk weight,
   slippage at the unsecured weight. The delta times the CET1 ratio target (10.5%) approximates the
   capital consumption of climate value erosion; feeds the ICAAP climate chapter (BCBS Principle 4).

---

## 5. Scenario Architecture (NGFS-Aligned)

Three scenarios × three horizons (2030/2040/2050), calibrated to NGFS narratives:

| Scenario | M_phys 2030/40/50 | M_trans 2030/40/50 | Carbon €/t 2030/40/50 | Narrative |
|---|---|---|---|---|
| Orderly — Net Zero 2050 | 1.05 / 1.12 / 1.18 | 1.00 / 1.10 / 1.15 | 130 / 210 / 250 | Early coordinated policy; transition bites now, physical contained |
| Disorderly — Delayed | 1.05 / 1.22 / 1.35 | **0.55 / 1.45 / 1.30** | 45 / 270 / 300 | Nothing until 2030, then abrupt repricing; fire-sale dynamics in stranded segments |
| Hot House — Current Policies | 1.12 / 1.45 / **1.95** | 0.35 / 0.40 / 0.45 | 35 / 45 / 55 | Muted transition, escalating physical damage, accelerating insurer retreat |

Design intent: **Disorderly maximises the transition add-on at 2040** (post-shock overshoot then
partial normalisation), **Hot House maximises the physical add-on at 2050**. A collateral book is
never "safe in all scenarios" — the binding scenario differs by class and geography, which is why
limits (§7) are set on the worst-of envelope.

---

## 6. Regulatory Basis (18 Mapped Requirements)

The anchor set the module tracks item-by-item with Met / Partial / Gap status and named owners:

- **ECB Guide on climate-related and environmental risks (Nov 2020)** — Expectation **8.4**
  (monitor & manage climate impact on collateral valuations — the anchor requirement) and 7.2
  (climate in credit risk appetite and credit-granting procedures).
- **ECB Thematic Review (2022)** — address-level geocoding to forward-looking hazard data as
  documented good practice; peer benchmark (<15% of SIs adjust collateral values).
- **EBA Guidelines on Loan Origination and Monitoring (EBA/GL/2020/06)** — §7.1 paras 208–210
  (valuation at origination must reflect energy efficiency and environmental factors), §7.2 paras
  217–223 (monitoring & event-driven revaluation), para 149 (ESG in creditworthiness).
- **CRR** — Art. 208(3) (property value monitoring, frequency escalation on significant change),
  Art. 229(1) (prudent valuation criteria).
- **CRR3 (Regulation (EU) 2024/1623)** — revised Art. 229 "property value": sustainable over the
  life of the loan; upward revaluation capped except for genuine improvements **including energy
  efficiency** — which makes retrofit lending value-restoring by regulation (see roadmap Phase 4).
- **BCBS Principles for the effective management and supervision of climate-related financial
  risks (June 2022)** — Principles 2 (board oversight) and 4 (ICAAP integration); **BCBS FAQ
  (Dec 2022)** on adjusting CRE/RRE collateral values where markets lag climate fundamentals.
- **PRA SS3/19** §3.2 (scenario analysis including collateral and recoveries).
- **BaFin MaRisk (7th amendment)** BTO 1.2.1 (ESG in collateral value review, documented methodology).
- **IFRS 9** B5.5.55 (collateral in ECL measurement — the LGD channel).
- **EBA Pillar 3 ESG ITS** — Template 5 (exposures subject to physical risk incl. collateral
  geography) and Template 2 (energy-efficiency split of mortgage collateral) generated from the
  register's hazard-zone and EPC tags.
- **EU EPBD 2024 recast / UK MEES** — the legal source of the four EPC pathway curves.

---

## 7. Operating Model: Triggers, Limits, Governance

### 7.1 Event-driven revaluation triggers (override the cyclical schedule)

| ID | Trigger | Action |
|----|---------|--------|
| T1 | Severe hazard event within 25 km | Desktop revaluation + insurance confirmation ≤ 10 business days |
| T2 | EPC regulation change (MEES/EPBD shift) | Book-wide transition overlay re-run ≤ 30 days |
| T3 | Climate-adjusted LTV > 90% | Remargining / additional collateral within covenant period |
| T4 | Insurer non-renewal or new exclusion | Reclassify retreat-exposed; recompute physical add-on without insurance offset |
| T5 | Hazard score +1 notch on map refresh | Full revaluation next cycle; staleness add-on doubled interim |
| T6 | Carbon price ±40% vs calibration | Recalibrate carbon-sensitive markdowns |
| T7 | Vessel CII downgrade to D/E | Charter-value review; retrofit plan required for continued eligibility |
| T8 | Limit utilisation ≥ 85% | New-origination restriction in affected hazard zone |

### 7.2 Board risk-appetite limits

L1 Flood-Zone-3 share of book ≤ 10% · L2 EPC F–G share of property collateral ≤ 8% ·
L3 uninsured high-hazard collateral ≤ 5% · L4 single hazard-zone (NUTS-2) concentration ≤ 12% ·
L5 climate-LTV > 90% share ≤ 15% · L6 CII D/E share of transport collateral ≤ 35%.

### 7.3 Three lines of defence

1st line captures climate attributes at origination and executes triggers; the Independent
Valuation Unit applies the adjusted prudent value and instructs appraisers (hazard statement, EPC
evidence, insurance confirmation now mandatory in the instruction pack). 2nd line owns the haircut
model and its annual recalibration/backtest, with model governance validating damage functions and
the LGD linkage. 3rd line audits trigger execution, data lineage, and internal-vs-Pillar-3
consistency. The Board Risk Committee approves L1–L6 and reviews the quarterly collateral climate
dashboard.

### 7.4 Data requirements (12-element register)

Address-level geocodes; forward hazard maps (7 perils, RCP-conditioned); EPC certificates; retrofit
cost curves; insurance terms & exclusions; insurer non-renewal signals (the one commonly **missing**
feed — sourced from broker panels); IMO CII ratings; aircraft engine data; commodity carbon
pass-through; issuer carbon intensity for financial collateral; local adaptation infrastructure;
internal workout loss history for backtesting.

### 7.5 Policy amendments (10 documents)

Collateral Valuation Policy (adjusted prudent value as binding basis) · Eligible Collateral Schedule
(wrong-way caps) · Appraiser Instruction Pack · LTV Policy (caps on adjusted value for Zone-3 /
EPC F–G) · Insurance Policy (minimum coverage ratios + non-renewal covenant) · Revaluation Policy
(T1–T8) · Credit Policy (origination screening) · Workout & Recovery Policy (climate-differentiated
fire-sale discounts) · Data Policy (mandatory geocoding, EPC refresh) · Product Governance
(retrofit-lending carve-out: improvement capex restores eligible value).

---

## 8. Implementation Roadmap

- **Phase 1 (Q1–Q2)** — geocode the register, procure forward hazard maps, EPC matching; approve
  the methodology paper; stand up the collateral climate data mart with lineage.
- **Phase 2 (Q2–Q3)** — deploy the haircut engine into the collateral system of record (one-quarter
  parallel run); amend the 10 policies; wire adjusted values into LGD models and the IFRS 9 overlay.
- **Phase 3 (Q3–Q4)** — activate T1–T8 and L1–L6 with automated monitoring; board dashboard and
  breach escalation; automate Pillar 3 Template 5 from register tags.
- **Phase 4 (Year 2)** — CRR3 life-of-loan sustainable-value test at origination; insurer-retreat
  early-warning feed; retrofit/adaptation lending integration; extension to securitisation pools
  and covered-bond cover-pool tests.

Maturity is self-assessed on 8 dimensions (data, methodology, valuation integration, policy,
monitoring, LGD/capital linkage, governance, disclosure) on a 1–5 scale against the ECB peer
median of ≈ 2.3 ("Developing").

---

## 9. Module Demonstration Dataset

The module ships with a deterministic 60-item register (€9.6bn collateral value against €7.2bn
of secured lending — 75% average LTV — across 20 countries) spanning all nine classes — including deliberately instructive
cases: Somerset Levels RRE (river-flood + insurer retreat), Canary Wharf EPC-E office (MEES
stranding on a prime asset), Venice hotel (compound coastal flood + subsidence + EPC F), an
Aframax tanker at CII E, a 21-year-old freighter fleet, coal-utility equity pledged as financial
collateral (wrong-way), and a renewables SPV insurance wrap as the clean-side control. All numbers
are illustrative calibrations for demonstration, not vendor data.

## 10. Known Simplifications (Production Hardening List)

- Damage function is a single convex curve per composite score; production should use per-peril
  vulnerability curves (depth-damage for flood, wind fragility for storm) by construction archetype.
- Insurance retreat is a step function at the retreat year; production should use a hazard-zone
  premium-spiral model with annual renewal probabilities.
- SA risk weights are applied at class level; CRR3 whole-loan splitting for IPRE/ADC exposures and
  the output floor interaction are not modelled in the UI.
- PDs are class-level constants by design (LGD-channel isolation); combined PD×LGD climate ECL
  lives in EP-AJ5.
- Correlated hazard clustering (one storm hitting many items) is visible via the NUTS-2
  concentration limit but not simulated stochastically; pair with EP-AF Monte Carlo modules for that.
