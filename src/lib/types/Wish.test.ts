import { describe, it, expect } from 'vitest';
import {
	wishSchema,
	createWishSchema,
	updateWishSchema,
	isValidWishType,
	isValidEventType,
	isValidWishStatus,
	isValidLanguage,
	WishType,
	EventType,
	WishStatus,
	Language
} from './Wish';

describe('Wish Types and Schemas', () => {
	describe('Type Guards', () => {
		it('should validate wish types correctly', () => {
			expect(isValidWishType('normal')).toBe(true);
			expect(isValidWishType('heartfelt')).toBe(true);
			expect(isValidWishType('funny')).toBe(true);
			expect(isValidWishType('invalid')).toBe(false);
		});

		it('should validate event types correctly', () => {
			expect(isValidEventType('birthday')).toBe(true);
			expect(isValidEventType('anniversary')).toBe(true);
			expect(isValidEventType('custom')).toBe(true);
			expect(isValidEventType('invalid')).toBe(false);
		});

		it('should validate wish status correctly', () => {
			expect(isValidWishStatus('Entwurf')).toBe(true);
			expect(isValidWishStatus('Zur Freigabe')).toBe(true);
			expect(isValidWishStatus('Freigegeben')).toBe(true);
			expect(isValidWishStatus('Archiviert')).toBe(true);
			expect(isValidWishStatus('Invalid')).toBe(false);
		});

		it('should validate language correctly', () => {
			expect(isValidLanguage('de')).toBe(true);
			expect(isValidLanguage('en')).toBe(true);
			expect(isValidLanguage('fr')).toBe(false);
		});
	});

	describe('Wish Schema Validation', () => {
		const validWishData = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			type: 'normal' as const,
			eventType: 'birthday' as const,
			relations: ['friend'],
			ageGroups: ['young'],
			specificValues: [18, 21],
			text: 'Happy Birthday [Name]! You are [Age] years old now.',
			belated: 'Belated Happy Birthday [Name]! Hope you had a great day.',
			status: 'Entwurf' as const,
			language: 'de' as const,
			createdAt: new Date(),
			updatedAt: new Date(),
			createdBy: '123e4567-e89b-12d3-a456-426614174000'
		};

		it('should validate correct wish data', () => {
			const result = wishSchema.safeParse(validWishData);
			expect(result.success).toBe(true);
		});

		it('should reject invalid ID format', () => {
			const invalidData = { ...validWishData, id: 'invalid_id_format' };
			const result = wishSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject empty relations array', () => {
			const invalidData = { ...validWishData, relations: [] };
			const result = wishSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject empty ageGroups array', () => {
			const invalidData = { ...validWishData, ageGroups: [] };
			const result = wishSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject text that is too short', () => {
			const invalidData = { ...validWishData, text: 'Too short' };
			const result = wishSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject text that is too long', () => {
			const invalidData = { ...validWishData, text: 'A'.repeat(1001) };
			const result = wishSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it('should reject invalid UUID for createdBy', () => {
			const invalidData = { ...validWishData, createdBy: 'not-a-uuid' };
			const result = wishSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('Create Wish Schema', () => {
		it('should validate wish creation data without ID and timestamps', () => {
			const createData = {
				type: 'normal' as const,
				eventType: 'birthday' as const,
				relations: ['friend'],
				ageGroups: ['young'],
				specificValues: [18, 21],
				text: 'Happy Birthday [Name]! You are [Age] years old now.',
				belated: 'Belated Happy Birthday [Name]! Hope you had a great day.',
				status: 'Entwurf' as const,
				language: 'de' as const,
				createdBy: '123e4567-e89b-12d3-a456-426614174000'
			};

			const result = createWishSchema.safeParse(createData);
			expect(result.success).toBe(true);
		});

		it('should set default values correctly', () => {
			const createData = {
				type: 'normal' as const,
				eventType: 'birthday' as const,
				relations: ['friend'],
				ageGroups: ['young'],
				text: 'Happy Birthday [Name]! You are [Age] years old now.',
				belated: 'Belated Happy Birthday [Name]! Hope you had a great day.',
				language: 'de' as const,
				createdBy: '123e4567-e89b-12d3-a456-426614174000'
			};

			const result = createWishSchema.safeParse(createData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.status).toBe('Entwurf');
				expect(result.data.specificValues).toEqual([]);
			}
		});
	});

	describe('Update Wish Schema', () => {
		it('should allow partial updates with required ID', () => {
			const updateData = {
				id: '123e4567-e89b-12d3-a456-426614174000',
				text: 'Updated wish text for [Name].'
			};

			const result = updateWishSchema.safeParse(updateData);
			expect(result.success).toBe(true);
		});

		it('should require ID for updates', () => {
			const updateData = {
				text: 'Updated wish text for [Name].'
			};

			const result = updateWishSchema.safeParse(updateData);
			expect(result.success).toBe(false);
		});
	});

	describe('Constants', () => {
		it('should have correct WishType values', () => {
			expect(WishType.NORMAL).toBe('normal');
			expect(WishType.HEARTFELT).toBe('heartfelt');
			expect(WishType.FUNNY).toBe('funny');
		});

		it('should have correct EventType values', () => {
			expect(EventType.BIRTHDAY).toBe('birthday');
			expect(EventType.ANNIVERSARY).toBe('anniversary');
			expect(EventType.CUSTOM).toBe('custom');
		});

		it('should have correct WishStatus values', () => {
			expect(WishStatus.ENTWURF).toBe('Entwurf');
			expect(WishStatus.ZUR_FREIGABE).toBe('Zur Freigabe');
			expect(WishStatus.FREIGEGEBEN).toBe('Freigegeben');
			expect(WishStatus.ARCHIVIERT).toBe('Archiviert');
		});

		it('should have correct Language values', () => {
			expect(Language.DE).toBe('de');
			expect(Language.EN).toBe('en');
		});
	});
});
