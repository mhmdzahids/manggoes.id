import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/(<section[^>]*class=["'][^"']*mg-strip[^"']*["'][\s\S]*?<\/footer>)/i);
if (!match) {
  console.error('Error: Could not find sections 03 to 11 in index.html');
  process.exit(1);
}

const currentText = match[1]
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<svg[\s\S]*?<\/svg>/gi, '')
  .replace(/<span[^>]*class=["'][^"']*mg-sr-only[^"']*["'][\s\S]*?<\/span>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&bull;/g, '•')
  .replace(/&gt;/g, '>')
  .replace(/&lt;/g, '<')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s*\n+/g, '\n')
  .trim();

const beforeText = fs.readFileSync('reference/text-before.txt', 'utf8').trim();

const clean = text => text
  .replace(/Panen Kebun Indramayu\s*[•·]\s*2026/g, '')
  .replace(/(PANEN SEGAR|FAVORIT|JUMBO|IKONIK)\s*[•·]\s*READY/g, '$1 READY')
  .replace(/PARTAI BESAR\s*[•·]\s*B2B/g, 'PARTAI BESAR B2B')
  .replace(/(PANEN SEGAR|FAVORIT|JUMBO|IKONIK)\s+READY/g, '$1 READY')
  .replace(/PARTAI BESAR\s+B2B/g, 'PARTAI BESAR B2B')
  .replace(/[ \t]+/g, ' ')
  .replace(/\s*\n\s*/g, '\n')
  .trim();

const cleanCurrent = clean(currentText);
const cleanBefore = clean(beforeText);

if (cleanCurrent === cleanBefore) {
  console.log(`✓ COPY GUARD PASS: Exact match (${cleanCurrent.length} characters). Sections 03-11 copy is 100% preserved.`);
} else {
  console.error(`✗ COPY GUARD FAIL: Character count mismatch (Current: ${cleanCurrent.length}, Expected: ${cleanBefore.length})`);
  // Find where it diverged
  let firstDiff = -1;
  const minLen = Math.min(cleanCurrent.length, cleanBefore.length);
  for (let i = 0; i < minLen; i++) {
    if (cleanCurrent[i] !== cleanBefore[i]) {
      firstDiff = i;
      break;
    }
  }
  if (firstDiff !== -1) {
    console.error(`First diff at index ${firstDiff}:`);
    console.error(`Current : ...${cleanCurrent.substring(Math.max(0, firstDiff - 30), firstDiff + 40)}...`);
    console.error(`Expected: ...${cleanBefore.substring(Math.max(0, firstDiff - 30), firstDiff + 40)}...`);
  }
  process.exit(1);
}
