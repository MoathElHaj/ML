import "server-only";
import { createHmac } from "node:crypto";

/**
 * Minimal Meta Graph / Marketing API client for click-to-WhatsApp campaigns.
 * Docs: https://developers.facebook.com/docs/marketing-api/ad-creative/messaging-ads/click-to-whatsapp
 */

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

const appId = process.env.META_APP_ID ?? "";
const appSecret = process.env.META_APP_SECRET ?? "";

export const isMetaConfigured = Boolean(appId && appSecret);

/** Permissions needed to read the business's assets and create ads on its behalf. */
export const META_SCOPES = [
  "ads_management",
  "ads_read",
  "business_management",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_ads",
  "leads_retrieval", // Instagram/Facebook Lead Ads forms → Clients
];

export class MetaError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly subcode?: number,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | boolean | object | undefined>;

function encode(params: Params) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  return out;
}

/** Signs calls with appsecret_proof so a leaked token can't be used without the app secret. */
function proof(token: string) {
  return createHmac("sha256", appSecret).update(token).digest("hex");
}

export async function graph<T>(path: string, token: string, opts: { method?: "GET" | "POST" | "DELETE"; params?: Params } = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const params = encode({ ...opts.params, access_token: token, appsecret_proof: proof(token) });
  const url = `${GRAPH}/${path.replace(/^\//, "")}`;
  const res =
    method === "GET"
      ? await fetch(`${url}?${params}`, { cache: "no-store" })
      : await fetch(url, { method, body: params, cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string; error_user_msg?: string; code?: number; error_subcode?: number } } & T;
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    throw new MetaError(e.error_user_msg || e.message || `Meta API error (${res.status})`, e.code, e.error_subcode);
  }
  return body;
}

