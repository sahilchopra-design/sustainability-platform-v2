## 7 · Methodology Deep Dive

### 7.1 What the module computes

`yieldco-dropdown-analyzer` (`YieldcoDropdownAnalyzerPage.jsx`, 1,240 lines)
is entirely **frontend-computed** — there is no backend route; every number
is derived in-page from editable, hand-authored illustrative inputs via a
chain of twelve `useMemo` blocks. It models a sponsor-to-YieldCo asset
rotation ("dropdown") across seven panels: (i) CAFD/share accretion-
dilution, (ii) a fleet register + 5-year committed-dropdown model, (iii) a
three-stage DDM / yield-spread / NAV-SOTP valuation suite with an implied
cost-of-equity bisection solver, (iv) corporate capital structure with a
dividend-cut stress test, (v) an NOL shield runway, (vi) a sustainability
overlay (fleet emissions intensity, dropdown emissions-accretion screen,
cost-of-equity premium), and (vii) an IDR (incentive distribution rights)
sponsor/public split. The page's own banner is explicit: "ALL math on this
page is computed locally in the browser... no engine call, no fabricated
data."

### 7.2 CAFD/share accretion-dilution — the core `m` model

```js
const mktCap = sharesM * price;
const wacc = (mktCap * ke + netDebt0 * kd) / (mktCap + netDebt0);   // pre-deal, no-tax
const equityRaised = purchase * eqPct;
const issuePrice = price * (1 - disc);
const newSharesM = equityRaised / issuePrice;
const debtRaised = purchase * debtPct;
const interestDrag = debtRaised * kd;
const cafd1 = cafd0 + assetCafd - interestDrag;
const shares1 = sharesM + newSharesM;
const cafdps0 = cafd0 / sharesM;
const cafdps1 = cafd1 / shares1;
const accretionPct = (cafdps1 / cafdps0 - 1) * 100;
```
(lines 191–256). Distribution policy holds DPS at the pre-deal level
(`dps0 = cafdps0 × payout`); post-dropdown payout ratio and coverage are
recomputed against the *new* CAFD/share at that held DPS. Retained-CAFD
funding raises net debt (cash used lowers the balance-sheet cash position),
so `netDebt1 = netDebt0 + debtRaised + retainedUsed`.

### 7.3 Worked example — CAFD/share accretion (the page's own defaults)

Using `DEFAULT_PROFILE` (`sharesM=200, price=$15.00, cafd0=$320M,
payout=80%, netDebt0=$1,600M, kₑ=9.5%, k_d=6.0%`) and `DEFAULT_DROP`
(`assetCafd=$42M, purchase=$480M, eqPct=40%, debtPct=48%, retPct=12%,
discPct=3%`):

```
mktCap        = 200 × 15.00                         = $3,000M
WACC          = (3,000×0.095 + 1,600×0.06)/4,600     = 381/4,600 = 8.2826%
equityRaised  = 480 × 0.40                           = $192.0M
issuePrice    = 15.00 × (1−0.03)                     = $14.55
newSharesM    = 192.0 / 14.55                        = 13.1959M
debtRaised    = 480 × 0.48                           = $230.4M
retainedUsed  = 480 × 0.12                           = $57.6M
interestDrag  = 230.4 × 0.06                         = $13.824M
cafd1         = 320 + 42 − 13.824                    = $348.176M
shares1       = 200 + 13.1959                        = 213.1959M
cafdps0       = 320/200                              = $1.6000
cafdps1       = 348.176/213.1959                     = $1.63313
accretion     = (1.63313/1.6000 − 1) × 100            = +2.0705%
```
Distribution follow-through: `dps0 = 1.60×0.80 = $1.28`; post-dropdown
payout `= 1.28/1.63313 × 100 = 78.38%` (down from 80% pre-deal, i.e. *more*
sustainable at held DPS); coverage rises from `1/0.80 = 1.25x` to
`1.63313/1.28 = 1.2759x`. Leverage: `netDebt1 = 1,600+230.4+57.6 = $1,888M`;
`lev0 = 1,600/320 = 5.00x` → `lev1 = 1,888/348.176 = 5.4225x` (leverage rises
despite the accretion — the deal is CAFD/share-accretive but balance-sheet-
levering). NAV bridge: `ev0 = 320/0.082826 = $3,863.5M`, `nav0 = 3,863.5 −
1,600 = $2,263.5M`, `navps0 = $11.318`; `assetCapValue = 42/0.082826 =
$507.1M` (bought at `$480M` purchase, i.e. `$27.1M` **below** capitalized
value — value-accretive on a NAV basis too); `nav1 = (362/0.082826) − 1,888
= $2,482.6M`, `navps1 = $11.645`, **NAV/share accretion = +2.89%.** The two
accretion metrics (CAFD/share +2.07%, NAV/share +2.89%) diverge because NAV
capitalizes the *entire* incremental CAFD at the pre-deal WACC while CAFD/
share nets out the actual interest drag on the specific debt tranche raised
— a genuine and instructive difference the page surfaces side by side.

