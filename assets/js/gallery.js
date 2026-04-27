( function () {
	'use strict';

	var items       = [];
	var current     = 0;
	var overlay     = null;
	var touchStartX = null;

	function init() {
		// Full-size URLs are already on the page in the WP interactivity state JSON.
		var imageState = {};
		try {
			var stateEl = document.getElementById( 'wp-script-module-data-@wordpress/interactivity' );
			if ( stateEl ) {
				var parsed = JSON.parse( stateEl.textContent );
				imageState = ( parsed.state && parsed.state[ 'core/image' ] && parsed.state[ 'core/image' ].metadata ) || {};
			}
		} catch ( e ) {}

		// Each photo-post-content block in the query loop.
		document.querySelectorAll( '.wp-block-b35-photo-post-content' ).forEach( function ( postEl ) {

			// When PHP added data-gallery-src the WP lightbox was disabled,
			// so there are no data-wp-context figures — handle as single image.
			if ( postEl.dataset.gallerySrc ) {
				var itemIdx = items.length;
				items.push( { src: postEl.dataset.gallerySrc, alt: postEl.dataset.galleryAlt || '' } );
				postEl.addEventListener( 'click', function ( e ) {
					if ( e.target.closest( 'a' ) ) return;
					e.stopPropagation();
					open( itemIdx );
				}, true );
				return;
			}

			// For all other cases (WP lightbox active), each figure[data-wp-context]
			// is one image — this covers both single-image and gallery-format posts.
			postEl.querySelectorAll( 'figure[data-wp-context]' ).forEach( function ( figure ) {
				var src = '', alt = '';
				try {
					var ctx  = JSON.parse( figure.getAttribute( 'data-wp-context' ) );
					var meta = ctx.imageId ? imageState[ ctx.imageId ] : null;
					if ( meta ) { src = meta.uploadedSrc || ''; alt = meta.alt || ''; }
				} catch ( e ) {}

				if ( ! src ) {
					var img = figure.querySelector( 'img' );
					if ( img ) { src = img.dataset.src || img.getAttribute( 'src' ) || ''; alt = img.alt || ''; }
				}

				if ( ! src ) return;

				var itemIdx = items.length;
				items.push( { src: src, alt: alt } );

				// Capture phase on the figure itself so clicking any image in a
				// multi-image gallery opens the lightbox at that specific image.
				figure.addEventListener( 'click', function ( e ) {
					if ( e.target.closest( 'a' ) ) return;
					e.stopPropagation();
					open( itemIdx );
				}, true );
			} );
		} );

		// Standalone wp-block-gallery <a> links (replaces gg-lightbox).
		var galleryOffset = items.length;
		document.querySelectorAll( '.wp-block-gallery a' ).forEach( function ( link, idx ) {
			var img = link.querySelector( 'img' );
			var itemIdx = galleryOffset + idx;
			items.push( { src: link.getAttribute( 'href' ), alt: img ? img.alt : '' } );
			link.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				open( itemIdx );
			} );
		} );
	}

	function open( idx ) {
		current = idx;
		if ( ! overlay ) buildOverlay();
		overlay.removeAttribute( 'hidden' );
		document.body.classList.add( 'b35-lightbox-open' );
		show( current );
	}

	function close() {
		if ( ! overlay ) return;
		overlay.setAttribute( 'hidden', '' );
		document.body.classList.remove( 'b35-lightbox-open' );
	}

	function show( idx ) {
		var item = items[ idx ];
		var img  = overlay.querySelector( '.b35-lb-img' );
		img.src  = '';
		img.alt  = item.alt;
		img.src  = item.src;
		overlay.querySelector( '.b35-lb-counter' ).textContent =
			( idx + 1 ) + ' / ' + items.length;
		var hasMultiple = items.length > 1;
		overlay.querySelector( '.b35-lb-prev' ).style.visibility = hasMultiple ? '' : 'hidden';
		overlay.querySelector( '.b35-lb-next' ).style.visibility = hasMultiple ? '' : 'hidden';
	}

	function step( dir ) {
		current = ( current + dir + items.length ) % items.length;
		show( current );
	}

	function buildOverlay() {
		overlay = document.createElement( 'div' );
		overlay.className = 'b35-lightbox';
		overlay.setAttribute( 'role', 'dialog' );
		overlay.setAttribute( 'aria-modal', 'true' );
		overlay.setAttribute( 'aria-label', 'Image lightbox' );
		overlay.setAttribute( 'hidden', '' );
		overlay.innerHTML =
			'<div class="b35-lb-backdrop"></div>' +
			'<button class="b35-lb-close" aria-label="Close">' +
				'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L17 17M17 1L1 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
			'</button>' +
			'<button class="b35-lb-prev" aria-label="Previous">' +
				'<svg width="14" height="26" viewBox="0 0 14 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13L13 25" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
			'</button>' +
			'<img class="b35-lb-img" src="" alt="">' +
			'<button class="b35-lb-next" aria-label="Next">' +
				'<svg width="14" height="26" viewBox="0 0 14 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13L1 25" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
			'</button>' +
			'<div class="b35-lb-counter"></div>';

		document.body.appendChild( overlay );

		overlay.querySelector( '.b35-lb-backdrop' ).addEventListener( 'click', close );
		overlay.querySelector( '.b35-lb-close' ).addEventListener( 'click', close );
		overlay.querySelector( '.b35-lb-prev' ).addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			step( -1 );
		} );
		overlay.querySelector( '.b35-lb-next' ).addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			step( 1 );
		} );

		document.addEventListener( 'keydown', function ( e ) {
			if ( overlay.hasAttribute( 'hidden' ) ) return;
			if ( e.key === 'Escape' )     close();
			if ( e.key === 'ArrowLeft' )  step( -1 );
			if ( e.key === 'ArrowRight' ) step( 1 );
		} );

		overlay.addEventListener( 'touchstart', function ( e ) {
			touchStartX = e.touches[ 0 ].clientX;
		}, { passive: true } );

		overlay.addEventListener( 'touchend', function ( e ) {
			if ( touchStartX === null ) return;
			var diff = touchStartX - e.changedTouches[ 0 ].clientX;
			if ( Math.abs( diff ) > 50 ) step( diff > 0 ? 1 : -1 );
			touchStartX = null;
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
