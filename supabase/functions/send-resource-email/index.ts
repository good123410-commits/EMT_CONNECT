import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const to = String(body?.to ?? "").trim();
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const fileUrl = String(body?.fileUrl ?? "").trim();
    const fileName = String(body?.fileName ?? "document").trim();

    if (!to || !title || !fileUrl) {
      return json({ error: "invalid_payload" }, 400);
    }

    if (!isValidEmail(to)) {
      return json({ error: "invalid_email" }, 400);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({ error: "email_not_configured" }, 503);
    }

    const from =
      Deno.env.get("RESOURCE_EMAIL_FROM") ??
      Deno.env.get("INVITE_EMAIL_FROM") ??
      "KEMIX <onboarding@resend.dev>";

    const descBlock = description
      ? `<p style="color:#475569;font-size:14px;line-height:1.6;">${escapeHtml(description)}</p>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:560px;line-height:1.6;color:#0f172a;">
        <h2 style="margin:0 0 12px;">KEMIX 자료실 — ${escapeHtml(title)}</h2>
        <p>요청하신 자료 다운로드 링크를 안내드립니다.</p>
        ${descBlock}
        <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <p style="margin:0 0 8px;"><strong>파일명</strong>: ${escapeHtml(fileName)}</p>
          <p style="margin:0;">
            <a href="${escapeHtml(fileUrl)}" style="color:#047857;font-weight:700;">자료 다운로드</a>
          </p>
        </div>
        <p style="font-size:13px;color:#64748b;">본 메일은 KEMIX 자료실에서 발송되었습니다.</p>
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
        subject: `[KEMIX 자료실] ${title}`,
        html,
      }),
    });

    const emailPayload = await emailRes.json();
    if (!emailRes.ok) {
      return json({ error: "resend_failed", detail: emailPayload }, 502);
    }

    return json({ success: true, id: emailPayload?.id ?? null }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
