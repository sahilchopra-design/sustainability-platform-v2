## 9 · Future Evolution

### 9.1 Evolution A — Real DALY burdens from GBD and WHO data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's WHO burden-of-disease machinery — DALY model,
ND-GAIN vulnerability, RCP mortality projections — is entirely absent: 75 countries
carry single seeded numbers per attribute (`daly = 500 + sr(i·13)×4500`, a
"vulnerability" labelled ND-GAIN that is a random draw), with the RCP8.5 view a
seeded multiplier on a seeded base. Evolution A grounds the module in the two public
datasets that make it honest: IHME's Global Burden of Disease results (per-country
DALYs and mortality for the module's 8 disease categories — malaria, dengue,
respiratory, heat, malnutrition — downloadable) and the actual ND-GAIN index
(published per country annually, free). The climate-attributable increment then comes
from published attribution studies (WHO's quantitative risk assessment gives
scenario-based attributable-mortality projections per outcome) rather than a seeded
uplift.

**How.** (1) `ref_disease_burden(iso3, disease, daly, mortality_per_100k, source,
year)` from GBD result exports; `ref_nd_gain(iso3, year, score)` from the published
index. (2) The RCP-scenario view re-based on WHO/Lancet-published attributable
fractions per disease-region, with the source and confidence interval carried.
(3) The economic monetisation (`GDP_per_DALY`) implemented as the guide describes,
with the threshold choice documented — it is a contested parameter and must be
visible, not buried.

**Prerequisites (hard).** PRNG purge on all country attributes; GBD/ND-GAIN terms of
use (both permit research use with attribution). **Acceptance:** a country's DALY
figure matches the GBD row it cites; the ND-GAIN column equals the published index;
scenario uplifts cite their attribution study; zero seeded metrics remain.

### 9.2 Evolution B — Health-investment case copilot (LLM tier 1)

**What.** The module's stated deliverable is a "WHO-aligned climate health risk
investment case". Post-Evolution A, a copilot drafts it: "make the adaptation
investment case for dengue control in Southeast Asia" — pulling the GBD burden rows,
the attributable-increment projections, and the monetisation arithmetic the page
computes, assembling them into a structured case with every figure cited. Also the
comparative layer: "which income group carries the highest climate-attributable
respiratory burden?"

**How.** Tier-1 pattern over the reference tables and §5 corpus (WHO, Lancet
Countdown, IPCC AR6 Ch.7); the copilot must carry uncertainty ranges from the
attribution studies into prose (attributable fractions have wide CIs, and dropping
them would manufacture false confidence); refusal on clinical and pharmaceutical
questions outside the burden data.

**Prerequisites (hard).** Evolution A first — an investment case built on seeded
DALYs would be fiction with a WHO label on it. **Acceptance:** every burden figure
in a generated case carries source-year-CI; regenerating yields identical numbers;
the copilot declines to rank interventions the data doesn't cover.
