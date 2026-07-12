## 9 · Future Evolution

### 9.1 Evolution A — Build the investment→jobs multiplier and skill-overlap matrix (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's two core models are unimplemented: `GreenJobs = GreenInvestment × EmploymentIntensity(sector, region)` (renewables ~3× the jobs per $M of fossil) and `SkillMatchScore = Σ[w_skill × SkillOverlap(FossilSkill_i, GreenRequirement_j)]` — region job counts and growth are `sr()`-seeded (only IRENA capacity is real), and the §8 spec is marked "not yet implemented." Evolution A builds both: an employment-multiplier model applying sector/region employment intensities (jobs per $M) to real green-investment figures, and a skill-overlap matrix computing reskilling friction between fossil and green occupations — turning a seeded jobs display into the multiplier and transition-pathway tool the guide describes.

**How.** (1) A backend route computing green jobs from investment × employment intensity, with intensities from IRENA/ILO employment-factor data by sector/region. (2) A skill-overlap matrix (fossil occupation → green requirement) yielding a SkillMatchScore that ranks reskilling pathways by friction. (3) Real green-investment inputs (IRENA/BNEF) replacing the seeded region panel, with the real IRENA capacity kept.

**Prerequisites.** Employment-intensity factors by sector/region and a skill-taxonomy overlap source (IRENA/ILO); green-investment data; the seeded region data replaced (§7-flagged). **Acceptance:** green-jobs figures recompute from investment × intensity reproducing §5; the SkillMatchScore ranks reskilling pathways from a real overlap matrix; no `sr()` job count feeds a headline.

### 9.2 Evolution B — Just-transition workforce copilot (LLM tier 2)

**What.** A copilot for workforce-development and policy teams: "how many jobs would $10B of solar investment create in this region, and which fossil-worker skills transfer with lowest friction?" tool-calls the Evolution A multiplier and skill-overlap endpoints, narrating the employment impact and reskilling pathways.

**How.** Tier-2 tool-calling over the jobs-multiplier and skill-match endpoints; the grounding corpus is §5/§7 (IRENA/ILO employment factors, the skill-overlap concept). The copilot's value is quantifying investment-to-jobs and identifying low-friction reskilling routes. Guardrail, pre-Evolution-A: the multiplier is unbuilt and jobs seeded, so it must refuse job-count figures and answer only on the real IRENA capacity context. Every figure validated against tool output.

**Prerequisites.** Evolution A (no multiplier today); employment-factor data; corpus embedding. **Acceptance:** post-Evolution-A, every jobs and skill-match figure traces to a tool call reproducing the multiplier; pre-Evolution-A the copilot declines job projections and cites only real capacity data.
