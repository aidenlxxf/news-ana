import { createHash } from "node:crypto";

export function generateParamsHash(
  country?: string | null,
  category?: string | null,
  query?: string | null,
): string {
  const normalized = JSON.stringify({
    country: country?.toLowerCase().trim() || null,
    category: category?.toLowerCase().trim() || null,
    query: query?.toLowerCase().trim() || null,
  });

  return createHash("sha256").update(normalized).digest("hex");
}
