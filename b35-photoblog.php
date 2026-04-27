<?php
/*
Plugin Name: Photo Blog
Plugin URI: http://bramesposito.com/projects/wordpress/photoblog
Description: Create a Photoblog, comparable to some popular existing ones
Author: Bram Esposito
Author URI: http://bramesposito.com
Version: 0.1.1
Text Domain: b35-photoblog
License: MIT License
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

function render_photo_post_content( $attributes, $content, $block ) {

	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_id = $block->context['postId'];

	if ( isset($attributes['postId'])) {
		$post_id = $attributes['postId'];
	}

	// When inside the main loop, we want to use queried object
	// so that `the_preview` for the current post can apply.
	// We force this behavior by omitting the third argument (post ID) from the `get_the_content`.
	$blocks = parse_blocks(get_the_content(null, false, $post_id));

	$image_blocks = array_filter($blocks, function($block) {
		return in_array($block['blockName'], [
			'core/image',
			'core/video',
			'core/gallery',
		]);
	});
	if (count($image_blocks) > 0) {
		$first_block = reset($image_blocks);
		if ( 'core/image' === $first_block['blockName'] && ! isset( $first_block['attrs']['lightbox'] ) ) {
			$first_block['attrs']['lightbox'] = [ 'enabled' => true, 'animation' => 'zoom' ];
		}
		$content = render_block($first_block);
	}
	// Check for nextpage to display page links for paginated posts.
	if ( has_block( 'core/nextpage' ) ) {
		$content .= wp_link_pages( array( 'echo' => 0 ) );
	}

	/** This filter is documented in wp-includes/post-template.php */
	$content = apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', $content ) );

	if ( empty( $content ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'entry-content' ) );

	return (
		'<div ' . $wrapper_attributes . '>' .
		$content .
		'</div>'
	);
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function create_block_photo_post_content_block_init() {
	register_block_type_from_metadata(
		__DIR__ . '/build/photo-post-content',
		array(
			'render_callback' => 'render_photo_post_content',
			'attributes'      => array(
				'postId' => array(
					'type'    => 'number',
				),
			),
		)
	);
}
add_action( 'init', 'create_block_photo_post_content_block_init' );


/**
 * Load child theme css and optional scripts
 *
 * @return void
 */
function b35_photo_blog_enqueue_scripts() {
    $cssfile = plugins_url("assets/css/style.css", __FILE__);
    wp_enqueue_style(
        'b35-photoblog-style',
        $cssfile,
        filemtime($cssfile)
    );
}
add_action( 'wp_enqueue_scripts', 'b35_photo_blog_enqueue_scripts', 100);


/**
 * Add "Image Post" to the +New admin bar menu.
 */
add_action( 'admin_bar_menu', function ( WP_Admin_Bar $wp_admin_bar ) {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	$wp_admin_bar->add_node( array(
		'id'     => 'b35-new-image-post',
		'title'  => __( 'Image Post', 'b35-photoblog' ),
		'parent' => 'new-content',
		'href'   => wp_nonce_url( admin_url( 'admin-post.php?action=b35_new_image_post' ), 'b35_new_image_post' ),
		'meta'   => array( 'title' => __( 'Add New Image Post', 'b35-photoblog' ) ),
	) );
}, 999 );

/**
 * Handle the "Add New Image Post" action: create the draft, set format, redirect to editor.
 */
add_action( 'admin_post_b35_new_image_post', function () {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( __( 'Sorry, you are not allowed to create posts.', 'b35-photoblog' ) );
	}

	check_admin_referer( 'b35_new_image_post' );

	$post_id = wp_insert_post( array(
		'post_type'   => 'post',
		'post_status' => 'auto-draft',
		'post_title'  => __( 'New Image Post', 'b35-photoblog' ),
	), true );

	if ( is_wp_error( $post_id ) || ! $post_id ) {
		wp_die( is_wp_error( $post_id ) ? $post_id->get_error_message() : __( 'Could not create post.', 'b35-photoblog' ) );
	}

	set_post_format( $post_id, 'image' );

	wp_safe_redirect( admin_url( 'post.php?post=' . $post_id . '&action=edit' ) );
	exit;
} );
