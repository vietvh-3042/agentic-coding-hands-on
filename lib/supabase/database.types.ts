export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      event_settings: {
        Row: {
          id: number;
          launch_at: string;
          special_day_end: string | null;
          special_day_start: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          launch_at: string;
          special_day_end?: string | null;
          special_day_start?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          launch_at?: string;
          special_day_end?: string | null;
          special_day_start?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      hashtags: {
        Row: {
          created_at: string;
          id: number;
          name: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: never;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: never;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      kudo_hashtags: {
        Row: {
          hashtag_id: number;
          kudo_id: string;
        };
        Insert: {
          hashtag_id: number;
          kudo_id: string;
        };
        Update: {
          hashtag_id?: number;
          kudo_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kudo_hashtags_hashtag_id_fkey";
            columns: ["hashtag_id"];
            isOneToOne: false;
            referencedRelation: "hashtags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudo_hashtags_kudo_id_fkey";
            columns: ["kudo_id"];
            isOneToOne: false;
            referencedRelation: "kudos";
            referencedColumns: ["id"];
          },
        ];
      };
      kudo_hearts: {
        Row: {
          created_at: string;
          hearts_value: number;
          kudo_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          hearts_value?: number;
          kudo_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          hearts_value?: number;
          kudo_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kudo_hearts_kudo_id_fkey";
            columns: ["kudo_id"];
            isOneToOne: false;
            referencedRelation: "kudos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudo_hearts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile_kudo_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudo_hearts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      kudos: {
        Row: {
          anonymous_name: string | null;
          attachment_count: number;
          created_at: string;
          hashtag_title: string;
          hashtags: string;
          hearts_count: number;
          id: string;
          image_urls: string[];
          is_anonymous: boolean;
          is_spam: boolean;
          message: string;
          receiver_id: string;
          sender_id: string;
        };
        Insert: {
          anonymous_name?: string | null;
          attachment_count?: number;
          created_at?: string;
          hashtag_title?: string;
          hashtags?: string;
          hearts_count?: number;
          id?: string;
          image_urls?: string[];
          is_anonymous?: boolean;
          is_spam?: boolean;
          message: string;
          receiver_id: string;
          sender_id: string;
        };
        Update: {
          anonymous_name?: string | null;
          attachment_count?: number;
          created_at?: string;
          hashtag_title?: string;
          hashtags?: string;
          hearts_count?: number;
          id?: string;
          image_urls?: string[];
          is_anonymous?: boolean;
          is_spam?: boolean;
          message?: string;
          receiver_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kudos_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profile_kudo_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudos_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudos_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profile_kudo_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudos_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile_kudo_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          boxes_opened: number;
          boxes_unopened: number;
          created_at: string;
          display_name: string;
          hero_badge: string;
          hero_code: string;
          id: string;
          language: string | null;
          role: string;
        };
        Insert: {
          avatar_url?: string | null;
          boxes_opened?: number;
          boxes_unopened?: number;
          created_at?: string;
          display_name: string;
          hero_badge?: string;
          hero_code: string;
          id: string;
          language?: string | null;
          role?: string;
        };
        Update: {
          avatar_url?: string | null;
          boxes_opened?: number;
          boxes_unopened?: number;
          created_at?: string;
          display_name?: string;
          hero_badge?: string;
          hero_code?: string;
          id?: string;
          language?: string | null;
          role?: string;
        };
        Relationships: [];
      };
      secret_box_icons: {
        Row: {
          id: string;
          image_url: string;
          name: string;
          sort_order: number;
          weight: number;
        };
        Insert: {
          id?: string;
          image_url: string;
          name: string;
          sort_order?: number;
          weight?: number;
        };
        Update: {
          id?: string;
          image_url?: string;
          name?: string;
          sort_order?: number;
          weight?: number;
        };
        Relationships: [];
      };
      user_icon_unlocks: {
        Row: {
          icon_id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          icon_id: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          icon_id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_icon_unlocks_icon_id_fkey";
            columns: ["icon_id"];
            isOneToOne: false;
            referencedRelation: "secret_box_icons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_icon_unlocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile_kudo_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_icon_unlocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      profile_kudo_stats: {
        Row: {
          hearts_received: number | null;
          id: string | null;
          kudos_received: number | null;
          kudos_sent: number | null;
        };
        Insert: {
          hearts_received?: never;
          id?: string | null;
          kudos_received?: never;
          kudos_sent?: never;
        };
        Update: {
          hearts_received?: never;
          id?: string | null;
          kudos_received?: never;
          kudos_sent?: never;
        };
        Relationships: [];
      };
    };
    Functions: {
      open_secret_box: {
        Args: never;
        Returns: {
          boxes_opened: number;
          boxes_unopened: number;
          icon_id: string;
          icon_image_url: string;
          icon_name: string;
        }[];
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
