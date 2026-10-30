/**
 * WordPress Export Script for Manggoes Brand Landing Page
 * Generates an Elementor & Astra-ready export bundle in /wordpress/
 *
 * Usage:
 *   node scripts/export-wp.mjs [--base-url <url>]
 * Default base URL:
 *   https://manggoes.id/wp-content/uploads/mg/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Parse CLI Arguments
let baseUrl = 'https://manggoes.id/wp-content/uploads/mg/';
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-url' && args[i + 1]) {
    baseUrl = args[i + 1];
    i++;
  } else if (args[i].startsWith('--base-url=')) {
    baseUrl = args[i].substring('--base-url='.length);
  }
}

// Ensure trailing slash on baseUrl
if (!baseUrl.endsWith('/')) {
  baseUrl += '/';
}

console.log('--- Manggoes WordPress Exporter ---');
console.log(`Target Base URL: ${baseUrl}`);

const wpDir = path.join(rootDir, 'wordpress');
const sectionsDir = path.join(wpDir, 'sections');
const imagesDir = path.join(wpDir, 'images');

// Clean & recreate destination directories
if (fs.existsSync(wpDir)) {
  fs.rmSync(wpDir, { recursive: true, force: true });
}
fs.mkdirSync(wpDir, { recursive: true });
fs.mkdirSync(sectionsDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

// 1. Copy Images & Logos into /wordpress/images/
const srcImagesDir = path.join(rootDir, 'assets', 'images');
const srcLogoDir = path.join(rootDir, 'assets', 'logo');

const copiedFiles = [];

if (fs.existsSync(srcImagesDir)) {
  const imgFiles = fs.readdirSync(srcImagesDir);
  for (const file of imgFiles) {
    const srcPath = path.join(srcImagesDir, file);
    const destPath = path.join(imagesDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      copiedFiles.push(file);
    }
  }
}

if (fs.existsSync(srcLogoDir)) {
  const logoFiles = fs.readdirSync(srcLogoDir);
  for (const file of logoFiles) {
    const srcPath = path.join(srcLogoDir, file);
    const destPath = path.join(imagesDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      copiedFiles.push(file);
    }
  }
}
console.log(`✓ Copied ${copiedFiles.length} images/logos to /wordpress/images/`);

// 2. Concatenate CSS & Rewrite Asset URLs
const cssFiles = [
  path.join(rootDir, 'css', 'tokens.css'),
  path.join(rootDir, 'css', 'base.css'),
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'css', 'sections.css')
];

let concatenatedCss = `/* ==========================================================================
   Manggoes WordPress Bundle Stylesheet
   Concatenated: tokens.css, base.css, components.css, sections.css
   Base Asset URL: ${baseUrl}
   ========================================================================== */\n\n`;

for (const file of cssFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    concatenatedCss += `/* --- File: ${path.basename(file)} --- */\n` + content + '\n\n';
  } else {
    console.warn(`Warning: CSS file not found: ${file}`);
  }
}

// Rewrite relative asset paths in CSS
concatenatedCss = concatenatedCss.replace(/url\(\s*['"]?(?:\.\.\/)?assets\/(?:images|logo)\/([^'")]+)['"]?\s*\)/g, (match, filename) => {
  return `url('${baseUrl}${filename}')`;
});

const outCssPath = path.join(wpDir, 'manggoes.css');
fs.writeFileSync(outCssPath, concatenatedCss, 'utf8');
console.log(`✓ Generated ${path.relative(rootDir, outCssPath)} (${Math.round(concatenatedCss.length / 1024)} KB)`);

// 3. Copy JavaScript
const srcJsPath = path.join(rootDir, 'js', 'main.js');
const outJsPath = path.join(wpDir, 'manggoes.js');
if (fs.existsSync(srcJsPath)) {
  fs.copyFileSync(srcJsPath, outJsPath);
  console.log(`✓ Generated ${path.relative(rootDir, outJsPath)}`);
} else {
  console.error(`Error: JS file not found: ${srcJsPath}`);
}

// 4. Extract Section Fragments from index.html
const indexHtmlPath = path.join(rootDir, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

function rewriteAssetUrls(html) {
  return html.replace(/(?:src|href)=['"](?:\.\.\/)?assets\/(?:images|logo)\/([^'"]+)['"]/g, (match, filename) => {
    const attr = match.startsWith('href') ? 'href' : 'src';
    return `${attr}="${baseUrl}${filename}"`;
  });
}

// Regex extraction helpers
function extractTagBlock(html, startPattern, endTag) {
  const match = html.match(startPattern);
  if (!match) return null;
  const startIndex = match.index;
  const endIndex = html.indexOf(endTag, startIndex);
  if (endIndex === -1) return null;
  return html.substring(startIndex, endIndex + endTag.length);
}

// Section 1: Header + Mobile Drawer
const headerTag = extractTagBlock(indexHtml, /<header\s+id=["']mg-header["']/i, '</header>');
const drawerTag = extractTagBlock(indexHtml, /<div\s+id=["']mg-mobile-nav["']/i, '</div>\n    </div>');
const headerCombined = (headerTag || '') + (drawerTag ? '\n\n    <!-- Mobile Navigation Drawer -->\n    ' + drawerTag : '');

// Section 2: Hero
const heroMatch = extractTagBlock(indexHtml, /<section\s+id=["']atas["']/i, '</section>');
// Section 3: Strip Kepercayaan
const stripMatch = extractTagBlock(indexHtml, /<section\s+class=["']mg-strip["']/i, '</section>');
// Section 4: Kenapa Kami
const kenapaMatch = extractTagBlock(indexHtml, /<section\s+id=["']kenapa["']/i, '</section>');
// Section 5: Harga
const hargaMatch = extractTagBlock(indexHtml, /<section\s+id=["']harga["']/i, '</section>');
// Section 6: Cerita
const ceritaMatch = extractTagBlock(indexHtml, /<section\s+id=["']cerita["']/i, '</section>');
// Section 7: Garansi
const garansiMatch = extractTagBlock(indexHtml, /<section\s+id=["']garansi["']/i, '</section>');
// Section 8: Testimoni
const testimoniMatch = extractTagBlock(indexHtml, /<section\s+id=["']testimoni["']/i, '</section>');
// Section 9: Cara Pesan
const caraPesanMatch = extractTagBlock(indexHtml, /<section\s+id=["']cara-pesan["']/i, '</section>');
// Section 10: FAQ
const faqMatch = extractTagBlock(indexHtml, /<section\s+id=["']faq["']/i, '</section>');
// Section 11: Kontak & Footer
const kontakMatch = extractTagBlock(indexHtml, /<section\s+id=["']kontak["']/i, '</section>');
// Floating WhatsApp
const floatingWaMatch = extractTagBlock(indexHtml, /<a\s+href=["']https:\/\/wa\.link\/5esniw["']\s+target=["']_blank["']\s+rel=["']noopener noreferrer["']\s+class=["']mg-floating-wa["']/i, '</a>');

const sectionsData = [
  {
    filename: '01-header.html',
    title: 'Section 1: Header & Navigation Drawer (#mg-header)',
    content: headerCombined
  },
  {
    filename: '02-hero.html',
    title: 'Section 2: Hero Section (#atas)',
    content: heroMatch
  },
  {
    filename: '03-strip.html',
    title: 'Section 3: Strip Kepercayaan 100+ Pelanggan',
    content: stripMatch
  },
  {
    filename: '04-kenapa.html',
    title: 'Section 4: Kenapa Manggoes (#kenapa)',
    content: kenapaMatch
  },
  {
    filename: '05-harga.html',
    title: 'Section 5: Harga: Special Offer (#harga)',
    content: hargaMatch
  },
  {
    filename: '06-cerita.html',
    title: 'Section 6: Cerita Kami (#cerita)',
    content: ceritaMatch
  },
  {
    filename: '07-garansi.html',
    title: 'Section 7: Garansi Rasa & Kualitas 100% (#garansi)',
    content: garansiMatch
  },
  {
    filename: '08-testimoni.html',
    title: 'Section 8: Testimoni Pelanggan (#testimoni)',
    content: testimoniMatch
  },
  {
    filename: '09-cara-pesan.html',
    title: 'Section 9: Cara Pesan (#cara-pesan)',
    content: caraPesanMatch
  },
  {
    filename: '10-faq.html',
    title: 'Section 10: FAQ Pertanyaan Sering Ditanyakan (#faq)',
    content: faqMatch
  },
  {
    filename: '11-kontak-footer.html',
    title: 'Section 11: Penutup & Footer (#kontak & #mg-footer)',
    content: (kontakMatch || '') + (floatingWaMatch ? '\n\n    <!-- Floating WhatsApp Action -->\n    ' + floatingWaMatch : '')
  }
];

for (const sec of sectionsData) {
  if (!sec.content) {
    console.error(`Error: Could not extract content for ${sec.filename}`);
    continue;
  }

  const rewrittenContent = rewriteAssetUrls(sec.content.trim());
  const fragmentHtml = `<!-- ======================================================================
     Manggoes ${sec.title}
     Panduan Elementor:
     1. Buat Container Elementor baru (Width: Full Width / 100%, Padding: 0, Margin: 0).
     2. Masukkan widget 'HTML' ke dalam container tersebut.
     3. Salin dan tempel seluruh kode di bawah ini ke dalam widget HTML.
     ====================================================================== -->
