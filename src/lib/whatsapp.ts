import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { GRAPH_VERSION } from "@/lib/meta";

/**
 * WhatsApp Cloud API: inbound messages arrive at /api/whatsapp/webhook and become clients;
 * the dashboard can reply with a text message (inside WhatsApp's 24-hour customer service window).
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */
export type WhatsAppSettings = {
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  app_secret: string;
  verify_token: string;
};

export const DEFAULT_WHATSAPP: WhatsAppSettings = { phone_number_id: "", business_account_id: "", access_token: "", app_secret: "", verify_token: "" };

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  const db = createServiceClient();
  if (!db) return DEFAULT_WHATSAPP;
  const { data } = await db.from("private_settings").select("value").eq("key", "whatsapp").maybeSingle();
  return { ...DEFAULT_WHATSAPP, ...((data?.value as Partial<WhatsAppSettings>) ?? {}) };
}

export function isWhatsAppReady(s: WhatsAppSettings) {
  return Boolean(s.phone_number_id && s.access_token);
}

/** Meta signs each webhook body with the app secret (X-Hub-Signature-256: sha256=<hex>). */
export function validSignature(rawBody: string, header: string | null, secret: string) {
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(header.slice(7));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function sendWhatsAppText(s: WhatsAppSettings, to: string, body: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${s.phone_number_id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body } }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; error_data?: { details?: string } } };
  if (!res.ok || json.error) throw new Error(json.error?.error_data?.details || json.error?.message || `WhatsApp API error (${res.status})`);
  return json.messages?.[0]?.id ?? null;
}

// Webhook payload (only the parts we use) ---------------------------------------
type WaMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
  image?: { caption?: string };
  referral?: { source_url?: string; source_id?: string; source_type?: string; headline?: string; body?: string; ctwa_clid?: string };
};
export type WaWebhook = {
  object?: string;
  entry?: { changes?: { field?: string; value?: { contacts?: { wa_id: string; profile?: { name?: string } }[]; messages?: WaMessage[] } }[] }[];
};

/** Turns each inbound message into a client + activity (deduped by message id). Returns how many were stored. */
export async function ingestWebhook(payload: WaWebhook) {
  const db = createServiceClient();
  if (!db) return 0;
  let stored = 0;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const v = change.value ?? {};
      for (const m of v.messages ?? []) {
        const profile = v.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
        const text =
          m.text?.body ??
          m.button?.text ??
          m.interactive?.button_reply?.title ??
          m.interactive?.list_reply?.title ??
          m.image?.caption ??
          `[${m.type}]`;
        const r = m.referral;
        // Click-to-WhatsApp ads send the ad that started the chat.
        const utm: Record<string, string> = {};
        if (r?.source_id) utm.ad_id = r.source_id;
        if (r?.ctwa_clid) utm.ctwa_clid = r.ctwa_clid;
        if (r?.headline) utm.headline = r.headline;
        if (r?.source_url) utm.source_url = r.source_url;
        if (r?.source_type) utm.source_type = r.source_type;
        const { error } = await db.rpc("ingest_lead", {
          p_name: profile,
          p_phone: `+${m.from}`,
          p_email: null,
          p_company: null,
          p_source: "whatsapp",
          p_utm: utm,
          p_service: null,
          p_kind: "whatsapp_in",
          p_body: text,
          p_external_id: `wa:${m.id}`,
          p_wa_id: m.from,
        });
        if (error) console.error("whatsapp ingest", error.message);
        else stored++;
      }
    }
  }
  return stored;
}
