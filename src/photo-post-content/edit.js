import ServerSideRender from '@wordpress/server-side-render';
import { useSelect } from '@wordpress/data';
export default function Edit( props ) {
	const { postId: contextPostId, postType: contextPostType } = props.context;
	// const postId = useSelect((select) => {
	// 	return select('core/editor')?.getCurrentPostId();
	// }, []);
	console.log(props.context);
	console.log(contextPostId);

	return (
		<ServerSideRender
			block="b35/photo-post-content"
			attributes={{ ...props.attributes, ...props.context }}
		/>
	);
}