<div class="mg">
${rewrittenContent}
</div>
`;

  const destPath = path.join(sectionsDir, sec.filename);
  fs.writeFileSync(destPath, fragmentHtml, 'utf8');
  console.log(`✓ Generated ${path.relative(rootDir, destPath)}`);
}

// 5. Generate Updated functions-snippet.php
const phpSnippet = `<?php
/**
 * Manggoes Landing Page — Asset Enqueue Snippet
 * 
 * CARA PEMASANGAN:
 * Opsi A (Direkomendasikan): Tempelkan kode ini di bagian bawah file functions.php 
 *       pada Child Theme Astra Anda (wp-content/themes/astra-child/functions.php).
 * Opsi B: Gunakan plugin 'Code Snippets' atau 'WPCode', buat PHP snippet baru,
 *       dan aktifkan opsi "Run Everywhere" atau "Front-End Only".
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$GLOBALS['mg_target_page_slug'] = 'beranda';

function manggoes_enqueue_scripts() {
    $target_slug = isset( $GLOBALS['mg_target_page_slug'] ) ? $GLOBALS['mg_target_page_slug'] : 'beranda';

    $is_target = false;
    if ( $target_slug === 'front' && is_front_page() ) {
        $is_target = true;
    } elseif ( is_page( $target_slug ) ) {
        $is_target = true;
    }

    if ( ! $is_target ) {
        return;
    }

    // Google Fonts (Averia Libre & Poppins)
    wp_enqueue_style(
        'manggoes-google-fonts',
        'https://fonts.googleapis.com/css2?family=Averia+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&display=swap',
        array(),
        null
    );

    // CSS file detection
    $theme_css_path = get_stylesheet_directory() . '/manggoes.css';
    $theme_css_uri  = get_stylesheet_directory_uri() . '/manggoes.css';

    $upload_dir      = wp_upload_dir();
    $upload_css_path = $upload_dir['basedir'] . '/mg/manggoes.css';
    $upload_css_uri  = $upload_dir['baseurl'] . '/mg/manggoes.css';

    if ( file_exists( $theme_css_path ) ) {
        wp_enqueue_style( 'manggoes-custom-css', $theme_css_uri, array(), filemtime( $theme_css_path ) );
    } elseif ( file_exists( $upload_css_path ) ) {
        wp_enqueue_style( 'manggoes-custom-css', $upload_css_uri, array(), filemtime( $upload_css_path ) );
    }

    // JS file detection
    $theme_js_path = get_stylesheet_directory() . '/manggoes.js';
    $theme_js_uri  = get_stylesheet_directory_uri() . '/manggoes.js';

    $upload_js_path = $upload_dir['basedir'] . '/mg/manggoes.js';
    $upload_js_uri  = $upload_dir['baseurl'] . '/mg/manggoes.js';

    if ( file_exists( $theme_js_path ) ) {
        wp_enqueue_script( 'manggoes-custom-js', $theme_js_uri, array(), filemtime( $theme_js_path ), true );
    } elseif ( file_exists( $upload_js_path ) ) {
        wp_enqueue_script( 'manggoes-custom-js', $upload_js_uri, array(), filemtime( $upload_js_path ), true );
    }
}
add_action( 'wp_enqueue_scripts', 'manggoes_enqueue_scripts', 99 );

/**
 * Shortcode: [manggoes_landing]
 * Memungkinkan pemanggilan seluruh landing page di halaman WordPress mana pun
 * secara instan tanpa perlu repot copy-paste HTML panjang di Elementor.
 */
