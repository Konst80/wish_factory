export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          allowed_endpoints: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit_per_hour: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_endpoints?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit_per_hour?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_endpoints?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit_per_hour?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          created_by: string
          email: string
          expires_at: string
          full_name: string
          id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          created_by: string
          email: string
          expires_at: string
          full_name: string
          id?: string
          role: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          role?: string
          token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      released_wishes: {
        Row: {
          age_groups: string[]
          belated: boolean
          event_type: string
          id: string
          language: string
          length: string
          original_wish_id: string
          relations: string[]
          released_at: string | null
          released_by: string
          specific_values: number[] | null
          text: string
          type: string
        }
        Insert: {
          age_groups: string[]
          belated?: boolean
          event_type: string
          id?: string
          language: string
          length: string
          original_wish_id: string
          relations: string[]
          released_at?: string | null
          released_by: string
          specific_values?: number[] | null
          text: string
          type: string
        }
        Update: {
          age_groups?: string[]
          belated?: boolean
          event_type?: string
          id?: string
          language?: string
          length?: string
          original_wish_id?: string
          relations?: string[]
          released_at?: string | null
          released_by?: string
          specific_values?: number[] | null
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "released_wishes_original_wish_id_fkey"
            columns: ["original_wish_id"]
            isOneToOne: true
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          ai_frequency_penalty: number | null
          ai_json_structure: string | null
          ai_max_tokens: number | null
          ai_model: string | null
          ai_presence_penalty: number | null
          ai_prompt_age_middle: string | null
          ai_prompt_age_senior: string | null
          ai_prompt_age_young: string | null
          ai_prompt_batch: string | null
          ai_prompt_belated: string | null
          ai_prompt_relation_colleague: string | null
          ai_prompt_relation_family: string | null
          ai_prompt_relation_friend: string | null
          ai_prompt_relation_partner: string | null
          ai_prompt_system: string | null
          ai_prompt_template: string | null
          ai_temperature: number | null
          ai_top_p: number | null
          api_access: boolean | null
          approval_requests: boolean | null
          auto_save: boolean | null
          backup_frequency: string | null
          confirm_before_delete: boolean | null
          created_at: string | null
          dashboard_layout: string | null
          data_retention: number | null
          email_notifications: boolean | null
          export_format: string | null
          id: string
          language: string | null
          new_wish_alerts: boolean | null
          push_notifications: boolean | null
          specific_values_anniversary_de: string | null
          specific_values_anniversary_en: string | null
          specific_values_birthday_de: string | null
          specific_values_birthday_en: string | null
          specific_values_custom_de: string | null
          specific_values_custom_en: string | null
          system_updates: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weekly_report: boolean | null
          wishes_per_page: number | null
        }
        Insert: {
          ai_frequency_penalty?: number | null
          ai_json_structure?: string | null
          ai_max_tokens?: number | null
          ai_model?: string | null
          ai_presence_penalty?: number | null
          ai_prompt_age_middle?: string | null
          ai_prompt_age_senior?: string | null
          ai_prompt_age_young?: string | null
          ai_prompt_batch?: string | null
          ai_prompt_belated?: string | null
          ai_prompt_relation_colleague?: string | null
          ai_prompt_relation_family?: string | null
          ai_prompt_relation_friend?: string | null
          ai_prompt_relation_partner?: string | null
          ai_prompt_system?: string | null
          ai_prompt_template?: string | null
          ai_temperature?: number | null
          ai_top_p?: number | null
          api_access?: boolean | null
          approval_requests?: boolean | null
          auto_save?: boolean | null
          backup_frequency?: string | null
          confirm_before_delete?: boolean | null
          created_at?: string | null
          dashboard_layout?: string | null
          data_retention?: number | null
          email_notifications?: boolean | null
          export_format?: string | null
          id?: string
          language?: string | null
          new_wish_alerts?: boolean | null
          push_notifications?: boolean | null
          specific_values_anniversary_de?: string | null
          specific_values_anniversary_en?: string | null
          specific_values_birthday_de?: string | null
          specific_values_birthday_en?: string | null
          specific_values_custom_de?: string | null
          specific_values_custom_en?: string | null
          system_updates?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weekly_report?: boolean | null
          wishes_per_page?: number | null
        }
        Update: {
          ai_frequency_penalty?: number | null
          ai_json_structure?: string | null
          ai_max_tokens?: number | null
          ai_model?: string | null
          ai_presence_penalty?: number | null
          ai_prompt_age_middle?: string | null
          ai_prompt_age_senior?: string | null
          ai_prompt_age_young?: string | null
          ai_prompt_batch?: string | null
          ai_prompt_belated?: string | null
          ai_prompt_relation_colleague?: string | null
          ai_prompt_relation_family?: string | null
          ai_prompt_relation_friend?: string | null
          ai_prompt_relation_partner?: string | null
          ai_prompt_system?: string | null
          ai_prompt_template?: string | null
          ai_temperature?: number | null
          ai_top_p?: number | null
          api_access?: boolean | null
          approval_requests?: boolean | null
          auto_save?: boolean | null
          backup_frequency?: string | null
          confirm_before_delete?: boolean | null
          created_at?: string | null
          dashboard_layout?: string | null
          data_retention?: number | null
          email_notifications?: boolean | null
          export_format?: string | null
          id?: string
          language?: string | null
          new_wish_alerts?: boolean | null
          push_notifications?: boolean | null
          specific_values_anniversary_de?: string | null
          specific_values_anniversary_en?: string | null
          specific_values_birthday_de?: string | null
          specific_values_birthday_en?: string | null
          specific_values_custom_de?: string | null
          specific_values_custom_en?: string | null
          system_updates?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_report?: boolean | null
          wishes_per_page?: number | null
        }
        Relationships: []
      }
      wishes: {
        Row: {
          age_groups: Database["public"]["Enums"]["age_group"][]
          belated: boolean
          created_at: string | null
          created_by: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          language: Database["public"]["Enums"]["language"]
          length: string
          relations: Database["public"]["Enums"]["relation"][]
          specific_values: number[] | null
          status: Database["public"]["Enums"]["wish_status"]
          text: string
          type: Database["public"]["Enums"]["wish_type"]
          updated_at: string | null
        }
        Insert: {
          age_groups: Database["public"]["Enums"]["age_group"][]
          belated?: boolean
          created_at?: string | null
          created_by: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          language: Database["public"]["Enums"]["language"]
          length?: string
          relations: Database["public"]["Enums"]["relation"][]
          specific_values?: number[] | null
          status?: Database["public"]["Enums"]["wish_status"]
          text: string
          type: Database["public"]["Enums"]["wish_type"]
          updated_at?: string | null
        }
        Update: {
          age_groups?: Database["public"]["Enums"]["age_group"][]
          belated?: boolean
          created_at?: string | null
          created_by?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          language?: Database["public"]["Enums"]["language"]
          length?: string
          relations?: Database["public"]["Enums"]["relation"][]
          specific_values?: number[] | null
          status?: Database["public"]["Enums"]["wish_status"]
          text?: string
          type?: Database["public"]["Enums"]["wish_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_wish_id: {
        Args: { wish_language: Database["public"]["Enums"]["language"] }
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      search_wishes: {
        Args: {
          search_term?: string
          filter_language?: Database["public"]["Enums"]["language"]
          filter_status?: Database["public"]["Enums"]["wish_status"]
          filter_event_type?: Database["public"]["Enums"]["event_type"]
          filter_relations?: Database["public"]["Enums"]["relation"][]
          filter_age_groups?: Database["public"]["Enums"]["age_group"][]
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          type: Database["public"]["Enums"]["wish_type"]
          event_type: Database["public"]["Enums"]["event_type"]
          relations: Database["public"]["Enums"]["relation"][]
          age_groups: Database["public"]["Enums"]["age_group"][]
          specific_values: number[]
          text: string
          belated: string
          status: Database["public"]["Enums"]["wish_status"]
          language: Database["public"]["Enums"]["language"]
          created_at: string
          updated_at: string
          created_by: string
          creator_name: string
        }[]
      }
      validate_status_transition: {
        Args: {
          current_status: Database["public"]["Enums"]["wish_status"]
          new_status: Database["public"]["Enums"]["wish_status"]
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      age_group: "all" | "young" | "middle" | "senior"
      event_type: "birthday" | "anniversary" | "custom"
      language: "de" | "en"
      relation: "friend" | "family" | "partner" | "colleague"
      user_role: "Redakteur" | "Administrator"
      wish_status: "Entwurf" | "Zur Freigabe" | "Freigegeben" | "Archiviert"
      wish_type: "normal" | "herzlich" | "humorvoll"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}