import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

function parseRgb(colorStr) {
  if (!colorStr) return [0, 0, 0, 1];
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), m[4] !== undefined ? parseFloat(m[4]) : 1];
  }
  return [0, 0, 0, 1];
}

function channelLuminance(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]) {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function blend(fg, bg) {
  const [r1, g1, b1, a1] = fg;
  const [r2, g2, b2] = bg;
  return [
    Math.round(r1 * a1 + r2 * (1 - a1)),
    Math.round(g1 * a1 + g2 * (1 - a1)),
    Math.round(b1 * a1 + b2 * (1 - a1))
  ];
}

function contrastRatio(fgRgba, bgRgba, fallbackBg = [255, 255, 255]) {
  const solidBg = bgRgba[3] < 1 ? blend(bgRgba, fallbackBg) : [bgRgba[0], bgRgba[1], bgRgba[2]];
  const solidFg = fgRgba[3] < 1 ? blend(fgRgba, solidBg) : [fgRgba[0], fgRgba[1], fgRgba[2]];
  
  const l1 = relativeLuminance(solidFg);
  const l2 = relativeLuminance(solidBg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const states = [
  { name: 'default', pseudo: null, action: null },
  { name: 'hover', pseudo: ':hover', action: 'hover' },
  { name: 'mouse-down', pseudo: ':active', action: 'mousedown' },
  { name: 'focus after click', pseudo: ':focus', action: 'focus' },
  { name: 'visited', pseudo: ':visited', action: null },
  { name: 'focus-visible', pseudo: ':focus-visible', action: null }
];

async function runAudit() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const btnStatesDir = path.resolve('reference/btn-states');
  fs.mkdirSync(btnStatesDir, { recursive: true });

  const pagesToTest = [
    { title: 'index.html', url: 'file://' + path.resolve('index.html') },
    { title: 'wp-sim.html (worst-case theme)', url: 'file://' + path.resolve('reference/wp-sim.html') }
  ];

  const results = [];
  let allPassed = true;

  for (const pageConfig of pagesToTest) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(pageConfig.url, { waitUntil: 'load' });

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');

    const buttonTargets = [
      { name: 'Primary Pill (Hero CTA)', sel: '.mg-hero__cta', fallbackBg: [244, 241, 232] },
      { name: 'Primary Pill (Nav CTA)', sel: '.mg-nav__cta', fallbackBg: [244, 241, 232] },
      { name: 'Primary (Pesan Kiojay)', sel: '.mg-price-card:nth-child(4) .mg-btn', fallbackBg: [255, 255, 255] },
      { name: 'Outlined Cream (B2B Card)', sel: '.mg-price-card:last-child .mg-btn', fallbackBg: [23, 47, 27] },
      { name: 'Cream Pill (Closing CTA)', sel: '.mg-closing-banner .mg-btn', fallbackBg: [21, 31, 11] },
      { name: 'Sticky Bar CTA', sel: '.mg-sticky-bar__cta', fallbackBg: [251, 249, 243] },
      { name: 'WhatsApp FAB', sel: '.mg-floating-wa', fallbackBg: [244, 241, 232] },
      { name: 'Sage Round Button', sel: '.mg-btn-sage', fallbackBg: [244, 241, 232] }
    ];

    for (const target of buttonTargets) {
      const el = await page.$(target.sel);
      if (!el) continue;

      for (const st of states) {
        // Clear previous state
        const { root: { nodeId } } = await cdp.send('DOM.getDocument');
        const { nodeId: targetNodeId } = await cdp.send('DOM.querySelector', { nodeId, selector: target.sel });

        if (st.pseudo && targetNodeId) {
          await cdp.send('CSS.forcePseudoState', {
            nodeId: targetNodeId,
            forcedPseudoClasses: [st.pseudo]
          });
        }

        const computed = await el.evaluate(node => {
          const cs = window.getComputedStyle(node);
          return {
            color: cs.color,
            bgColor: cs.backgroundColor,
            borderColor: cs.borderColor
          };
        });

        const fg = parseRgb(computed.color);
        const bg = parseRgb(computed.bgColor);
        const ratio = contrastRatio(fg, bg, target.fallbackBg);
        const pass = ratio >= 4.5;
        if (!pass) allPassed = false;

        const safePageName = pageConfig.title.startsWith('index') ? 'index' : 'wpsim';
        const safeTargetName = target.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const safeStateName = st.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const screenshotFileName = `${safePageName}_${safeTargetName}_${safeStateName}.png`;
        const screenshotPath = path.join(btnStatesDir, screenshotFileName);

        try {
          await el.screenshot({ path: screenshotPath });
        } catch (e) {}

        results.push({
          page: pageConfig.title,
          button: target.name,
          selector: target.sel,
          state: st.name,
          color: computed.color,
          bgColor: computed.bgColor,
          contrast: ratio.toFixed(2),
          passed: pass,
          screenshot: screenshotFileName
        });

        // Reset pseudo state
        if (st.pseudo && targetNodeId) {
          await cdp.send('CSS.forcePseudoState', { nodeId: targetNodeId, forcedPseudoClasses: [] });
        }
      }
    }

    await page.close();
  }

  await browser.close();

  // Print results table
  console.log('\n================================================================================');
  console.log('                 BUTTON STATE & CONTRAST RATIO AUDIT TABLE');
  console.log('================================================================================');
  console.log(
    'Page'.padEnd(14) +
    'Button'.padEnd(28) +
    'State'.padEnd(18) +
    'Color'.padEnd(20) +
    'Background'.padEnd(20) +
    'Ratio'.padEnd(8) +
    'Status'
  );
  console.log('-'.repeat(115));

  for (const r of results) {
    const statusStr = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(
      r.page.substring(0, 12).padEnd(14) +
      r.button.padEnd(28) +
      r.state.padEnd(18) +
      r.color.padEnd(20) +
      r.bgColor.padEnd(20) +
      `${r.contrast}:1`.padEnd(8) +
      statusStr
    );
  }
  console.log('================================================================================\n');

  if (allPassed) {
    console.log('🎉 ALL BUTTON STATES PASSED WCAG AA (>= 4.5:1) in index.html AND wp-sim.html!');
  } else {
    console.error('❌ SOME BUTTON STATES FAILED WCAG AA CONTRAST REQUIREMENT.');
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
