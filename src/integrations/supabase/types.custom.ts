
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CustomDatabase = {
  public: {
    Tables: {
      tone_preferences: {
        Row: {
          created_at: string
          description: string
          example_tweets: string[]
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          example_tweets?: string[]
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          example_tweets?: string[]
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          user_id: string
          original_filename: string | null
          original_url: string | null
          clip_url: string | null
          status: string
          inserted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_filename?: string | null
          original_url?: string | null
          clip_url?: string | null
          status?: string
          inserted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_filename?: string | null
          original_url?: string | null
          clip_url?: string | null
          status?: string
          inserted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (CustomDatabase["public"]["Tables"] & CustomDatabase["public"]["Views"])
    | { schema: keyof CustomDatabase },
  TableName extends PublicTableNameOrOptions extends { schema: keyof CustomDatabase }
    ? keyof (CustomDatabase[PublicTableNameOrOptions["schema"]]["Tables"] &
        CustomDatabase[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof CustomDatabase }
  ? (CustomDatabase[PublicTableNameOrOptions["schema"]]["Tables"] &
      CustomDatabase[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (CustomDatabase["public"]["Tables"] &
      CustomDatabase["public"]["Views"])
  ? (CustomDatabase["public"]["Tables"] &
      CustomDatabase["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never
