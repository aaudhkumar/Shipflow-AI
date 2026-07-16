/**
 * prdVersions.content is jsonb with no zod schema in the repo (it's filled by
 * an Inngest function, not the tRPC layer), so its exact shape isn't
 * guaranteed. This pulls readable bullet lines out of whatever comes back
 * instead of assuming one structure. Tighten this once you confirm the real
 * shape from an actual generated PRD.
 */
export function extractPrdBullets(content: unknown): string[] {
  if (!content) return [];
  if (Array.isArray(content)) {
    return content.filter((v): v is string => typeof v === "string");
  }
  if (typeof content === "object") {
    const obj = content as Record<string, unknown>;
    const candidates = obj.requirements ?? obj.goals ?? obj.acceptanceCriteria ?? obj.userStories ?? obj.sections;
    if (Array.isArray(candidates)) {
      return candidates.map((c) => (typeof c === "string" ? c : (c as any)?.title ?? (c as any)?.text ?? JSON.stringify(c)));
    }
    if (typeof obj.summary === "string") return [obj.summary];
  }
  if (typeof content === "string") return [content];
  return [];
}
