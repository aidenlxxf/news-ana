import { createHash } from "node:crypto";

export function generateParamsHash(
  country?: string,
  category?: string,
  query?: string,
): string {
  const normalized = JSON.stringify({
    country: country?.toLowerCase().trim() || null,
    category: category?.toLowerCase().trim() || null,
    query: query?.toLowerCase().trim() || null,
  });

  return createHash("sha256").update(normalized).digest("hex");
}
