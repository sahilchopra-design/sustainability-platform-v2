"""
lineage.analyze — mine the captured lineage for learnings (auto-derived).

Reads backend/lineage_output/traces/*.json and produces learnings.json +
LINEAGE_FINDINGS.md: coverage, data gaps (empty tables), a failure taxonomy,
endpoints not touching real data, complexity/perf hotspots, core source tables,
reference-data usage, and a concrete enhancement backlog seeded from the data.

  python lineage/analyze.py
"""

import os
import re
import json
import time
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
OUT = os.path.join(BACKEND, "lineage_output")
TRACES = os.path.join(OUT, "traces")


def _load_txns():
    txns = []
    if not os.path.isdir(TRACES):
        return txns
    for fn in sorted(os.listdir(TRACES)):
        if not fn.endswith(".json"):
            continue
        try:
            p = json.load(open(os.path.join(TRACES, fn), encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        for t in p.get("transactions", []):
            t["_domain"] = p.get("domain", fn[:-5])
            txns.append(t)
    return txns


def _bucket_error(err):
    if not err:
        return "other"
    e = err.lower()
    if "404" in e or "not found" in e:
        return "404 / empty-data"
    if "validationerror" in e or "field required" in e or "value is not" in e:
        return "input validation"
    if "programmingerror" in e or "psycopg" in e or "undefinedcolumn" in e \
            or "does not exist" in e:
        return "SQL / schema"
    if "typeerror" in e or "nonetype" in e or "unsupported operand" in e:
        return "calc / None-handling"
    if "keyerror" in e or "attributeerror" in e or "indexerror" in e:
        return "missing key/attr"
    if "401" in e or "403" in e or "unauthor" in e or "forbidden" in e:
        return "auth required"
    if "500" in e:
        return "server 500"
    return "other"


def _norm_sig(err):
    s = err or ""
    s = re.sub(r"'[^']*'", "'X'", s)
    s = re.sub(r'"[^"]*"', '"X"', s)
    s = re.sub(r"\b[0-9a-f]{8}-[0-9a-f-]{20,}\b", "UUID", s)
    s = re.sub(r"\b\d+\b", "N", s)
    return s.strip()[:140]


def _is_correction(cls, prov, err):
    """Correction = a likely real product bug. Observation = expected/known gap
    (incl. harness mock-input artifacts that FastAPI would 422 in production)."""
    prov = prov or []
    e = (err or "").lower()
    real = "real-db" in prov
    # Genuine schema/query bugs — real regardless of input source.
    if any(k in e for k in ("undefinedcolumn", "undefinedtable", "ambiguouscolumn",
                            "ambiguous", "undefinedfunction", "syntaxerror",
                            "syntax error", "does not exist")):
        return True
    # Harness mock-body artifact: a primitive stands in for the request model
    # (FastAPI would 422 before the handler in production).
    if re.search(r"'(str|dict|list|int|float|bool)' object has no attribute", e):
        return False
    # Input-driven driver errors (mock ids / values) — not product bugs.
    if any(k in e for k in ("foreignkeyviolation", "invalidtextrepresentation",
                            "notnullviolation", "invalid input syntax")):
        return False
    if cls == "server 500":
        return True
    if cls in ("calc / None-handling", "missing key/attr") and real:
        return True
    return False


def _split_corrections(failures):
    corr, obs = defaultdict(list), defaultdict(list)
    for t in failures:
        cls = _bucket_error(t.get("error"))
        prov = t.get("provenance") or []
        sig = _norm_sig(t.get("error"))
        key = (cls, sig)
        (corr if _is_correction(cls, prov, t.get("error")) else obs)[key].append(t)

    def pack(d, kind):
        out = []
        for (cls, sig), items in sorted(d.items(), key=lambda kv: -len(kv[1])):
            out.append({
                "class": cls, "signature": sig, "count": len(items),
                "kind": kind,
                "endpoints": [t["label"] for t in items[:8]],
                "domains": sorted({t["_domain"] for t in items})[:8],
                "suggested": _suggest(cls, kind),
            })
        return out
    return pack(corr, "correction"), pack(obs, "observation")


def _suggest(cls, kind):
    if kind == "observation":
        return {
            "404 / empty-data": "Seed the underlying table; not a code bug.",
            "auth required": "Expected — endpoint needs an authenticated session.",
            "input validation": "Harness mock input; tighten mockgen, not the handler.",
            "missing key/attr": "Likely mock-input shape; verify against real payload.",
            "calc / None-handling": "Mock None propagated; harness input issue.",
        }.get(cls, "Expected/known-gap; verify before acting.")
    return {
        "SQL / schema": "Real query/schema mismatch — fix the SQL or migration.",
        "server 500": "Unhandled handler error on real data — add guard / fix logic.",
        "calc / None-handling": "Handler divides/operates on None from real data — guard it.",
        "missing key/attr": "Handler assumes a key absent in real data — defensive access.",
    }.get(cls, "Investigate — failed on real data.")


def analyze():
    txns = _load_txns()
    n = len(txns)
    by_status = Counter(t.get("status") for t in txns)
    prov = Counter()
    for t in txns:
        for p in (t.get("provenance") or []):
            prov[p] += 1

    # table population: max rows seen per table; reference tables
    table_rows = defaultdict(int)
    table_seen = set()
    ref_tables = set()
    for t in txns:
        for s in (t.get("sources") or []):
            for tb in (s.get("tables") or []):
                table_seen.add(tb)
                rc = s.get("rowcount") or 0
                if rc and rc > table_rows[tb]:
                    table_rows[tb] = rc
                if s.get("is_reference"):
                    ref_tables.add(tb)
    populated = sorted([t for t in table_seen if table_rows[t] > 0])
    empty_like = sorted([t for t in table_seen if table_rows[t] <= 0])

    # failure taxonomy
    failures = [t for t in txns if t.get("status") == "failed"]
    fbuckets = Counter(_bucket_error(t.get("error")) for t in failures)
    fail_by_domain = Counter(t["_domain"] for t in failures)
    corrections, observations = _split_corrections(failures)

    # endpoints not touching real DB data (computed/mock only, and passed)
    no_real = [t for t in txns if t.get("status") == "passed"
               and "real-db" not in (t.get("provenance") or [])
               and "reference-data" not in (t.get("provenance") or [])]

    # hotspots
    timed = [t for t in txns if t.get("dur_ms") is not None]
    slowest = sorted(timed, key=lambda t: t["dur_ms"], reverse=True)[:12]
    deepest = sorted(txns, key=lambda t: t.get("node_count", 0), reverse=True)[:12]
    truncated = [t for t in txns if (t.get("truncated") or [])]

    # core source tables (most read)
    table_hits = Counter()
    for t in txns:
        for tb in set(t.get("source_tables") or []):
            table_hits[tb] += 1

    learnings = {
        "generated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "coverage": {
            "transactions": n,
            "passed": by_status.get("passed", 0),
            "failed": by_status.get("failed", 0),
            "skipped_mutations": by_status.get("skipped", 0),
            "functions_traced": sum(t.get("node_count", 0) for t in txns),
            "sql_statements": sum(len(t.get("sources") or []) for t in txns),
            "provenance": dict(prov),
            "tables_touched": len(table_seen),
        },
        "data_gaps": {
            "empty_or_no_rows_tables": empty_like,
            "populated_tables": populated,
            "note": "empty_like = appeared in a query but never returned rows "
                    "(likely unseeded / no data in this environment)",
        },
        "corrections": corrections,
        "observations": observations,
        "corrections_summary": {
            "total_failures": len(failures),
            "corrections": sum(c["count"] for c in corrections),
            "observations": sum(o["count"] for o in observations),
            "distinct_correction_signatures": len(corrections),
        },
        "failure_taxonomy": {
            "by_class": dict(fbuckets.most_common()),
            "by_domain_top": dict(fail_by_domain.most_common(15)),
            "examples": [{"endpoint": t["label"], "domain": t["_domain"],
                         "class": _bucket_error(t.get("error")),
                         "error": (t.get("error") or "")[:160]}
                        for t in failures[:40]],
        },
        "not_touching_real_data": {
            "count": len(no_real),
            "endpoints": [t["label"] for t in no_real[:60]],
            "note": "passed but no real-db/reference source — pure compute OR "
                    "still on sample/seed fallbacks (candidates to wire to data)",
        },
        "hotspots": {
            "slowest_ms": [{"endpoint": t["label"], "dur_ms": t["dur_ms"],
                            "domain": t["_domain"]} for t in slowest],
            "deepest_calltrees": [{"endpoint": t["label"],
                                   "functions": t.get("node_count", 0),
                                   "domain": t["_domain"]} for t in deepest],
            "trace_truncated": [{"endpoint": t["label"],
                                 "caps": t.get("truncated")} for t in truncated],
        },
        "core_source_tables": dict(table_hits.most_common(25)),
        "reference_data_tables": sorted(ref_tables),
        "enhancement_backlog": _enhancements(empty_like, by_status, no_real,
                                             fbuckets, truncated),
    }

    os.makedirs(OUT, exist_ok=True)
    json.dump(learnings, open(os.path.join(OUT, "learnings.json"), "w",
                              encoding="utf-8"), indent=1, default=str)
    _write_md(learnings)
    print(f"[analyze] {n} transactions · {len(empty_like)} empty-like tables · "
          f"{by_status.get('failed',0)} failures across "
          f"{len(fail_by_domain)} domains")
    print(f"[analyze] wrote {os.path.join(OUT,'learnings.json')} + LINEAGE_FINDINGS.md")
    return learnings


def _enhancements(empty_like, by_status, no_real, fbuckets, truncated):
    items = []
    if empty_like:
        items.append({"area": "data", "priority": "P1",
            "title": f"Seed {len(empty_like)} empty tables",
            "detail": "Detail/by-id and dashboard endpoints 404 or read NaN because "
                      "these tables have no rows. Seed representative reference rows "
                      "so lineage exercises real data end-to-end."})
    if by_status.get("skipped", 0):
        items.append({"area": "harness", "priority": "P1",
            "title": f"Write-path coverage: {by_status['skipped']} mutation endpoints untested",
            "detail": "Run with --allow-writes against a disposable Supabase branch DB "
                      "(create_branch) so POST/PUT/DELETE lineage is captured without "
                      "touching production."})
    if fbuckets.get("input validation") or fbuckets.get("calc / None-handling"):
        items.append({"area": "harness", "priority": "P1",
            "title": "Smarter mock inputs (schema-example + real-row hydration)",
            "detail": "Compute endpoints fail on naive mocks (None into arithmetic). "
                      "Use pydantic field examples/constraints and hydrate request "
                      "bodies from real list-endpoint rows."})
    items.append({"area": "harness", "priority": "P2",
        "title": "Contract assertions per transaction",
        "detail": "Beyond 'did it run', assert output schema validity, no NaN/Inf in "
                  "numeric KPIs, and lineage completeness (every output field traces "
                  "to a source). Turns lineage into a regression gate."})
    items.append({"area": "harness", "priority": "P2",
        "title": "Frontend lineage layer",
        "detail": "Drive the 816 React routes headless; capture network → rendered KPIs "
                  "and stitch to the backend lineage for true source→screen lineage."})
    if truncated:
        items.append({"area": "harness", "priority": "P3",
            "title": f"Deep-trace mode for {len(truncated)} capped endpoints",
            "detail": "Some call trees hit node/depth caps (e.g. portfolio analysis). "
                      "Offer an opt-in uncapped trace for those flows."})
    items.append({"area": "ops", "priority": "P0",
        "title": "Pin fastapi/starlette (route-registration regression)",
        "detail": "Installed fastapi 0.137.1 / starlette 0.52.1 drifted from pinned "
                  "0.110.1 / 0.37.2 and silently break include_router. Restore pins; "
                  "add a CI smoke test asserting /api/v1 route count > N."})
    items.append({"area": "ops", "priority": "P2",
        "title": "Run the sweep in CI nightly",
        "detail": "Read-only sweep + dashboard artifact on each main build; diff "
                  "pass/fail and provenance vs the prior run to catch data/logic drift."})
    return items


def _write_md(L):
    c = L["coverage"]
    lines = [
        "# A² Intelligence — Data-Lineage Findings & Enhancements",
        f"_Auto-generated {L['generated']} from the E2E lineage sweep._\n",
        "## Coverage",
        f"- **{c['transactions']}** transactions · **{c['passed']} passed** · "
        f"**{c['failed']} failed** · **{c['skipped_mutations']} mutations skipped** (read-only)",
        f"- **{c['functions_traced']:,}** functions traced · **{c['sql_statements']:,}** SQL statements · "
        f"**{c['tables_touched']}** DB tables touched",
        f"- Provenance: " + ", ".join(f"{k} {v}" for k, v in c["provenance"].items()),
        "",
        "## Key learnings",
        f"1. **Empty data is the dominant failure mode.** {len(L['data_gaps']['empty_or_no_rows_tables'])} "
        "tables were queried but returned no rows, cascading into 404s on detail/by-id "
        "endpoints and NaN risk in dashboards.",
        "2. **Failure taxonomy:** " + ", ".join(
            f"{k} ({v})" for k, v in L["failure_taxonomy"]["by_class"].items()) + ".",
        f"3. **{L['not_touching_real_data']['count']} passing endpoints read no real DB/reference "
        "data** — pure compute or still on sample fallbacks (wiring candidates).",
        "4. **Route-registration P0:** fastapi/starlette drift silently drops API routes on a "
        "fresh process start (the live server is a stale, working process).",
        "",
        "## Corrections (likely real bugs) — aggregated by signature",
        f"_{L['corrections_summary']['corrections']} failures across "
        f"{L['corrections_summary']['distinct_correction_signatures']} distinct signatures._\n",
    ]
    for c in L["corrections"][:25]:
        lines.append(f"- **×{c['count']} · {c['class']}** — `{c['signature']}`  \n"
                     f"  e.g. {', '.join(c['endpoints'][:4])} — _{c['suggested']}_")
    lines += [
        "",
        "## Observations (expected / known gaps)",
        f"_{L['corrections_summary']['observations']} failures classified as expected._\n",
    ]
    for o in L["observations"][:15]:
        lines.append(f"- ×{o['count']} · {o['class']} — {o['suggested']}")
    lines += [
        "",
        "## Data gaps — empty / unseeded tables",
        ", ".join(f"`{t}`" for t in L["data_gaps"]["empty_or_no_rows_tables"]) or "_none_",
        "",
        "## Core source tables (most-read)",
        ", ".join(f"`{t}`×{n}" for t, n in L["core_source_tables"].items()) or "_none_",
        "",
        "## Enhancement backlog",
    ]
    for e in L["enhancement_backlog"]:
        lines.append(f"- **[{e['priority']}] {e['title']}** ({e['area']}) — {e['detail']}")
    lines.append("")
    open(os.path.join(OUT, "LINEAGE_FINDINGS.md"), "w", encoding="utf-8").write(
        "\n".join(lines))


if __name__ == "__main__":
    analyze()