// ---------------------------------------------------------------------------
// OAuth (Facebook Login for Business)
// ---------------------------------------------------------------------------
export function oauthUrl(state: string, redirectUri: string) {
  const q = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: META_SCOPES.join(","),
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${q}`;
}

type TokenResponse = { access_token: string; token_type?: string; expires_in?: number };

/** Code → short-lived token → long-lived (~60 day) user token. */
export async function exchangeCode(code: string, redirectUri: string) {
  const short = await fetch(
    `${GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code })}`,
    { cache: "no-store" },
  ).then((r) => r.json() as Promise<TokenResponse & { error?: { message: string } }>);
  if (!short.access_token) throw new MetaError(short.error?.message ?? "Could not exchange the Meta login code.");

  const long = await fetch(
    `${GRAPH}/oauth/access_token?${new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: short.access_token,
    })}`,
    { cache: "no-store" },
  ).then((r) => r.json() as Promise<TokenResponse & { error?: { message: string } }>);
  const token = long.access_token ?? short.access_token;
  const expiresIn = long.access_token ? long.expires_in : short.expires_in;
  return { token, expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null };
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
export type AdAccount = { id: string; name: string; currency: string; account_status: number };
export type Page = { id: string; name: string };

export async function getMe(token: string) {
  return graph<{ id: string; name: string }>("me", token, { params: { fields: "id,name" } });
}

export async function listAdAccounts(token: string) {
  const res = await graph<{ data: AdAccount[] }>("me/adaccounts", token, { params: { fields: "id,name,currency,account_status", limit: 100 } });
  return res.data;
}

export async function listPages(token: string) {
  const res = await graph<{ data: Page[] }>("me/accounts", token, { params: { fields: "id,name", limit: 100 } });
  return res.data;
}

/** Resolves free-text interest names to Meta interest IDs; names Meta doesn't know are skipped. */
export async function resolveInterests(token: string, names: string[]) {
  const found: { id: string; name: string }[] = [];
  for (const name of names.slice(0, 8)) {
    try {
      const res = await graph<{ data: { id: string; name: string }[] }>("search", token, { params: { type: "adinterest", q: name, limit: 1 } });
      const hit = res.data[0];
      if (hit && !found.some((f) => f.id === hit.id)) found.push({ id: hit.id, name: hit.name });
    } catch {
      // An unknown interest shouldn't block the campaign.
    }
  }
  return found;
}

/** Most currencies have 2 decimals; Meta budgets are sent in the smallest unit. */
const ZERO_DECIMAL = new Set(["JPY", "KRW", "CLP", "ISK", "PYG", "VND", "IDR", "HUF", "TWD", "COP", "CRC"]);
export function toMinorUnits(amount: number, currency: string) {
  return Math.round(amount * (ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100));
}

// ---------------------------------------------------------------------------
// Click-to-WhatsApp campaign
// ---------------------------------------------------------------------------
export type CtwaInput = {
  token: string;
  adAccountId: string; // act_...
  currency: string;
  pageId: string;
  whatsappNumber?: string | null;
  name: string;
  headline: string;
  primaryText: string;
  description: string;
  welcomeMessage: string;
  icebreakers: string[];
  imageBytesBase64: string;
  dailyBudget: number;
  durationDays: number;
  countries: string[];
  ageMin: number;
  ageMax: number;
  gender: "all" | "male" | "female";
  interests: { id: string; name: string }[];
};

export type CtwaResult = { campaignId?: string; adsetId?: string; creativeId?: string; adId?: string };

/**
 * Creates campaign → ad set → image → creative → ad, every object PAUSED so nothing
 * spends money until a person activates it in Ads Manager. `onStep` records IDs as they
 * are created, so a failure part-way still tells you what exists in Meta.
 */
export async function createClickToWhatsAppCampaign(input: CtwaInput, onStep: (r: CtwaResult) => Promise<void>) {
  const { token, adAccountId } = input;
  const result: CtwaResult = {};

  const campaign = await graph<{ id: string }>(`${adAccountId}/campaigns`, token, {
    method: "POST",
    params: {
      name: input.name,
      objective: "OUTCOME_ENGAGEMENT",
      status: "PAUSED",
      special_ad_categories: [],
      is_adset_budget_sharing_enabled: false,
    },
  });
  result.campaignId = campaign.id;
  await onStep(result);

  const start = new Date(Date.now() + 15 * 60 * 1000);
  const end = new Date(start.getTime() + Math.max(input.durationDays, 2) * 24 * 60 * 60 * 1000);
  const targeting: Record<string, unknown> = {
    geo_locations: { countries: input.countries },
    age_min: input.ageMin,
    age_max: input.ageMax,
    device_platforms: ["mobile", "desktop"],
    targeting_automation: { advantage_audience: 0 },
  };
  if (input.gender !== "all") targeting.genders = [input.gender === "male" ? 1 : 2];
  if (input.interests.length) targeting.flexible_spec = [{ interests: input.interests }];

  const adset = await graph<{ id: string }>(`${adAccountId}/adsets`, token, {
    method: "POST",
    params: {
      name: `${input.name} — WhatsApp`,
      campaign_id: campaign.id,
      destination_type: "WHATSAPP",
      optimization_goal: "CONVERSATIONS",
      billing_event: "IMPRESSIONS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      daily_budget: toMinorUnits(input.dailyBudget, input.currency),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      promoted_object: input.whatsappNumber ? { page_id: input.pageId, whatsapp_phone_number: input.whatsappNumber } : { page_id: input.pageId },
      targeting,
      status: "PAUSED",
    },
  });
  result.adsetId = adset.id;
  await onStep(result);

  const images = await graph<{ images: Record<string, { hash: string }> }>(`${adAccountId}/adimages`, token, {
    method: "POST",
    params: { bytes: input.imageBytesBase64 },
  });
  const imageHash = Object.values(images.images)[0]?.hash;
  if (!imageHash) throw new MetaError("Meta did not return an image hash.");

  const iceBreakers = input.icebreakers.filter(Boolean).slice(0, 3);
  // Greeting shown when the WhatsApp chat opens, with up to three tap-to-send questions.
  const welcome = iceBreakers.length
    ? {
        type: "VISUAL_EDITOR",
        version: 2,
        landing_screen_type: "welcome_message",
        media_type: "text",
        text_format: {
          customer_action_type: "ice_breakers",
          message: { text: input.welcomeMessage, ice_breakers: iceBreakers.map((title) => ({ title })) },
        },
      }
    : undefined;

  const creative = await graph<{ id: string }>(`${adAccountId}/adcreatives`, token, {
    method: "POST",
    params: {
      name: `${input.name} — creative`,
      object_story_spec: {
        page_id: input.pageId,
        link_data: {
          name: input.headline,
          message: input.primaryText,
          description: input.description,
          image_hash: imageHash,
          link: "https://api.whatsapp.com/send",
          ...(welcome ? { page_welcome_message: welcome } : {}),
          call_to_action: { type: "WHATSAPP_MESSAGE", value: { app_destination: "WHATSAPP" } },
        },
      },
    },
  });
  result.creativeId = creative.id;
  await onStep(result);

  const ad = await graph<{ id: string }>(`${adAccountId}/ads`, token, {
    method: "POST",
    params: { name: `${input.name} — ad`, adset_id: adset.id, creative: { creative_id: creative.id }, status: "PAUSED" },
  });
  result.adId = ad.id;
  await onStep(result);
  return result;
}

export function adsManagerUrl(adAccountId: string, campaignId?: string | null) {
  const act = adAccountId.replace(/^act_/, "");
  const q = new URLSearchParams({ act });
  if (campaignId) q.set("selected_campaign_ids", campaignId);
  return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?${q}`;
}
