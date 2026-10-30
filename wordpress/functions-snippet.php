<?php
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
