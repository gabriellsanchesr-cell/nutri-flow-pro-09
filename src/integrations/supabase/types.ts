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
      anamneses: {
        Row: {
          created_at: string
          espaco_livre: string | null
          historico_alimentar: string | null
          historico_medico: string | null
          historico_treino: string | null
          id: string
          objetivos_motivacoes: string | null
          paciente_id: string
          preenchido_por: Database["public"]["Enums"]["preenchido_por"]
          respondido: boolean
          saude_intestinal: string | null
          sono_estresse: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          espaco_livre?: string | null
          historico_alimentar?: string | null
          historico_medico?: string | null
          historico_treino?: string | null
          id?: string
          objetivos_motivacoes?: string | null
          paciente_id: string
          preenchido_por?: Database["public"]["Enums"]["preenchido_por"]
          respondido?: boolean
          saude_intestinal?: string | null
          sono_estresse?: string | null
          token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          espaco_livre?: string | null
          historico_alimentar?: string | null
          historico_medico?: string | null
          historico_treino?: string | null
          id?: string
          objetivos_motivacoes?: string | null
          paciente_id?: string
          preenchido_por?: Database["public"]["Enums"]["preenchido_por"]
          respondido?: boolean
          saude_intestinal?: string | null
          sono_estresse?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_fisicas: {
        Row: {
          altura: number | null
          altura_joelho: number | null
          altura_sentado: number | null
          bio_agua_corporal: number | null
          bio_gordura_visceral: number | null
          bio_idade_metabolica: number | null
          bio_massa_gorda: number | null
          bio_massa_livre_gordura: number | null
          bio_massa_muscular: number | null
          bio_metabolismo_basal: number | null
          bio_percentual_gordura: number | null
          bio_percentual_ideal: number | null
          bio_percentual_massa_muscular: number | null
          bio_peso_osseo: number | null
          circ_abdomen: number | null
          circ_antebraco: number | null
          circ_braco_contraido: number | null
          circ_braco_dir: number | null
          circ_braco_esq: number | null
          circ_cintura: number | null
          circ_coxa_dir: number | null
          circ_coxa_distal: number | null
          circ_coxa_esq: number | null
          circ_coxa_medial: number | null
          circ_coxa_proximal: number | null
          circ_ombro: number | null
          circ_panturrilha: number | null
          circ_pescoco: number | null
          circ_quadril: number | null
          circ_torax: number | null
          classificacao_imc: string | null
          created_at: string
          data_avaliacao: string
          diam_biacromial: number | null
          diam_bicrista: number | null
          diam_femur: number | null
          diam_punho: number | null
          dobra_abdominal: number | null
          dobra_axilar_media: number | null
          dobra_biceps: number | null
          dobra_coxa: number | null
          dobra_panturrilha: number | null
          dobra_peitoral: number | null
          dobra_subescapular: number | null
          dobra_supraespinhal: number | null
          dobra_suprailiaca: number | null
          dobra_toracica: number | null
          dobra_triceps: number | null
          envergadura: number | null
          id: string
          imc: number | null
          massa_gorda_kg: number | null
          massa_magra_kg: number | null
          observacoes: string | null
          paciente_id: string
          percentual_gordura_dobras: number | null
          peso: number | null
          protocolo_dobras: string | null
          relacao_cintura_quadril: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          altura?: number | null
          altura_joelho?: number | null
          altura_sentado?: number | null
          bio_agua_corporal?: number | null
          bio_gordura_visceral?: number | null
          bio_idade_metabolica?: number | null
          bio_massa_gorda?: number | null
          bio_massa_livre_gordura?: number | null
          bio_massa_muscular?: number | null
          bio_metabolismo_basal?: number | null
          bio_percentual_gordura?: number | null
          bio_percentual_ideal?: number | null
          bio_percentual_massa_muscular?: number | null
          bio_peso_osseo?: number | null
          circ_abdomen?: number | null
          circ_antebraco?: number | null
          circ_braco_contraido?: number | null
          circ_braco_dir?: number | null
          circ_braco_esq?: number | null
          circ_cintura?: number | null
          circ_coxa_dir?: number | null
          circ_coxa_distal?: number | null
          circ_coxa_esq?: number | null
          circ_coxa_medial?: number | null
          circ_coxa_proximal?: number | null
          circ_ombro?: number | null
          circ_panturrilha?: number | null
          circ_pescoco?: number | null
          circ_quadril?: number | null
          circ_torax?: number | null
          classificacao_imc?: string | null
          created_at?: string
          data_avaliacao?: string
          diam_biacromial?: number | null
          diam_bicrista?: number | null
          diam_femur?: number | null
          diam_punho?: number | null
          dobra_abdominal?: number | null
          dobra_axilar_media?: number | null
          dobra_biceps?: number | null
          dobra_coxa?: number | null
          dobra_panturrilha?: number | null
          dobra_peitoral?: number | null
          dobra_subescapular?: number | null
          dobra_supraespinhal?: number | null
          dobra_suprailiaca?: number | null
          dobra_toracica?: number | null
          dobra_triceps?: number | null
          envergadura?: number | null
          id?: string
          imc?: number | null
          massa_gorda_kg?: number | null
          massa_magra_kg?: number | null
          observacoes?: string | null
          paciente_id: string
          percentual_gordura_dobras?: number | null
          peso?: number | null
          protocolo_dobras?: string | null
          relacao_cintura_quadril?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          altura?: number | null
          altura_joelho?: number | null
          altura_sentado?: number | null
          bio_agua_corporal?: number | null
          bio_gordura_visceral?: number | null
          bio_idade_metabolica?: number | null
          bio_massa_gorda?: number | null
          bio_massa_livre_gordura?: number | null
          bio_massa_muscular?: number | null
          bio_metabolismo_basal?: number | null
          bio_percentual_gordura?: number | null
          bio_percentual_ideal?: number | null
          bio_percentual_massa_muscular?: number | null
          bio_peso_osseo?: number | null
          circ_abdomen?: number | null
          circ_antebraco?: number | null
          circ_braco_contraido?: number | null
          circ_braco_dir?: number | null
          circ_braco_esq?: number | null
          circ_cintura?: number | null
          circ_coxa_dir?: number | null
          circ_coxa_distal?: number | null
          circ_coxa_esq?: number | null
          circ_coxa_medial?: number | null
          circ_coxa_proximal?: number | null
          circ_ombro?: number | null
          circ_panturrilha?: number | null
          circ_pescoco?: number | null
          circ_quadril?: number | null
          circ_torax?: number | null
          classificacao_imc?: string | null
          created_at?: string
          data_avaliacao?: string
          diam_biacromial?: number | null
          diam_bicrista?: number | null
          diam_femur?: number | null
          diam_punho?: number | null
          dobra_abdominal?: number | null
          dobra_axilar_media?: number | null
          dobra_biceps?: number | null
          dobra_coxa?: number | null
          dobra_panturrilha?: number | null
          dobra_peitoral?: number | null
          dobra_subescapular?: number | null
          dobra_supraespinhal?: number | null
          dobra_suprailiaca?: number | null
          dobra_toracica?: number | null
          dobra_triceps?: number | null
          envergadura?: number | null
          id?: string
          imc?: number | null
          massa_gorda_kg?: number | null
          massa_magra_kg?: number | null
          observacoes?: string | null
          paciente_id?: string
          percentual_gordura_dobras?: number | null
          peso?: number | null
          protocolo_dobras?: string | null
          relacao_cintura_quadril?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_fisicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      calculos_energeticos: {
        Row: {
          adicional_gestante: boolean | null
          adicional_met: number | null
          altura: number | null
          carboidrato_g: number | null
          carboidrato_pct: number | null
          created_at: string
          distribuicao_refeicoes: Json | null
          fator_atividade: number | null
          fator_injuria: number | null
          formula: string | null
          get: number | null
          gordura_g: number | null
          gordura_pct: number | null
          id: string
          idade: number | null
          massa_magra: number | null
          meta_calorica: number | null
          objetivo: string | null
          paciente_id: string
          percentual_ajuste: number | null
          peso: number | null
          proteina_g: number | null
          proteina_pct: number | null
          sexo: string | null
          tmb: number | null
          trimestre_gestante: number | null
          user_id: string
        }
        Insert: {
          adicional_gestante?: boolean | null
          adicional_met?: number | null
          altura?: number | null
          carboidrato_g?: number | null
          carboidrato_pct?: number | null
          created_at?: string
          distribuicao_refeicoes?: Json | null
          fator_atividade?: number | null
          fator_injuria?: number | null
          formula?: string | null
          get?: number | null
          gordura_g?: number | null
          gordura_pct?: number | null
          id?: string
          idade?: number | null
          massa_magra?: number | null
          meta_calorica?: number | null
          objetivo?: string | null
          paciente_id: string
          percentual_ajuste?: number | null
          peso?: number | null
          proteina_g?: number | null
          proteina_pct?: number | null
          sexo?: string | null
          tmb?: number | null
          trimestre_gestante?: number | null
          user_id: string
        }
        Update: {
          adicional_gestante?: boolean | null
          adicional_met?: number | null
          altura?: number | null
          carboidrato_g?: number | null
          carboidrato_pct?: number | null
          created_at?: string
          distribuicao_refeicoes?: Json | null
          fator_atividade?: number | null
          fator_injuria?: number | null
          formula?: string | null
          get?: number | null
          gordura_g?: number | null
          gordura_pct?: number | null
          id?: string
          idade?: number | null
          massa_magra?: number | null
          meta_calorica?: number | null
          objetivo?: string | null
          paciente_id?: string
          percentual_ajuste?: number | null
          peso?: number | null
          proteina_g?: number | null
          proteina_pct?: number | null
          sexo?: string | null
          tmb?: number | null
          trimestre_gestante?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculos_energeticos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
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
      diario_config: {
        Row: {
          ativo: boolean
          created_at: string
          frequencia: string
          id: string
          paciente_id: string
          refeicoes_habilitadas: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          frequencia?: string
          id?: string
          paciente_id: string
          refeicoes_habilitadas?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          frequencia?: string
          id?: string
          paciente_id?: string
          refeicoes_habilitadas?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_config_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_registros: {
        Row: {
          created_at: string
          data_registro: string
          descricao: string
          feedback_data: string | null
          feedback_nutri: string | null
          foto_path: string | null
          horario: string | null
          id: string
          paciente_id: string
          paciente_user_id: string
          sentimento: string | null
          tipo_refeicao: string
          updated_at: string
          visto_nutri: boolean
        }
        Insert: {
          created_at?: string
          data_registro?: string
          descricao?: string
          feedback_data?: string | null
          feedback_nutri?: string | null
          foto_path?: string | null
          horario?: string | null
          id?: string
          paciente_id: string
          paciente_user_id: string
          sentimento?: string | null
          tipo_refeicao?: string
          updated_at?: string
          visto_nutri?: boolean
        }
        Update: {
          created_at?: string
          data_registro?: string
          descricao?: string
          feedback_data?: string | null
          feedback_nutri?: string | null
          foto_path?: string | null
          horario?: string | null
          id?: string
          paciente_id?: string
          paciente_user_id?: string
          sentimento?: string | null
          tipo_refeicao?: string
          updated_at?: string
          visto_nutri?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "diario_registros_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      evolucao_fotos: {
        Row: {
          angulo: string
          created_at: string
          data_registro: string
          foto_path: string
          id: string
          observacoes: string | null
          paciente_id: string
          user_id: string
        }
        Insert: {
          angulo?: string
          created_at?: string
          data_registro?: string
          foto_path: string
          id?: string
          observacoes?: string | null
          paciente_id: string
          user_id: string
        }
        Update: {
          angulo?: string
          created_at?: string
          data_registro?: string
          foto_path?: string
          id?: string
          observacoes?: string | null
          paciente_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolucao_fotos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      exames_laboratoriais: {
        Row: {
          arquivo_path: string
          created_at: string
          data_coleta: string
          id: string
          nome_exame: string
          observacoes: string | null
          paciente_id: string
          user_id: string
        }
        Insert: {
          arquivo_path: string
          created_at?: string
          data_coleta?: string
          id?: string
          nome_exame: string
          observacoes?: string | null
          paciente_id: string
          user_id: string
        }
        Update: {
          arquivo_path?: string
          created_at?: string
          data_coleta?: string
          id?: string
          nome_exame?: string
          observacoes?: string | null
          paciente_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exames_laboratoriais_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      orientacoes: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_orientacao"]
          conteudo: string
          created_at: string
          data_envio: string | null
          enviada: boolean
          id: string
          paciente_id: string
          titulo: string
          user_id: string
          visualizada: boolean
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_orientacao"]
          conteudo?: string
          created_at?: string
          data_envio?: string | null
          enviada?: boolean
          id?: string
          paciente_id: string
          titulo: string
          user_id: string
          visualizada?: boolean
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_orientacao"]
          conteudo?: string
          created_at?: string
          data_envio?: string | null
          enviada?: boolean
          id?: string
          paciente_id?: string
          titulo?: string
          user_id?: string
          visualizada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orientacoes_paciente_id_fkey"
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
          data_fim: string | null
          data_inicio: string | null
          id: string
          is_template: boolean | null
          nome: string
          objetivo_template:
            | Database["public"]["Enums"]["objetivo_principal"]
            | null
          observacoes: string | null
          paciente_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          is_template?: boolean | null
          nome?: string
          objetivo_template?:
            | Database["public"]["Enums"]["objetivo_principal"]
            | null
          observacoes?: string | null
          paciente_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          is_template?: boolean | null
          nome?: string
          objetivo_template?:
            | Database["public"]["Enums"]["objetivo_principal"]
            | null
          observacoes?: string | null
          paciente_id?: string | null
          status?: string
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
      questionarios: {
        Row: {
          created_at: string
          data_envio: string | null
          data_resposta: string | null
          id: string
          paciente_id: string
          respostas: Json | null
          status: Database["public"]["Enums"]["status_questionario"]
          tipo: Database["public"]["Enums"]["tipo_questionario"]
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_envio?: string | null
          data_resposta?: string | null
          id?: string
          paciente_id: string
          respostas?: Json | null
          status?: Database["public"]["Enums"]["status_questionario"]
          tipo: Database["public"]["Enums"]["tipo_questionario"]
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_envio?: string | null
          data_resposta?: string | null
          id?: string
          paciente_id?: string
          respostas?: Json | null
          status?: Database["public"]["Enums"]["status_questionario"]
          tipo?: Database["public"]["Enums"]["tipo_questionario"]
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionarios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      refeicoes: {
        Row: {
          created_at: string
          horario_sugerido: string | null
          id: string
          observacoes: string | null
          ordem: number | null
          plano_id: string
          substituicoes_sugeridas: string | null
          tipo: Database["public"]["Enums"]["tipo_refeicao"]
        }
        Insert: {
          created_at?: string
          horario_sugerido?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_id: string
          substituicoes_sugeridas?: string | null
          tipo: Database["public"]["Enums"]["tipo_refeicao"]
        }
        Update: {
          created_at?: string
          horario_sugerido?: string | null
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
      categoria_orientacao:
        | "alimentacao"
        | "hidratacao"
        | "sono"
        | "treino"
        | "intestino"
        | "comportamento"
        | "outro"
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
      preenchido_por: "nutricionista" | "paciente"
      status_consulta: "agendado" | "realizado" | "cancelado"
      status_questionario: "pendente" | "enviado" | "respondido"
      tipo_consulta: "primeira_consulta" | "retorno" | "online" | "presencial"
      tipo_questionario:
        | "anamnese"
        | "checkin_semanal"
        | "qualidade_vida"
        | "comportamento_alimentar"
        | "sintomas_intestinais"
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
      categoria_orientacao: [
        "alimentacao",
        "hidratacao",
        "sono",
        "treino",
        "intestino",
        "comportamento",
        "outro",
      ],
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
      preenchido_por: ["nutricionista", "paciente"],
      status_consulta: ["agendado", "realizado", "cancelado"],
      status_questionario: ["pendente", "enviado", "respondido"],
      tipo_consulta: ["primeira_consulta", "retorno", "online", "presencial"],
      tipo_questionario: [
        "anamnese",
        "checkin_semanal",
        "qualidade_vida",
        "comportamento_alimentar",
        "sintomas_intestinais",
      ],
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
