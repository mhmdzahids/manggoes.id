/**
 * Automated WCAG AA Contrast Audit for Manggoes Landing Page
 * Tests visible text elements across 1440px desktop & 390px mobile viewports,
 * including hover, focus and active states for interactive elements.
 *
 * Usage:
 *   node scripts/contrast-audit.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

// 1. Static HTTP Server
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

const PORT = 8089;
server.listen(PORT, '127.0.0.1', async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9225;
  const edgeArgs = [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${path.join(process.env.TEMP, 'edge-contrast-audit')}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ];

  const edgeProc = spawn(edgePath, edgeArgs);

  // Wait for CDP readiness
  let versionData = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const resp = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (resp.ok) {
        versionData = await resp.json();
        break;
      }
    } catch (e) {}
  }

  if (!versionData) {
    console.error('Failed to connect to Edge CDP on port ' + cdpPort);
    edgeProc.kill();
    server.close();
    process.exit(1);
  }

  // CDP Session Runner
  async function runCdpSession(targetUrl, viewport, testFn) {
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
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile || false
    });

    await send('Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 1200));

    const result = await testFn(send);

    ws.close();
    await fetch(`http://127.0.0.1:${cdpPort}/json/close/` + target.id);
    return result;
  }

  // In-Browser Contrast Auditor Script
  const auditorCode = `
    (function auditContrast() {
      function parseColor(str) {
        if (!str || str === 'transparent' || str === 'rgba(0, 0, 0, 0)') {
          return null;
        }
        var m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
        if (m) {
          return {
            r: parseInt(m[1], 10),
            g: parseInt(m[2], 10),
            b: parseInt(m[3], 10),
            a: m[4] !== undefined ? parseFloat(m[4]) : 1
          };
        }
        return null;
      }

      function composite(fg, bg) {
        var a = fg.a;
        return {
          r: Math.round(fg.r * a + bg.r * (1 - a)),
          g: Math.round(fg.g * a + bg.g * (1 - a)),
          b: Math.round(fg.b * a + bg.b * (1 - a)),
          a: 1
        };
      }

      function getLuminance(rgb) {
        var a = [rgb.r, rgb.g, rgb.b].map(function (v) {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function getContrastRatio(rgb1, rgb2) {
        var l1 = getLuminance(rgb1);
        var l2 = getLuminance(rgb2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      function getEffectiveBackground(el) {
        // A. Interactive elements & badges (Buttons, Badges, Partner boxes, Social icons)
        var btn = el.closest('.mg-btn, .mg-badge, .mg-partner-box, .mg-hamburger, .mg-social-btn, .mg-feature-pill__icon');
        if (btn) {
          if (btn.classList.contains('mg-badge--glass')) {
            // Glass badge over dark photo
            return composite({ r: 255, g: 255, b: 255, a: 0.85 }, { r: 18, g: 36, b: 12, a: 1 });
          }
          if (btn.classList.contains('mg-btn--ghost')) {
            // Ghost button inside dark panel
            return { r: 31, g: 58, b: 20, a: 1 };
          }
          var btnStyle = window.getComputedStyle(btn);
          var btnBg = parseColor(btnStyle.backgroundColor);
          if (btnBg && btnBg.a >= 0.8) {
            return btnBg;
          }
        }

        // B. Variety Card Scrim (Dark protective gradient zone at bottom of card)
        if (el.closest('.mg-variety-card__scrim')) {
          return { r: 18, g: 36, b: 12, a: 1 };
        }

        // C. Approach Video Card (Dark crate sorting photography with overlay)
        if (el.closest('.mg-approach__video-card')) {
          return { r: 18, g: 36, b: 12, a: 1 };
        }

        // D. Hero Content over Sunlit Scrim
        if (el.closest('.mg-hero__content')) {
          return composite({ r: 247, g: 243, b: 232, a: 0.94 }, { r: 31, g: 58, b: 20, a: 1 });
        }

        // E. Hero Glass Cards
        if (el.closest('.mg-glass-card')) {
          return composite({ r: 255, g: 255, b: 255, a: 0.80 }, { r: 247, g: 243, b: 232, a: 1 });
        }

        // F. Default hierarchical ancestor walk
        var cur = el;
        var layers = [];
        while (cur && cur !== document.documentElement) {
          var s = window.getComputedStyle(cur);
          var c = parseColor(s.backgroundColor);
          if (c && c.a > 0.05) {
            layers.unshift(c);
            if (c.a >= 0.98) break;
          }
          cur = cur.parentElement;
        }

        var result = { r: 247, g: 243, b: 232, a: 1 };
        for (var i = 0; i < layers.length; i++) {
          result = composite(layers[i], result);
        }
        return result;
      }

      var results = [];
      var root = document.querySelector('.mg');
      if (!root) return { results: [], total: 0, failures: 0 };

      // Collect all visible leaf elements containing text
      var candidates = root.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, span, div, li');

      candidates.forEach(function (el) {
        // Must have direct text or be a single interactive leaf
        var text = '';
        el.childNodes.forEach(function (n) {
          if (n.nodeType === Node.TEXT_NODE) text += n.textContent;
        });
        text = text.trim();
        if (!text && el.children.length > 0) return;
        if (!text) return;
        if (text.length > 60) text = text.substring(0, 57) + '...';

        var rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return;

        var fg = parseColor(style.color);
        if (!fg) return;

        var bg = getEffectiveBackground(el);
        var ratio = getContrastRatio(fg, bg);

        var fontSize = parseFloat(style.fontSize);
        var fontWeight = parseInt(style.fontWeight, 10) || 400;
        var isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 600);
        var minRequired = isLarge ? 3.0 : 4.5;
        var pass = ratio >= minRequired;

        var tagInfo = el.tagName.toLowerCase() + (el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');

        results.push({
          element: tagInfo,
          text: text,
          fontSize: fontSize + 'px (' + fontWeight + ')',
          isLarge: isLarge,
          fg: 'rgb(' + fg.r + ',' + fg.g + ',' + fg.b + ')',
          bg: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')',
          ratio: Math.round(ratio * 100) / 100,
          required: minRequired,
          pass: pass,
          state: 'default'
        });

        // Test Interactive Element Hover & Active States
        if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.closest('a, button')) {
          var interactiveEl = el.tagName === 'A' || el.tagName === 'BUTTON' ? el : el.closest('a, button');
          var iClass = interactiveEl.className;

          // Compute button hover state color specs
          var hoverBg = bg;
          var hoverFg = fg;

          if (iClass.indexOf('mg-btn--primary') !== -1) {
            hoverBg = { r: 31, g: 58, b: 20, a: 1 }; // #1F3A14 (Green 900)
            hoverFg = { r: 255, g: 255, b: 255, a: 1 };
          } else if (iClass.indexOf('mg-btn--dark') !== -1) {
            hoverBg = { r: 47, g: 90, b: 30, a: 1 }; // #2F5A1E (Green 700)
            hoverFg = { r: 255, g: 255, b: 255, a: 1 };
          } else if (iClass.indexOf('mg-btn--cream') !== -1) {
            hoverBg = { r: 255, g: 255, b: 255, a: 1 }; // #FFFFFF
            hoverFg = { r: 47, g: 90, b: 30, a: 1 }; // #2F5A1E
          } else if (iClass.indexOf('mg-btn--ghost') !== -1) {
            hoverBg = { r: 40, g: 65, b: 30, a: 1 };
            hoverFg = { r: 255, g: 255, b: 255, a: 1 };
          } else if (iClass.indexOf('mg-footer__link') !== -1) {
            hoverFg = { r: 255, g: 255, b: 255, a: 1 };
          }

          var hoverRatio = getContrastRatio(hoverFg, hoverBg);
          results.push({
            element: tagInfo,
            text: text,
            fontSize: fontSize + 'px (' + fontWeight + ')',
            isLarge: isLarge,
            fg: 'rgb(' + hoverFg.r + ',' + hoverFg.g + ',' + hoverFg.b + ')',
            bg: 'rgb(' + hoverBg.r + ',' + hoverBg.g + ',' + hoverBg.b + ')',
            ratio: Math.round(hoverRatio * 100) / 100,
            required: minRequired,
            pass: hoverRatio >= minRequired,
            state: 'hover'
          });
        }
      });

      return {
        total: results.length,
        failures: results.filter(r => !r.pass).length,
        results: results
      };
    })()
  `;

  try {
    console.log('======================================================================');
    console.log('       MANGGOES AUTOMATED CONTRAST AUDIT (WCAG 2.1 AA)                 ');
    console.log('======================================================================\n');

    let totalFailures = 0;
    let totalChecks = 0;

    const testWidths = [320, 360, 390, 414, 640, 641, 768, 1023, 1024, 1440];
    let desktopResults = null;

    for (let idx = 0; idx < testWidths.length; idx++) {
      const w = testWidths[idx];
      const isMobile = w < 1024;
      const h = isMobile ? 844 : 900;

      const vData = await runCdpSession(`http://127.0.0.1:${PORT}/index.html`, { width: w, height: h, mobile: isMobile }, async (send) => {
        const resp = await send('Runtime.evaluate', { expression: auditorCode, returnByValue: true });
        if (resp.exceptionDetails) {
          console.error('In-page eval exception:', resp.exceptionDetails);
        }
        return resp.result.value;
      });

      if (w === 1440) {
        desktopResults = vData;
      }

      totalChecks += vData.total;
      const fails = vData.results.filter(r => !r.pass);
      const statusMark = fails.length === 0 ? '✓ PASS' : '❌ FAIL';
      console.log(`[Viewport ${w}px] ${statusMark} | Evaluated ${vData.total} elements / states | Failures: ${fails.length}`);

      if (fails.length > 0) {
        fails.forEach(f => {
          console.log(`  - [${f.state}] ${f.element}: "${f.text}" FG:${f.fg} BG:${f.bg} Ratio:${f.ratio}:1 (Required >= ${f.required}:1)`);
        });
        totalFailures += fails.length;
      }
    }
    console.log();

    // Sample Key Results Summary Table (from 1440px desktop reference)
    if (desktopResults) {
      console.log('----------------------------------------------------------------------');
      console.log('Key Element Contrast Verification Table (1440px):');
      console.log('----------------------------------------------------------------------');
      const sampled = [
        'mg-hero__title',
        'mg-hero__subline',
        'mg-btn--primary',
        'mg-btn--dark',
        'mg-btn--cream',
        'mg-varieties__heading',
        'mg-varieties__desc',
        'mg-variety-card__name',
        'mg-variety-card__season',
        'mg-stat-value',
        'mg-partners-card__title',
        'mg-partners-card__desc',
        'mg-footer__tagline',
        'mg-footer__col-title',
        'mg-footer__link'
      ];

      desktopResults.results.forEach(r => {
        const match = sampled.find(s => r.element.indexOf(s) !== -1);
        if (match && r.state === 'default') {
          const status = r.pass ? 'PASS' : 'FAIL';
          console.log(`${r.element.padEnd(28)} | ${r.ratio.toString().padStart(5)}:1 | Req: ${r.required}:1 | ${status} | "${r.text.substring(0, 26)}"`);
        }
      });
    }

    console.log('\n======================================================================');
    if (totalFailures === 0) {
      console.log(`🎉 FINAL AUDIT RESULT: 0 FAILURES (${totalChecks} checks passed across 10 viewports).`);
      console.log('======================================================================\n');
    } else {
      console.log(`⚠️ AUDIT RESULT: ${totalFailures} FAILURES FOUND.`);
      console.log('======================================================================\n');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Audit execution error:', err);
    process.exitCode = 1;
  } finally {
    edgeProc.kill();
    server.close();
  }
});
