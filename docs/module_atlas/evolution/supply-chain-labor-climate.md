## 9 · Future Evolution

### 9.1 Evolution A — Build the compound CLRisk product and WBGT heat-stress curve (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents that both named formulas are missing: the guide specifies a multiplicative compound score `CLRisk = PhysicalHazard × LabourVulnerability × SupplyChainDependency` and an exponential heat-stress productivity curve `1 − exp(−HeatExposure/ThermalComfort)` (IPCC AR5), but the code computes unweighted means of independent `sr()` draws and applies only a flat linear `tempMult = 1 + (tempScenario − 1.5) × 0.1` to heat scores. The 70 supply chains are synthetic (commodity/region by round-robin), the due-diligence-threshold slider is non-functional, and `genderPayGap` is dead data. Yet the module has real regulatory relevance (CS3D, LkSG) and shares the supply-chain backend (blast radius 81, failing compute routes). Evolution A builds the compound model.

**How.** (1) Implement the multiplicative `CLRisk = PhysicalHazard × LabourVulnerability × SupplyChainDependency` so risk compounds where hazard and vulnerability coincide (the whole point of a climate-labour intersection tool), replacing the unweighted mean. (2) Implement the WBGT-based heat-stress productivity-loss curve from ILO/IPCC AR6 WGII Ch.13 methodology — the exponential the guide names — driving `workersAffected` productivity loss. (3) Ground physical hazard in the platform's physical-risk digital twin (real flood/heat grids) keyed to supplier locations, and labour vulnerability in ILO core-convention compliance by country. (4) Fix the non-functional due-diligence threshold slider and surface or remove `genderPayGap`. (5) Add a real CS3D/LkSG due-diligence workflow (submission, remediation tracking, tier escalation) — currently absent.

**Prerequisites.** Physical-risk grids (exist); ILO convention data per country; the shared compute-route fixes. **Acceptance:** CLRisk is the product of three factors so co-located hazard+vulnerability compounds; heat-stress loss follows the WBGT exponential; the threshold slider works.

### 9.2 Evolution B — CS3D/LkSG due-diligence copilot (LLM tier 2)

**What.** A copilot for the compliance officer: "which supply chains are compound climate-labour high-risk and why?", "what's the heat-stress productivity loss for our Southeast Asia garment suppliers at 2°C?", "generate the CS3D due-diligence risk assessment" — reading the (Evolution-A) compound CLRisk, the WBGT heat model, and the due-diligence workflow, drafting the regulatory risk assessment.

**How.** Tier-2 pattern once the compound model and workflow exist: the risk-scoring and heat-stress calculators become tools; the copilot narrates the compound-risk decomposition (hazard × vulnerability × dependency), cites the ILO WBGT methodology, and drafts the CS3D/LkSG assessment mapping suppliers to the regulations' actual applicability tests. The no-fabrication validator checks every risk figure against tool output.

**Prerequisites (hard).** Evolution A — with no compound formula, no WBGT curve, and no due-diligence workflow, the copilot would draft regulatory filings on unweighted random means, a serious compliance risk. **Acceptance:** every CLRisk/productivity figure traces to the computed model; the CS3D assessment cites the regulation's real thresholds; a supply chain outside coverage returns a refusal.
