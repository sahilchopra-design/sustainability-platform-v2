## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula (`LTIFR = (Lost Time Injuries × 1,000,000) /
> Hours Worked`) is the industry-standard construction. **It is never computed.** `ltir` and `trir`
> are independent random fields per company — there is no `lostTimeInjuries` count or `hoursWorked`
> denominator anywhere in the file for the ratio to be derived from.

### 7.1 What the module computes

78 real, named industrial/extractives companies (BHP, Rio Tinto, ExxonMobil, Shell, ArcelorMittal,
Caterpillar, Bechtel, etc.) across sectors (secs[i]) and regions, each with independently-seeded:
`ltir` (0.2–4.7), `trir` (0.5–8.5), `fatalities` (0–5), `nearMisses`, `lostDays`, `employees`,
`safetySpend`, `trainingHours`, `inspections`, `violations`, `safetyScore` (20–95), `isoCompliance`
(bool), `mentalHealth`/`ergonomics`/`ppeCompliance` scores, `incidentTrend` (Improving/Stable/
Worsening), `safetyRating` (6-tier, from a *separate* draw of the same seed `sr(i·7)` used for
`ltir` — see §7.4), `severity`, `processEvents`, `contractorRate`.

```js
kpis.avgLtir = Σ ltir / n     // portfolio mean of the random ltir field
kpis.totalFat = Σ fatalities
kpis.avgScore = round(Σ safetyScore / n)
kpis.improving = count(incidentTrend === 'Improving')
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `ltir` | 0.2–4.7 | `sr(i·7)×4.5+0.2`, synthetic |
| `trir` | 0.5–8.5 | `sr(i·11)×8+0.5`, synthetic |
| `BENCHMARKS` (8 sectors) | Mining ltir 2.8/trir 5.2/fatRate 0.012 → Utilities ltir 1.0/trir 2.2/fatRate 0.002 | Static, plausible relative ordering (Mining highest, Utilities/Chemicals lowest) consistent with real IOGP/ILO sector safety-performance rankings, but not sourced to a specific published dataset row |
| `TREND` (36 months) | `avgLtir = 2.5 − month×0.03 + noise` | Synthetic gently-declining trend, illustrative of an improving-safety narrative rather than a real fleet trend |

### 7.3 Calculation walkthrough

1. `kpis`, `sectorChart` (per-sector mean `ltir`/`trir`), and `radarData` (6-axis average across
   safety/training/PPE/mental-health/ergonomics/ISO-certification-rate) all aggregate `COMPANIES`
   with simple, correctly-implemented means and counts — the *aggregation* logic is sound, only the
   underlying per-company `ltir`/`trir` inputs are unfounded.
2. **Company table** colour-codes `ltir` (`badge(r.ltir,[1,2,3.5])`) and `trir`
   (`badge(r.trir,[2,4,6])`) against fixed thresholds — a genuine, if arbitrarily-chosen, tiering
   rubric.
3. **Sector Benchmarks tab** renders the static `BENCHMARKS` table directly against `COMPANIES`'
   sector averages, letting a user visually compare a synthetic per-company figure against a
   plausible-but-uncited sector reference — a comparison that looks evidentiary but isn't, since
   both sides ultimately trace back to author judgement rather than a shared real dataset.

### 7.4 A data-quality note: `safetyRating` reuses the `ltir` seed

```js
ltir: +(sr(i*7)*4.5+0.2).toFixed(2)
...
safetyRating: sr(i*7)<0.1?'Critical': sr(i*7)<0.25?'Poor': ... :'Excellent'
```

Both `ltir` and `safetyRating` are derived from the **same** `sr(i·7)` draw. This means `safetyRating`
is **perfectly monotonically determined by `ltir`** — a company's letter-grade rating never needs the
`trir`, `fatalities`, or `violations` fields at all, despite those fields nominally contributing to
overall safety performance. This is a subtler design flaw than a fully independent random field: it
creates an illusion of a richer multi-factor rating while the rating is actually single-factor.

### 7.5 Data provenance & limitations

- **All 78 companies' `ltir`/`trir`/`fatalities`/etc. are synthetic**, though attached to real company
  names, which risks a reader mistaking a random number for that company's actual disclosed safety
  record.
- **No LTIFR/TRIR formula exists** — the guide's core methodology (injuries × 1,000,000 / hours
  worked) requires two inputs (`lostTimeInjuries`, `hoursWorked`) neither of which exists in the data
  model at all.
- **`safetyRating` is single-factor despite appearing multi-dimensional** (§7.4) — a genuine
  implementation defect worth fixing regardless of whether the underlying data becomes real.
- `BENCHMARKS`' 8-sector table, while plausible, is not cited to IOGP Safety Performance Indicators
  or any other specific named source, despite the guide citing IOGP directly.

**Framework alignment:** GRI 403 (Occupational Health and Safety, 2018) and ILO R194 (both named in
the guide) define the *concepts* (LTIFR, TRIR, fatality rate) correctly labelled in the UI, but the
actual GRI 403 calculation methodology (injury counts over exposure hours) is not implemented — the
displayed figures are not currently GRI 403-compliant metrics, just plausibly-ranged random numbers
with the right units and labels.
