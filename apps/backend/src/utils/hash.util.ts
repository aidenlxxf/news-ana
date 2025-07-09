import { TaskParametersV1 } from "@na/schema";
import { createHash } from "node:crypto";

/**
 * Generate a hash of the task parameters. distincted by country, category, and query.
 *
 * @param params - The task parameters
 * @returns The hash of the task parameters
 */
export function generateParamsHash(
  params: Pick<TaskParametersV1, "country" | "category" | "query">,
): string {
  const normalized = JSON.stringify({
    country: params.country?.toLowerCase().trim() || null,
    category: params.category?.toLowerCase().trim() || null,
    query: params.query?.toLowerCase().trim() || null,
  });

  return createHash("sha256").update(normalized).digest("hex");
}
