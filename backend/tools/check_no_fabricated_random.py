"""
Guardrail: detect the "random-as-data" anti-pattern in calculation engines.

Fabricated randomness (random.uniform / rng.choice / np.random.* / hash()-seeded RNG)
used to PRODUCE a returned metric is banned in services/*.py computation paths — it makes
regulatory/risk numbers non-reproducible and untethered from real inputs. Legitimate Monte
Carlo simulations (real draws from calibrated distributions, aggregated to a distribution)
are allowed via an explicit allowlist in fabrication_baseline.json.

Modes:
  python tools/check_no_fabricated_random.py            # ratchet check (CI): exit 1 on regressions
  python tools/check_no_fabricated_random.py --report   # print full per-file surface, exit 0
  python tools/check_no_fabricated_random.py --update-baseline   # rewrite baseline to current state

The baseline records, per file: the current hit count and a status:
  "legit_mc"  -> permanently allowed (real Monte Carlo); never counted as a regression
  "wave3_todo"-> known fabrication surface being burned down; count may only DECREASE
A file NOT in the baseline with any hits -> regression (fail).
A "wave3_todo" file whose count INCREASES -> regression (fail).
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
# Scan both the calculation engines and the API route layer (routes also compute
# returned metrics). Keys in the baseline are paths relative to backend/.
SCAN_DIRS = [os.path.join(BACKEND, "services"), os.path.join(BACKEND, "api")]
BASELINE = os.path.join(HERE, "fabrication_baseline.json")

# Fabrication signals — a returned/derived value drawn from a PRNG.
PATTERNS = [
    r"\brandom\.(?:Random|uniform|randint|random|choice|gauss|normalvariate|betavariate|triangular|shuffle|sample)\b",
    r"\brng\.(?:uniform|randint|random|choice|gauss|normalvariate|betavariate|triangular|integers|normal)\b",
    r"\bnp\.random\.(?:uniform|randint|choice|normal|rand|randn|random_sample|standard_normal)\b",
    r"\bnpr\.(?:uniform|randint|choice|normal|rand|randn)\b",
]
_RX = re.compile("|".join(PATTERNS))
# hash()-seeded RNG is the salted, non-reproducible variant — always fabrication.
_HASH_SEED_RX = re.compile(r"random\.Random\(\s*hash\(|default_rng\(\s*hash\(|seed\(\s*hash\(")


def _strip_noise(line: str) -> str:
    """Drop full-line comments so we count code, not prose that mentions rng."""
    s = line.strip()
    if s.startswith("#"):
        return ""
    return line


def scan_file(path: str) -> int:
    hits = 0
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                code = _strip_noise(line)
                if not code:
                    continue
                hits += len(_RX.findall(code))
                hits += len(_HASH_SEED_RX.findall(code))
    except (UnicodeDecodeError, OSError):
        return 0
    return hits


def scan_all() -> dict:
    out = {}
    for root_dir in SCAN_DIRS:
        for dirpath, _dirs, files in os.walk(root_dir):
            if "__pycache__" in dirpath:
                continue
            for name in files:
                if not name.endswith(".py"):
                    continue
                path = os.path.join(dirpath, name)
                n = scan_file(path)
                if n:
                    key = os.path.relpath(path, BACKEND).replace(os.sep, "/")
                    out[key] = n
    return out


def load_baseline() -> dict:
    if os.path.exists(BASELINE):
        with open(BASELINE, encoding="utf-8") as fh:
            return json.load(fh)
    return {"files": {}}


def main(argv):
    current = scan_all()
    baseline = load_baseline()
    bfiles = baseline.get("files", {})

    if "--report" in argv:
        total = sum(current.values())
        todo = {f: c for f, c in current.items()
                if bfiles.get(f, {}).get("status") != "legit_mc"}
        print(f"Fabrication surface: {sum(todo.values())} hits across {len(todo)} files "
              f"({total} incl. allowlisted MC).\n")
        for f, c in sorted(current.items(), key=lambda kv: -kv[1]):
            status = bfiles.get(f, {}).get("status", "UNTRACKED")
            print(f"  {c:4d}  {f:<48s} [{status}]")
        return 0

    if "--update-baseline" in argv:
        merged = {"files": {}}
        for f, c in current.items():
            prev = bfiles.get(f, {})
            merged["files"][f] = {"count": c, "status": prev.get("status", "wave3_todo")}
        # keep legit_mc entries even if count changed
        with open(BASELINE, "w", encoding="utf-8") as fh:
            json.dump(merged, fh, indent=2, sort_keys=True)
        print(f"Baseline updated: {len(merged['files'])} files, {sum(current.values())} hits.")
        return 0

    # Ratchet check
    regressions = []
    for f, c in current.items():
        entry = bfiles.get(f)
        if entry is None:
            regressions.append(f"NEW fabrication surface in {f}: {c} hits (not in baseline)")
        elif entry.get("status") == "legit_mc":
            continue
        elif c > entry.get("count", 0):
            regressions.append(f"{f}: fabrication INCREASED {entry.get('count')} -> {c}")
    if regressions:
        print("FAIL — fabricated-random guardrail:")
        for r in regressions:
            print("  -", r)
        return 1
    tracked = sum(c for f, c in current.items()
                  if bfiles.get(f, {}).get("status") != "legit_mc")
    print(f"OK — no fabrication regressions. Remaining burn-down surface: {tracked} hits "
          f"across {sum(1 for f, c in current.items() if bfiles.get(f, {}).get('status') != 'legit_mc')} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
