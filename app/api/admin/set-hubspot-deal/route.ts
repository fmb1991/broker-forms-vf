export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

type Body = {
  token?: string;
  hubspot_deal_id?: string | number;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await req.json()) as Body;
    const token = (body.token || "").trim();
    const dealRaw = (body.hubspot_deal_id ?? "").toString().trim();

    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "Faltou token" }), { status: 400 });
    }
    if (!dealRaw || !/^\d+$/.test(dealRaw)) {
      return new Response(JSON.stringify({ ok: false, error: "HubSpot Deal ID deve conter apenas números." }), { status: 400 });
    }

    // Reuse your existing RPC to get the payload, and read form.id from it
    const { data, error } = await supabase.rpc("sec_get_form_payload_v3", {
      p_lang: "pt-BR",
      p_token: token,
    });

    if (error || !data?.form?.id) {
      return new Response(JSON.stringify({ ok: false, error: "Form não encontrado para este token." }), { status: 404 });
    }

    const formId = data.form.id as string;

    const { error: upErr } = await supabase
      .from("form_instances")
      .update({ hubspot_deal_id: dealRaw })
      .eq("id", formId);

    if (upErr) {
      return new Response(JSON.stringify({ ok: false, error: upErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, form_instance_id: formId, hubspot_deal_id: dealRaw }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500 });
  }
}
