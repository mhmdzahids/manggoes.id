function scallopPath(n = 24, r = 95, amp = 3.5, steps = 360) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const rr = r + amp * Math.cos(n * th);
    pts.push(`${(100 + rr * Math.cos(th)).toFixed(2)},${(100 + rr * Math.sin(th)).toFixed(2)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

const ICONS = {
  leaf: `
    <path d="M12 2.5c-4.6 3.6-6.6 8.2-5.3 12.6C7.7 18.4 10 20.6 12 21.5c2-.9 4.3-3.1 5.3-6.4C18.6 10.7 16.6 6.1 12 2.5z" fill="var(--mg-green-700, #2E5B34)" />
    <path d="M12 6v15 M12 11l-3-2 M12 14.5l-3.4-2.2 M12 11l3-2 M12 14.5l3.4-2.2" fill="none" stroke="var(--mg-surface-raised, #FBF9F3)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
  `,
  'shield-check': `
    <path d="M12 2.5l7.5 2.8v5.7c0 4.6-3.1 8.7-7.5 10.5-4.4-1.8-7.5-5.9-7.5-10.5V5.3L12 2.5z" fill="var(--mg-green-700, #2E5B34)" />
    <path d="M8.6 12.2l2.4 2.4 4.4-4.8" fill="none" stroke="var(--mg-surface-raised, #FBF9F3)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `,
  sprout: `
    <path d="M12 13c0-3.5-2.4-5.8-6-5.8 0 3.4 2.4 5.8 6 5.8z M12 11.5c0-3.2 2.2-5.3 5.6-5.3 0 3.1-2.2 5.3-5.6 5.3z" fill="var(--mg-green-700, #2E5B34)" />
    <path d="M12 21v-8" fill="none" stroke="var(--mg-green-700, #2E5B34)" stroke-width="1.8" stroke-linecap="round" />
  `
};

export function generateSealSvg({ id, topText, bottomText, icon, className = 'mg-seal-badge', width = 144, height = 144 }) {
  const iconMarkup = ICONS[icon] || ICONS.leaf;
  const scallop = scallopPath(24, 95, 3.5, 360);

  return `<svg class="${className}" viewBox="0 0 200 200" width="${width}" height="${height}" aria-hidden="true">
  <defs>
    <linearGradient id="mg-seal-${id}-fill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3A6B40" />
      <stop offset="100%" stop-color="var(--mg-green-800, #264C2B)" />
    </linearGradient>
    <path id="mg-seal-${id}-top" d="M 32,100 A 68,68 0 0 1 168,100" fill="none" />
    <path id="mg-seal-${id}-bot" d="M 20,100 A 80,80 0 0 0 180,100" fill="none" />
  </defs>

  <!-- 1. Rosette Edge (Scalloped) -->
  <path d="${scallop}" fill="url(#mg-seal-${id}-fill)" />

  <!-- 2. Outer Hairline Ring -->
  <circle cx="100" cy="100" r="86" fill="none" stroke="var(--mg-surface-raised, #FBF9F3)" stroke-width="1" opacity="0.55" />

  <!-- 3. Text Band Arcs -->
  <text font-family="var(--mg-font-display, 'Plus Jakarta Sans', system-ui, sans-serif)" font-weight="800" font-size="14" letter-spacing="2.2" fill="var(--mg-surface-raised, #FBF9F3)">
    <textPath href="#mg-seal-${id}-top" startOffset="50%" text-anchor="middle">${topText.toUpperCase()}</textPath>
  </text>
  <text font-family="var(--mg-font-display, 'Plus Jakarta Sans', system-ui, sans-serif)" font-weight="800" font-size="14" letter-spacing="2.2" fill="var(--mg-surface-raised, #FBF9F3)">
    <textPath href="#mg-seal-${id}-bot" startOffset="50%" text-anchor="middle">${bottomText.toUpperCase()}</textPath>
  </text>

  <!-- 4. Dotted Ring (53 round dots) -->
  <circle cx="100" cy="100" r="62" fill="none" stroke="var(--mg-surface-raised, #FBF9F3)" opacity="0.6" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 7.25" />

  <!-- 5. Center Disc -->
  <circle cx="100" cy="100" r="48" fill="var(--mg-surface-raised, #FBF9F3)" stroke="rgba(31,61,36,0.12)" stroke-width="1" />

  <!-- 6. Two Diamond Separators at 9 and 3 o'clock -->
  <rect x="22.5" y="97.5" width="5" height="5" transform="rotate(45 25 100)" fill="var(--mg-mango, #F5A623)" />
  <rect x="172.5" y="97.5" width="5" height="5" transform="rotate(45 175 100)" fill="var(--mg-mango, #F5A623)" />

  <!-- 7. Center Icon -->
  <g transform="translate(79.6 79.6) scale(1.7)">
    ${iconMarkup.trim()}
  </g>
</svg>`;
}
