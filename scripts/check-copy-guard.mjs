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
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&bull;/g, '•')
  .replace(/&gt;/g, '>')
  .replace(/&lt;/g, '<')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s*\n+/g, '\n')
  .trim();

const beforeText = fs.readFileSync('reference/text-before.txt', 'utf8').trim();

if (currentText === beforeText) {
  console.log(`✓ COPY GUARD PASS: Exact match (${currentText.length} characters). Sections 03-11 copy is 100% preserved.`);
} else {
  console.error(`✗ COPY GUARD FAIL: Character count mismatch (Current: ${currentText.length}, Expected: ${beforeText.length})`);
  // Find where it diverged
  let firstDiff = -1;
  const minLen = Math.min(currentText.length, beforeText.length);
  for (let i = 0; i < minLen; i++) {
    if (currentText[i] !== beforeText[i]) {
      firstDiff = i;
      break;
    }
  }
  if (firstDiff !== -1) {
    console.error(`First diff at index ${firstDiff}:`);
    console.error(`Current : ...${currentText.substring(Math.max(0, firstDiff - 30), firstDiff + 40)}...`);
    console.error(`Expected: ...${beforeText.substring(Math.max(0, firstDiff - 30), firstDiff + 40)}...`);
  }
  process.exit(1);
}
