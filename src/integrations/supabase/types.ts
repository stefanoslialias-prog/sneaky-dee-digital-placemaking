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
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string
          discount: string
          expires_at: string
          id: string
          image_url: string | null
          issued_at: string | null
          pass_payload: Json | null
          pass_type: string | null
          passkit_campaign_id: string | null
          passkit_offer_id: string | null
          passkit_template_id: string | null
          title: string
          user_id: string | null
          wallet_compatible: boolean | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description: string
          discount: string
          expires_at: string
          id?: string
          image_url?: string | null
          issued_at?: string | null
          pass_payload?: Json | null
          pass_type?: string | null
          passkit_campaign_id?: string | null
          passkit_offer_id?: string | null
          passkit_template_id?: string | null
          title: string
          user_id?: string | null
          wallet_compatible?: boolean | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string
          discount?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          issued_at?: string | null
          pass_payload?: Json | null
          pass_type?: string | null
          passkit_campaign_id?: string | null
          passkit_offer_id?: string | null
          passkit_template_id?: string | null
          title?: string
          user_id?: string | null
          wallet_compatible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          first_seen_at: string
          id: string
          last_seen_at: string
          mac_address: string
          opt_in: boolean
          user_id: string | null
        }
        Insert: {
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          mac_address: string
          opt_in?: boolean
          user_id?: string | null
        }
        Update: {
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          mac_address?: string
          opt_in?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      location_traffic: {
        Row: {
          device_count: number
          id: string
          location_id: string
          timestamp: string
        }
        Insert: {
          device_count: number
          id?: string
          location_id: string
          timestamp?: string
        }
        Update: {
          device_count?: number
          id?: string
          location_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_traffic_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wifi_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          id: string
          order: number
          text: string
          type: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          order: number
          text: string
          type?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          order?: number
          text?: string
          type?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          answer: string
          comment: string | null
          created_at: string
          id: string
          location_id: string | null
          question_id: string
          session_id: string
        }
        Insert: {
          answer: string
          comment?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          question_id: string
          session_id: string
        }
        Update: {
          answer?: string
          comment?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          question_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupons: {
        Row: {
          claimed_at: string
          coupon_id: string
          device_id: string | null
          email: string | null
          id: string
          name: string | null
          redeemed_at: string | null
          user_id: string | null
        }
        Insert: {
          claimed_at?: string
          coupon_id: string
          device_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          redeemed_at?: string | null
          user_id?: string | null
        }
        Update: {
          claimed_at?: string
          coupon_id?: string
          device_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          redeemed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_emails: {
        Row: {
          device_id: string | null
          email_address: string
          email_content: string
          id: string
          retries: number
          sent_at: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          device_id?: string | null
          email_address: string
          email_content: string
          id?: string
          retries?: number
          sent_at?: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          device_id?: string | null
          email_address?: string
          email_content?: string
          id?: string
          retries?: number
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          id: string
          interaction_timestamp: string
          ip_address: string
          question_id: string
        }
        Insert: {
          id?: string
          interaction_timestamp?: string
          ip_address: string
          question_id: string
        }
        Update: {
          id?: string
          interaction_timestamp?: string
          ip_address?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      "user_tab;es": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          claimed_at: string
          coupon_id: string
          device_id: string | null
          id: string
          pass_url: string | null
          passkit_coupon_id: string | null
          passkit_status: string | null
          platform: string | null
          redeemed_at: string | null
          user_id: string | null
        }
        Insert: {
          claimed_at?: string
          coupon_id: string
          device_id?: string | null
          id?: string
          pass_url?: string | null
          passkit_coupon_id?: string | null
          passkit_status?: string | null
          platform?: string | null
          redeemed_at?: string | null
          user_id?: string | null
        }
        Update: {
          claimed_at?: string
          coupon_id?: string
          device_id?: string | null
          id?: string
          pass_url?: string | null
          passkit_coupon_id?: string | null
          passkit_status?: string | null
          platform?: string | null
          redeemed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
          name: string
          preferences: string | null
          signed_up_at: string | null
        }
        Insert: {
          email: string
          id?: string
          name: string
          preferences?: string | null
          signed_up_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          name?: string
          preferences?: string | null
          signed_up_at?: string | null
        }
        Relationships: []
      }
      wifi_locations: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      location_analytics: {
        Row: {
          concerned_count: number | null
          first_response: string | null
          happy_count: number | null
          last_response: string | null
          location_code: string | null
          neutral_count: number | null
          total_responses: number | null
        }
        Relationships: []
      }
      sentiment_summary: {
        Row: {
          concerned_count: number | null
          happy_count: number | null
          neutral_count: number | null
          survey_date: number | null
          total_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_coupon: {
        Args: {
          p_coupon_id: string
          p_device_id?: string
          p_email?: string
          p_name?: string
        }
        Returns: Json
      }
      get_random_question_for_ip: {
        Args: { p_ip_address: string }
        Returns: {
          id: string
          text: string
          type: string
          category: string
        }[]
      }
      has_role: {
        Args: { user_id: string; required_role: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      record_question_interaction: {
        Args: { p_ip_address: string; p_question_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