### 7.4 Fleet emissions-intensity roll-up and dropdown accretion screen

```js
const intensity = totGen > 0 ? emis / (totGen * 1000) : 0;    // gen-weighted tCO2e/MWh (GWh→MWh)
// screen: post-deal intensity = (fleet emissions + dropdown gen×intensity) / (fleet gen + dropdown gen)
const after = (baseGen + g) > 0 ? (baseEmis + e) / (baseGen + g) : 0;
const delta = after - fleet.intensity;
const accretive = delta > 1e-12;                                // raises fleet intensity → flagged
```
(lines 337–345, 501–536). Using `DEFAULT_ASSETS` (Wind A 1,400 GWh/0
intensity, Solar B 900 GWh/0, Hydro C 700 GWh/0.004, Gas peaker D 300 GWh/
0.45 tCO2e/MWh): `totGen = 3,300 GWh`, `emis = 700×1,000×0.004 +
300×1,000×0.45 = 2,800 + 135,000 = 137,800 tCO2e`, **fleet intensity =
137,800 / 3,300,000 = 0.041758 tCO2e/MWh.**

**Gas-vs-renewables dropdown screen**, two candidate dropdowns against this
same fleet:
- **Gas dropdown** (300 GWh at 0.45 tCO2e/MWh, matching the existing gas
  peaker's intensity): `g = 300,000 MWh`, `e = 300,000×0.45 = 135,000
  tCO2e`; `after = (137,800+135,000)/(3,300,000+300,000) = 272,800/3,600,000
  = 0.075778 tCO2e/MWh`; **Δ = +0.034020 → intensity-ACCRETIVE** (nearly
  doubles the fleet's carbon intensity).
- **Wind dropdown** (450 GWh at 0.0 intensity — the schedule's actual "Wind
  dropdown II"): `after = 137,800/(3,300,000+450,000) = 137,800/3,750,000 =
  0.036747 tCO2e/MWh`; **Δ = −0.005011 → intensity-dilutive** (improves the
  fleet average by pure dilution, since it adds zero-emission generation
  without adding emissions to the numerator).

This confirms the code's screen mechanic exactly: a same-intensity gas asset
raises the fleet average because it enters at a rate roughly 10x the current
blended intensity, while any zero-carbon asset — regardless of size —
mechanically *dilutes* the average by growing the denominator alone. The
page then feeds `fleet.intensity` into a labeled, hand-authored cost-of-
equity premium (`Δkₑ = slope × (intensity − benchmark)`, `slope` and
`benchmark` both user inputs) and re-prices the three-stage DDM at the
adjusted kₑ — explicitly **not** a calibrated market coefficient.

### 7.5 Three-stage DDM, yield-spread and NAV SOTP

```js
// stage 1 (yrs 1-5): the 5-yr model's DPS path; stage 2 (yrs 6-10): growth fades
// linearly from year-5 growth g5 to terminal g; stage 3: Gordon terminal value
for (t=1..5)  pv += path[t-1] / (1+ke)^t
for (t=6..10) { g = g5 + (gTerm-g5)*(t-5)/5; dps *= (1+g); pv += dps/(1+ke)^t }
tv = dps*(1+gTerm)/(ke-gTerm);  pv += tv/(1+ke)^10
```
(lines 396–413). Implied cost of equity is solved by 100-iteration bisection
so `DDM(kₑ*) = market price`. Yield-spread valuation: `fairPrice = DPS₁ ÷
(10yr yield + required spread)`. NAV SOTP discounts each asset's *own*
declining CAFD (`cafd × (1−decline)^k`) over its *own* remaining life at a
differentiated rate (`kContrPct` for contracted assets, `kMerchPct` for
merchant), then nets corporate debt — "the finer-grained alternative
(differentiated rates, finite lives)" to the flat-perpetuity NAV bridge in
§7.3.

### 7.6 5-year model, dividend-cut stress and NOL runway

The 5-year roll-up compounds each existing asset's CAFD at `(1−decline)^t`,
adds each committed dropdown from its entry year (held flat post-entry,
financed at the *same* headline funding mix/issue price as the headline
dropdown — a static, documented simplification), and applies a DPS policy
rule: `DPSₜ = min(DPSₜ₋₁×(1+g_target), payout_ceiling × CAFD/shareₜ)` — a
below-prior-year DPS is flagged as a **cut**. The dividend-cut stress test
haircuts year-1 CAFD by 0/−10/−20/−30% and classifies coverage against
current dividend cash as `CUT (<1.00x) / WATCH (1.00–1.10x) / HOLD (>1.10x)`.
The NOL runway applies the real §172 post-2017 80%-of-taxable-income
limitation: `usable = min(NOL_balance, 0.8×taxable)`, `cash_tax = 21%×
(taxable − usable)`, ending the first year cash tax turns positive.

### 7.7 Incentive Distribution Rights (IDR) waterfall

```
tier cash = (DPS in band) × pro-forma shares
sponsor share of tier = take% × tier cash;  public share = (100−take)% × tier cash
```
Convention (documented in-page): the declared DPS is allocated **marginally**
across ascending bands; sponsor IDR cash is *part of* the declared total —
no gross-up. Classic MLP-style default tiers: 0% take up to $1.00 DPS, 15%
to $1.15, 25% to $1.30, 50% above (the "high splits" top tier).

### 7.8 Data provenance & limitations

- **All figures are hand-authored illustrative demo data** — no engine call,
  no live market feed. The profile (`DEFAULT_PROFILE`), dropdown
  (`DEFAULT_DROP`), fleet (`DEFAULT_ASSETS`), committed schedule
  (`DEFAULT_SCHEDULE`), IDR tiers, and DPS-yield spread history
  (`SPREAD_HISTORY`) are all explicitly labeled "editable... NOT live data."
- **NAV bridge is a zero-growth perpetuity** at the pre-deal WACC — a
  documented simplification; the NAV-SOTP panel is the finer-grained
  alternative with differentiated rates and finite asset lives, and the two
  will not agree except by construction.
- **The 5-year dropdown financing is static**: every committed dropdown is
  assumed to finance at the *headline* dropdown's funding mix and issue
  price, not its own negotiated terms.
- **Sustainability kₑ premium is explicitly hand-authored** ("user slope, not
  an estimated market coefficient") — a sensitivity lens, not a calibrated
  cost-of-capital adjustment.
- **DRO-style loss reallocation, book/tax disparities and true §704(b)
  waterfalls are out of scope** for this page (those belong to
  `tax-equity-transferability`); this page's IDR convention is a simplified
  single-allocation split, not a full MLP incentive-distribution cash
  waterfall with catch-up provisions.
- **Green-securitization (ABS) comparison is headline-only** — the page
  explicitly defers full ABS structuring (tranching, credit enhancement,
  waterfall) to the separate `/green-securitization` module.
- No guide/code mismatch found: the atlas spec ("CAFD accretion of a
  dropdown, payout-ratio sustainability, NAV/share bridge, dropdown vs
  green-securitization takeout comparison") undersells the implementation,
  which adds the full 5-year model, three-stage DDM/implied-kₑ/NAV-SOTP
  suite, dividend-cut stress, NOL runway and the sustainability overlay.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Provide a self-contained, browser-only corporate-
finance workbench for a YieldCo evaluating a sponsor asset dropdown:
immediate CAFD/share and NAV/share accretion, multi-year distribution
sustainability under a committed ROFO pipeline, a triangulated valuation
(DDM/yield-spread/NAV-SOTP), balance-sheet stress, tax-shield runway, and a
sustainability screen — for YieldCo management, sponsor corporate-
development teams and public unitholders assessing whether a proposed
dropdown creates or destroys per-share value.

**8.2 Conceptual approach.** All math is display-level and computed
client-side via chained `useMemo` blocks so every intermediate (funding mix,
pro-forma CAFD, NAV bridge, DDM stages, stress scenarios) recalculates
instantly as inputs are edited — appropriate for a workbench meant to be
driven interactively rather than round-tripped to a server. The three
valuation methods (DDM, yield-spread, NAV-SOTP) are deliberately kept
independent rather than reconciled to a single "fair value," so their
dispersion is itself a signal the page surfaces ("triangulate DDM, yield and
SOTP — dispersion between the three is itself a signal about embedded
growth expectations").

**8.3 Mathematical specification.**
```
WACC = (E·kₑ + D·k_d)/(E+D),  E = shares×price, D = net debt        (pre-deal, no tax shield)
CAFD/share_1 = (CAFD_0 + asset_CAFD − debt_raised·k_d) / (shares_0 + equity_raised/issue_price)
Accretion% = (CAFD/share_1 / CAFD/share_0 − 1) × 100
NAV_0 = CAFD_0/WACC − NetDebt_0;  NAV_1 = (CAFD_0+asset_CAFD)/WACC − NetDebt_1
Fleet intensity = Σᵢ genᵢ·intensityᵢ / Σᵢ genᵢ            (generation-weighted)
Dropdown screen: Δintensity = (fleet_emis + gen_dd·int_dd)/(fleet_gen + gen_dd) − fleet_intensity
CAFDₜ = Σᵢ CAFDᵢ(1−declineᵢ)ᵗ + Σ dropdown CAFD (from entry yr) − Σ acquisition-debt interest
DPSₜ = min(DPSₜ₋₁(1+g_target), payout_ceiling × CAFD/shareₜ)
DDM = Σ_{t=1}^{5} DPSₜ/(1+kₑ)ᵗ + Σ_{t=6}^{10} DPSₜ/(1+kₑ)ᵗ (fading growth) + TV/(1+kₑ)¹⁰
Implied kₑ*: bisection s.t. DDM(kₑ*) = market price
NAV_SOTP = Σᵢ [Σ_{k=1}^{lifeᵢ} CAFDᵢ(1−declᵢ)ᵏ/(1+rᵢ)ᵏ] − corp_debt,  rᵢ = contracted or merchant rate
Δkₑ (sustainability) = slope × (fleet_intensity − benchmark)     (hand-authored, labeled)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Profile / dropdown / fleet / schedule defaults | `DEFAULT_*` | Hand-authored illustrative, labeled editable |
| IDR tier thresholds/takes | `DEFAULT_IDR_TIERS` | Classic MLP-style splits, hand-authored |
| DPS-yield spread history | `SPREAD_HISTORY` | Hand-authored illustrative sector levels, labeled NOT market data |
| Sustainability kₑ slope/benchmark | `sus.slopePctPerT`/`benchmarkT` | User assumption, explicitly not an estimated market coefficient |
| Dividend-cut verdict thresholds | 1.00x / 1.10x | Documented policy rule (hand-authored) |
| NOL 80% limitation | 80% of taxable income | IRC §172 (post-2017 rule, real) |

**8.4 Data requirements.** Shares outstanding, price, current CAFD, payout
ratio, net debt, kₑ/k_d for the profile; asset CAFD, purchase price, funding
mix (equity/debt/retained %), issue discount for the dropdown; per-asset
generation, CAFD, emissions intensity, decline rate and remaining life for
the fleet register; a committed dropdown schedule (year, CAFD, purchase,
generation, intensity, taxonomy flag); DPS growth target and payout ceiling
policy parameters; discount rates (contracted/merchant), terminal growth,
10-year yield and required spread for the valuation suite; revolver/notes
balances and rates for capital structure; NOL balance and taxable fraction;
sustainability slope and benchmark.

**8.5 Validation & benchmarking.** No backend or external data source
exists for this page — validation is limited to internal consistency checks
a user can perform by hand (e.g. the accretion identities traced in §7.3).
Production use would require replacing every `DEFAULT_*` constant with the
actual YieldCo's reported CAFD, share count, fleet register and committed
ROFO pipeline, and benchmarking the DDM/NAV-SOTP outputs against the
company's own guidance and sell-side estimates.

**8.6 Limitations & model risk.** NAV bridge assumes a flat zero-growth
perpetuity at the pre-deal WACC (no tax shield, no growth) — a materially
different assumption from the NAV-SOTP panel's differentiated, finite-life
DCF, so the two NAV figures are not directly reconcilable by design. The
5-year model finances every committed dropdown at the headline dropdown's
static mix and issue price rather than asset-specific terms. The
sustainability cost-of-equity premium is an explicitly hand-authored
sensitivity, not a calibrated market risk premium — using it as a pricing
input rather than a screening lens would overstate its precision. The IDR
convention is a simplified marginal-band split without MLP-style catch-up
provisions or subordinated-unit mechanics. All defaults are illustrative and
must be replaced with real fleet/balance-sheet data before any output is
used for an actual dropdown decision.

**Framework alignment:** CAFD-per-share accretion/dilution analysis (standard
YieldCo equity-research convention) · three-stage dividend discount model ·
NAV sum-of-the-parts (per-asset DCF) · classic MLP incentive-distribution-
rights tier structure · IRC §172 net-operating-loss 80% limitation (real) ·
PCAF-style generation-weighted emissions intensity (methodologically
consistent with the platform's other financed-emissions modules, though this
page does not call PCAF machinery directly).
