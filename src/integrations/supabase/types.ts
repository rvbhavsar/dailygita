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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          chapter_number: number
          chapter_summary: string | null
          chapter_summary_hindi: string | null
          created_at: string
          id: number
          name: string
          name_translated: string | null
          name_transliterated: string | null
          verses_count: number
        }
        Insert: {
          chapter_number: number
          chapter_summary?: string | null
          chapter_summary_hindi?: string | null
          created_at?: string
          id?: number
          name: string
          name_translated?: string | null
          name_transliterated?: string | null
          verses_count?: number
        }
        Update: {
          chapter_number?: number
          chapter_summary?: string | null
          chapter_summary_hindi?: string | null
          created_at?: string
          id?: number
          name?: string
          name_translated?: string | null
          name_transliterated?: string | null
          verses_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          daily_verse_enabled: boolean
          display_name: string | null
          id: string
          is_onboarded: boolean
          marital_status: string | null
          profession: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          daily_verse_enabled?: boolean
          display_name?: string | null
          id?: string
          is_onboarded?: boolean
          marital_status?: string | null
          profession?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          daily_verse_enabled?: boolean
          display_name?: string | null
          id?: string
          is_onboarded?: boolean
          marital_status?: string | null
          profession?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_insights: {
        Row: {
          challenge_id: string | null
          chapter_number: number
          created_at: string
          description: string
          id: string
          title: string
          user_id: string
          verse_id: string
          verse_number: number
        }
        Insert: {
          challenge_id?: string | null
          chapter_number: number
          created_at?: string
          description: string
          id?: string
          title: string
          user_id: string
          verse_id: string
          verse_number: number
        }
        Update: {
          challenge_id?: string | null
          chapter_number?: number
          created_at?: string
          description?: string
          id?: string
          title?: string
          user_id?: string
          verse_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      translations: {
        Row: {
          author_name: string
          created_at: string
          description: string
          id: number
          verse_id: number
        }
        Insert: {
          author_name: string
          created_at?: string
          description: string
          id?: number
          verse_id: number
        }
        Update: {
          author_name?: string
          created_at?: string
          description?: string
          id?: number
          verse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "translations_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["verse_id"]
          },
        ]
      }
      verse_audio: {
        Row: {
          chapter_number: number
          created_at: string
          duration_seconds: number | null
          file_size: number | null
          id: string
          storage_path: string
          verse_number: number
        }
        Insert: {
          chapter_number: number
          created_at?: string
          duration_seconds?: number | null
          file_size?: number | null
          id?: string
          storage_path: string
          verse_number: number
        }
        Update: {
          chapter_number?: number
          created_at?: string
          duration_seconds?: number | null
          file_size?: number | null
          id?: string
          storage_path?: string
          verse_number?: number
        }
        Relationships: []
      }
      verse_challenges: {
        Row: {
          ai_summary: string | null
          analyzed_at: string
          challenges: string[]
          chapter_number: number
          id: string
          verse_number: number
        }
        Insert: {
          ai_summary?: string | null
          analyzed_at?: string
          challenges?: string[]
          chapter_number: number
          id?: string
          verse_number: number
        }
        Update: {
          ai_summary?: string | null
          analyzed_at?: string
          challenges?: string[]
          chapter_number?: number
          id?: string
          verse_number?: number
        }
        Relationships: []
      }
      verses: {
        Row: {
          chapter_number: number
          created_at: string
          id: number
          text: string
          verse_id: number
          verse_number: number
          word_meanings: string | null
        }
        Insert: {
          chapter_number: number
          created_at?: string
          id?: number
          text: string
          verse_id: number
          verse_number: number
          word_meanings?: string | null
        }
        Update: {
          chapter_number?: number
          created_at?: string
          id?: number
          text?: string
          verse_id?: number
          verse_number?: number
          word_meanings?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verses_chapter_number_fkey"
            columns: ["chapter_number"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["chapter_number"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
