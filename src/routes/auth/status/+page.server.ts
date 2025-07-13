import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Simple server load to ensure route is properly recognized
	return {};
};
