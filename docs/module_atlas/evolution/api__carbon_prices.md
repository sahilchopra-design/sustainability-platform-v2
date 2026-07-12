## 9 · Future Evolution

### 9.1 Evolution A — Interpolated multi-region carbon-price series (analytics ladder: rung 1 → 2)

**What.** A read-only pass-through domain over ingested NGFS scenario data — four viewer-gated
endpoints serving the `Price|Carbon` variable verbatim from `dh_ngfs_scenario_data`, with the only
logic being variable resolution and a **nearest-year lookup**. §7.5 names the honest limitations:
the nearest-year match can silently substitute a distant year's price when the requested year is
absent (the response echoes the requested year but returns another year's value, with no
interpolation — unlike the sibling `carbon_price_ets` engine); region is hard-defaulted to World;
and coverage depends entirely on what has been ingested. The lineage harness shows most routes
`db-empty` — the NGFS price series are thinly populated. Evolution A adds linear interpolation
between anchor years (so 2033 against 2030/2035 anchors returns an interpolated value, not the
nearer anchor) and broadens ingested region coverage.

**How.** `_find_carbon_price_records` gains an interpolation path mirroring the `carbon_price_ets`
engine's `interpolate_price`, flagged in the response as `interpolated: true`; the ingest pipeline
loads sub-regional NGFS price rows so `region` queries beyond World resolve. Rung 2: expose the full
NGFS scenario grid (model × region × year) so downstream transition-risk engines can select vintage
and model explicitly, not just World/nearest-year.

**Prerequisites.** The `db-empty` provenance across `/compare`, `/scenarios`, `/{scenario}` (§4.2)
is the headline gap — populate `dh_ngfs_scenario_data` with the full NGFS price set (roadmap D0/D1);
the domain must stay a faithful pass-through (interpolation between real anchors is fine;
re-deriving prices is not). **Acceptance:** a 2033 request against 2030/2035 anchors returns an
interpolated value flagged `interpolated: true`, not the 2035 anchor; a non-World region query
resolves; `/scenarios` lists a fully-populated scenario set.

### 9.2 Evolution B — Carbon-price grounding tool for the desk copilots (LLM tier 2)

**What.** Rather than a standalone copilot, this domain's highest-value LLM role is as a **shared
grounding tool** the desk orchestrators call: when any copilot (transition risk, financed emissions,
CBAM, `am` Paris alignment) needs an NGFS carbon price, it tool-calls `/{scenario}` or `/compare`
here — the single authoritative NGFS source `data_hub_client.get_carbon_price` already provides
internally. This guarantees every carbon-price figure across the platform's LLM answers traces to
the same ingested NGFS values, not a model-invented number.

**How.** Register the 4 read endpoints as a low-level tool in the shared tool registry; the
no-fabrication validator treats any carbon-price numeric in a desk-copilot answer as requiring a
call to this domain (or `carbon_price_ets`). The response's `source` stamp (`NGFS/{model}/{scenario}`)
and, post-Evolution A, the `interpolated` flag become the provenance shown in the "show work"
expander. Viewer-role gating already fits the read-only design.

**Prerequisites.** Evolution A's populated series and interpolation flag (so tool answers are
complete and honest about interpolation); Atlas corpus embedded (roadmap D3). **Acceptance:** a
transition-risk copilot answer quoting a 2030 Net Zero carbon price traces to a `/{scenario}` tool
call with its NGFS source stamp; a requested year filled by interpolation is shown as interpolated,
never as an exact NGFS value; an unavailable scenario returns the well-formed empty response, not a
fabricated price.
