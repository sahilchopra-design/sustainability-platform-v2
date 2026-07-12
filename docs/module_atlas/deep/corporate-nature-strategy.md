## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (frontend↔engine disconnect).** This is a tier-A module with a genuinely
> production-grade backend (`corporate_nature_strategy_engine.py`) implementing SBTN 5-step scoring, TNFD
> LEAP disclosure scoring, ENCORE dependency weights, MSA.km² footprint, EU NRL exposure, and a weighted
> composite (SBTN 35% + TNFD 30% + NRL 15% + GBF 10% + ENCORE 10%). **But the frontend page does not call
> that engine.** `CorporateNatureStrategyPage.jsx` renders **55 generic `sr()`-seeded "Nature Strategy N"
> items** — every displayed score, coverage %, TNFD score, risk, and dependency is a random draw, and the
> named ref/assessment routes (`/full-assessment`, `/encore-dependencies`, `/ref/*`) are not wired into
> the page. So the guide's TNFD-LEAP methodology is *real in the engine* but *absent from the UI*, which
> shows fabricated numbers. §7.1–7.4 document the seeded frontend; §7.5–7.6 document the real engine (the
> model the page *should* surface — no separate §8 needed, the model exists).

### 7.1 What the frontend computes (seeded)

The page generates 55 items with all fields independently `sr()`-seeded, then averages the filtered set:

```js
score      = sr(i·11)·40 + 50        // 50–90
coverage   = sr(i·17)·30 + 60        // 60–90 %
risk       = sr(i·19)·50 + 10        // 10–60
compliance = sr(i·23)·40 + 50        // "TNFD Score" 50–90
impact     = sr(i·29)·60 + 20
rating     = ['AAA'..'B'][floor(sr(i·13)·6)]
kpis.avgScore = mean(score); kpis.aligned = |compliance > 70|
```

There is no LEAP, no dependency matrix, no MSA footprint — the "TNFD Score" is `sr(i·23)·40+50`, a random
number. The 12-point trend series (`TS`) is likewise seeded.

### 7.2 Parameterisation (frontend)

| Field | Generator | Provenance |
|---|---|---|
| `score`, `coverage`, `risk`, `compliance`, `impact` | `sr(i·k)·span + base` | Synthetic seeded PRNG |
| `rating` | `['AAA','AA','A','BBB','BB','B'][floor(sr·6)]` | Synthetic seeded PRNG |
| `pct1` (biodiversity dep), `pct2` (ecosystem service) | `sr()`-scaled | Synthetic seeded PRNG |
| `flag1` (TNFD aligned), `flag2` (SBTN committed) | `sr() > threshold` | Synthetic seeded PRNG |
| sector / region | `F1/F2[floor(sr·len)]` | Synthetic assignment |

### 7.3 Calculation walkthrough (frontend)

`ITEMS` seeded once → `filtered` (search/sector/region) → `kpis` average the seeded fields → four tabs
(dashboard, company table with expandable radar, TNFD alignment charts, action tracker) render the
constants. No user action changes a score; filters only subset the seeded universe.

### 7.4 Worked example (frontend)

Item `i = 1`: `score = sr(11)·40 + 50`. `sr(11) = frac(sin(12)·10⁴)`; `sin(12 rad) = −0.5366`, ×10⁴ =
−5365.7, frac ≈ 0.434 ⇒ `score = 0.434·40 + 50 = 67.4`. Its `compliance` ("TNFD Score") uses `sr(1·23)`,
an unrelated seed → an independent 50–90 value. The radar in the drill-down plots these seeded fields
against a fixed 0–100 axis; none reflect a real nature assessment.

### 7.5 The real engine (what the module *should* surface)

`corporate_nature_strategy_engine.py` implements the guide's methodology faithfully:

- **SBTN 5-step scoring** (each step 0–100, from *disclosure booleans*, not random): Step 1 Assess
  (`materiality_screening +40`, `leap_locate +30`, `min(30, locations·5)`); Step 2 Interpret (ENCORE
  dependency +35, state-of-nature +35, scenario +30); Step 3 Measure (MSA footprint +40, biodiversity +35,
  water +25); Step 4 Set targets (SBTN target +30, land +35, freshwater +35); Step 5 Disclose (TNFD +40,
  annual progress +35, third-party verification +25).
- **MSA.km² footprint:** `Σ_loc (area_ha/100) × (1 − MSA_factor(land_use))` — GLOBIO-style mean-species-
  abundance loss, with land-use MSA factors (intensive agriculture 0.30, pasture 0.35…).
- **ENCORE dependency weights** per sector (financial_dependency_weight 0.02–0.14) and a
  **`SBTN_SECTOR_IMPACT_MAP`** classifying 11 sectors by primary/secondary impact drivers (land use, water,
  pollution, overexploitation, invasive species, climate change) and tier-1/tier-2 SBTN priority.
- **Composite:** `SBTN 0.35 + TNFD 0.30 + NRL 0.15 + GBF 0.10 + ENCORE 0.10`, bucketed into 5 maturity
  tiers (80–100 leader … 0–19 nascent).
- Routes expose `/ref/sbtn-sectors`, `/ref/tnfd-metrics`, `/ref/encore-services`, `/ref/gbf-countries`,
  `/ref/nrl-habitats`, `/ref/maturity-tiers`, `POST /encore-dependencies`, `POST /full-assessment`.

### 7.6 Data provenance & limitations

- **Frontend: 100% synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. The displayed "TNFD Score" is not
  a TNFD score — it is a random draw. This is the module's central defect: a real engine exists but is
  bypassed.
- **Engine: standards-based and disclosure-driven** — scores derive from company disclosure booleans and
  location/target data, not random numbers. It is production-ready but requires real company disclosures as
  input; MSA factors and dependency weights are literature-sourced (GLOBIO, ENCORE v2.1).
- Remediation: wire the page's table to `POST /full-assessment` and the `/ref/*` endpoints so displayed
  scores are engine outputs, not seeded placeholders.

**Framework alignment:** *TNFD v1.0 (Sep 2023)* — the LEAP approach (Locate, Evaluate, Assess, Prepare) and
14 disclosure metrics are scored in the engine. *SBTN Step Guidance v1.1 (2023)* — the 5-step Assess→
Interpret→Measure→Set→Disclose process is the engine's spine. *ENCORE v2.1* (UNEP-WCMC/NCFA) supplies
ecosystem-service dependency materiality by sector. *CBD Kunming-Montreal GBF Target 3 (30×30)* and *EU
Nature Restoration Law (EU) 2024/1991* provide the NRL/GBF exposure legs. *GLOBIO/MSA* underpins the
biodiversity-footprint metric. The engine calculates all of these; the frontend currently displays none of
them.
