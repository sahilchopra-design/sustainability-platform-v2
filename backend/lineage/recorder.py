"""lineage.recorder — persist transactions to JSON + append-only JSONL ledger."""

import os
import json
import time

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "lineage_output")
TRACES_DIR = os.path.join(OUTPUT_DIR, "traces")
LEDGER = os.path.join(OUTPUT_DIR, "ledger.jsonl")
SUMMARY = os.path.join(OUTPUT_DIR, "summary.json")


def _ensure():
    os.makedirs(TRACES_DIR, exist_ok=True)


def write_domain(domain, transactions, run_meta):
    """Write one domain's transactions and append each to the ledger."""
    _ensure()
    path = os.path.join(TRACES_DIR, f"{domain}.json")
    payload = {"domain": domain, "meta": run_meta,
               "transactions": [t.to_dict() for t in transactions]}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=1, default=str)
    with open(LEDGER, "a", encoding="utf-8") as fh:
        for t in transactions:
            d = t.to_dict()
            fh.write(json.dumps({
                "ts": run_meta.get("ts"),
                "domain": domain,
                "label": d["label"],
                "status": d["status"],
                "http_status": d["http_status"],
                "dur_ms": d["dur_ms"],
                "node_count": d["node_count"],
                "provenance": d["provenance"],
                "source_tables": d["source_tables"],
                "sql_count": len(d["sources"]),
                "truncated": d["truncated"],
                "error": d["error"],
            }, default=str) + "\n")
    return path


def update_summary(domain_summaries):
    """Merge per-domain rollups into summary.json (read by the dashboard)."""
    _ensure()
    existing = {}
    if os.path.exists(SUMMARY):
        try:
            with open(SUMMARY, encoding="utf-8") as fh:
                existing = json.load(fh).get("domains", {})
        except Exception:  # noqa: BLE001
            existing = {}
    existing.update(domain_summaries)
    totals = {
        "transactions": sum(d["transactions"] for d in existing.values()),
        "passed": sum(d["passed"] for d in existing.values()),
        "failed": sum(d["failed"] for d in existing.values()),
        "skipped": sum(d.get("skipped", 0) for d in existing.values()),
        "functions_traced": sum(d["functions_traced"] for d in existing.values()),
        "sql_statements": sum(d["sql_statements"] for d in existing.values()),
        "domains": len(existing),
    }
    with open(SUMMARY, "w", encoding="utf-8") as fh:
        json.dump({"generated": time.strftime("%Y-%m-%d %H:%M:%S"),
                   "totals": totals, "domains": existing}, fh, indent=1)


def rebuild_from_traces():
    """Recompute summary.json + ledger.jsonl from the per-domain trace files.

    Used after a parallel orchestrated run so the authoritative rollups never
    depend on raced read-modify-writes by concurrent subprocesses.
    """
    _ensure()
    domains = {}
    if os.path.exists(LEDGER):
        os.remove(LEDGER)
    for fn in sorted(os.listdir(TRACES_DIR)) if os.path.isdir(TRACES_DIR) else []:
        if not fn.endswith(".json"):
            continue
        try:
            payload = json.load(open(os.path.join(TRACES_DIR, fn), encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        dom = payload.get("domain", fn[:-5])
        txns = payload.get("transactions", [])
        meta = payload.get("meta", {})
        domains[dom] = {
            "prefix": meta.get("router_prefix", ""),
            "transactions": len(txns),
            "passed": sum(1 for t in txns if t.get("status") == "passed"),
            "failed": sum(1 for t in txns if t.get("status") == "failed"),
            "skipped": sum(1 for t in txns if t.get("status") == "skipped"),
            "functions_traced": sum(t.get("node_count", 0) for t in txns),
            "sql_statements": sum(len(t.get("sources", [])) for t in txns),
            "ts": meta.get("ts", ""),
        }
        with open(LEDGER, "a", encoding="utf-8") as fh:
            for t in txns:
                fh.write(json.dumps({
                    "ts": meta.get("ts"), "domain": dom, "label": t.get("label"),
                    "status": t.get("status"), "http_status": t.get("http_status"),
                    "dur_ms": t.get("dur_ms"), "node_count": t.get("node_count"),
                    "provenance": t.get("provenance"),
                    "source_tables": t.get("source_tables"),
                    "sql_count": len(t.get("sources", [])),
                    "truncated": t.get("truncated"), "error": t.get("error"),
                }, default=str) + "\n")
    totals = {
        "transactions": sum(d["transactions"] for d in domains.values()),
        "passed": sum(d["passed"] for d in domains.values()),
        "failed": sum(d["failed"] for d in domains.values()),
        "skipped": sum(d["skipped"] for d in domains.values()),
        "functions_traced": sum(d["functions_traced"] for d in domains.values()),
        "sql_statements": sum(d["sql_statements"] for d in domains.values()),
        "domains": len(domains),
    }
    with open(SUMMARY, "w", encoding="utf-8") as fh:
        json.dump({"generated": time.strftime("%Y-%m-%d %H:%M:%S"),
                   "totals": totals, "domains": domains}, fh, indent=1)
    return totals
