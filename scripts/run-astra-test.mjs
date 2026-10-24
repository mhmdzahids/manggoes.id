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
  if (reqPath === '/') reqPath = '/tests/astra-leak-test.html';
  const filePath = path.join(rootDir, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 8094;
server.listen(PORT, '127.0.0.1', async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9230;
  const edgeArgs = [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${path.join(process.env.TEMP, 'edge-astra-test')}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
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

  const targetUrl = `http://127.0.0.1:${PORT}/tests/astra-leak-test.html`;
  const targetResp = await fetch(`http://127.0.0.1:${cdpPort}/json/new?` + encodeURIComponent(targetUrl), { method: 'PUT' });
  const target = await targetResp.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: targetUrl });
  await new Promise(r => setTimeout(r, 1500));

  const evalRes = await send('Runtime.evaluate', {
    expression: `(function() {
      var badge = document.getElementById('overall-status');
      var results = [];
      document.querySelectorAll('#test-results-grid .test-item').forEach(function(item) {
        var label = item.querySelector('.test-label') ? item.querySelector('.test-label').textContent.trim() : item.id;
        var status = item.querySelector('.test-status') ? item.querySelector('.test-status').textContent.trim() : '';
        var pass = item.classList.contains('pass');
        results.push({ label: label, status: status, pass: pass });
      });
      return {
        badgeText: badge ? badge.textContent.trim() : 'NOT_FOUND',
        badgeClass: badge ? badge.className : '',
        results: results
      };
    })()`,
    returnByValue: true
  });

  console.log('======================================================================');
  console.log('                 ASTRA LEAK & ISOLATION TEST                          ');
  console.log('======================================================================\n');
  const data = evalRes.result.value;
  console.log(`OVERALL STATUS: ${data.badgeText} (${data.badgeClass})`);
  console.log('----------------------------------------------------------------------');
  for (const r of data.results) {
    const mark = r.pass ? '✓ PASS' : '❌ FAIL';
    console.log(`${mark} | ${r.label}: ${r.status}`);
  }
  console.log('\n======================================================================');

  ws.close();
  try { edgeProc.kill(); } catch (e) {}
  server.close();
  process.exit(data.badgeText.includes('100% ISOLATED') ? 0 : 1);
});
