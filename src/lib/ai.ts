import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getMarketingPackages } from "./content";

export const isAiConfigured = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/** What Claude returns for a click-to-WhatsApp campaign. Limits are enforced after parsing. */
export const AdPlanSchema = z.object({
  campaign_name: z.string().describe("Short internal campaign name, e.g. 'Web dev — Muscat — Oct'"),
  headline: z.string().describe("Ad headline, max 40 characters"),
  primary_text: z.string().describe("Primary ad text, 2-4 short lines, max 400 characters"),
  description: z.string().describe("Link description, max 30 characters"),
  welcome_message: z.string().describe("Greeting shown when the WhatsApp chat opens, max 200 characters"),
  icebreakers: z.array(z.string()).describe("Exactly 3 short questions a customer can tap, max 60 characters each"),
  age_min: z.number().int().describe("Minimum audience age, 18-65"),
  age_max: z.number().int().describe("Maximum audience age, 18-65"),
  gender: z.enum(["all", "male", "female"]),
  countries: z.array(z.string()).describe("ISO 3166-1 alpha-2 country codes"),
  interests: z.array(z.string()).describe("3-6 Meta detailed-targeting interest names in English, e.g. 'Small business', 'Entrepreneurship'"),
  rationale: z.string().describe("2-4 sentences in Arabic explaining the strategy for the dashboard user"),
  tips: z.array(z.string()).describe("2-4 practical tips in Arabic: creative, timing, follow-up"),
});

export type AdPlan = z.infer<typeof AdPlanSchema>;

export type AdBrief = {
  service: string;
  goal: string;
  audience: string;
  countries: string[];
  dailyBudget: number;
  currency: string;
  durationDays: number;
  language: "ar" | "en";
  offer?: string;
};

const SYSTEM = `You are a senior performance marketer at Bariq Digital Agency (وكالة بريق الرقمية), based in Oman and serving the Gulf.
Bariq offers digital marketing, graphic design, website development and mobile app development.
You draft Meta (Facebook/Instagram) click-to-WhatsApp campaigns for Bariq's own services: the ad opens a WhatsApp chat with Bariq.

Write ad copy that:
- speaks to business owners in the Gulf in clear, warm Modern Standard Arabic (or natural English when asked), with a single concrete benefit and a clear invitation to message on WhatsApp;
- respects Meta advertising policies: no exaggerated or unverifiable claims, no guaranteed results, no "you"-statements that assert personal attributes, no all-caps or excessive punctuation, no emoji spam (one or two at most);
- uses the real offer and prices you are given and never invents discounts, statistics, client names or awards.

Targeting: be realistic for the budget. Prefer broad, high-intent interests (business owners, entrepreneurship, small business, e-commerce, marketing) over narrow ones.`;

function clamp(text: string, max: number) {
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

/** Keeps the plan within Meta's limits whatever the model returned. */
export function normalizePlan(plan: AdPlan, fallbackCountries: string[]): AdPlan {
  const ageMin = Math.min(Math.max(Math.round(plan.age_min) || 18, 18), 65);
  const ageMax = Math.min(Math.max(Math.round(plan.age_max) || 65, ageMin), 65);
  const countries = plan.countries.map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c));
  return {
    ...plan,
    campaign_name: clamp(plan.campaign_name, 100),
    headline: clamp(plan.headline, 40),
    primary_text: clamp(plan.primary_text, 500),
    description: clamp(plan.description, 30),
    welcome_message: clamp(plan.welcome_message, 200),
    icebreakers: plan.icebreakers.map((q) => clamp(q, 80)).filter(Boolean).slice(0, 3),
    age_min: ageMin,
    age_max: ageMax,
    countries: countries.length ? countries : fallbackCountries,
    interests: plan.interests.map((i) => i.trim()).filter(Boolean).slice(0, 6),
    tips: plan.tips.slice(0, 4),
  };
}

export class AiError extends Error {}

export async function generateAdPlan(brief: AdBrief): Promise<AdPlan> {
  const client = new Anthropic();
  const packages = getMarketingPackages("ar")
    .map((p) => `- ${p.name}: ${p.price} OMR/month — ${p.features.join("، ")}`)
    .join("\n");

  const request = `Draft a click-to-WhatsApp campaign.

Service to promote: ${brief.service}
Business goal: ${brief.goal}
Target audience (in the client's words): ${brief.audience || "Business owners and entrepreneurs"}
Countries: ${brief.countries.join(", ")}
Daily budget: ${brief.dailyBudget} ${brief.currency} for ${brief.durationDays} days
Ad language: ${brief.language === "ar" ? "Arabic" : "English"} (headline, primary text, description, welcome message and icebreakers all in this language)
Offer or notes: ${brief.offer || "Free 30-minute consultation"}

Bariq's monthly marketing packages, for reference (only mention prices if relevant to the service):
${packages}`;

  let response;
  try {
    response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "medium", format: betaZodOutputFormat(AdPlanSchema) },
      messages: [{ role: "user", content: request }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new AiError("مفتاح Anthropic API غير صالح. راجع ANTHROPIC_API_KEY.");
    if (error instanceof Anthropic.RateLimitError) throw new AiError("تم تجاوز حد الطلبات مؤقتاً. حاول بعد دقيقة.");
    if (error instanceof Anthropic.APIError) throw new AiError(`تعذّر الاتصال بالذكاء الاصطناعي (${error.status}).`);
    throw error;
  }

  if (response.stop_reason === "refusal") throw new AiError("رفض الذكاء الاصطناعي إنشاء هذه الحملة. عدّل وصف الهدف وحاول مجدداً.");
  if (!response.parsed_output) throw new AiError("لم يُرجع الذكاء الاصطناعي خطة صالحة. حاول مرة أخرى.");
  return normalizePlan(response.parsed_output, brief.countries);
}