function manggoes_landing_shortcode( $atts ) {
    $sections_dir = get_stylesheet_directory() . '/sections/';
    $upload_dir   = wp_upload_dir();
    $upload_sections = $upload_dir['basedir'] . '/mg/sections/';

    $base_dir = file_exists( $sections_dir . '01-header.html' ) ? $sections_dir : ( file_exists( $upload_sections . '01-header.html' ) ? $upload_sections : '' );

    if ( ! $base_dir ) {
        return '<!-- Manggoes sections directory not found -->';
    }

    ob_start();
    echo '<div class="mg">';
    for ( $i = 1; $i <= 11; $i++ ) {
        $prefix = str_pad( $i, 2, '0', STR_PAD_LEFT );
        $files = glob( $base_dir . $prefix . '-*.html' );
        if ( ! empty( $files ) ) {
            include $files[0];
        }
    }
    echo '</div>';
    return ob_get_clean();
}
add_shortcode( 'manggoes_landing', 'manggoes_landing_shortcode' );
`;

const snippetPath = path.join(wpDir, 'functions-snippet.php');
fs.writeFileSync(snippetPath, phpSnippet, 'utf8');
console.log(`✓ Generated ${path.relative(rootDir, snippetPath)}`);

console.log('\n--- WordPress Export Completed Successfully! ---');
