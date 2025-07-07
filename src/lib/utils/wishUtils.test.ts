import { describe, it, expect } from 'vitest';
import {
	generateWishId,
	extractNumberFromWishId,
	extractLanguageFromWishId,
	isValidStatusTransition,
	hasPermission,
	canEditWish,
	extractPlaceholders,
	validatePlaceholders,
	insertPlaceholder,
	buildWishQueryString
} from './wishUtils';
import { WishStatus, Language } from '../types/Wish';
import { Permissions } from '../types/User';

describe('wishUtils', () => {
	describe('generateWishId', () => {
		it('should generate correct ID format for German', () => {
			const id = generateWishId('de', 0);
			expect(id).toBe('wish_external_de_1');
		});

		it('should generate correct ID format for English', () => {
			const id = generateWishId('en', 5);
			expect(id).toBe('wish_external_en_6');
		});

		it('should handle default lastNumber', () => {
			const id = generateWishId('de');
			expect(id).toBe('wish_external_de_1');
		});
	});

	describe('extractNumberFromWishId', () => {
		it('should extract number from valid ID', () => {
			expect(extractNumberFromWishId('wish_external_de_123')).toBe(123);
			expect(extractNumberFromWishId('wish_external_en_456')).toBe(456);
		});

		it('should return null for invalid ID format', () => {
			expect(extractNumberFromWishId('invalid_id')).toBeNull();
			expect(extractNumberFromWishId('wish_external_123')).toBeNull();
			expect(extractNumberFromWishId('wish_external_fr_123')).toBeNull();
		});
	});

	describe('extractLanguageFromWishId', () => {
		it('should extract language from valid ID', () => {
			expect(extractLanguageFromWishId('wish_external_de_123')).toBe('de');
			expect(extractLanguageFromWishId('wish_external_en_456')).toBe('en');
		});

		it('should return null for invalid ID format', () => {
			expect(extractLanguageFromWishId('invalid_id')).toBeNull();
			expect(extractLanguageFromWishId('wish_external_fr_123')).toBeNull();
		});
	});

	describe('isValidStatusTransition', () => {
		it('should allow valid Redakteur transitions', () => {
			expect(isValidStatusTransition('Entwurf', 'Zur Freigabe', 'Redakteur')).toBe(true);
			expect(isValidStatusTransition('Zur Freigabe', 'Entwurf', 'Redakteur')).toBe(true);
		});

		it('should deny invalid Redakteur transitions', () => {
			expect(isValidStatusTransition('Entwurf', 'Freigegeben', 'Redakteur')).toBe(false);
			expect(isValidStatusTransition('Zur Freigabe', 'Freigegeben', 'Redakteur')).toBe(false);
		});

		it('should allow valid Administrator transitions', () => {
			expect(isValidStatusTransition('Zur Freigabe', 'Freigegeben', 'Administrator')).toBe(true);
			expect(isValidStatusTransition('Freigegeben', 'Archiviert', 'Administrator')).toBe(true);
			expect(isValidStatusTransition('Archiviert', 'Entwurf', 'Administrator')).toBe(true);
		});
	});

	describe('hasPermission', () => {
		it('should check Redakteur permissions correctly', () => {
			expect(hasPermission('Redakteur', Permissions.CREATE_WISH)).toBe(true);
			expect(hasPermission('Redakteur', Permissions.EDIT_OWN_WISH)).toBe(true);
			expect(hasPermission('Redakteur', Permissions.APPROVE_WISH)).toBe(false);
			expect(hasPermission('Redakteur', Permissions.MANAGE_USERS)).toBe(false);
		});

		it('should check Administrator permissions correctly', () => {
			expect(hasPermission('Administrator', Permissions.CREATE_WISH)).toBe(true);
			expect(hasPermission('Administrator', Permissions.APPROVE_WISH)).toBe(true);
			expect(hasPermission('Administrator', Permissions.MANAGE_USERS)).toBe(true);
		});
	});

	describe('canEditWish', () => {
		it('should allow Administrator to edit any wish', () => {
			expect(canEditWish('Administrator', 'user1', 'user2')).toBe(true);
			expect(canEditWish('Administrator', 'user1', 'user1')).toBe(true);
		});

		it('should allow Redakteur to edit only own wishes', () => {
			expect(canEditWish('Redakteur', 'user1', 'user1')).toBe(true);
			expect(canEditWish('Redakteur', 'user1', 'user2')).toBe(false);
		});
	});

	describe('extractPlaceholders', () => {
		it('should extract all placeholders from text', () => {
			const text = 'Hello [Name], you are [Age] years old on [Date]!';
			const placeholders = extractPlaceholders(text);
			expect(placeholders).toEqual(['[Name]', '[Age]', '[Date]']);
		});

		it('should return empty array for text without placeholders', () => {
			const text = 'Hello world, no placeholders here!';
			const placeholders = extractPlaceholders(text);
			expect(placeholders).toEqual([]);
		});

		it('should handle malformed brackets', () => {
			const text = 'Hello [Name, you are Age] years old!';
			const placeholders = extractPlaceholders(text);
			expect(placeholders).toEqual(['[Name, you are Age]']);
		});
	});

	describe('validatePlaceholders', () => {
		it('should validate required placeholders exist', () => {
			const text = 'Hello [Name], you are [Age] years old!';
			expect(validatePlaceholders(text, ['[Name]', '[Age]'])).toBe(true);
			expect(validatePlaceholders(text, ['[Name]', '[Age]', '[Date]'])).toBe(false);
		});
	});

	describe('insertPlaceholder', () => {
		it('should insert placeholder at correct position', () => {
			const text = 'Hello , you are old!';
			const result = insertPlaceholder(text, 'Name', 6);
			expect(result).toBe('Hello [Name], you are old!');
		});
	});

	describe('buildWishQueryString', () => {
		it('should build correct query string', () => {
			const filters = {
				language: 'de' as Language,
				status: 'Freigegeben' as WishStatus,
				eventType: 'birthday' as const,
				search: 'test'
			};
			const query = buildWishQueryString(filters);
			expect(query).toContain('language=de');
			expect(query).toContain('status=Freigegeben');
			expect(query).toContain('eventType=birthday');
			expect(query).toContain('search=test');
		});

		it('should handle empty filters', () => {
			const query = buildWishQueryString({});
			expect(query).toBe('');
		});

		it('should handle array filters', () => {
			const filters = {
				relations: ['friend', 'family'] as ('friend' | 'family')[],
				ageGroups: ['young', 'middle'] as ('young' | 'middle')[]
			};
			const query = buildWishQueryString(filters);
			expect(query).toContain('relations=friend%2Cfamily');
			expect(query).toContain('ageGroups=young%2Cmiddle');
		});
	});
});
