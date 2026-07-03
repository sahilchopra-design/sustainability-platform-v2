"""
lineage.orchestrate — full-platform sweep with subprocess isolation + timeouts.

Each route module is exercised in its OWN subprocess (`run.py --module …`) with a
hard timeout, so a module that hangs on an external API (SEC / yfinance /
Climate-TRACE) is killed without stalling the sweep. Runs read-only. After all
modules finish, summary.json + ledger are rebuilt from the per-domain trace
files (race-free) and the dashboard is regenerated.

  python lineage/orchestrate.py                 # all route modules
  python lineage/orchestrate.py --workers 3 --timeout 120
"""

import os
import sys
import time
import shutil
import argparse
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

try:                                   # Windows consoles default to cp1252
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES_DIR = os.path.join(BACKEND, "api", "v1", "routes")
OUT_DIR = os.path.join(BACKEND, "lineage_output")
PY = sys.executable or "python"

if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)


def list_modules():
    mods = []
    for fn in sorted(os.listdir(ROUTES_DIR)):
        if fn.endswith(".py") and not fn.startswith("_"):
            mods.append("api.v1.routes." + fn[:-3])
    return mods


def run_one(module, timeout):
    t0 = time.time()
    try:
        proc = subprocess.run(
            [PY, os.path.join("lineage", "run.py"), "--module", module],
            cwd=BACKEND, capture_output=True, text=True, timeout=timeout,
        )
        tail = (proc.stdout or "").strip().splitlines()
        summary = next((l for l in reversed(tail) if "passed=" in l), "")
        ok = proc.returncode == 0
        return {"module": module, "status": "ok" if ok else "error",
                "summary": summary, "dur": round(time.time() - t0, 1),
                "stderr": (proc.stderr or "")[-300:] if not ok else ""}
    except subprocess.TimeoutExpired:
        return {"module": module, "status": "timeout",
                "summary": f"killed after {timeout}s", "dur": timeout, "stderr": ""}
    except Exception as exc:  # noqa: BLE001
        return {"module": module, "status": "crash",
                "summary": f"{type(exc).__name__}: {exc}", "dur": round(time.time() - t0, 1),
                "stderr": ""}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--timeout", type=int, default=120)
    ap.add_argument("--keep", action="store_true", help="don't clear prior output")
    args = ap.parse_args()

    if not args.keep and os.path.isdir(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(os.path.join(OUT_DIR, "traces"), exist_ok=True)

    modules = list_modules()
    print(f"[orchestrate] {len(modules)} route modules · "
          f"{args.workers} workers · {args.timeout}s timeout · read-only")

    results = []
    done = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(run_one, m, args.timeout): m for m in modules}
        for fut in as_completed(futs):
            r = fut.result()
            results.append(r)
            done += 1
            mark = {"ok": "OK", "error": "XX", "timeout": "TO", "crash": "XX"}.get(r["status"], "??")
            print(f"[{done:3}/{len(modules)}] {mark} {r['module'][-46:]:46} "
                  f"{r['dur']:6.1f}s  {r['summary'][-60:]}")

    # rebuild authoritative rollups + dashboard from the per-domain trace files
    from lineage import recorder
    from lineage import dashboard
    totals = recorder.rebuild_from_traces()
    dash = dashboard.build()

    # orchestration report (honest coverage: what timed out / crashed)
    bad = [r for r in results if r["status"] != "ok"]
    print(f"\n[orchestrate] modules: {len(modules)} · "
          f"ok={sum(1 for r in results if r['status']=='ok')} · "
          f"timeout={sum(1 for r in results if r['status']=='timeout')} · "
          f"error={sum(1 for r in results if r['status'] in ('error','crash'))}")
    if bad:
        print("[orchestrate] non-ok modules (coverage gaps):")
        for r in sorted(bad, key=lambda x: x["module"]):
            print(f"   {r['status']:7} {r['module']}  {r['summary'][:70]}")
    print(f"\n[orchestrate] TOTALS  transactions={totals['transactions']} "
          f"passed={totals['passed']} failed={totals['failed']} "
          f"skipped={totals['skipped']} fns={totals['functions_traced']} "
          f"sql={totals['sql_statements']} domains={totals['domains']}")
    print(f"[orchestrate] dashboard: {dash}")


if __name__ == "__main__":
    main()
