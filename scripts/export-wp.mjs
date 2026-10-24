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
  const startIndex = html.search(startPattern);
  if (startIndex === -1) return null;
  const endIndex = html.indexOf(endTag, startIndex);
  if (endIndex === -1) return null;
  return html.substring(startIndex, endIndex + endTag.length);
}

// Section 1: Header + Mobile Drawer
const headerMatch = extractTagBlock(indexHtml, /<header\s+id=["']mg-header["']/i, '</header>');
// Section 2: Hero
const heroMatch = extractTagBlock(indexHtml, /<section\s+id=["']mg-hero["']/i, '</section>');
// Section 3: Varieties
const varietiesMatch = extractTagBlock(indexHtml, /<section\s+id=["']mg-varietas["']/i, '</section>');
// Section 4: Stats
const statsMatch = extractTagBlock(indexHtml, /<section\s+id=["']mg-statistik["']/i, '</section>');
// Section 5: Approach
const approachMatch = extractTagBlock(indexHtml, /<section\s+id=["']mg-pendekatan["']/i, '</section>');
// Section 6: Reviews
const reviewsMatch = extractTagBlock(indexHtml, /<section\s+id=["']mg-ulasan["']/i, '</section>');
// Section 7: Footer
const footerMatch = extractTagBlock(indexHtml, /<footer\s+id=["']mg-footer["']/i, '</footer>');
// Video Modal Dialog
const modalMatch = extractTagBlock(indexHtml, /<div\s+id=["']mg-video-modal["']/i, '    </div>\n    </div>');

const sectionsData = [
  {
    filename: '01-header.html',
    title: 'Section 1: Header (#mg-header)',
    content: headerMatch
  },
  {
    filename: '02-hero.html',
    title: 'Section 2: Hero (#mg-hero)',
    content: heroMatch
  },
  {
    filename: '03-varietas.html',
    title: 'Section 3: Varietas (#mg-varietas)',
    content: varietiesMatch
  },
  {
    filename: '04-statistik.html',
    title: 'Section 4: Statistik (#mg-statistik)',
    content: statsMatch
  },
  {
    filename: '05-pendekatan.html',
    title: 'Section 5: Pendekatan Kami (#mg-pendekatan & #mg-video-modal)',
    content: (approachMatch || '') + (modalMatch ? '\n\n    <!-- Video Modal Dialog (#mg-video-modal) -->\n    ' + modalMatch : '')
  },
  {
    filename: '06-ulasan.html',
    title: 'Section 6: Ulasan Pelanggan (#mg-ulasan)',
    content: reviewsMatch
  },
  {
    filename: '07-footer.html',
    title: 'Section 7: Footer (#mg-footer)',
    content: footerMatch
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

// 5. Generate functions-snippet.php
const phpSnippet = `<?php
/**
 * Manggoes Landing Page — Asset Enqueue Snippet
 * 
 * CARA PEMASANGAN:
 * Opsi A (Direkomendasikan): Tempelkan kode ini di bagian bawah file functions.php 
 *       pada Child Theme Astra Anda (wp-content/themes/astra-child/functions.php).
 * Opsi B: Gunakan plugin 'Code Snippets' atau 'WPCode', buat PHP snippet baru,
 *       dan aktifkan opsi "Run Everywhere" atau "Front-End Only".
 *
 * CATATAN PENTING WORDPRESS MULTISITE & HOSTER:
 * - Pada WordPress Multisite, akun Administrator biasa dibatasi hak akses HTML-nya (unfiltered_html).
 *   Enqueue CSS & JS melalui PHP ini menjamin script & style dimuat resmi oleh core WordPress tanpa diblokir.
 * - File manggoes.css dan manggoes.js harus diletakkan di direktori tema anak (astra-child) ATAU
 *   di folder wp-content/uploads/mg/. Snippet ini otomatis mendeteksi lokasi file.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * Konfigurasi Slug Halaman Target
 * Ganti nilai 'beranda' di bawah dengan slug halaman tempat Manggoes ditampilkan.
 * Contoh: 'beranda', 'home', atau 'mangga'.
 * Jika ingin ditampilkan pada halaman depan utama (Front Page), biarkan $target_page_slug = 'front';
 */
$GLOBALS['mg_target_page_slug'] = 'beranda';

function manggoes_enqueue_scripts() {
    $target_slug = isset( $GLOBALS['mg_target_page_slug'] ) ? $GLOBALS['mg_target_page_slug'] : 'beranda';

    // Cek apakah halaman yang dibuka adalah halaman target atau front page yang ditentukan
    $is_target = false;
    if ( $target_slug === 'front' && is_front_page() ) {
        $is_target = true;
    } elseif ( is_page( $target_slug ) ) {
        $is_target = true;
    }

    if ( ! $is_target ) {
        return;
    }

    // 1. Google Fonts Preconnect & Stylesheet (Plus Jakarta Sans & DM Sans)
    wp_enqueue_style(
        'manggoes-google-fonts',
        'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..500;1,9..40,400..500&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
        array(),
        null
    );

    // 2. Deteksi Lokasi File manggoes.css
    // Lokasi Prioritas 1: Child Theme Directory
    $theme_css_path = get_stylesheet_directory() . '/manggoes.css';
    $theme_css_uri  = get_stylesheet_directory_uri() . '/manggoes.css';

    // Lokasi Prioritas 2: Uploads Folder (wp-content/uploads/mg/manggoes.css)
    $upload_dir      = wp_upload_dir();
    $upload_css_path = $upload_dir['basedir'] . '/mg/manggoes.css';
    $upload_css_uri  = $upload_dir['baseurl'] . '/mg/manggoes.css';

    $css_path = file_exists( $theme_css_path ) ? $theme_css_path : $upload_css_path;
    $css_uri  = file_exists( $theme_css_path ) ? $theme_css_uri : $upload_css_uri;
    $css_ver  = file_exists( $css_path ) ? filemtime( $css_path ) : '1.0.0';

    wp_enqueue_style(
        'manggoes-custom-styles',
        $css_uri,
        array(),
        $css_ver
    );

    // 3. Deteksi Lokasi File manggoes.js
    $theme_js_path = get_stylesheet_directory() . '/manggoes.js';
    $theme_js_uri  = get_stylesheet_directory_uri() . '/manggoes.js';

    $upload_js_path = $upload_dir['basedir'] . '/mg/manggoes.js';
    $upload_js_uri  = $upload_dir['baseurl'] . '/mg/manggoes.js';

    $js_path = file_exists( $theme_js_path ) ? $theme_js_path : $upload_js_path;
    $js_uri  = file_exists( $theme_js_path ) ? $theme_js_uri : $upload_js_uri;
    $js_ver  = file_exists( $js_path ) ? filemtime( $js_path ) : '1.0.0';

    wp_enqueue_script(
        'manggoes-custom-script',
        $js_uri,
        array(),
        $js_ver,
        true // Muat di footer sebelum </body>
    );
}
add_action( 'wp_enqueue_scripts', 'manggoes_enqueue_scripts', 99 );

/**
 * Optimasi Kecepatan: Tambahkan rel="preconnect" untuk Google Fonts
 */
function manggoes_resource_hints( $urls, $relation_type ) {
    if ( 'preconnect' === $relation_type ) {
        $urls[] = array(
            'href' => 'https://fonts.googleapis.com',
            'crossorigin' => 'anonymous',
        );
        $urls[] = array(
            'href' => 'https://fonts.gstatic.com',
            'crossorigin' => 'anonymous',
        );
    }
    return $urls;
}
add_filter( 'wp_resource_hints', 'manggoes_resource_hints', 10, 2 );

/**
 * Tambahkan atribut defer pada script manggoes.js
 */
function manggoes_defer_script( $tag, $handle ) {
    if ( 'manggoes-custom-script' === $handle ) {
        return str_replace( ' src', ' defer src', $tag );
    }
    return $tag;
}
add_filter( 'script_loader_tag', 'manggoes_defer_script', 10, 2 );
`;

const phpSnippetPath = path.join(wpDir, 'functions-snippet.php');
fs.writeFileSync(phpSnippetPath, phpSnippet, 'utf8');
console.log(`✓ Generated ${path.relative(rootDir, phpSnippetPath)}`);

console.log('\n--- WordPress Export Completed Successfully! ---');
