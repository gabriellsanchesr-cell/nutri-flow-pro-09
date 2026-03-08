import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is a nutri
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Use service role to check role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "nutri")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas nutricionistas podem gerenciar contas" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, paciente_id, email, password, nome_completo } = body;

    switch (action) {
      case "create": {
        if (!email || !password || !paciente_id) {
          return new Response(JSON.stringify({ error: "Email, senha e paciente_id são obrigatórios" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create auth user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome_completo: nome_completo || "" },
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Assign paciente role
        await adminClient.from("user_roles").insert({
          user_id: newUser.user.id,
          role: "paciente",
        });

        // Link to paciente record
        await adminClient
          .from("pacientes")
          .update({ auth_user_id: newUser.user.id, account_status: "ativo" })
          .eq("id", paciente_id);

        return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deactivate": {
        if (!paciente_id) {
          return new Response(JSON.stringify({ error: "paciente_id é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: paciente } = await adminClient
          .from("pacientes")
          .select("auth_user_id")
          .eq("id", paciente_id)
          .single();

        if (!paciente?.auth_user_id) {
          return new Response(JSON.stringify({ error: "Paciente não tem conta vinculada" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient.auth.admin.updateUserById(paciente.auth_user_id, {
          ban_duration: "876600h", // ~100 years
        });

        await adminClient
          .from("pacientes")
          .update({ account_status: "desativado" })
          .eq("id", paciente_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reactivate": {
        if (!paciente_id) {
          return new Response(JSON.stringify({ error: "paciente_id é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: paciente } = await adminClient
          .from("pacientes")
          .select("auth_user_id")
          .eq("id", paciente_id)
          .single();

        if (!paciente?.auth_user_id) {
          return new Response(JSON.stringify({ error: "Paciente não tem conta vinculada" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient.auth.admin.updateUserById(paciente.auth_user_id, {
          ban_duration: "none",
        });

        await adminClient
          .from("pacientes")
          .update({ account_status: "ativo" })
          .eq("id", paciente_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        if (!paciente_id) {
          return new Response(JSON.stringify({ error: "paciente_id é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: paciente } = await adminClient
          .from("pacientes")
          .select("auth_user_id")
          .eq("id", paciente_id)
          .single();

        // Delete auth user if exists
        if (paciente?.auth_user_id) {
          await adminClient.auth.admin.deleteUser(paciente.auth_user_id);
        }

        // Hard delete the paciente record
        await adminClient.from("pacientes").delete().eq("id", paciente_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
