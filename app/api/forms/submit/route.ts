import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,               // server-only
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // server-only
);

const HS_TOKEN      = process.env.HUBSPOT_PRIVATE_APP_TOKEN || "";
const PIPELINE_ID   = process.env.HS_RENEWAL_PIPELINE_ID    || "";
const STAGE_WAITING = process.env.HS_STAGE_WAITING_FOR_PROPOSAL_ID || "";

async function insertLog(form_instance_id: string, action: string, details: any = null) {
  await supabase.from("form_hubspot_sync_logs").insert({
    form_instance_id,
    action,
    details
  });
}

async function updateForm(form_instance_id: string, patch: Record<string, any>) {
  await supabase.from("form_instances").update(patch).eq("id", form_instance_id);
}

export async function POST(req: NextRequest) {
  const debug: any = { steps: [] };

  try {
    // 0) Basic env presence check (masked booleans – no secrets leaked)
    debug.env = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      HUBSPOT_PRIVATE_APP_TOKEN_present: HS_TOKEN.length > 10,
      HS_RENEWAL_PIPELINE_ID_present: !!PIPELINE_ID,
      HS_STAGE_WAITING_present: !!STAGE_WAITING
    };

    const body = await req.json().catch(() => ({} as any));
    const form_instance_id = body?.form_instance_id as string;
    const submitted_by_email = (body?.submitted_by_email || "").toLowerCase();

    debug.steps.push("BODY_PARSED");
    if (!form_instance_id) {
      debug.error = "Missing form_instance_id";
      return new Response(JSON.stringify({ ok: false, debug }), { status: 400 });
    }

    // 1) Mark STARTED so we never stay in NOT_ATTEMPTED silently
    await updateForm(form_instance_id, { hubspot_sync_status: "STARTED" }).catch(() => {});
    debug.steps.push("STATUS_STARTED");

    // 2) Load the form row
    const { data: form, error } = await supabase
      .from("form_instances")
      .select("*")
      .eq("id", form_instance_id)
      .single();

    if (error || !form) {
      debug.steps.push("FORM_NOT_FOUND");
      await insertLog(form_instance_id, "FORM_NOT_FOUND", { error: String(error?.message || error) }).catch(() => {});
      // We can’t update a row that doesn't exist; return debug only.
      return new Response(JSON.stringify({ ok: true, hubspotUpdated: false, reason: "form_not_found", debug }), { status: 200 });
    }

    await insertLog(form_instance_id, "FORM_LOADED", { hasDealId: !!form.hubspot_deal_id }).catch(() => {});
    debug.steps.push("FORM_LOADED");

    // 3) If there is no deal id, flag and exit (non-blocking)
    const dealId = form.hubspot_deal_id?.toString().trim();
    if (!dealId) {
      await updateForm(form_instance_id, {
        hubspot_sync_status: "MISSING_DEAL_ID",
        hubspot_sync_error: "No hubspot_deal_id on form instance",
        needs_attention: true,
        submitted_by_email: submitted_by_email || form.submitted_by_email || null
      }).catch(() => {});
      await insertLog(form_instance_id, "MISSING_DEAL_ID_FLAGGED", null).catch(() => {});
      debug.steps.push("MISSING_DEAL_ID_FLAGGED");
      return new Response(JSON.stringify({ ok: true, hubspotUpdated: false, reason: "missing_deal_id", debug }), { status: 200 });
    }

    // 4) We are ABOUT to call HubSpot — breadcrumb
    await insertLog(form_instance_id, "ABOUT_TO_CALL_HUBSPOT", {
      dealId, pipeline: PIPELINE_ID, stage: STAGE_WAITING
    }).catch(() => {});
    debug.steps.push("ABOUT_TO_CALL_HUBSPOT");

    // 5) Call HubSpot to move the deal
    if (!HS_TOKEN || !PIPELINE_ID || !STAGE_WAITING) {
      debug.steps.push("ENV_MISSING_FOR_HS_CALL");
      await updateForm(form_instance_id, {
        hubspot_sync_status: "FAILED_UPDATE",
        hubspot_sync_error: "Missing HS env (token/pipeline/stage)",
        needs_attention: true
      }).catch(() => {});
      await insertLog(form_instance_id, "HUBSPOT_UPDATE_FAILED", { reason: "env_missing" }).catch(() => {});
      return new Response(JSON.stringify({ ok: true, hubspotUpdated: false, debug }), { status: 200 });
    }

    const hsRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${HS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        properties: {
          dealstage: STAGE_WAITING,
          pipeline: PIPELINE_ID
        }
      })
    });

    debug.steps.push(`HS_RESPONSE_${hsRes.status}`);

    if (!hsRes.ok) {
      const text = await hsRes.text();
      await updateForm(form_instance_id, {
        hubspot_sync_status: "FAILED_UPDATE",
        hubspot_sync_error: `HTTP ${hsRes.status}: ${text?.slice(0,800)}`,
        needs_attention: true
      }).catch(() => {});
      await insertLog(form_instance_id, "HUBSPOT_UPDATE_FAILED", { status: hsRes.status, body: text?.slice(0,2000) }).catch(() => {});
      return new Response(JSON.stringify({ ok: true, hubspotUpdated: false, debug }), { status: 200 });
    }

    await updateForm(form_instance_id, {
      hubspot_sync_status: "SUCCESS",
      hubspot_sync_error: null,
      needs_attention: false
    }).catch(() => {});
    await insertLog(form_instance_id, "HUBSPOT_UPDATE_SUCCESS", { dealId }).catch(() => {});
    debug.steps.push("HUBSPOT_UPDATE_SUCCESS");

    return new Response(JSON.stringify({ ok: true, hubspotUpdated: true, debug }), { status: 200 });
  } catch (err: any) {
    // Final safety net
    debug.steps.push("HANDLER_EXCEPTION");
    debug.error = String(err?.message || err);
    return new Response(JSON.stringify({ ok: true, hubspotUpdated: false, debug }), { status: 200 });
  }
}
