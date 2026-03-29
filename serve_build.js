const http = require('http');
const fs   = require('fs');
const path = require('path');

const BUILD = 'C:/Users/SahilChopra/Documents/Risk Analytics/frontend/build';
const PORT  = 4000;
const HOST  = '0.0.0.0';

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css',   '.json': 'application/json',
  '.png': 'image/png',  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(BUILD, urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(BUILD, 'index.html');
  }

  const ext = path.extname(filePath);
  const ct  = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, HOST, () => {
  console.log(`AA Impact Platform running on http://${HOST}:${PORT}`);
  console.log(`LAN access: http://192.168.86.154:${PORT}`);
});
