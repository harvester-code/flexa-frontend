// 참고: https://supabase.com/blog/react-query-nextjs-app-router-cache-helpers
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      certification: {
        Row: {
          cert_number: number;
          created_at: string;
          email: string;
          expired_at: string;
          id: string;
        };
        Insert: {
          cert_number: number;
          created_at: string;
          email: string;
          expired_at: string;
          id: string;
        };
        Update: {
          cert_number?: number;
          created_at?: string;
          email?: string;
          expired_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          description: string | null;
          group_name: string;
          id: number;
          is_active: boolean;
          master_scenario_id: string | null;
          timezone: string | null;
        };
        Insert: {
          description?: string | null;
          group_name: string;
          id?: number;
          is_active?: boolean;
          master_scenario_id?: string | null;
          timezone?: string | null;
        };
        Update: {
          description?: string | null;
          group_name?: string;
          id?: number;
          is_active?: boolean;
          master_scenario_id?: string | null;
          timezone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: '\bairports_master_scenario_id_fkey';
            columns: ['master_scenario_id'];
            isOneToOne: false;
            referencedRelation: 'simulation_scenario';
            referencedColumns: ['id'];
          },
        ];
      };
      operation_setting: {
        Row: {
          group_id: number;
          id: number;
          processing_procedure: Json | null;
          terminal_layout: Json | null;
          terminal_layout_image_url: string | null;
          terminal_name: string;
          terminal_process: Json;
        };
        Insert: {
          group_id: number;
          id?: number;
          processing_procedure?: Json | null;
          terminal_layout?: Json | null;
          terminal_layout_image_url?: string | null;
          terminal_name: string;
          terminal_process: Json;
        };
        Update: {
          group_id?: number;
          id?: number;
          processing_procedure?: Json | null;
          terminal_layout?: Json | null;
          terminal_layout_image_url?: string | null;
          terminal_name?: string;
          terminal_process?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'operation_setting_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      roles: {
        Row: {
          description: string | null;
          id: number;
          is_active: boolean;
          role_name: string;
        };
        Insert: {
          description?: string | null;
          id?: number;
          is_active?: boolean;
          role_name: string;
        };
        Update: {
          description?: string | null;
          id?: number;
          is_active?: boolean;
          role_name?: string;
        };
        Relationships: [];
      };
      scenario_metadata: {
        Row: {
          facility_conn: Json | null;
          facility_info: Json | null;
          flight_sch: Json | null;
          history: Json | null;
          id: number;
          overview: Json | null;
          passenger_attr: Json | null;
          passenger_sch: Json | null;
          simulation_id: string;
        };
        Insert: {
          facility_conn?: Json | null;
          facility_info?: Json | null;
          flight_sch?: Json | null;
          history?: Json | null;
          id?: number;
          overview?: Json | null;
          passenger_attr?: Json | null;
          passenger_sch?: Json | null;
          simulation_id: string;
        };
        Update: {
          facility_conn?: Json | null;
          facility_info?: Json | null;
          flight_sch?: Json | null;
          history?: Json | null;
          id?: number;
          overview?: Json | null;
          passenger_attr?: Json | null;
          passenger_sch?: Json | null;
          simulation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'simulation_metadata_simulation_id_fkey';
            columns: ['simulation_id'];
            isOneToOne: false;
            referencedRelation: 'simulation_scenario';
            referencedColumns: ['id'];
          },
        ];
      };
      simulation_scenario: {
        Row: {
          created_at: string;
          editor: string;
          id: string;
          is_active: boolean;
          memo: string | null;
          simulation_date: string | null;
          simulation_name: string;
          simulation_url: string | null;
          size: number | null;
          terminal: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          editor: string;
          id: string;
          is_active?: boolean;
          memo?: string | null;
          simulation_date?: string | null;
          simulation_name: string;
          simulation_url?: string | null;
          size?: number | null;
          terminal: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          editor?: string;
          id?: string;
          is_active?: boolean;
          memo?: string | null;
          simulation_date?: string | null;
          simulation_name?: string;
          simulation_url?: string | null;
          size?: number | null;
          terminal?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'simulation_scenario_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_info';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_access_request: {
        Row: {
          admin_email: string;
          created_at: string;
          id: string;
          is_checked: boolean;
          request_mg: string;
          user_email: string;
        };
        Insert: {
          admin_email: string;
          created_at: string;
          id: string;
          is_checked?: boolean;
          request_mg: string;
          user_email?: string;
        };
        Update: {
          admin_email?: string;
          created_at?: string;
          id?: string;
          is_checked?: boolean;
          request_mg?: string;
          user_email?: string;
        };
        Relationships: [];
      };
      user_info: {
        Row: {
          bio: string | null;
          created_at: string;
          email: string;
          first_name: string;
          group_id: number | null;
          is_active: boolean;
          last_name: string;
          position: string | null;
          profile_image_url: string | null;
          role_id: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          group_id?: number | null;
          is_active?: boolean;
          last_name: string;
          position?: string | null;
          profile_image_url?: string | null;
          role_id?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          group_id?: number | null;
          is_active?: boolean;
          last_name?: string;
          position?: string | null;
          profile_image_url?: string | null;
          role_id?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_info_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_info_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_login_history: {
        Row: {
          id: string;
          ip_address: string | null;
          logged_in_at: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          ip_address?: string | null;
          logged_in_at?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          ip_address?: string | null;
          logged_in_at?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      kill_session: {
        Args: {
          target_session_id: string;
        };
        Returns: undefined;
      };
      parse_device_info: {
        Args: {
          user_agent: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes'] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
