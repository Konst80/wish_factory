import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { releasedWishesService } from '$lib/server/released-wishes-service';
import { createSupabaseServerClientFromSvelteKit } from '$lib/supabase';

export const POST: RequestHandler = async ({ params, cookies }) => {
	try {
		const { id } = params;

		// Get user from session
		const supabase = createSupabaseServerClientFromSvelteKit(cookies);
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return json(
				{
					error: {
						code: 'UNAUTHORIZED',
						message: 'Authentication required',
						timestamp: new Date().toISOString()
					}
				},
				{ status: 401 }
			);
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
				error: {
					code: 'RELEASE_FAILED',
					message: error instanceof Error ? error.message : 'Failed to release wish',
					timestamp: new Date().toISOString()
				}
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
			return json(
				{
					error: {
						code: 'UNAUTHORIZED',
						message: 'Authentication required',
						timestamp: new Date().toISOString()
					}
				},
				{ status: 401 }
			);
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
				error: {
					code: 'UNRELEASE_FAILED',
					message: error instanceof Error ? error.message : 'Failed to unrelease wish',
					timestamp: new Date().toISOString()
				}
			},
			{ status: 400 }
		);
	}
};
