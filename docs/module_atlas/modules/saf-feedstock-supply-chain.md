# SAF Feedstock Supply Chain Intelligence
**Module ID:** `saf-feedstock-supply-chain` · **Route:** `/saf-feedstock-supply-chain` · **Tier:** B (frontend-computed) · **EP code:** EP-EF3 · **Sprint:** EF

## 1 · Overview
Comprehensive feedstock supply intelligence for all six SAF pathways: UCO, tallow, cellulosic residues, MSW, agricultural residues, and algae. Maps 18 seeded suppliers by certification (ISCC+, RSB), price forecast scenarios, and supply chain risk radar.

> **Business value:** Used by SAF producers managing feedstock procurement, airlines verifying sustainability credentials, and investors assessing feedstock supply risk in SAF project due diligence.

**How an analyst works this module:**
- Review supply overview for 18 suppliers and certification status
- Examine feedstock markets for price history and availability by type
- Use supply chain risk radar for 6-dimension risk assessment by feedstock
- Run price forecast scenarios for 10-year feedstock cost trajectory

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCKS`, `KpiCard`, `SUPPLIERS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FEEDSTOCKS` | 7 | `name`, `pathway`, `price2024`, `price2030`, `supply_mt`, `growth`, `ci`, `dbl_count`, `risk`, `countries` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `country` | `['USA', 'EU', 'Brazil', 'Australia', 'Malaysia', 'China', 'UK', 'Indonesia'][Math.floor(sr(i * 11 + 2) * 8)];` |
| `vol_t` | `Math.round((10000 + sr(i * 13 + 3) * 290000));` |
| `price` | `Math.round(fs.price2024 * (0.85 + sr(i * 17 + 4) * 0.35));` |
| `quality` | `parseFloat((60 + sr(i * 19 + 5) * 38).toFixed(1));` |
| `cert` | `['ISCC+', 'RSB', 'ISCC', 'REDcert²', 'None'][Math.floor(sr(i * 23 + 6) * 5)];` |
| `hhi` | `parseFloat((sr(i * 29 + 7) * 0.8).toFixed(2));` |
| `filtered` | `useMemo(() => SUPPLIERS.filter(s => selFeed === 'ALL' \|\| s.feedstock === selFeed), [selFeed]); const avgPrice = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, f) => s + f.price, 0) / filtered.length) : 0, [filtered]);` |
| `avgQuality` | `useMemo(() => filtered.length ? (filtered.reduce((s, f) => s + f.quality, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalVol` | `useMemo(() => filtered.reduce((s, f) => s + f.vol_t, 0), [filtered]);` |
| `priceForecast` | `FEEDSTOCKS.map(f => {` |
| `forecast` | `Math.round(f.price2024 + (f.price2030 - f.price2024) * t);` |
| `riskRadar` | `FEEDSTOCKS.map(f => ({ subject: f.id, risk: f.risk, supply: Math.min(100, Math.round(f.supply_mt / 8)), growth: Math.min(100, Math.round(f.growth * 5)) }));` |
| `sustainChart` | `FEEDSTOCKS.map(f => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UCO Price ($/t) | `Spot UCO market (RHS Bloomberg)` | USDA/EU UCO trade data | Highly volatile; affected by food demand competition and EU mandate on UCO in road transport. |
| ISCC+ Certification Cost ($/t) | `Audit + administration + annual renewal` | ISCC GmbH fee schedule | Required for EU RED compliance; covers chain of custody from feedstock origin to SAF producer. |
| Feedstock Gap by 2030 (Mt) | `IEA scenario: required − available` | IEA Renewables 2023 + Task 39 | Principal bottleneck for SAF scale-up; drives premiums and PtL investment as alternative. |
- **ISCC+/RSB certification data + feedstock price market + supply gap analysis** → 18-supplier intelligence + price forecast slider + supply chain risk radar → **SAF producers securing feedstock, airlines verifying sustainability, investors assessing supply risk**

## 5 · Intermediate Transformation Logic
**Methodology:** Feedstock Availability & Cost
**Headline formula:** `Feedstock_cost = Collection + Processing + Transport; CI_reduction = (Petroleum_CI − SAF_CI) / Petroleum_CI`

UCO global supply ~5–7 Mt/yr; required SAF feedstock 2030: 30–50 Mt/yr; significant feedstock gap by 2030.

**Standards:** ['ISCC+ Certification Framework', 'RSB Global Standard', 'IEA Bioenergy Task 39 Feedstock Availability']
**Reference documents:** ISCC (2023) – ISCC+ System Document; RSB (2023) – Roundtable on Sustainable Biomaterials Standard; IEA Bioenergy (2023) – Task 39 Feedstock Availability Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The page labels a per-supplier field `hhi` (Herfindahl-
> Hirschman Index), the standard market-concentration statistic computed as `sum(marketShare_i^2)`
> over all suppliers. In this module `hhi = sr(i x 29 + 7) x 0.8` — an **independent seeded random
> number**, not calculated from any supplier's actual volume share of total feedstock supply. A
> real HHI cannot be assigned per-supplier at all (it is a market-level statistic); the field name
> is a mislabel for what is actually a synthetic per-supplier risk-proxy score.

### 7.1 What the module computes

7 base feedstock categories (`FEEDSTOCKS`) carry real-world-plausible reference data (2024/2030
price, global supply Mt/yr, YoY growth %, life-cycle carbon intensity, EU RED double-counting
eligibility, supply risk score). 18 synthetic suppliers are generated by sampling from these base
feedstocks:

```
price  = round(feedstock.price2024 x (0.85 + sr(i x 17 + 4) x 0.35))   // +/-15%/+20% spread around base
vol_t  = round(10,000 + sr(i x 13 + 3) x 290,000)
quality = (60 + sr(i x 19 + 5) x 38).toFixed(1)                        // 60-98 quality score
hhi    = (sr(i x 29 + 7) x 0.8).toFixed(2)                             // mislabeled synthetic score
priceForecast(t) = round(price2024 + (price2030 - price2024) x t)      // linear interpolation, t in [0,1]
```

### 7.2 Parameterisation

| Feedstock | 2024 price ($/t) | 2030 price ($/t) | Global supply (Mt/yr) | Growth %/yr | CI (gCO2eq/MJ) | Double-count eligible |
|---|---|---|---|---|---|---|
| UCO | 780 | 950 (rising — tightening supply) | 6.0 | 2.5 | 28 | Yes |
| Animal Tallow | 620 | 680 | 4.5 | 1.2 | 35 | Yes |
| Cellulosic Ethanol | 420 | 360 (falling — scale learning) | 120 | 8.5 | 12 | No |
| Municipal Solid Waste | 80 | 70 | 800 | 1.8 | 5 | No |
| Agricultural Residues | 95 | 85 | 500 | 3.2 | 8 | No |
| Green Hydrogen (PtL) | 4,200 | 2,200 (halving — electrolyser learning curve) | 0.05 | 95 | -70 | No |

These base values are directionally consistent with the guide's cited ranges (UCO $600-1,200/t;
ISCC+ certification cost separate) and IEA Bioenergy Task 39-style feedstock characterisation —
plausible reference data, though not cited to a specific published dataset row-by-row.

### 7.3 Calculation walkthrough

1. `SUPPLIERS` (18 rows) sample a `FEEDSTOCKS` entry per supplier and perturb `price` around the
   base 2024 price by a synthetic +/-15-20% band; `vol_t` and `quality` are independently seeded.
2. `filtered` subsets suppliers by `selFeed`; `avgPrice`/`avgQuality`/`totalVol` are simple means/
   sums over the filtered set.
3. `priceForecast` linearly interpolates each feedstock's price from its 2024 to 2030 anchor at a
   user-controlled year fraction `t` — a straight-line trend, not a supply/demand-elasticity model.
4. `riskRadar` maps each feedstock's static `risk` (25-85, hand-assigned per feedstock — Green
   Hydrogen highest at 85, MSW lowest at 30) alongside `supply` (`min(100, supply_mt/8)`) and
   `growth` (`min(100, growth x 5)`) on a common 0-100 radar scale — a **rescaling for display**,
   not three independently meaningful percentiles.

### 7.4 Worked example

At forecast year fraction `t=0.5` (interpolating 2024->2030, i.e. ~2027) for UCO:
`forecast = round(780 + (950-780) x 0.5) = round(780+85) = $865/t` — a straight-line midpoint,
which likely understates real near-term UCO price given the guide's own note that UCO demand
competition (road transport mandates) is a *current*, not gradually-building, pressure.

### 7.5 Data provenance & limitations

- Base `FEEDSTOCKS` reference values are plausible and roughly sourced from the cited standards
  (ISCC+, RSB, IEA Bioenergy Task 39) but not tied to a specific dataset row.
- 18 suppliers are synthetic perturbations around the base feedstock prices — not real company/
  facility data.
- `hhi` field is mislabeled: it is a per-supplier random number (0.00-0.80), not a market
  concentration statistic. A real HHI would require `sum((supplier_i.vol_t / feedstock_total_vol)^2)`
  computed once per feedstock across all its suppliers — that calculation does not exist in the
  code.
- Price forecasts are linear 2024-to-2030 interpolations, not a supply-cost curve or elasticity
  model — they cannot represent the non-linear price dynamics (e.g. a feedstock-gap-driven price
  spike) that the guide's own "25-35 Mt feedstock gap by 2030" finding implies should occur.

**Framework alignment:** ISCC+ Certification Framework and RSB Global Standard (named correctly as
certification schemes attached to supplier rows, no compliance-scoring algorithm implemented) ·
EU RED double-counting provisions (`dbl_count` flag reproduces the real EU RED II Annex IX Part A/B
waste-feedstock double-counting distinction correctly) · IEA Bioenergy Task 39 feedstock
availability framing (context only).

## 9 · Future Evolution

### 9.1 Evolution A — A real concentration statistic and supply-cost curves (analytics ladder: rung 1 → 2)

**What.** The 7-feedstock reference layer (prices, global supply, CI, EU RED double-counting eligibility) is plausible and roughly sourced (§7.5), but the module's flagged defect is conceptual: the per-supplier `hhi` field is a seeded random number mislabelled as a Herfindahl-Hirschman Index — a real HHI is a market-level statistic (Σ share² across suppliers per feedstock) that the code never computes, and cannot exist per-supplier at all. Price forecasts are flat linear interpolations, and the 18 suppliers are synthetic perturbations. Evolution A computes concentration correctly and upgrades the price layer.

**How.** (1) Compute the actual HHI once per feedstock over its suppliers' volume shares, rendered at the feedstock level; the per-supplier field is renamed to what it can honestly be (a composite supply-risk score with documented components: certification status, geography, volume reliability) or dropped. (2) The supplier register becomes user-editable (procurement teams enter actual counterparties) so concentration and risk reflect a real book; the 18 seeded rows become demo fixtures. (3) Price forecasts gain scenario structure: UCO/tallow price paths linked to SAF-mandate demand volumes from `saf-policy-mandate` rather than straight lines, elasticity assumption documented. (4) A small backend route serves feedstock reference data and computed concentration so sibling SAF modules consume one feedstock fact base.

**Prerequisites.** Volume fields on supplier rows; scenario-linkage convention with the policy module. **Acceptance:** the feedstock-level HHI reproduces from supplier shares by hand; no field named `hhi` exists per supplier; mandate-scenario changes move the price forecast visibly and documentedly.

### 9.2 Evolution B — Procurement-risk copilot for feedstock desks (LLM tier 2)

**What.** Feedstock procurement questions are portfolio-shaped: "our UCO book is 68% two suppliers — what's the concentration read and which certified alternatives exist in-region?", "which feedstocks keep EU RED double-counting if the Annex IX review tightens?", "draft the supply-risk section of our SAF project DD". The copilot combines computed concentration, the certification register, and regulatory reference content.

**How.** Tier-2 tool calls over the register/concentration/forecast endpoints; alternative-supplier suggestions are filtered register queries (certification, feedstock, region), never invented counterparties. Regulatory answers (RED II Annex IX status, double-counting) ground in chunked directive text with review-risk framed as scenario, not prediction. DD sections compose computed metrics through report studio with the assumptions-box pattern. Price-outlook statements carry the scenario name and elasticity assumption from the tool payload.

**Prerequisites (hard).** Evolution A — concentration advice from a mislabelled random field would be analytically wrong at the concept level, not just the data level; directive texts chunked. **Acceptance:** every concentration figure reproduces from register shares; suggested alternatives exist in the register with the claimed certifications; regulatory claims cite directive clauses.