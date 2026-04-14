import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Token inválido" }, 401);

    const callerId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "nutri")
      .single();

    if (!roleData) return json({ error: "Apenas administradores podem gerenciar equipe" }, 403);

    const body = await req.json();
    const { action, membro_id, email, password, nome_completo, telefone, funcao, funcao_personalizada, permissoes, acesso_todos_pacientes, pacientes_atribuidos } = body;

    switch (action) {
      case "create": {
        if (!email || !password || !nome_completo) return json({ error: "Email, senha e nome são obrigatórios" }, 400);

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome_completo },
        });
        if (createError) return json({ error: createError.message }, 400);

        await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "equipe" });

        const { data: membro, error: membroError } = await adminClient.from("equipe_membros").insert({
          auth_user_id: newUser.user.id,
          nome_completo,
          email,
          telefone: telefone || null,
          funcao: funcao || "personalizado",
          funcao_personalizada: funcao_personalizada || null,
          permissoes: permissoes || {},
          acesso_todos_pacientes: acesso_todos_pacientes ?? false,
          pacientes_atribuidos: pacientes_atribuidos || [],
          deve_trocar_senha: true,
          created_by: callerId,
        }).select().single();

        if (membroError) return json({ error: membroError.message }, 400);

        await adminClient.from("profiles").upsert({
          user_id: newUser.user.id,
          nome_completo,
          telefone: telefone || null,
        }, { onConflict: "user_id" });

        return json({ success: true, user_id: newUser.user.id, membro });
      }

      case "update": {
        if (!membro_id) return json({ error: "membro_id é obrigatório" }, 400);

        const { data: membro } = await adminClient
          .from("equipe_membros")
          .select("auth_user_id")
          .eq("id", membro_id)
          .single();
        if (!membro) return json({ error: "Membro não encontrado" }, 404);

        const authUpdates: Record<string, unknown> = {};
        if (email) authUpdates.email = email;
        if (password) authUpdates.password = password;

        if (Object.keys(authUpdates).length > 0) {
          const { error } = await adminClient.auth.admin.updateUserById(membro.auth_user_id, authUpdates);
          if (error) return json({ error: error.message }, 400);
        }

        const membroUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (nome_completo) membroUpdates.nome_completo = nome_completo;
        if (email) membroUpdates.email = email;
        if (telefone !== undefined) membroUpdates.telefone = telefone;
        if (funcao) membroUpdates.funcao = funcao;
        if (funcao_personalizada !== undefined) membroUpdates.funcao_personalizada = funcao_personalizada;
        if (permissoes) membroUpdates.permissoes = permissoes;
        if (acesso_todos_pacientes !== undefined) membroUpdates.acesso_todos_pacientes = acesso_todos_pacientes;
        if (pacientes_atribuidos !== undefined) membroUpdates.pacientes_atribuidos = pacientes_atribuidos;

        await adminClient.from("equipe_membros").update(membroUpdates).eq("id", membro_id);
        return json({ success: true });
      }

      case "deactivate": {
        if (!membro_id) return json({ error: "membro_id é obrigatório" }, 400);
        const { data: membro } = await adminClient.from("equipe_membros").select("auth_user_id").eq("id", membro_id).single();
        if (!membro) return json({ error: "Membro não encontrado" }, 404);

        await adminClient.auth.admin.updateUserById(membro.auth_user_id, { ban_duration: "876600h" });
        await adminClient.from("equipe_membros").update({ ativo: false }).eq("id", membro_id);
        return json({ success: true });
      }

      case "reactivate": {
        if (!membro_id) return json({ error: "membro_id é obrigatório" }, 400);
        const { data: membro } = await adminClient.from("equipe_membros").select("auth_user_id").eq("id", membro_id).single();
        if (!membro) return json({ error: "Membro não encontrado" }, 404);

        await adminClient.auth.admin.updateUserById(membro.auth_user_id, { ban_duration: "none" });
        await adminClient.from("equipe_membros").update({ ativo: true }).eq("id", membro_id);
        return json({ success: true });
      }

      case "delete": {
        if (!membro_id) return json({ error: "membro_id é obrigatório" }, 400);
        const { data: membro } = await adminClient.from("equipe_membros").select("auth_user_id").eq("id", membro_id).single();
        if (!membro) return json({ error: "Membro não encontrado" }, 404);

        await adminClient.auth.admin.deleteUser(membro.auth_user_id);
        await adminClient.from("equipe_membros").delete().eq("id", membro_id);
        return json({ success: true });
      }

      case "reset_password": {
        if (!membro_id || !password) return json({ error: "membro_id e password são obrigatórios" }, 400);
        const { data: membro } = await adminClient.from("equipe_membros").select("auth_user_id").eq("id", membro_id).single();
        if (!membro) return json({ error: "Membro não encontrado" }, 404);

        const { error } = await adminClient.auth.admin.updateUserById(membro.auth_user_id, { password });
        if (error) return json({ error: error.message }, 400);

        await adminClient.from("equipe_membros").update({ deve_trocar_senha: true }).eq("id", membro_id);
        return json({ success: true });
      }

      default:
        return json({ error: "Ação inválida" }, 400);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ error: 'Erro interno do servidor' }, 500);
  }
});
