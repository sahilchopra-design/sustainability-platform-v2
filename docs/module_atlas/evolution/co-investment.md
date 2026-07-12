## 9 · Future Evolution

### 9.1 Evolution A — Build the CIRA return model the guide promises (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the guide's engine `CIRA = IRR − λ × ClimateVaR` with
NGFS-sensitized DCF does not exist — the page is a localStorage CRUD pipeline tracker
whose only real model is the 7-check weighted decision score. That checklist is
genuine and worth keeping; what's missing is the financial layer. Evolution A adds it:
per-deal cash-flow entry, IRR/MOIC computation, a project-level Climate VaR from
scenario-stressed cash flows, and the CIRA ranking that makes deals comparable.

**How.** (1) Extend the deal schema with a cash-flow vector and coordinates/sector;
IRR via Newton iteration client-side (deterministic, no backend strictly required),
MOIC as a check ratio. (2) Climate VaR: stress the cash-flow vector under NGFS
orderly/disorderly using the shared carbon-price paths and, for physical exposure, the
digital-twin composite score at the project location; VaR = distribution over the
scenario set, λ user-set with a documented default. (3) CIRA column joins the pipeline
table next to the existing decision signal; the radar's double-counted "Impact
Alignment" axis (§7.6) gets fixed while touching the scoring. (4) Move persistence
from `localStorage['ra_coinvest_v1']` to a backend table so pipelines survive browsers
and support multi-user IC workflows — this module's first vertical.

**Prerequisites (hard).** Replace or clearly fictionalize the GP track-record table —
§7.6 flags invented IRR/TVPI figures attached to real firm names (Sequoia, KKR,
Temasek) as a presentation risk; that must not ship into a returns-focused view.
**Acceptance:** a hand-computed IRR test case matches; CIRA ordering changes when λ or
scenario changes; deals persist across browsers via the new endpoint.

### 9.2 Evolution B — IC-memo drafter from pipeline evidence (LLM tier 1 → 2)

**What.** The workflow ends at "synthesise CIRA ranking, syndication fit, and
concentration limits for investment committee" — synthesis being exactly what the page
leaves manual. Evolution B drafts the IC memo for a selected deal: decision-checklist
outcome with per-criterion evidence (which of the 7 checks passed and why), ESG radar
reading, SDG mapping, and — after Evolution A — the CIRA versus pipeline distribution,
each figure cited to the deal record. The existing Markdown export becomes the render
target, so the memo lands in the format the module already emits.

**How.** Tier 1 needs no backend: the deal list is client state, and the grounding
corpus is this Atlas record (§7.2's decision rubric with its 20/15/15/15/15/10/10
weights) plus the IFC/PRI framework references §5 cites. The prompt encodes two
honesty rules from §7.6: checklist weights are unsourced house conventions, and (until
replaced) GP track-record numbers are fictional and must never appear in a memo.
Tier 2 arrives with Evolution A's backend: "re-rank the pipeline at λ=0.5" becomes a
tool call.

**Prerequisites.** The fictional-GP-data quarantine (hard, same as Evolution A);
corpus embedding for the framework texts. **Acceptance:** memos cite each checklist
criterion with its actual pass/fail state from the deal record; a memo for a deal
missing cash-flow data states that returns analysis is unavailable rather than
inventing an IRR.
