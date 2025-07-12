export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instanciate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '12.2.3 (519615d)';
	};
	public: {
		Tables: {
			api_keys: {
				Row: {
					id: string;
					name: string;
					key_hash: string;
					key_prefix: string;
					description: string | null;
					is_active: boolean;
					rate_limit_per_hour: number;
					allowed_endpoints: string[];
					last_used_at: string | null;
					total_requests: number;
					created_by: string | null;
					created_at: string;
					updated_at: string;
					expires_at: string | null;
				};
				Insert: {
					id?: string;
					name: string;
					key_hash: string;
					key_prefix: string;
					description?: string | null;
					is_active?: boolean;
					rate_limit_per_hour?: number;
					allowed_endpoints?: string[];
					last_used_at?: string | null;
					total_requests?: number;
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
					expires_at?: string | null;
				};
				Update: {
					id?: string;
					name?: string;
					key_hash?: string;
					key_prefix?: string;
					description?: string | null;
					is_active?: boolean;
					rate_limit_per_hour?: number;
					allowed_endpoints?: string[];
					last_used_at?: string | null;
					total_requests?: number;
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
					expires_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "api_keys_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					}
				];
			};
			released_wishes: {
				Row: {
					id: string;
					original_wish_id: string;
					type: string;
					event_type: string;
					relations: string[];
					age_groups: string[];
					specific_values: number[];
					text: string;
					belated: boolean;
					language: string;
					length: string;
					released_by: string;
					released_at: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					original_wish_id: string;
					type: string;
					event_type: string;
					relations: string[];
					age_groups: string[];
					specific_values?: number[];
					text: string;
					belated?: boolean;
					language: string;
					length: string;
					released_by: string;
					released_at?: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					original_wish_id?: string;
					type?: string;
					event_type?: string;
					relations?: string[];
					age_groups?: string[];
					specific_values?: number[];
					text?: string;
					belated?: boolean;
					language?: string;
					length?: string;
					released_by?: string;
					released_at?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "released_wishes_original_wish_id_fkey";
						columns: ["original_wish_id"];
						isOneToOne: false;
						referencedRelation: "wishes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "released_wishes_released_by_fkey";
						columns: ["released_by"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					}
				];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string | null;
					email: string;
					full_name: string;
					id: string;
					role: Database['public']['Enums']['user_role'];
					updated_at: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string | null;
					email: string;
					full_name: string;
					id: string;
					role?: Database['public']['Enums']['user_role'];
					updated_at?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string | null;
					email?: string;
					full_name?: string;
					id?: string;
					role?: Database['public']['Enums']['user_role'];
					updated_at?: string | null;
				};
				Relationships: [];
			};
			user_settings: {
				Row: {
					ai_frequency_penalty: number | null;
					ai_max_tokens: number | null;
					ai_model: string | null;
					ai_presence_penalty: number | null;
					ai_prompt_age_young: string | null;
					ai_prompt_age_middle: string | null;
					ai_prompt_age_senior: string | null;
					ai_prompt_system: string | null;
					ai_prompt_template: string | null;
					ai_temperature: number | null;
					ai_top_p: number | null;
					api_access: boolean | null;
					approval_requests: boolean | null;
					auto_save: boolean | null;
					backup_frequency: string | null;
					confirm_before_delete: boolean | null;
					created_at: string | null;
					dashboard_layout: string | null;
					data_retention: number | null;
					email_notifications: boolean | null;
					export_format: string | null;
					id: string;
					language: string | null;
					new_wish_alerts: boolean | null;
					push_notifications: boolean | null;
					specific_values_anniversary_de: string | null;
					specific_values_anniversary_en: string | null;
					specific_values_birthday_de: string | null;
					specific_values_birthday_en: string | null;
					specific_values_custom_de: string | null;
					specific_values_custom_en: string | null;
					system_updates: boolean | null;
					theme: string | null;
					timezone: string | null;
					updated_at: string | null;
					user_id: string;
					weekly_report: boolean | null;
					wishes_per_page: number | null;
				};
				Insert: {
					ai_frequency_penalty?: number | null;
					ai_max_tokens?: number | null;
					ai_model?: string | null;
					ai_presence_penalty?: number | null;
					ai_prompt_age_young?: string | null;
					ai_prompt_age_middle?: string | null;
					ai_prompt_age_senior?: string | null;
					ai_prompt_system?: string | null;
					ai_prompt_template?: string | null;
					ai_temperature?: number | null;
					ai_top_p?: number | null;
					api_access?: boolean | null;
					approval_requests?: boolean | null;
					auto_save?: boolean | null;
					backup_frequency?: string | null;
					confirm_before_delete?: boolean | null;
					created_at?: string | null;
					dashboard_layout?: string | null;
					data_retention?: number | null;
					email_notifications?: boolean | null;
					export_format?: string | null;
					id?: string;
					language?: string | null;
					new_wish_alerts?: boolean | null;
					push_notifications?: boolean | null;
					specific_values_anniversary_de?: string | null;
					specific_values_anniversary_en?: string | null;
					specific_values_birthday_de?: string | null;
					specific_values_birthday_en?: string | null;
					specific_values_custom_de?: string | null;
					specific_values_custom_en?: string | null;
					system_updates?: boolean | null;
					theme?: string | null;
					timezone?: string | null;
					updated_at?: string | null;
					user_id: string;
					weekly_report?: boolean | null;
					wishes_per_page?: number | null;
				};
				Update: {
					ai_frequency_penalty?: number | null;
					ai_max_tokens?: number | null;
					ai_model?: string | null;
					ai_presence_penalty?: number | null;
					ai_prompt_age_young?: string | null;
					ai_prompt_age_middle?: string | null;
					ai_prompt_age_senior?: string | null;
					ai_prompt_system?: string | null;
					ai_prompt_template?: string | null;
					ai_temperature?: number | null;
					ai_top_p?: number | null;
					api_access?: boolean | null;
					approval_requests?: boolean | null;
					auto_save?: boolean | null;
					backup_frequency?: string | null;
					confirm_before_delete?: boolean | null;
					created_at?: string | null;
					dashboard_layout?: string | null;
					data_retention?: number | null;
					email_notifications?: boolean | null;
					export_format?: string | null;
					id?: string;
					language?: string | null;
					new_wish_alerts?: boolean | null;
					push_notifications?: boolean | null;
					specific_values_anniversary_de?: string | null;
					specific_values_anniversary_en?: string | null;
					specific_values_birthday_de?: string | null;
					specific_values_birthday_en?: string | null;
					specific_values_custom_de?: string | null;
					specific_values_custom_en?: string | null;
					system_updates?: boolean | null;
					theme?: string | null;
					timezone?: string | null;
					updated_at?: string | null;
					user_id?: string;
					weekly_report?: boolean | null;
					wishes_per_page?: number | null;
				};
				Relationships: [];
			};
			wishes: {
				Row: {
					age_groups: Database['public']['Enums']['age_group'][];
					belated: string;
					created_at: string | null;
					created_by: string;
					event_type: Database['public']['Enums']['event_type'];
					id: string;
					language: Database['public']['Enums']['language'];
					relations: Database['public']['Enums']['relation'][];
					specific_values: number[] | null;
					status: Database['public']['Enums']['wish_status'];
					text: string;
					type: Database['public']['Enums']['wish_type'];
					updated_at: string | null;
				};
				Insert: {
					age_groups: Database['public']['Enums']['age_group'][];
					belated: string;
					created_at?: string | null;
					created_by: string;
					event_type: Database['public']['Enums']['event_type'];
					id?: string;
					language: Database['public']['Enums']['language'];
					relations: Database['public']['Enums']['relation'][];
					specific_values?: number[] | null;
					status?: Database['public']['Enums']['wish_status'];
					text: string;
					type: Database['public']['Enums']['wish_type'];
					updated_at?: string | null;
				};
				Update: {
					age_groups?: Database['public']['Enums']['age_group'][];
					belated?: string;
					created_at?: string | null;
					created_by?: string;
					event_type?: Database['public']['Enums']['event_type'];
					id?: string;
					language?: Database['public']['Enums']['language'];
					relations?: Database['public']['Enums']['relation'][];
					specific_values?: number[] | null;
					status?: Database['public']['Enums']['wish_status'];
					text?: string;
					type?: Database['public']['Enums']['wish_type'];
					updated_at?: string | null;
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
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			generate_wish_id: {
				Args: { wish_language: Database['public']['Enums']['language'] };
				Returns: string;
			};
			get_user_role: {
				Args: Record<PropertyKey, never>;
				Returns: Database['public']['Enums']['user_role'];
			};
			search_wishes: {
				Args: {
					search_term?: string;
					filter_language?: Database['public']['Enums']['language'];
					filter_status?: Database['public']['Enums']['wish_status'];
					filter_event_type?: Database['public']['Enums']['event_type'];
					filter_relations?: Database['public']['Enums']['relation'][];
					filter_age_groups?: Database['public']['Enums']['age_group'][];
					limit_count?: number;
					offset_count?: number;
				};
				Returns: {
					id: string;
					type: Database['public']['Enums']['wish_type'];
					event_type: Database['public']['Enums']['event_type'];
					relations: Database['public']['Enums']['relation'][];
					age_groups: Database['public']['Enums']['age_group'][];
					specific_values: number[];
					text: string;
					belated: string;
					status: Database['public']['Enums']['wish_status'];
					language: Database['public']['Enums']['language'];
					created_at: string;
					updated_at: string;
					created_by: string;
					creator_name: string;
				}[];
			};
			validate_status_transition: {
				Args: {
					current_status: Database['public']['Enums']['wish_status'];
					new_status: Database['public']['Enums']['wish_status'];
					user_role: Database['public']['Enums']['user_role'];
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
			wish_type: 'normal' | 'herzlich' | 'humorvoll';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {
			age_group: ['all', 'young', 'middle', 'senior'],
			event_type: ['birthday', 'anniversary', 'custom'],
			language: ['de', 'en'],
			relation: ['friend', 'family', 'partner', 'colleague'],
			user_role: ['Redakteur', 'Administrator'],
			wish_status: ['Entwurf', 'Zur Freigabe', 'Freigegeben', 'Archiviert'],
			wish_type: ['normal', 'herzlich', 'humorvoll']
		}
	}
} as const;
