/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
import { registerBlockType } from '@wordpress/blocks';


/**
 * Internal dependencies
 */
import Edit from './edit';
import metadata from './block.json';

const photoPostIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20">
		<path d="M19 10v7a2 2 0 0 1-2 2h-3m5-9c-6.442 0-10.105 1.985-12.055 4.243M19 10V8.5M1 14v3a2 2 0 0 0 2 2h0 11M1 14V3a2 2 0 0 1 2-2h8M6 1h11a2 2 0 0 1 2 2v8M1 14c1.403-.234 3.637-.293 5.945.243M14 19c-1.704-2.768-4.427-4.148-7.055-4.757M6.5 5C6 5 5 5.3 5 6.5S6 8 6.5 8 8 7.7 8 6.5 7 5 6.5 5z" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>
);


/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType( metadata.name, {

	icon: photoPostIcon,
	attributes: {
		postId: { // Add postId as an attribute
			type: 'number',
		},
	},
	/**
	 * @see ./edit.js
	 */
	edit: Edit,
} );
