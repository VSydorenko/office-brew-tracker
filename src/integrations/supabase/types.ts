export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      coffee_flavors: {
        Row: {
          coffee_type_id: string
          created_at: string
          flavor_id: string
          id: string
        }
        Insert: {
          coffee_type_id: string
          created_at?: string
          flavor_id: string
          id?: string
        }
        Update: {
          coffee_type_id?: string
          created_at?: string
          flavor_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coffee_flavors_coffee_type_id_fkey"
            columns: ["coffee_type_id"]
            isOneToOne: false
            referencedRelation: "coffee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_flavors_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "flavors"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_types: {
        Row: {
          brand: string | null
          brand_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          origin_id: string | null
          package_size: string | null
          processing_method_id: string | null
          updated_at: string
          variety_id: string | null
        }
        Insert: {
          brand?: string | null
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          origin_id?: string | null
          package_size?: string | null
          processing_method_id?: string | null
          updated_at?: string
          variety_id?: string | null
        }
        Update: {
          brand?: string | null
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          origin_id?: string | null
          package_size?: string | null
          processing_method_id?: string | null
          updated_at?: string
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coffee_types_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_types_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_types_processing_method_id_fkey"
            columns: ["processing_method_id"]
            isOneToOne: false
            referencedRelation: "processing_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_types_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "coffee_varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_varieties: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      consumption_rule_users: {
        Row: {
          created_at: string
          id: string
          percentage: number
          rule_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          percentage: number
          rule_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          percentage?: number
          rule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumption_rule_users_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "consumption_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumption_rule_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consumption_rules: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      distribution_template_users: {
        Row: {
          created_at: string
          id: string
          percentage: number | null
          shares: number | null
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          percentage?: number | null
          shares?: number | null
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          percentage?: number | null
          shares?: number | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_template_users_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "distribution_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_template_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_templates: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          is_active: boolean
          name: string
          total_shares: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          id?: string
          is_active?: boolean
          name: string
          total_shares?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          name?: string
          total_shares?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      flavors: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      origins: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      processing_methods: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_path: string | null
          avatar_url: string | null
          card_holder_name: string | null
          card_number: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          card_holder_name?: string | null
          card_number?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          card_holder_name?: string | null
          card_number?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_amount_changes: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string
          id: string
          new_amount: number
          old_amount: number
          purchase_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string
          id?: string
          new_amount: number
          old_amount: number
          purchase_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          new_amount?: number
          old_amount?: number
          purchase_id?: string
        }
        Relationships: []
      }
      purchase_distributions: {
        Row: {
          adjusted_amount: number | null
          adjustment_type: string | null
          calculated_amount: number
          created_at: string
          id: string
          is_paid: boolean
          notes: string | null
          paid_at: string | null
          percentage: number | null
          previous_amount: number | null
          purchase_id: string
          shares: number | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          adjusted_amount?: number | null
          adjustment_type?: string | null
          calculated_amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          previous_amount?: number | null
          purchase_id: string
          shares?: number | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          adjusted_amount?: number | null
          adjustment_type?: string | null
          calculated_amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          previous_amount?: number | null
          purchase_id?: string
          shares?: number | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_distributions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_distributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          coffee_type_id: string
          created_at: string
          id: string
          purchase_id: string
          quantity: number
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          coffee_type_id: string
          created_at?: string
          id?: string
          purchase_id: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          coffee_type_id?: string
          created_at?: string
          id?: string
          purchase_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_coffee_type_id_fkey"
            columns: ["coffee_type_id"]
            isOneToOne: false
            referencedRelation: "coffee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          buyer_id: string
          created_at: string
          date: string
          distribution_status: string | null
          driver_id: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          original_total_amount: number | null
          template_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          date: string
          distribution_status?: string | null
          driver_id?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          original_total_amount?: number | null
          template_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          date?: string
          distribution_status?: string | null
          driver_id?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          original_total_amount?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "distribution_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_kpis: {
        Args: { end_date: string; start_date: string }
        Returns: {
          active_users: number
          average_check: number
          my_unpaid_total: number
          purchases_count: number
          total_spent: number
          unpaid_total: number
        }[]
      }
      get_last_purchase_template_id:
        | { Args: never; Returns: string }
        | { Args: { buyer_user_id: string }; Returns: string }
      get_latest_coffee_price: { Args: { coffee_id: string }; Returns: number }
      get_profiles_for_picker: {
        Args: { limit_n?: number; offset_n?: number; search?: string }
        Returns: {
          avatar_path: string
          avatar_url: string
          id: string
          name: string
        }[]
      }
      get_recent_purchases_enriched: {
        Args: { limit_n?: number }
        Returns: {
          amount_paid: number
          amount_unpaid: number
          buyer_name: string
          date: string
          distribution_status: string
          id: string
          paid_count: number
          participants_count: number
          total_amount: number
          unpaid_count: number
        }[]
      }
      get_spending_timeseries: {
        Args: { end_date: string; start_date: string }
        Returns: {
          month_start: string
          purchases_count: number
          total_spent: number
        }[]
      }
      get_status_breakdown: {
        Args: { end_date: string; start_date: string }
        Returns: {
          cnt: number
          status: string
        }[]
      }
      get_top_coffees_by_qty: {
        Args: { end_date: string; limit_n?: number; start_date: string }
        Returns: {
          coffee_name: string
          coffee_type_id: string
          total_qty: number
        }[]
      }
      get_top_drivers_with_monthly: {
        Args: { end_date: string; limit_n?: number; start_date: string }
        Returns: {
          driver_id: string
          driver_name: string
          month_start: string
          total_trips: number
          trips: number
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      user_status: "pending" | "approved" | "rejected" | "blocked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      user_status: ["pending", "approved", "rejected", "blocked"],
    },
  },
} as const
