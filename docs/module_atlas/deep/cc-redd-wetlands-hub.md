## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is broadly faithful: the code implements a REDD+ avoided-deforestation
calculator (VM0007-style), a wetland multi-gas calculator (VM0033-style), a blue-carbon reference
table, and a risk-weighted buffer-pool tool. One nuance vs the guide: the guide emphasises
*jurisdictional* JNR/ART TREES reference-level accounting; the code implements a **project-level**
avoided-deforestation baseline with an exponential-decay forest stock, not a jurisdictional RL. It is
labelled `methodology:'VM0007'`, consistent with the code.

### 7.1 What the module computes

**REDD+** (`calcREDD`), project-level baseline with declining forest stock:
```
deforested(t) = remaining · BDR;   remaining −= deforested        // BDR = baseline deforestation rate
baseline_emissions = deforested · (CS_forest − CS_post) · (44/12) // C→CO2
gross = baseline_emissions
leak  = gross·(leakage_act% + leakage_mkt%)/100                   // activity-shift + market leakage
buf   = (gross − leak)·buffer%/100
unc   = (gross − leak − buf)·uncertainty%/100
net(t)= max(0, gross − leak − buf − unc)
```

**Wetlands multi-gas** (`calcWetlands`) — full 3-gas baseline vs project:
```
bl_total = area·(CO2_rate·1 + CH4_rate·GWP_CH4 + N2O_rate·GWP_N2O)
pj_total = area·(pj_CO2·1 + pj_CH4·GWP_CH4 + pj_N2O·GWP_N2O)
gross = max(0, bl_total − pj_total);   net = (gross − leak)·(1−buffer%)
```
GWP set is selectable: `GWP_AR5={CH4:28,N2O:265}` or `GWP_AR6={CH4:27.2,N2O:273}`.

**Risk-weighted buffer** (`riskPremium`): `Σ RISK_FACTORS[i].scores[level_i] · weight_i` over 5 risk
categories, added to a base buffer of 20% — the Verra AFOLU Non-Permanence Risk Tool logic.

### 7.2 Parameterisation / scoring rubric

| Parameter | Default / value | Provenance |
|---|---|---|
| BDR (baseline deforestation) | 1.2%/yr | UI-set; typical tropical frontier rate |
| CS_forest / CS_post | 350 / 50 tC/ha | UI-set; intact tropical forest vs post-clearing |
| Carbon→CO₂ | 44/12 | Exact molar ratio |
| Leakage act / mkt | 8% / 4% (=12%) | Code comment: VM0007 activity-shift + market split |
| Buffer / uncertainty | 25% / 10% | UI-set; Verra NPR + activity-data uncertainty |
| GWP AR5/AR6 | CH₄ 28/27.2, N₂O 265/273 | IPCC AR5 Table 8.7 / AR6 Table 7.SM.7 |
| Blue-carbon sequestration | Mangrove 8.4, Seagrass 4.2, Salt Marsh 6.5, Peatland 2.8 tCO₂/ha/yr | `BLUE_CARBON` — literature-consistent, uncited |
| Risk weights | Political 0.25, Fire 0.25, Community 0.20, Technical 0.15, Financial 0.15 | `RISK_FACTORS` — Verra NPR risk categories |

The 20 `HUB_PROJECTS` (area, credits, price, registry) are **synthetic** (`sr()` PRNG).

### 7.3 Calculation walkthrough

REDD+ iterates crediting years, drawing down the forest stock by BDR each year (so annual baseline
emissions decline as the at-risk stock shrinks), applying four sequential deductions (leakage →
buffer → uncertainty), and accumulating net credits. Result pushes to `CarbonCreditContext` as
`VM0007`. Wetlands computes a per-year 3-gas baseline-minus-project difference under the chosen GWP
set. The risk tab maps 5 selected risk levels to a buffer premium via the weighted-score table.

### 7.4 Worked example (REDD+, year 1)

Defaults: BDR=1.2%, forest=100,000 ha, CS_forest=350, CS_post=50, leak_act=8%, leak_mkt=4%,
buffer=25%, uncertainty=10%.

| Step | Computation | Result |
|---|---|---|
| Deforested (yr 1) | 100,000·0.012 | 1,200 ha |
| Baseline emissions | 1,200·(350−50)·(44/12) | 1,200·300·3.667 = **1,320,000 tCO₂e** |
| Leakage (12%) | 1,320,000·0.12 | 158,400 |
| Buffer (25% of net-of-leak) | (1,320,000−158,400)·0.25 | 290,400 |
| Uncertainty (10%) | (1,161,600−290,400)·0.10 | 87,120 |
| **Net (yr 1)** | 1,320,000 − 158,400 − 290,400 − 87,120 | **≈ 784,080 tCO₂e** |

That is a 59% delivery ratio (net/gross) — squarely in the range REDD+ buyers expect once leakage,
buffer and uncertainty haircuts are stacked. Year 2 baseline is slightly lower as `remaining` shrank.

### 7.5 Data provenance & limitations
- Hub portfolio rows are **synthetic seeded demo data** (`sr()`); calculator inputs are user-set;
  blue-carbon sequestration rates and risk-scores are hard-coded literature-style values.
- Project-level BDR baseline, **not** a jurisdictional (JNR/ART) reference level — no nested
  accounting, no national forest-cover trend adjustment, no remote-sensing activity data ingestion.
- Constant BDR (no deforestation-front dynamics), flat percentage leakage (no leakage-belt monitoring),
  and buffer/uncertainty as static percentages rather than data-driven.

**Framework alignment:** **Verra VM0007** (REDD+ methodology framework) — the baseline×carbon-stock
difference with leakage/buffer/uncertainty deductions is VM0007's structure. **VM0033** (tidal
wetland restoration) — the multi-gas baseline-minus-project difference under IPCC GWP. **Verra AFOLU
Non-Permanence Risk Tool** — the weighted risk-category buffer. **ART TREES / JNR** are named in the
guide as the jurisdictional analogues but are not implemented; ART TREES derives crediting from a
jurisdiction's historical + adjusted reference level with a crediting-level discount, which this
project-level tool approximates only at the parcel scale.
