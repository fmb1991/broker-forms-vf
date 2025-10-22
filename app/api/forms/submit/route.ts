// app/api/forms/submit/route.ts

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- Supabase (server-side) client
const supabase = createClient(
  process.env.SUPABASE_URL!,                // NOT the NEXT_PUBLIC one
  process.env.SUPABASE_SERVICE_ROLE_KEY!    // server-only key
);

const HS_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN!;
const PIPELINE_ID = process.env.HS_RENEWAL_PIPELINE_ID!;                // ex: "default" or your pipeline id
const STAGE_WAITING = process.env.HS_STAGE_WAITING_FOR_PROPOSAL_ID!;    // ex: "presentationscheduled" (your real internal id)

const TEST_DOMAIN = (process.env.TEST_EMAIL_DOMAIN || "").toLowerCase(); // ex: "forters.com.br"
const TEST_EMAILS = (process.env.TEST_EMAILS || "")
  .toLowerCase()
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const FORCE_TEST = (process.env.FORCE_TEST_MODE || "false").toLowerCase() === "true";

// --- small helpers to read/write
async function getFormInstance(form_instance_id: string) {
  const { data, error } = await supabase
    .from("form_instances")
    .select("*")
    .eq("id", form_instance_id)
    .single();
  if (error) throw error;
  return data;
}

async function updateFormInstance(form_instance_id: string, patch: Record<string, any>) {
  const { error } = await supabase
    .from("form_instances")
    .update(patch)
    .eq("id", form_instance_id);
  if (error) throw error;
}

async function insertLog(payload: {
  form_instance_id: string;
  action: string;
  details?: any;
}) {
  const { error } = await supabase
    .from("form_hubspot_sync_logs")
    .insert({
      form_instance_id: payload.form_instance_id,
      action: payload.action,
      details: payload.details ?? null,
    });
  if (error) console.error("log insert error:", error);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Expect these two fields coming from your form submit
    // - form_instance_id: the UUID of the form instance in your DB
    // - submitted_by_email: (optional) the user's email who submitted
    const { form_instance_id, submitted_by_email } = body;

    if (!form_instance_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing form_instance_id" }), { status: 400 });
    }

    // Load the form instance (includes hubspot_deal_id if set in Admin)
    const form = await getFormInstance(form_instance_id);

    // Determine if this is a test submission
    const email = (submitted_by_email || form.submitted_by_email || "").toLowerCase();
    const isTestEmail =
      !!email &&
      ((TEST_DOMAIN && email.endsWith(`@${TEST_DOMAIN}`)) || TEST_EMAILS.includes(email));
    const is_test_submission = FORCE_TEST || isTestEmail;

    // Persist test flag if changed
    if (is_test_submission && !form.is_test_submission) {
      try { await updateFormInstance(form_instance_id, { is_test_submission: true }); } catch {}
    }

    await insertLog({
      form_instance_id,
      action: "SUBMIT_RECEIVED",
      details: { email, is_test_submission },
    });

    // If there's no HubSpot deal mapped, flag but do not block
    const dealId = form.hubspot_deal_id;
    if (!dealId) {
      await updateFormInstance(form_instance_id, {
        submitted_by_email: email || form.submitted_by_email || null,
        hubspot_sync_status: "MISSING_DEAL_ID",
        hubspot_sync_error: "Form submitted without hubspot_deal_id",
        needs_attention: is_test_submission ? false : true,
      });

      await insertLog({
        form_instance_id,
        action: "MISSING_DEAL_ID_FLAGGED",
        details: { reason: "No hubspot_deal_id on form instance" },
      });

      // Still return success to the user
      return new Response(JSON.stringify({ ok: true, hubspotUpdated: false, reason: "missing_deal_id" }), { status: 200 });
    }

    // We have a deal id -> try to move the stage in HubSpot
    await insertLog({
      form_instance_id,
      action: "HUBSPOT_UPDATE_ATTEMPT",
      details: { dealId, pipeline: PIPELINE_ID, stage: STAGE_WAITING },
    });

    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${HS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          dealstage: STAGE_WAITING,
          pipeline: PIPELINE_ID, // safe if the deal might be in another pipeline
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      await updateFormInstance(form_instance_id, {
        hubspot_sync_status: "FAILED_UPDATE",
        hubspot_sync_error: `HTTP ${res.status}: ${text?.slice(0, 800)}`,
        needs_attention: is_test_submission ? false : true,
      });
      await insertLog({
        form_instance_id,
        action: "HUBSPOT_UPDATE_FAILED",
        details: { status: res.status, body: text?.slice(0, 2000) },
      });

      // Do not block the user
      return new Response(JSON.stringify({ ok: true, hubspotUpdated: false }), { status: 200 });
    }

    // Success
    await updateFormInstance(form_instance_id, {
      hubspot_sync_status: "SUCCESS",
      hubspot_sync_error: null,
      needs_attention: false,
    });
    await insertLog({
      form_instance_id,
      action: "HUBSPOT_UPDATE_SUCCESS",
      details: { dealId, pipeline: PIPELINE_ID, stage: STAGE_WAITING },
    });

    return new Response(JSON.stringify({ ok: true, hubspotUpdated: true }), { status: 200 });
  } catch (err: any) {
    console.error("Submit handler error", err);
    try {
      await insertLog({
        form_instance_id: "unknown",
        action: "SUBMIT_HANDLER_ERROR",
        details: { message: String(err?.message || err) },
      });
    } catch {}
    // Never block the user
    return new Response(JSON.stringify({ ok: true, hubspotUpdated: false }), { status: 200 });
  }
}
