import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.webp': 'image/webp' };
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 8095;
server.listen(PORT, '127.0.0.1', async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9232;
  const edgeArgs = [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${path.join(process.env.TEMP, 'edge-gap-test')}`,
    '--disable-gpu',
    'about:blank'
  ];
  const edgeProc = spawn(edgePath, edgeArgs);
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const resp = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (resp.ok) break;
    } catch (e) {}
  }
  const targetUrl = `http://127.0.0.1:${PORT}/index.html`;
  const targetResp = await fetch(`http://127.0.0.1:${cdpPort}/json/new?` + encodeURIComponent(targetUrl), { method: 'PUT' });
  const target = await targetResp.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, { resolve });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: targetUrl });
  await new Promise(r => setTimeout(r, 1200));

  const evalRes = await send('Runtime.evaluate', {
    expression: `(function() {
      var arrows = document.querySelector('.mg-carousel__controls').getBoundingClientRect();
      var stats = document.querySelector('.mg-stats-bar').getBoundingClientRect();
      var varieties = document.querySelector('#mg-varietas').getBoundingClientRect();
      var statsSec = document.querySelector('#mg-statistik').getBoundingClientRect();
      return {
        arrowsBottom: arrows.bottom,
        statsBarTop: stats.top,
        gap: stats.top - arrows.bottom,
        varietiesBottom: varieties.bottom,
        statsSecTop: statsSec.top
      };
    })()`,
    returnByValue: true
  });
  console.log('RESULT:', evalRes.result.value);
  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
});
