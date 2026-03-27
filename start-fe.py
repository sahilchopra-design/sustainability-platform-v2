"""
Shim: launches React/CRACO frontend from sp-tmp (outside project root).
Injects Node.js directory into PATH so CRACO's internal 'node' call resolves.
"""
import subprocess, sys, os

FRONTEND_DIR = r"C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\frontend"
NODE_EXE     = r"C:\Program Files\nodejs\node.exe"
NODE_DIR     = r"C:\Program Files\nodejs"
CRACO        = os.path.join(FRONTEND_DIR, r"node_modules\@craco\craco\dist\bin\craco.js")

env = os.environ.copy()
# Prepend node dir so that 'node' resolves within any child process CRACO spawns
env["PATH"] = NODE_DIR + os.pathsep + env.get("PATH", "")
env["PORT"]                  = "4000"
env["BROWSER"]               = "none"
env["REACT_APP_BACKEND_URL"] = "http://localhost:8001"
env["NODE_ENV"]              = "development"

proc = subprocess.run(
    [NODE_EXE, CRACO, "start"],
    cwd=FRONTEND_DIR,
    env=env,
)
sys.exit(proc.returncode if proc.returncode is not None else 0)
