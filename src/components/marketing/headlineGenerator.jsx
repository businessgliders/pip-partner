import { base44 } from "@/api/base44Client";

// Generates a unique, conversion-focused headline for a specific ad format.
// Always incorporates the brand "Pilates in Pink™ Studio".
export async function generateHeadline({ campaign, format, avoid = [] }) {
  const avoidList = avoid.filter(Boolean).slice(0, 12);
  const prompt = `You are a senior direct-response copywriter for the "Pilates in Pink™ Studio" franchise brand.
Write ONE short, conversion-focused ad headline for the "${campaign.title}" campaign.

Constraints:
- MUST naturally incorporate the brand name "Pilates in Pink™ Studio" (with the ™ symbol).
- Tailor tone and length to this ad placement: ${format.label} (${format.w}×${format.h}px, ${format.category}).
- ${format.category === "display" || format.w * format.h < 200000 ? "Keep it punchy: 4–8 words." : "Keep it under 12 words."}
- Sound aspirational, feminine, premium — not corporate.
- Make it unique. Do NOT reuse any of these previously used headlines: ${avoidList.length ? avoidList.map((h) => `"${h}"`).join(", ") : "(none)"}.
- No quotes around the headline, no emojis, no hashtags.

Return only the headline text, nothing else.`;

  const result = await base44.integrations.Core.InvokeLLM({ prompt });
  return String(result || "").trim().replace(/^["“”']+|["“”']+$/g, "");
}