## 7 · Methodology Deep Dive

This is one of the better-grounded modules in this batch: 12 **real, named water utilities** (Thames
Water, Severn Trent, United Utilities, Anglian, Veolia UK/France, Suez, Acciona Agua, FCC Aqualia,
Aguas Andinas, Manila Water) with plausible, internally-consistent regulatory financial metrics (RAB,
WACC, DSCR, gearing, Moody's rating, C-MeX). Two of the guide's three formulas are genuinely
implemented; the third (`ODI_Incentive`) and the `Totex_Efficiency` ratio are static author-assigned
fields rather than computed from the underlying totex trend data also present in the file.

### 7.1 What the module computes

```js
adjWACC       = (util.wacc_real + waccAdj/100).toFixed(2)                    // real WACC + user slider adjustment
allowedReturn = (util.rab × adjWACC/100 / 1000).toFixed(2)                    // £Bn allowed return
leakageSaving = round(util.leakage × leakageTarget/100 × 0.42)                // NPV-style saving, £0.42/m³ shadow price
```

`totex_eff` (0.94–1.07, "efficiency ratio" — values >1.0 mean spending *above* allowance) and
`serviceability` (A/B grade), `dscr`, `gearing`, `moody`, `dividend`, `ph_compliance` (drinking-water
compliance %), `pollution_incidents` are all **static, author-curated per-utility fields**, calibrated
to real published figures for each named company (e.g. Thames Water `gearing:82%` correctly reflects
its well-documented above-guidance leverage; `dscr:1.38` is plausibly the lowest of the 12).

### 7.2 Parameterisation

| Utility | RAB (£M) | WACC real | Gearing | Moody's | Serviceability |
|---|---|---|---|---|---|
| Thames Water | 17,200 | 2.92% | 82% | Baa2 | B |
| Severn Trent | 9,800 | 2.92% | 68% | Baa1 | A |
| Veolia France | 12,400 | 3.50% | 62% | Baa1 | A |
| Aguas Andinas (Chile) | 3,100 | 5.20% | 55% | A3 | A |
| Manila Water | 2,400 | 6.80% | 64% | Baa3 | B |

WACC rises with country risk (UK 2.92% → France 3.50% → Spain 4.10% → Chile 5.20% → Philippines
6.80%), a realistic sovereign-risk-adjusted ordering. `£0.42/m³` (the leakage-saving shadow price) is
cited in-line as a specific per-cubic-metre value, consistent with typical UK water-tariff levels but
not tied to a named Ofwat publication in the code itself.

### 7.3 Calculation walkthrough

1. Selecting a utility recomputes `adjWACC`/`allowedReturn`/`leakageSaving` live as the user moves the
   `waccAdj` and `leakageTarget` sliders — a genuine interactive what-if tool.
2. **Totex & Efficiency tab** — `TOTEX_TREND` (2017–2024) tracks `totex_actual` vs `totex_allowed`
   with independent `sr()` noise; a true `Totex_Efficiency = totex_actual/totex_allowed` ratio *could*
   be derived from this series but the displayed per-utility `totex_eff` field is a separate static
   value, not computed from `TOTEX_TREND`.
3. **Asset Serviceability tab** — `ASSET_HEALTH` (5 asset classes: Water Mains, Sewer Network,
   Treatment Works, Pumping Stations, Service Reservoirs) shows Grade A–E distribution and
   `replacement_rate`/`backlog_km` — all static, portfolio-wide (not per-utility) figures.
4. **ODI tracker (`OUTCOMES`, 7 categories)** — `weight`, `pa_rate` (£/unit incentive rate,
   signed — negative for penalty-only categories like Pollution Incidents), `incentive_cap`,
   `performance` label, `pct` (performance level) are all static; the guide's
   `ODI_Incentive = (Performance_Actual − PC_Target) × P_A_Rate` is never computed — there's no
   `PC_Target` field at all, so the £ incentive value shown (if any) is not derived from `pct`.
5. **RAB Trend (`RAB_TREND`, AMP3–AMP8)** — `allowed_return = round(rab × wacc/100)` **is** correctly
   derived in-line via `.map()`, mirroring the interactive calculator's own formula.

### 7.4 Worked example

Thames Water: `wacc_real = 2.92%`, `rab = £17,200M`. At `waccAdj = 0` (no user adjustment):

```
adjWACC = 2.92 + 0 = 2.92%
allowedReturn = 17,200 × 2.92/100 / 1000 = £0.502Bn
```

Leakage: `leakage = 287 Ml/d`, `leakage_target = 231 Ml/d`. At `leakageTarget` slider = 100% (full
AMP8 target achievement): `leakageSaving = round(287 × 100/100 × 0.42) = round(120.5) = £121M` — using
the *current* leakage figure, not the reduction gap (`287−231=56`); a production version should
almost certainly use `leakage − leakage_target` (the actual volume saved), not raw current leakage, to
avoid overstating savings by treating the entire current leakage volume as recoverable.

### 7.5 Data provenance & limitations

- **The 12 utilities' core financials are genuinely well-curated**, consistent with published Ofwat
  PR24/AMP8 and equivalent international regulatory data for each named company — a real strength of
  this module relative to most others in this batch.
- **`leakageSaving`'s formula uses current leakage rather than the leakage-reduction gap** — a likely
  overstatement bug worth fixing (see §7.4).
- **`ODI_Incentive` is not computed** — the guide's stated formula has no corresponding calculation;
  `OUTCOMES.pct` (performance level) never multiplies through to a £ incentive figure.
- **`totex_eff` is static, not derived from `TOTEX_TREND`** — two data series describing the same
  concept (totex efficiency) that could diverge without warning since they're not linked.

**Framework alignment:** Ofwat PR24 Final Determinations 2024 — the RAB/WACC/allowed-return
methodology is genuinely and correctly implemented per the standard UK regulated-utility framework;
AMP period structure (AMP3–AMP8) correctly modelled in `RAB_TREND`. C-MeX and ODI framework concepts
are named and partially represented (static values) but the ODI £-incentive calculation itself is
not implemented.
