## 7 · Methodology Deep Dive

The EM Carbon Credit Hub is an **Article 6 (Paris Agreement) carbon-market intelligence tracker**: bilateral
ITMO deals, corresponding-adjustment (CA) status, ITMO pricing by project type, NDC-gap/offset demand,
the ACMI initiative, JCM & bilateral programs, and MRV/integrity. It is data-and-aggregation driven — the
deal, pricing and CA tables are **authored realistic data** (real buyer/seller pairs, mechanisms,
verifiers), and the page computes market roll-ups over them. No guide record supplied → no mismatch flag.

### 7.1 What the module computes

The page is primarily a **structured tracker**; derived quantities are aggregations, not modelled scores:

```
Total ITMO volume       = Σ BILATERAL_DEALS.itmoVolume            (MtCO₂e)
Volume-weighted price   = Σ(vol·price) / Σ vol
CA coverage %           = deals with caApplied=true / total deals
By mechanism            = group Σ volume over {Art6.2, Art6.4, JCM, bilateral}
NDC gap / offset demand  = CA_STATUS.ndcGap aggregated by region
Integrity/MRV score     = qualitative MRV_CHALLENGES roll-up
```
`sr(s)=frac(sin(s+1)×10⁴)` is present but used only for minor chart cosmetics; the substantive tables are
hard-coded.

### 7.2 Parameterisation / data tables

| Table | Rows | Contents (real fields) |
|---|---|---|
| `BILATERAL_DEALS` | 25 | buyer/seller, sector, ITMO volume, $/t, CA status, mechanism (Art6.2/6.4/JCM/bilateral), start/end year, verifier (Gold Standard/Verra/JCM/UN Art6.4 Body), additionality proof |
| `ITMO_PRICING` | 12 | project type, min/max/avg price, volume, trend, liquidity score, registry count |
| `CA_STATUS` | 15 | country, CA framework (yes/partial/no), credit volume, projects, NDC target, NDC gap, Art6-ready, domestic ETS, carbon tax |
| `JCM_PROJECTS` | 16 | Japan Joint Crediting Mechanism projects |
| `MRV_CHALLENGES` | 11 | MRV/integrity challenge log |
| `ACMI_DATA` | — | Africa Carbon Markets Initiative targets |

Pricing bands are **plausible real-market magnitudes** (REDD+ high-integrity $15–28, Renewable Energy
$5–16, Blue Carbon $18–35, Green Hydrogen $20–40) reflecting the actual Article 6 / voluntary market
premium for high-integrity nature credits. CA status and NDC targets track real country positions
(Switzerland −50%, Singapore −36%, Japan −46%).

### 7.3 Calculation walkthrough

1. Deal, pricing and CA tables load as module constants.
2. Market-map tab aggregates volume and price by buyer/seller/mechanism.
3. Article 6.2 tracker filters deals by CA status; ITMO pricing tab charts price bands and liquidity.
4. CA deep-dive cross-tabs framework readiness vs credit volume; NDC-gap tab ranks countries by offset
   demand (`ndcGap`); MRV/integrity tab surfaces the challenge log.

### 7.4 Worked example (volume-weighted ITMO price)

Take three Switzerland deals: Peru (2.5 Mt @ $18), Ghana (1.8 @ $15), Thailand (0.8 @ $20).
```
Σ(vol·price) = 2.5·18 + 1.8·15 + 0.8·20 = 45 + 27 + 16 = 88
Σ vol        = 2.5 + 1.8 + 0.8 = 5.1
VWAP         = 88 / 5.1 = $17.25 / tCO₂e
```
CA coverage for these three = 3/3 = 100% (all caApplied=true) — i.e. all have a corresponding adjustment
applied so the host country will not also count the reduction toward its NDC (avoiding double counting).

### 7.5 Data provenance & limitations

- **Deal/pricing/CA tables are authored** to reflect the real Article 6 market (real countries, verifiers,
  mechanisms), but they are a **curated snapshot**, not a live registry feed — volumes and CA statuses are
  point-in-time illustrations.
- No modelled score or PRNG-driven risk metric drives the headline numbers; the analysis is descriptive
  aggregation.
- Pricing bands are indicative; actual ITMO prices are thinly traded and opaque.

**Framework alignment:** **Paris Agreement Article 6** — 6.2 (cooperative approaches / ITMOs with
corresponding adjustments), 6.4 (UN-supervised mechanism, the PACM successor to the CDM); **corresponding
adjustments** (host-country ledger adjustment to prevent double counting toward NDCs); **JCM** (Japan's
Joint Crediting Mechanism); **ACMI** (Africa Carbon Markets Initiative); credit-quality signalling via
**ICVCM Core Carbon Principles** and standards (**Verra VCS, Gold Standard**) named in the verifier field;
**additionality** tests (investment/technology/financial barriers, common-practice) per CDM/Article 6
additionality guidance.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (ITMO integrity & pricing model).**

### 8.1 Purpose & scope
Turn the tracker into a scored **ITMO integrity + fair-value model**: a credit-quality score per deal and
a modelled reference price, supporting buy-side Article 6 procurement and portfolio integrity screening.

### 8.2 Conceptual approach
Score each ITMO on **ICVCM CCP + corresponding-adjustment robustness + additionality strength + MRV
quality**, then model fair value as a quality-adjusted premium over a project-type base price. Benchmarks:
ICVCM CCP assessment framework, VCMI Claims Code, Gold Standard/Verra methodologies, Article 6.2 guidance.

### 8.3 Mathematical specification
```
IntegrityScore = w1·CCP_score + w2·CA_robustness + w3·additionality + w4·MRV_quality  (0–100)
   CCP_score: ICVCM 10 Core Carbon Principles assessed at programme + methodology-category level
   CA_robustness: {applied 1.0, exempt 0.7, pending 0.4, rejected 0.0}
FairPrice = basePrice(projectType) · (1 + β·(IntegrityScore−50)/50) · liquidityAdj
DoubleCountRisk = P(no valid CA) · volume
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| CCP score | — | ICVCM Core Carbon Principles assessment (programme-level) |
| Base price by type | — | ITMO_PRICING avg (this module), CDR.fyi / market data |
| Additionality | — | CDM/Art6 additionality tools |
| MRV quality | — | methodology + verifier track record |

### 8.4 Data requirements
Per-deal registry data (already tabulated), ICVCM CCP assessment outcomes, host-country NDC ledgers for CA
verification, methodology/verifier metadata. Free: ICVCM assessments, UNFCCC Art6 registry; the platform
holds the deal/pricing/CA tables.

### 8.5 Validation & benchmarking plan
Reconcile modelled fair price vs observed transaction prices; integrity score vs ICVCM CCP-labelled
credits; CA robustness vs UNFCCC corresponding-adjustment records; sensitivity of price to integrity weight.

### 8.6 Limitations & model risk
Article 6 is nascent with thin, opaque pricing and evolving CA rules; integrity scoring is judgemental.
Conservative fallback: treat pending/rejected CA as high double-count risk and discount price/volume
accordingly rather than assuming a corresponding adjustment will be granted.
