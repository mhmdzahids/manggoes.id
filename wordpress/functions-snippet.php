<?php
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
