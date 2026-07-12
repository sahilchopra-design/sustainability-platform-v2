## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) mismatch flag.** A backend engine exists
> (`export_credit_esg_engine.py`, with real `/assess`, `/equator-principles`, `/fossil-fuel-screen`,
> `/green-classification` endpoints) that could compute the guide's composite
> `ECA_ESG = (0.6·IFC_PS + 0.4·OECD_CA)`. **The `ExportCreditESGPage.jsx` frontend does not call it for
> scoring** — it renders 50 seeded transactions and 40 seeded countries, and the weighted composite is
> **never computed on-page**. The IFC PS statuses, OECD/E/S/G scores, EP categories are all `sr()`
> synthetic. The framework labels (ECAs, IFC PS1–PS8, OECD Common Approaches, Equator Principles
> categories) are real. Documented below.

### 7.1 What the frontend computes

`transactions` (50) and `countries` (40) are seeded; the only aggregation is portfolio roll-ups:

```js
oecdScore = round(50 + s3·45)               // 50–95, synthetic
eScore/sScore/gScore = round(40..50 + sr()·50..55)   // synthetic E/S/G pillar scores
ifcScreening = IFC_PS.map(ps => ({
  status: sr()>0.3 ? 'Compliant' : sr()>0.15 ? 'Partial' : 'Gap',
  score:  round(40 + sr()·55)
}))
// portfolio:
totalValue = Σ valueMn ;  avgOecd = round(Σ oecdScore / 50)
sectorAgg / geoAgg / riskDist  = counts and value sums by sector / host country / ESG category
```

The **weighted ECA_ESG composite (0.6·IFC + 0.4·OECD) is not computed** — the page shows the pillar
scores separately but never blends them per the guide's formula.

### 7.2 Parameterisation & provenance

| Element | Rows | Provenance |
|---|---|---|
| `ECA_NAMES` | 15 | **Real ECAs**: Euler Hermes (DE), Bpifrance, US EXIM, UKEF, NEXI, K-EXIM, SACE, CESCE, Atradius, EDC, Sinosure, EKN, SERV, OeKB, EKF |
| `IFC_PS` | 8 | **Real** IFC Performance Standards PS1–PS8 (Assessment, Labour, Pollution, Community, Land Resettlement, Biodiversity, Indigenous, Cultural Heritage) |
| `EP_CATS` / `ESG_CATS` | 3 / 3 | **Real** Equator Principles / OECD Common Approaches Category A/B/C |
| `SECTORS` | 12 | Real project-finance sectors |
| `PROJ_NAMES` | 50 | Illustrative project names |
| Transaction/country scores | seeded | **Synthetic** `sr()` |
| Country `region`, names | 40 | Real host-country names + regions (metadata) |

### 7.3 Calculation walkthrough (frontend)

1. `transactions` generates 50 deals with seeded ECA, sector, ESG category (A/B/C), EP category, value,
   tenor, per-PS IFC status, OECD/E/S/G scores, hazard risks, covenants.
2. Filter/sort by sector, category, search; expand row for the IFC PS radar.
3. `countries` provides 40 host-country risk profiles (OECD risk 1–7, E/S/G, climate vulnerability,
   corruption index) — all seeded.
4. Portfolio tab: `totalValue`, `avgOecd`, `sectorAgg`, `geoAgg`, and a Category A/B/C distribution.

### 7.4 Worked example (transaction i = 3 → "Andean Copper Mine")

| Step | Computation | Result |
|---|---|---|
| s3 = sr(57) | frac(sin(58)·10⁴) | ≈ 0.30 |
| esgCat | ESG_CATS[floor(0.30·3)] | index 0 → "A" |
| oecdScore | round(50 + 0.30·45) | 64 |
| A guide composite (not coded) | 0.6·IFC_avg + 0.4·64 | — not computed |

A copper mine correctly lands in Category A (highest-impact, full ESIA) — but that is by seeded chance,
not by an impact-screening rule. The OECD score 64 and the per-PS statuses are random, and the guide's
composite that would combine them is absent.

### 7.5 Data provenance & limitations

- **All transaction/country scores are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). ECA names, IFC PS, EP
  categories, and host countries are real labels on random data.
- **No ECA_ESG composite computed** despite the guide — IFC and OECD pillar scores are shown separately,
  never weighted 0.6/0.4.
- **No host-country gap assessment** (guide KPI) is computed; it is a display field.
- The rigorous backend (`/assess`, `/equator-principles`, `/fossil-fuel-screen`) is not invoked.

**Framework alignment:** Content references the real regime accurately — the **OECD Common Approaches on
Officially Supported Export Credits** (Category A/B/C, >$10M ESIA threshold), the **IFC Performance
Standards 2012** (PS1–PS8), and **Equator Principles IV**. Category A = full ESIA + independent review;
the IFC PS structure is the E&S benchmark against which host-country gaps are measured. The intended-but-
absent artefact is the guide's weighted ECA_ESG compliance score.

## 8 · Model Specification

**Status: specification — not yet wired into the frontend (backend engine exists).** Route transactions
through `export_credit_esg_engine.assess` and compute the weighted composite.

**8.1 Purpose & scope.** Produce a per-transaction ECA ESG compliance score gating cover endorsement,
combining IFC PS compliance with OECD Common Approaches procedural compliance, with host-country gap
assessment and fossil-fuel screening.

**8.2 Conceptual approach.** The weighted composite the guide defines, benchmarked to real ECA E&S review
practice (UKEF, EDC, US EXIM) and the OECD Common Approaches procedure — IFC PS compliance (materiality-
weighted, Compliant/Minor/Major grades) blended with OECD procedural compliance (categorisation, ESIA
benchmarking, monitoring, public disclosure).

**8.3 Mathematical specification.**

```
IFC_PS_score = Σ_p w_p · grade_p / Σ_p w_p × 100   grade ∈ {Compliant 1, Minor 0.5, Major 0}
OECD_CA_score = mean(categorisation, ESIA-benchmarking, monitoring-plan, public-info) × 100
ECA_ESG = (0.6·IFC_PS_score + 0.4·OECD_CA_score)
Host-country gaps = count(PS requirement stricter than national law)
Fossil-fuel screen: exclude ⇔ activity ∈ excluded-fossil list AND not aligned exception
Endorse ⇔ (ECA_ESG ≥ 85) AND (open Major NC = 0) AND fossil-screen pass
```

| Parameter | Source |
|---|---|
| IFC/OECD weights (0.6/0.4) | Guide; ECA practice |
| PS sub-requirement weights | IFC PS Guidance Notes |
| OECD CA procedural criteria | OECD Common Approaches 2016 §4/§6/§24 |
| Endorsement threshold 85% | Guide / ECA covenant |
| Fossil exclusion list | OECD sector understanding + ECA fossil-fuel policies |

**8.4 Data requirements.** Project ESIA (parsed to PS grades), OECD categorisation questionnaire, host-
country E&S law database, sector/fuel classification. Platform has the backend engine and reference
endpoints; frontend needs to POST transaction evidence rather than seed.

**8.5 Validation & benchmarking plan.** Reconcile category determinations against OECD CA §4 criteria;
test that any Major NC blocks endorsement; benchmark against published ECA E&S review conclusions.

**8.6 Limitations & model risk.** PS grading is judgemental — dual sign-off. Category mis-screening
propagates; validate against sector/impact criteria. Conservative fallback: unassessed applicable PS →
treated as Major-NC-equivalent (0) until evidenced.
