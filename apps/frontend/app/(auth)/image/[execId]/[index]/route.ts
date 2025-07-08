import { getExecution } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ execId: string; index: string }> },
) {
  const { execId, index: paramIndex } = await params;

  const execution = await getExecution(execId);

  if (!execution.result) return new Response("Not found", { status: 404 });

  const index = Number.parseInt(paramIndex, 10);

  const targetArticle = execution.result.articles.at(index);

  if (!targetArticle?.urlToImage)
    return new Response("Not found", { status: 404 });

  const requestHeaders = new Headers(
    // keep only content-related, range request related headers, and accept-encoding
    [...request.headers].filter(
      ([key]) =>
        key.startsWith("content-") ||
        key.startsWith("range") ||
        key.startsWith("if-range") ||
        key === "accept-encoding" ||
        key === "accept" ||
        key === "user-agent",
    ),
  );

  const resp = await fetch(targetArticle.urlToImage, {
    headers: requestHeaders,
  });

  if (!resp.ok) {
    if (resp.status === 404) return new Response("Not found", { status: 404 });
    console.error(
      "Failed to fetch image",
      targetArticle.urlToImage,
      resp.status,
    );
    return new Response("Internal server error", { status: 500 });
  }

  const responseHeaders = new Headers(
    // keep content-related, cache-related, and range request related headers
    [...resp.headers].filter(
      ([key]) =>
        key.startsWith("content-") ||
        key.startsWith("accept-ranges") ||
        key.startsWith("cache-") ||
        key === "etag" ||
        key === "last-modified" ||
        key === "expires" ||
        key === "age",
    ),
  );

  return new Response(resp.body, {
    status: resp.status,
    headers: responseHeaders,
  });
}
