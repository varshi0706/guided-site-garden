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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      allocations: {
        Row: {
          active: boolean
          allocated_at: string
          ended_at: string | null
          id: string
          room_id: string
          student_id: string
        }
        Insert: {
          active?: boolean
          allocated_at?: string
          ended_at?: string | null
          id?: string
          room_id: string
          student_id: string
        }
        Update: {
          active?: boolean
          allocated_at?: string
          ended_at?: string | null
          id?: string
          room_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          desired_hall_id: string | null
          id: string
          kind: string
          reason: string
          status: Database["public"]["Enums"]["req_status"]
          student_id: string
          swap_with_roll_no: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          desired_hall_id?: string | null
          id?: string
          kind: string
          reason?: string
          status?: Database["public"]["Enums"]["req_status"]
          student_id: string
          swap_with_roll_no?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          desired_hall_id?: string | null
          id?: string
          kind?: string
          reason?: string
          status?: Database["public"]["Enums"]["req_status"]
          student_id?: string
          swap_with_roll_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_desired_hall_id_fkey"
            columns: ["desired_hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_note: string | null
          category: string
          created_at: string
          description: string
          hall_id: string | null
          id: string
          status: string
          student_id: string
          title: string
        }
        Insert: {
          admin_note?: string | null
          category: string
          created_at?: string
          description?: string
          hall_id?: string | null
          id?: string
          status?: string
          student_id: string
          title: string
        }
        Update: {
          admin_note?: string | null
          category?: string
          created_at?: string
          description?: string
          hall_id?: string | null
          id?: string
          status?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dues: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          id: string
          paid: boolean
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date: string
          id?: string
          paid?: boolean
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          paid?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_bookings: {
        Row: {
          admin_note: string | null
          created_at: string
          end_date: string
          guest_name: string
          hall_id: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["req_status"]
          student_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          end_date: string
          guest_name: string
          hall_id: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["req_status"]
          student_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          end_date?: string
          guest_name?: string
          hall_id?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["req_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_bookings_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hall_bookings: {
        Row: {
          admin_note: string | null
          attendance: number
          booking_date: string
          created_at: string
          end_time: string
          hall_id: string
          id: string
          purpose: string
          start_time: string
          status: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          attendance?: number
          booking_date: string
          created_at?: string
          end_time: string
          hall_id: string
          id?: string
          purpose: string
          start_time: string
          status?: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          attendance?: number
          booking_date?: string
          created_at?: string
          end_time?: string
          hall_id?: string
          id?: string
          purpose?: string
          start_time?: string
          status?: Database["public"]["Enums"]["req_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hall_bookings_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hall_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      halls: {
        Row: {
          capacity: number
          created_at: string
          description: string
          guest_rooms: number
          id: string
          is_active: boolean
          kind: string
          location: string
          mess_fee: number
          name: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string
          guest_rooms?: number
          id?: string
          is_active?: boolean
          kind?: string
          location?: string
          mess_fee?: number
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string
          guest_rooms?: number
          id?: string
          is_active?: boolean
          kind?: string
          location?: string
          mess_fee?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          category: string
          created_at: string
          full_name: string
          id: string
          phone: string | null
          roll_no: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          roll_no?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          roll_no?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          hall_id: string
          id: string
          room_no: string
          room_type: string
        }
        Insert: {
          capacity?: number
          hall_id: string
          id?: string
          room_no: string
          room_type?: string
        }
        Update: {
          capacity?: number
          hall_id?: string
          id?: string
          room_no?: string
          room_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          hall_id: string | null
          id: string
          is_recruiting: boolean
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          hall_id?: string | null
          id?: string
          is_recruiting?: boolean
          name: string
          phone?: string | null
          role: string
        }
        Update: {
          created_at?: string
          hall_id?: string | null
          id?: string
          is_recruiting?: boolean
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_hall_change: {
        Args: { _request_id: string; _room_id: string }
        Returns: undefined
      }
      approve_swap: { Args: { _request_id: string }; Returns: undefined }
      booked_slots: {
        Args: { _date: string; _hall_id: string }
        Returns: {
          end_time: string
          start_time: string
        }[]
      }
      hall_vacancy: {
        Args: never
        Returns: {
          hall_id: string
          occupied: number
          total_beds: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
      req_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "student"],
      req_status: ["pending", "approved", "rejected"],
    },
  },
} as const
