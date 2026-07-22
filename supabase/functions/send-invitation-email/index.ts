import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function roleLabel(role: string): string {
  switch (role) {
    case "paramedic":
      return "응급구조사";
    case "hospital":
      return "병원 관계자";
    case "private_ems":
      return "사설 구급차 운용자";
    case "admin":
      return "관리자";
    default:
      return role;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "not_authenticated" }, 401);
    }

    const body = await req.json();
    const to = String(body?.to ?? "").trim();
    const code = String(body?.code ?? "").trim();
    const targetRole = String(body?.targetRole ?? "paramedic");
    const expiresAt = body?.expiresAt ? String(body.expiresAt) : null;

    if (!to || !code) {
      return json({ error: "invalid_payload" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: "server_misconfigured" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "not_authenticated" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("role, is_approved")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin" || !profile?.is_approved) {
      return json({ error: "not_authorized_admin" }, 403);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({ error: "email_not_configured" }, 503);
    }

    const from =
      Deno.env.get("INVITE_EMAIL_FROM") ?? "EMS Connect <onboarding@resend.dev>";
    const expiresLine = expiresAt
      ? `<p style="color:#475569;font-size:14px;">만료일: ${new Date(expiresAt).toLocaleString("ko-KR")}</p>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:520px;line-height:1.6;color:#0f172a;">
        <h2 style="margin:0 0 12px;">EMS Connect 전문가 초대</h2>
        <p>안녕하세요. EMS Connect 운영팀입니다.</p>
        <p>아래 초대 코드로 전문가 인증을 진행해 주세요.</p>
        <div style="margin:16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <p style="margin:0 0 8px;"><strong>대상 역할</strong>: ${roleLabel(targetRole)}</p>
          <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:1px;">${code}</p>
        </div>
        ${expiresLine}
        <p style="font-size:14px;color:#475569;">
          앱 <strong>설정 → 구급대원 인증</strong> 메뉴에서 초대 코드와 자격증을 제출해 주세요.
        </p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "[EMS Connect] 전문가 초대 코드",
        html,
      }),
    });

    const emailPayload = await emailRes.json();
    if (!emailRes.ok) {
      return json(
        {
          error: "resend_failed",
          detail: emailPayload,
        },
        502,
      );
    }

    try {
      await adminClient.from("audit_logs").insert({
        actor_id: userData.user.id,
        action: "invitation_email_sent",
        target_type: "invitation_code",
        target_id: code,
        details: {
          to,
          targetRole,
          resend_id: emailPayload?.id ?? null,
        },
      });
    } catch {
      // audit 실패해도 메일 전송은 성공 처리
    }

    return json({ success: true, id: emailPayload?.id ?? null }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
