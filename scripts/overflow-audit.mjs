/**
 * Automated Overflow Audit for Manggoes Landing Page
 * Tests viewports: 320, 360, 390, 414, 768, 1024, 1440 px
 * Detects document-level horizontal scrollbar and any elements protruding outside viewport.
 *
 * Usage:
 *   node scripts/overflow-audit.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(workspaceRoot, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
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

const PORT = 8092;
server.listen(PORT, '127.0.0.1', async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9228;
  const edgeArgs = [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${path.join(process.env.TEMP, 'edge-overflow-audit')}`,
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

  async function runCdpSession(targetUrl, width, height) {
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: width,
      height: height,
      deviceScaleFactor: 1,
      mobile: width < 1024
    });

    await send('Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 1200));

    const checkScript = `
      (function checkOverflow() {
        var vw = window.innerWidth;
        var docEl = document.documentElement;
        var body = document.body;
        var docScrollWidth = docEl.scrollWidth;
        var bodyScrollWidth = body.scrollWidth;
        var hasDocOverflow = docScrollWidth > vw || bodyScrollWidth > vw;

        // Find elements protruding outside viewport
        var protruding = [];
        var all = document.querySelectorAll('.mg *');

        all.forEach(function(el) {
          // Ignore children of intentional scroll containers (e.g. .mg-carousel__track, .mg-reviews-grid)
          if ((el.closest('.mg-carousel__track') || el.closest('.mg-reviews-grid')) && 
              !el.classList.contains('mg-carousel__track') && 
              !el.classList.contains('mg-reviews-grid')) {
            return;
          }
          if (el.closest('.mg-drawer') && !el.closest('.mg-drawer').classList.contains('is-open')) {
            return;
          }
          if (el.closest('.mg-modal-backdrop') && !el.closest('.mg-modal-backdrop').classList.contains('is-active')) {
            return;
          }

          var r = el.getBoundingClientRect();
          // Element is visible and right edge protrudes past viewport
          if (r.width > 0 && r.height > 0) {
            // Buffer of 0.5px for sub-pixel rounding
            if (r.right > vw + 0.5) {
              var sel = el.tagName.toLowerCase() + 
                (el.id ? '#' + el.id : '') + 
                (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
              protruding.push({
                selector: sel,
                right: Math.round(r.right * 10) / 10,
                width: Math.round(r.width * 10) / 10,
                left: Math.round(r.left * 10) / 10,
                excess: Math.round((r.right - vw) * 10) / 10,
                section: el.closest('section, header, footer') ? el.closest('section, header, footer').id : 'unknown'
              });
            }
          }
        });

        // Deduplicate parent/child cascade: keep most meaningful outermost or distinctive
        return {
          vw: vw,
          docScrollWidth: docScrollWidth,
          bodyScrollWidth: bodyScrollWidth,
          hasDocOverflow: hasDocOverflow,
          protrudingCount: protruding.length,
          protruding: protruding.slice(0, 15) // top 15
        };
      })()
    `;

    const evalRes = await send('Runtime.evaluate', { expression: checkScript, returnByValue: true });

    ws.close();
    await fetch(`http://127.0.0.1:${cdpPort}/json/close/` + target.id);
    return evalRes.result.value;
  }

  const widths = [320, 360, 390, 414, 640, 641, 768, 1023, 1024, 1440];
  console.log('======================================================================');
  console.log('              MANGGOES VIEWPORT OVERFLOW AUDIT                        ');
  console.log('======================================================================\n');

  let totalOverflows = 0;
  const reportByWidth = [];

  for (const w of widths) {
    const h = w < 768 ? 844 : 900;
    const res = await runCdpSession(`http://127.0.0.1:${PORT}/index.html`, w, h);
    reportByWidth.push(res);
    const status = res.hasDocOverflow || res.protrudingCount > 0 ? 'FAIL' : 'PASS';
    if (status === 'FAIL') totalOverflows++;

    console.log(`[Viewport ${w}px] status: ${status} (docScrollWidth: ${res.docScrollWidth}px, vw: ${res.vw}px)`);
    if (res.protrudingCount > 0) {
      console.log(`  Found ${res.protrudingCount} protruding element(s):`);
      res.protruding.forEach(p => {
        console.log(`    - [${p.section}] ${p.selector} | right: ${p.right}px (+${p.excess}px) | width: ${p.width}px`);
      });
    }
  }

  console.log('\n======================================================================');
  if (totalOverflows === 0) {
    console.log('🎉 OVERFLOW AUDIT: 0 FAILURES ACROSS ALL TESTED VIEWPORTS!');
  } else {
    console.log(`⚠️ OVERFLOW AUDIT: FAILURES DETECTED IN ${totalOverflows} VIEWPORT(S).`);
    process.exitCode = 1;
  }
  console.log('======================================================================\n');

  edgeProc.kill();
  server.close();
});
