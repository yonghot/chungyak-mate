/**
 * Supabase Database 타입 정의
 *
 * 실제 운영에서는 `supabase gen types typescript`로 자동 생성하되,
 * MVP 단계에서는 PRD 스키마 기반으로 수동 정의한다.
 */

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export type SubscriptionType = 'savings' | 'deposit' | 'housing';

export type ComplexStatus = 'upcoming' | 'open' | 'closed' | 'completed';

export type SupplyType =
  | 'general'
  | 'newlywed'
  | 'first_life'
  | 'multi_child'
  | 'elderly_parent'
  | 'institutional'
  | 'relocation';

export type EligibilityStatus = 'eligible' | 'ineligible' | 'conditional';

export type NotificationType = 'recommendation' | 'deadline' | 'result' | 'system';

export type SyncLogStatus = 'running' | 'success' | 'partial' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          birth_date: string;
          phone: string | null;
          is_household_head: boolean;
          marital_status: MaritalStatus;
          marriage_date: string | null;
          dependents_count: number;
          homeless_start_date: string | null;
          total_assets_krw: number | null;
          monthly_income_krw: number | null;
          car_value_krw: number | null;
          subscription_type: SubscriptionType | null;
          subscription_start_date: string | null;
          deposit_count: number | null;
          has_won_before: boolean;
          won_date: string | null;
          profile_completion: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          birth_date: string;
          phone?: string | null;
          is_household_head?: boolean;
          marital_status: MaritalStatus;
          marriage_date?: string | null;
          dependents_count?: number;
          homeless_start_date?: string | null;
          total_assets_krw?: number | null;
          monthly_income_krw?: number | null;
          car_value_krw?: number | null;
          subscription_type?: SubscriptionType | null;
          subscription_start_date?: string | null;
          deposit_count?: number | null;
          has_won_before?: boolean;
          won_date?: string | null;
          profile_completion?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          birth_date?: string;
          phone?: string | null;
          is_household_head?: boolean;
          marital_status?: MaritalStatus;
          marriage_date?: string | null;
          dependents_count?: number;
          homeless_start_date?: string | null;
          total_assets_krw?: number | null;
          monthly_income_krw?: number | null;
          car_value_krw?: number | null;
          subscription_type?: SubscriptionType | null;
          subscription_start_date?: string | null;
          deposit_count?: number | null;
          has_won_before?: boolean;
          won_date?: string | null;
          profile_completion?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      complexes: {
        Row: {
          id: string;
          name: string;
          region: string;
          district: string;
          address: string | null;
          developer: string | null;
          constructor: string | null;
          total_units: number | null;
          announcement_date: string | null;
          subscription_start: string | null;
          subscription_end: string | null;
          winner_date: string | null;
          status: ComplexStatus;
          source_url: string | null;
          raw_data: Record<string, unknown> | null;
          external_id: string | null;
          move_in_date: string | null;
          special_supply_start: string | null;
          special_supply_end: string | null;
          contract_start: string | null;
          contract_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          region: string;
          district: string;
          address?: string | null;
          developer?: string | null;
          constructor?: string | null;
          total_units?: number | null;
          announcement_date?: string | null;
          subscription_start?: string | null;
          subscription_end?: string | null;
          winner_date?: string | null;
          status?: ComplexStatus;
          source_url?: string | null;
          raw_data?: Record<string, unknown> | null;
          external_id?: string | null;
          move_in_date?: string | null;
          special_supply_start?: string | null;
          special_supply_end?: string | null;
          contract_start?: string | null;
          contract_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          region?: string;
          district?: string;
          address?: string | null;
          developer?: string | null;
          constructor?: string | null;
          total_units?: number | null;
          announcement_date?: string | null;
          subscription_start?: string | null;
          subscription_end?: string | null;
          winner_date?: string | null;
          status?: ComplexStatus;
          source_url?: string | null;
          raw_data?: Record<string, unknown> | null;
          external_id?: string | null;
          move_in_date?: string | null;
          special_supply_start?: string | null;
          special_supply_end?: string | null;
          contract_start?: string | null;
          contract_end?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      supply_types: {
        Row: {
          id: string;
          complex_id: string;
          type: SupplyType;
          unit_count: number;
          area_sqm: number | null;
          price_krw: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complex_id: string;
          type: SupplyType;
          unit_count: number;
          area_sqm?: number | null;
          price_krw?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          complex_id?: string;
          type?: SupplyType;
          unit_count?: number;
          area_sqm?: number | null;
          price_krw?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'supply_types_complex_id_fkey';
            columns: ['complex_id'];
            referencedRelation: 'complexes';
            referencedColumns: ['id'];
          },
        ];
      };
      eligibility_rules: {
        Row: {
          id: string;
          supply_type: SupplyType;
          rule_key: string;
          rule_name: string;
          condition: Record<string, unknown>;
          law_reference: string | null;
          priority: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supply_type: SupplyType;
          rule_key: string;
          rule_name: string;
          condition: Record<string, unknown>;
          law_reference?: string | null;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supply_type?: SupplyType;
          rule_key?: string;
          rule_name?: string;
          condition?: Record<string, unknown>;
          law_reference?: string | null;
          priority?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      eligibility_results: {
        Row: {
          id: string;
          profile_id: string;
          complex_id: string;
          supply_type: SupplyType;
          result: EligibilityStatus;
          score: number | null;
          reasons: EligibilityReason[];
          evaluated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          complex_id: string;
          supply_type: SupplyType;
          result: EligibilityStatus;
          score?: number | null;
          reasons?: EligibilityReason[];
          evaluated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          complex_id?: string;
          supply_type?: SupplyType;
          result?: EligibilityStatus;
          score?: number | null;
          reasons?: EligibilityReason[];
          evaluated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'eligibility_results_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'eligibility_results_complex_id_fkey';
            columns: ['complex_id'];
            referencedRelation: 'complexes';
            referencedColumns: ['id'];
          },
        ];
      };
      bookmarks: {
        Row: {
          id: string;
          profile_id: string;
          complex_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          complex_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          complex_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookmarks_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookmarks_complex_id_fkey';
            columns: ['complex_id'];
            referencedRelation: 'complexes';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data: Record<string, unknown>;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data?: Record<string, unknown>;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string;
          data?: Record<string, unknown>;
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sync_logs: {
        Row: {
          id: string;
          started_at: string;
          finished_at: string | null;
          status: SyncLogStatus;
          total_fetched: number;
          inserted: number;
          updated: number;
          skipped: number;
          failed: number;
          error_detail: Array<{ external_id: string; message: string }>;
          created_at: string;
        };
        Insert: {
          id?: string;
          started_at?: string;
          finished_at?: string | null;
          status: SyncLogStatus;
          total_fetched?: number;
          inserted?: number;
          updated?: number;
          skipped?: number;
          failed?: number;
          error_detail?: Array<{ external_id: string; message: string }>;
          created_at?: string;
        };
        Update: {
          id?: string;
          started_at?: string;
          finished_at?: string | null;
          status?: SyncLogStatus;
          total_fetched?: number;
          inserted?: number;
          updated?: number;
          skipped?: number;
          failed?: number;
          error_detail?: Array<{ external_id: string; message: string }>;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      marital_status: MaritalStatus;
      subscription_type: SubscriptionType;
      complex_status: ComplexStatus;
      supply_type: SupplyType;
      eligibility_status: EligibilityStatus;
      notification_type: NotificationType;
      sync_log_status: SyncLogStatus;
    };
  };
}

/** 판정 결과의 근거 항목 */
export interface EligibilityReason {
  rule_key: string;
  rule_name: string;
  passed: boolean;
  message: string;
  law_reference?: string;
}

/** Row 타입 shorthand */
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Complex = Database['public']['Tables']['complexes']['Row'];
export type ComplexInsert = Database['public']['Tables']['complexes']['Insert'];
export type ComplexUpdate = Database['public']['Tables']['complexes']['Update'];

export type SupplyTypeRow = Database['public']['Tables']['supply_types']['Row'];
export type SupplyTypeInsert = Database['public']['Tables']['supply_types']['Insert'];

export type EligibilityRule = Database['public']['Tables']['eligibility_rules']['Row'];
export type EligibilityRuleInsert = Database['public']['Tables']['eligibility_rules']['Insert'];

export type EligibilityResult = Database['public']['Tables']['eligibility_results']['Row'];
export type EligibilityResultInsert = Database['public']['Tables']['eligibility_results']['Insert'];

export type Bookmark = Database['public']['Tables']['bookmarks']['Row'];
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export type SyncLog = Database['public']['Tables']['sync_logs']['Row'];
export type SyncLogInsert = Database['public']['Tables']['sync_logs']['Insert'];
