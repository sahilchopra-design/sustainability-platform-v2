## 9 · Future Evolution

### 9.1 Evolution A — Build the ITRS and connect to the real NGFS backend (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide promises an Integrated Transition Risk Score (`ITRS = w₁×NGFSMacroImpact + w₂×IEAEnergyShift + w₃×PolicyCarbonPrice`) mapping energy intensity and carbon exposure to sector-level risk, but the page is a scenario registry + carbon-price interpolator + ensemble-weight calculator with no ITRS, no sector mapping, and no portfolio stress. Worse, four of six ensemble-weighting methods (BMA/skill/expert/performance) all resolve to the same seeded-random branch — only `equal` and `temperature` (a real Gaussian kernel) are genuine. Evolution A builds the real ITRS on real scenario data.

**How.** (1) Draw NGFS macro variables and carbon-price paths from the sibling `ngfs-scenarios` backend (a genuine tier-A workbench with curated NGFS Phase IV data and 9 endpoints — §7 of that module confirms it is not `sr()`-random), rather than this page's `base = 15 + code.length·2` interpolation. (2) Layer real IEA WEO sector energy-demand shifts (public dataset) and compute the ITRS as the documented weighted sum over actual sector energy-intensity and carbon-exposure inputs. (3) Delete the three fake ensemble methods or implement them properly — BMA needs scenario likelihoods, skill needs a scoring rule; a seeded placeholder masquerading as four distinct methods is a correctness defect.

**Prerequisites.** Consuming the `ngfs-scenarios` API (avoids duplicating scenario data); IEA WEO ingestion; sector energy-intensity/carbon-exposure inputs. **Acceptance:** ITRS computed per sector from real NGFS+IEA inputs; the four ensemble methods either produce genuinely different, defensible weights or are removed; no `sr()` in carbon-price or weight paths.

### 9.2 Evolution B — Scenario-reconciliation copilot (LLM tier 1 → 2)

**What.** A copilot for the bank/supervisor users §1 targets: "how does NGFS Disorderly differ from IEA NZE on 2050 carbon price?", "which sectors have the highest integrated transition risk under Delayed Transition?", "reconcile the two frameworks' 2030 assumptions" — grounded in the 14-scenario registry and, post-Evolution-A, the real ITRS and NGFS/IEA data.

**How.** Tier 1 over the scenario registry: system prompt from this Atlas page plus the NGFS Phase IV and IEA WEO 2023 references named in §5, answering scenario-definition and comparison questions with citations. Tier 2, after Evolution A: tool calls against the ITRS endpoint and the shared `ngfs-scenarios` compare API for sector rankings and reconciliation tables, with the fabrication validator matching quoted carbon prices and risk scores to tool outputs. The copilot must not present the current seeded ensemble weights as methodologically distinct, and must disclose which scenario numbers are curated vs interpolated until Evolution A lands.

**Prerequisites.** Tier 1 needs the registry and standards corpus; ITRS/reconciliation answers require Evolution A and are better served by calling the real `ngfs-scenarios` backend. **Acceptance:** scenario comparisons cite a registry row or the NGFS/IEA references; ITRS figures (post-Evolution-A) trace to tool calls; refusal on ensemble-method distinctions the code does not genuinely implement.
