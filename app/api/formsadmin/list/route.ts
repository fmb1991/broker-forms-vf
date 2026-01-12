import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const { adminSecret, status, q, page = 1, pageSize = 20 } = await req.json().catch(() => ({}));

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const from = (Number(page) - 1) * Number(pageSize);
  const to = from + Number(pageSize) - 1;

  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin.from("v_formsadmin").select("*", { count: "exact" });

  if (status) query = query.eq("computed_status", status);
  if (q) query = query.ilike("respondent_company", `%${q}%`);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    page: Number(page),
    pageSize: Number(pageSize),
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / Number(pageSize)),
  });
}
