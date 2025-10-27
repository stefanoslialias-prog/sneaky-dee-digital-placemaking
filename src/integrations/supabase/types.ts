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
      coupon_claims: {
        Row: {
          claimed_at: string | null
          coupon_id: string
          device_id: string
          expires_at: string | null
          id: string
          metadata: Json | null
          redeemed: boolean | null
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_code: string
          referred_by: string | null
          share_token: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          claimed_at?: string | null
          coupon_id: string
          device_id: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          redeemed?: boolean | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_code: string
          referred_by?: string | null
          share_token?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          claimed_at?: string | null
          coupon_id?: string
          device_id?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          redeemed?: boolean | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_code?: string
          referred_by?: string | null
          share_token?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_claims_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_claims_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_claims_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "coupon_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string | null
          description: string | null
          discount: string
          expires_at: string | null
          id: string
          partner_id: string | null
          pdf_url: string | null
          share_enabled: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount: string
          expires_at?: string | null
          id?: string
          partner_id?: string | null
          pdf_url?: string | null
          share_enabled?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount?: string
          expires_at?: string | null
          id?: string
          partner_id?: string | null
          pdf_url?: string | null
          share_enabled?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_events: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          metadata: Json | null
          session_id: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          metadata?: Json | null
          session_id: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_events_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_events_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons_public"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          client_name: string | null
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          parent_location_id: string | null
          postal_code: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          parent_location_id?: string | null
          postal_code?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          parent_location_id?: string | null
          postal_code?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_staff: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          partner_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          partner_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          partner_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_staff_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          options: Json | null
          order: number
          partner_id: string | null
          text: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order?: number
          partner_id?: string | null
          text: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order?: number
          partner_id?: string | null
          text?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answer: string | null
          comment: string | null
          created_at: string | null
          id: string
          location_id: string | null
          partner_id: string | null
          question_id: string | null
          session_id: string | null
        }
        Insert: {
          answer?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          partner_id?: string | null
          question_id?: string | null
          session_id?: string | null
        }
        Update: {
          answer?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          partner_id?: string | null
          question_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_emails: {
        Row: {
          created_at: string | null
          device_id: string
          email_address: string
          email_content: string
          id: string
          retries: number | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          email_address: string
          email_content: string
          id?: string
          retries?: number | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          email_address?: string
          email_content?: string
          id?: string
          retries?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wifi_locations: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      coupons_public: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          discount: string | null
          expires_at: string | null
          id: string | null
          partner_id: string | null
          title: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount?: string | null
          expires_at?: string | null
          id?: string | null
          partner_id?: string | null
          title?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount?: string | null
          expires_at?: string | null
          id?: string | null
          partner_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      claim_coupon: {
        Args: { p_coupon_id: string; p_device_id: string; p_session_id: string }
        Returns: string
      }
      claim_coupon_with_share: {
        Args: {
          p_coupon_id: string
          p_device_id: string
          p_referred_by_token?: string
          p_user_email?: string
          p_user_name?: string
        }
        Returns: Json
      }
      get_location_analytics: {
        Args: { location_slug: string }
        Returns: {
          negative_sentiment: number
          neutral_sentiment: number
          positive_sentiment: number
          total_responses: number
          total_visits: number
        }[]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Returns: boolean
      }
      insert_survey_response: {
        Args: {
          p_answer: string
          p_comment?: string
          p_location_id?: string
          p_partner_id?: string
          p_question_id: string
          p_session_id: string
        }
        Returns: string
      }
      redeem_coupon_qr: {
        Args: { p_redemption_code: string; p_staff_user_id: string }
        Returns: Json
      }
      update_response_comment:
        | {
            Args: { p_comment: string; p_response_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_comment: string
              p_response_id: string
              p_session_id: string
            }
            Returns: undefined
          }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
