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
      acompanhamentos: {
        Row: {
          aderencia_plano: number | null
          circunferencia_abdominal: number | null
          circunferencia_quadril: number | null
          created_at: string
          data_registro: string
          foto_url: string | null
          id: string
          nivel_energia: number | null
          observacoes_nutricionista: string | null
          observacoes_paciente: string | null
          paciente_id: string
          peso: number | null
          qualidade_sono: number | null
          user_id: string
        }
        Insert: {
          aderencia_plano?: number | null
          circunferencia_abdominal?: number | null
          circunferencia_quadril?: number | null
          created_at?: string
          data_registro?: string
          foto_url?: string | null
          id?: string
          nivel_energia?: number | null
          observacoes_nutricionista?: string | null
          observacoes_paciente?: string | null
          paciente_id: string
          peso?: number | null
          qualidade_sono?: number | null
          user_id: string
        }
        Update: {
          aderencia_plano?: number | null
          circunferencia_abdominal?: number | null
          circunferencia_quadril?: number | null
          created_at?: string
          data_registro?: string
          foto_url?: string | null
          id?: string
          nivel_energia?: number | null
          observacoes_nutricionista?: string | null
          observacoes_paciente?: string | null
          paciente_id?: string
          peso?: number | null
          qualidade_sono?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acompanhamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      alimentos_plano: {
        Row: {
          alimento_taco_id: number | null
          carboidrato_g: number | null
          created_at: string
          energia_kcal: number | null
          fibra_g: number | null
          id: string
          lipidio_g: number | null
          medida_caseira: string | null
          nome_alimento: string
          proteina_g: number | null
          quantidade: number | null
          refeicao_id: string
        }
        Insert: {
          alimento_taco_id?: number | null
          carboidrato_g?: number | null
          created_at?: string
          energia_kcal?: number | null
          fibra_g?: number | null
          id?: string
          lipidio_g?: number | null
          medida_caseira?: string | null
          nome_alimento: string
          proteina_g?: number | null
          quantidade?: number | null
          refeicao_id: string
        }
        Update: {
          alimento_taco_id?: number | null
          carboidrato_g?: number | null
          created_at?: string
          energia_kcal?: number | null
          fibra_g?: number | null
          id?: string
          lipidio_g?: number | null
          medida_caseira?: string | null
          nome_alimento?: string
          proteina_g?: number | null
          quantidade?: number | null
          refeicao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alimentos_plano_alimento_taco_id_fkey"
            columns: ["alimento_taco_id"]
            isOneToOne: false
            referencedRelation: "alimentos_taco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alimentos_plano_refeicao_id_fkey"
            columns: ["refeicao_id"]
            isOneToOne: false
            referencedRelation: "refeicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      alimentos_taco: {
        Row: {
          carboidrato_g: number | null
          energia_kcal: number | null
          fibra_g: number | null
          grupo: Database["public"]["Enums"]["grupo_alimentar"] | null
          id: number
          lipidio_g: number | null
          nome: string
          numero: number | null
          proteina_g: number | null
        }
        Insert: {
          carboidrato_g?: number | null
          energia_kcal?: number | null
          fibra_g?: number | null
          grupo?: Database["public"]["Enums"]["grupo_alimentar"] | null
          id?: number
          lipidio_g?: number | null
          nome: string
          numero?: number | null
          proteina_g?: number | null
        }
        Update: {
          carboidrato_g?: number | null
          energia_kcal?: number | null
          fibra_g?: number | null
          grupo?: Database["public"]["Enums"]["grupo_alimentar"] | null
          id?: number
          lipidio_g?: number | null
          nome?: string
          numero?: number | null
          proteina_g?: number | null
        }
        Relationships: []
      }
      checklist_respostas: {
        Row: {
          aderencia_plano: number | null
          created_at: string
          id: string
          nivel_energia: number | null
          observacoes: string | null
          paciente_id: string
          peso: number | null
          qualidade_sono: number | null
          respondido: boolean | null
          semana: string
          token: string
        }
        Insert: {
          aderencia_plano?: number | null
          created_at?: string
          id?: string
          nivel_energia?: number | null
          observacoes?: string | null
          paciente_id: string
          peso?: number | null
          qualidade_sono?: number | null
          respondido?: boolean | null
          semana?: string
          token?: string
        }
        Update: {
          aderencia_plano?: number | null
          created_at?: string
          id?: string
          nivel_energia?: number | null
          observacoes?: string | null
          paciente_id?: string
          peso?: number | null
          qualidade_sono?: number | null
          respondido?: boolean | null
          semana?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_respostas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas: {
        Row: {
          anotacoes: string | null
          created_at: string
          data_hora: string
          id: string
          paciente_id: string
          status: Database["public"]["Enums"]["status_consulta"] | null
          tipo: Database["public"]["Enums"]["tipo_consulta"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anotacoes?: string | null
          created_at?: string
          data_hora: string
          id?: string
          paciente_id: string
          status?: Database["public"]["Enums"]["status_consulta"] | null
          tipo?: Database["public"]["Enums"]["tipo_consulta"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anotacoes?: string | null
          created_at?: string
          data_hora?: string
          id?: string
          paciente_id?: string
          status?: Database["public"]["Enums"]["status_consulta"] | null
          tipo?: Database["public"]["Enums"]["tipo_consulta"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          account_status: string | null
          alergias: string | null
          altura: number | null
          ativo: boolean | null
          auth_user_id: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          fase_real: Database["public"]["Enums"]["fase_real"] | null
          historico_patologias: string | null
          id: string
          medicamentos: string | null
          nivel_atividade: Database["public"]["Enums"]["nivel_atividade"] | null
          nome_completo: string
          objetivo: Database["public"]["Enums"]["objetivo_principal"] | null
          objetivo_outro: string | null
          observacoes_comportamentais: string | null
          peso_inicial: number | null
          restricoes_alimentares: string | null
          rotina_sono: string | null
          sexo: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string | null
          alergias?: string | null
          altura?: number | null
          ativo?: boolean | null
          auth_user_id?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          fase_real?: Database["public"]["Enums"]["fase_real"] | null
          historico_patologias?: string | null
          id?: string
          medicamentos?: string | null
          nivel_atividade?:
            | Database["public"]["Enums"]["nivel_atividade"]
            | null
          nome_completo: string
          objetivo?: Database["public"]["Enums"]["objetivo_principal"] | null
          objetivo_outro?: string | null
          observacoes_comportamentais?: string | null
          peso_inicial?: number | null
          restricoes_alimentares?: string | null
          rotina_sono?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string | null
          alergias?: string | null
          altura?: number | null
          ativo?: boolean | null
          auth_user_id?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          fase_real?: Database["public"]["Enums"]["fase_real"] | null
          historico_patologias?: string | null
          id?: string
          medicamentos?: string | null
          nivel_atividade?:
            | Database["public"]["Enums"]["nivel_atividade"]
            | null
          nome_completo?: string
          objetivo?: Database["public"]["Enums"]["objetivo_principal"] | null
          objetivo_outro?: string | null
          observacoes_comportamentais?: string | null
          peso_inicial?: number | null
          restricoes_alimentares?: string | null
          rotina_sono?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planos_alimentares: {
        Row: {
          created_at: string
          id: string
          is_template: boolean | null
          nome: string
          objetivo_template:
            | Database["public"]["Enums"]["objetivo_principal"]
            | null
          observacoes: string | null
          paciente_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_template?: boolean | null
          nome?: string
          objetivo_template?:
            | Database["public"]["Enums"]["objetivo_principal"]
            | null
          observacoes?: string | null
          paciente_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_template?: boolean | null
          nome?: string
          objetivo_template?:
            | Database["public"]["Enums"]["objetivo_principal"]
            | null
          observacoes?: string | null
          paciente_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_alimentares_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          crn: string | null
          id: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          crn?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          crn?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refeicoes: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          ordem: number | null
          plano_id: string
          substituicoes_sugeridas: string | null
          tipo: Database["public"]["Enums"]["tipo_refeicao"]
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_id: string
          substituicoes_sugeridas?: string | null
          tipo: Database["public"]["Enums"]["tipo_refeicao"]
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_id?: string
          substituicoes_sugeridas?: string | null
          tipo?: Database["public"]["Enums"]["tipo_refeicao"]
        }
        Relationships: [
          {
            foreignKeyName: "refeicoes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_alimentares"
            referencedColumns: ["id"]
          },
        ]
      }
      substituicoes: {
        Row: {
          alimento_original: string
          alimento_substituto: string
          created_at: string
          grupo: Database["public"]["Enums"]["grupo_alimentar"]
          id: string
          observacoes: string | null
          user_id: string
        }
        Insert: {
          alimento_original: string
          alimento_substituto: string
          created_at?: string
          grupo: Database["public"]["Enums"]["grupo_alimentar"]
          id?: string
          observacoes?: string | null
          user_id: string
        }
        Update: {
          alimento_original?: string
          alimento_substituto?: string
          created_at?: string
          grupo?: Database["public"]["Enums"]["grupo_alimentar"]
          id?: string
          observacoes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      app_role: "nutri" | "paciente"
      fase_real: "rotina" | "estrategia" | "autonomia" | "liberdade"
      grupo_alimentar:
        | "cereais"
        | "verduras"
        | "frutas"
        | "leguminosas"
        | "oleaginosas"
        | "carnes"
        | "leites"
        | "ovos"
        | "oleos"
        | "acucares"
        | "outros"
      nivel_atividade:
        | "sedentario"
        | "leve"
        | "moderado"
        | "intenso"
        | "muito_intenso"
      objetivo_principal:
        | "emagrecimento"
        | "ganho_de_massa"
        | "saude_intestinal"
        | "controle_ansiedade_alimentar"
        | "performance"
        | "outro"
      status_consulta: "agendado" | "realizado" | "cancelado"
      tipo_consulta: "primeira_consulta" | "retorno" | "online" | "presencial"
      tipo_refeicao:
        | "cafe_da_manha"
        | "lanche_da_manha"
        | "almoco"
        | "lanche_da_tarde"
        | "jantar"
        | "ceia"
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
      app_role: ["nutri", "paciente"],
      fase_real: ["rotina", "estrategia", "autonomia", "liberdade"],
      grupo_alimentar: [
        "cereais",
        "verduras",
        "frutas",
        "leguminosas",
        "oleaginosas",
        "carnes",
        "leites",
        "ovos",
        "oleos",
        "acucares",
        "outros",
      ],
      nivel_atividade: [
        "sedentario",
        "leve",
        "moderado",
        "intenso",
        "muito_intenso",
      ],
      objetivo_principal: [
        "emagrecimento",
        "ganho_de_massa",
        "saude_intestinal",
        "controle_ansiedade_alimentar",
        "performance",
        "outro",
      ],
      status_consulta: ["agendado", "realizado", "cancelado"],
      tipo_consulta: ["primeira_consulta", "retorno", "online", "presencial"],
      tipo_refeicao: [
        "cafe_da_manha",
        "lanche_da_manha",
        "almoco",
        "lanche_da_tarde",
        "jantar",
        "ceia",
      ],
    },
  },
} as const
