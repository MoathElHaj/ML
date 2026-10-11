import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { graph, isMetaConfigured } from "@/lib/meta";

/**
 * Pulls new Instagram/Facebook Lead Ads form submissions for the connected Page into Clients.
 * Needs the `leads_retrieval` permission (reconnect Meta once after this feature was added).
 */
type Lead = {
  id: string;
  created_time: string;
  field_data?: { name: string; values: string[] }[];
  ad_id?: string;
  ad_name?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  platform?: string;
};

const pick = (fields: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) {
    const hit = Object.entries(fields).find(([name]) => name.toLowerCase().replace(/[^a-z]/g, "") === k);
    if (hit?.[1]) return hit[1];
  }
  return null;
};

export async function syncMetaLeads(): Promise<{ ok: boolean; imported: number; error?: string }> {
  const db = createServiceClient();
  if (!db || !isMetaConfigured) return { ok: false, imported: 0, error: "not_configured" };
  const { data: conn } = await db.from("meta_connection").select("access_token, page_id, leads_synced_at").eq("id", 1).maybeSingle();
  if (!conn?.page_id) return { ok: false, imported: 0, error: "no_page" };

  const since = conn.leads_synced_at ? Math.floor(new Date(conn.leads_synced_at).getTime() / 1000) - 3600 : Math.floor(Date.now() / 1000) - 90 * 86400;
  const startedAt = new Date().toISOString();
  let imported = 0;
  try {
    const page = await graph<{ access_token?: string }>(conn.page_id, conn.access_token, { params: { fields: "access_token" } });
    const token = page.access_token ?? conn.access_token;
    const forms = await graph<{ data: { id: string; name: string }[] }>(`${conn.page_id}/leadgen_forms`, token, { params: { fields: "id,name", limit: 100 } });
    for (const form of forms.data ?? []) {
      let next: string | undefined;
      do {
        const res = await graph<{ data: Lead[]; paging?: { cursors?: { after?: string }; next?: string } }>(`${form.id}/leads`, token, {
          params: {
            fields: "id,created_time,field_data,ad_id,ad_name,adset_name,campaign_id,campaign_name,form_id,platform",
            limit: 100,
            after: next,
            filtering: [{ field: "time_created", operator: "GREATER_THAN", value: since }],
          },
        });
        for (const lead of res.data ?? []) {
          const fields = Object.fromEntries((lead.field_data ?? []).map((f) => [f.name, f.values?.join(", ") ?? ""]));
          const name = pick(fields, "fullname", "name") ?? [pick(fields, "firstname"), pick(fields, "lastname")].filter(Boolean).join(" ");
          const body = Object.entries(fields)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");
          const utm: Record<string, string> = { form_id: form.id, form_name: form.name };
          for (const k of ["ad_id", "ad_name", "adset_name", "campaign_id", "campaign_name", "platform"] as const) if (lead[k]) utm[k] = String(lead[k]);
          const { error } = await db.rpc("ingest_lead", {
            p_name: name || null,
            p_phone: pick(fields, "phonenumber", "phone", "mobile", "whatsappnumber"),
            p_email: pick(fields, "email"),
            p_company: pick(fields, "companyname", "company"),
            p_source: "meta_lead_form",
            p_utm: utm,
            p_service: null,
            p_kind: "lead",
            p_body: body,
            p_external_id: `metalead:${lead.id}`,
          });
          if (!error) imported++;
        }
        next = res.paging?.next ? res.paging.cursors?.after : undefined;
      } while (next);
    }
    await db.from("meta_connection").update({ leads_synced_at: startedAt }).eq("id", 1);
    return { ok: true, imported };
  } catch (e) {
    return { ok: false, imported, error: e instanceof Error ? e.message : String(e) };
  }
}
