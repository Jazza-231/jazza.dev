import type { PageLoad } from "./$types";

export const load = (async ({ params }) => {
	return {
		slug: params.project,
	};
}) satisfies PageLoad;
