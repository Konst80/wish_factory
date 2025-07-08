export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					email: string;
					full_name: string;
					role: 'Redakteur' | 'Administrator';
					avatar_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					full_name: string;
					role?: 'Redakteur' | 'Administrator';
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					full_name?: string;
					role?: 'Redakteur' | 'Administrator';
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'profiles_id_fkey';
						columns: ['id'];
						isOneToOne: true;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			wishes: {
				Row: {
					id: string;
					type: 'normal' | 'funny';
					event_type: 'birthday' | 'anniversary' | 'custom';
					relations: ('friend' | 'family' | 'partner' | 'colleague')[];
					age_groups: ('all' | 'young' | 'middle' | 'senior')[];
					specific_values: number[];
					text: string;
					belated: string;
					status: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
					language: 'de' | 'en';
					created_at: string;
					updated_at: string;
					created_by: string;
				};
				Insert: {
					id: string;
					type: 'normal' | 'funny';
					event_type: 'birthday' | 'anniversary' | 'custom';
					relations: ('friend' | 'family' | 'partner' | 'colleague')[];
					age_groups: ('all' | 'young' | 'middle' | 'senior')[];
					specific_values?: number[];
					text: string;
					belated: string;
					status?: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
					language: 'de' | 'en';
					created_at?: string;
					updated_at?: string;
					created_by: string;
				};
				Update: {
					id?: string;
					type?: 'normal' | 'funny';
					event_type?: 'birthday' | 'anniversary' | 'custom';
					relations?: ('friend' | 'family' | 'partner' | 'colleague')[];
					age_groups?: ('all' | 'young' | 'middle' | 'senior')[];
					specific_values?: number[];
					text?: string;
					belated?: string;
					status?: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
					language?: 'de' | 'en';
					created_at?: string;
					updated_at?: string;
					created_by?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'wishes_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			user_settings: {
				Row: {
					id: string;
					user_id: string;
					language: string;
					timezone: string;
					email_notifications: boolean;
					push_notifications: boolean;
					new_wish_alerts: boolean;
					approval_requests: boolean;
					system_updates: boolean;
					weekly_report: boolean;
					theme: string;
					dashboard_layout: string;
					wishes_per_page: number;
					auto_save: boolean;
					confirm_before_delete: boolean;
					api_access: boolean;
					export_format: string;
					backup_frequency: string;
					data_retention: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					language?: string;
					timezone?: string;
					email_notifications?: boolean;
					push_notifications?: boolean;
					new_wish_alerts?: boolean;
					approval_requests?: boolean;
					system_updates?: boolean;
					weekly_report?: boolean;
					theme?: string;
					dashboard_layout?: string;
					wishes_per_page?: number;
					auto_save?: boolean;
					confirm_before_delete?: boolean;
					api_access?: boolean;
					export_format?: string;
					backup_frequency?: string;
					data_retention?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					language?: string;
					timezone?: string;
					email_notifications?: boolean;
					push_notifications?: boolean;
					new_wish_alerts?: boolean;
					approval_requests?: boolean;
					system_updates?: boolean;
					weekly_report?: boolean;
					theme?: string;
					dashboard_layout?: string;
					wishes_per_page?: number;
					auto_save?: boolean;
					confirm_before_delete?: boolean;
					api_access?: boolean;
					export_format?: string;
					backup_frequency?: string;
					data_retention?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'user_settings_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			generate_wish_id: {
				Args: {
					wish_language: 'de' | 'en';
				};
				Returns: string;
			};
			search_wishes: {
				Args: {
					search_term?: string;
					filter_language?: 'de' | 'en';
					filter_status?: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
					filter_event_type?: 'birthday' | 'anniversary' | 'custom';
					filter_relations?: ('friend' | 'family' | 'partner' | 'colleague')[];
					filter_age_groups?: ('all' | 'young' | 'middle' | 'senior')[];
					limit_count?: number;
					offset_count?: number;
				};
				Returns: {
					id: string;
					type: 'normal' | 'funny';
					event_type: 'birthday' | 'anniversary' | 'custom';
					relations: ('friend' | 'family' | 'partner' | 'colleague')[];
					age_groups: ('all' | 'young' | 'middle' | 'senior')[];
					specific_values: number[];
					text: string;
					belated: string;
					status: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
					language: 'de' | 'en';
					created_at: string;
					updated_at: string;
					created_by: string;
					creator_name: string;
				}[];
			};
			validate_status_transition: {
				Args: {
					current_status: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
					new_status: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
					user_role: 'Redakteur' | 'Administrator';
				};
				Returns: boolean;
			};
		};
		Enums: {
			age_group: 'all' | 'young' | 'middle' | 'senior';
			event_type: 'birthday' | 'anniversary' | 'custom';
			language: 'de' | 'en';
			relation: 'friend' | 'family' | 'partner' | 'colleague';
			user_role: 'Redakteur' | 'Administrator';
			wish_status: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
			wish_type: 'normal' | 'funny';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
