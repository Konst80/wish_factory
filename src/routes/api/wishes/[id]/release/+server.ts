import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { releasedWishesService } from '$lib/server/released-wishes-service';
import { createSupabaseServerClientFromSvelteKit } from '$lib/supabase';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const { id } = params;

		// Get user from session
		const supabase = createSupabaseServerClientFromSvelteKit(cookies);
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Release the wish
		const releasedWish = await releasedWishesService.releaseWish(id, user.id);

		return json({
			success: true,
			releasedWish,
			message: 'Wish successfully released for WishSnap'
		});
	} catch (error) {
		console.error('Release wish error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to release wish'
			},
			{ status: 400 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		const { id } = params;

		// Get user from session
		const supabase = createSupabaseServerClientFromSvelteKit(cookies);
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Unrelease the wish
		await releasedWishesService.unreleaseWish(id);

		return json({
			success: true,
			message: 'Wish successfully unreleased'
		});
	} catch (error) {
		console.error('Unrelease wish error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to unrelease wish'
			},
			{ status: 400 }
		);
	}
};
