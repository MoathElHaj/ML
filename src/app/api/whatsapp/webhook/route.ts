import { after } from "next/server";
import { getWhatsAppSettings, ingestWebhook, validSignature, type WaWebhook } from "@/lib/whatsapp";

/** Meta calls this once when you save the webhook: echo the challenge if the verify token matches. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const s = await getWhatsAppSettings();
  if (url.searchParams.get("hub.mode") === "subscribe" && s.verify_token && url.searchParams.get("hub.verify_token") === s.verify_token) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Incoming WhatsApp messages. Answer 200 quickly; Meta retries anything slower or failing. */
export async function POST(request: Request) {
  const raw = await request.text();
  const s = await getWhatsAppSettings();
  const secret = s.app_secret || process.env.META_APP_SECRET || "";
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"), secret)) return new Response("Invalid signature", { status: 401 });

  let payload: WaWebhook;
  try {
    payload = JSON.parse(raw) as WaWebhook;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  after(() => ingestWebhook(payload));
  return new Response("OK", { status: 200 });
}
