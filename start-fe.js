// Shim to launch React frontend from sp-tmp (outside project root)
const { spawn } = require('child_process');
const path = require('path');

const FRONTEND_DIR = 'C:/Users/SahilChopra/AppData/Local/Temp/sp-tmp/frontend';
const NODE_EXE    = 'C:/Program Files/nodejs/node.exe';
const CRACO       = path.join(FRONTEND_DIR, 'node_modules/@craco/craco/dist/bin/craco.js');

const fe = spawn(NODE_EXE, [CRACO, 'start'], {
  cwd: FRONTEND_DIR,
  env: {
    ...process.env,
    PORT:                    '4000',
    BROWSER:                 'none',
    REACT_APP_BACKEND_URL:   'http://localhost:8001',
  },
  stdio: 'inherit',
  shell: false,
});

fe.on('exit', (code) => process.exit(code ?? 0));
