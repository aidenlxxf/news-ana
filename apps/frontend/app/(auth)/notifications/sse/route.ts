const BACKEND_HOST = process.env.BACKEND_HOST || "http://localhost:3001";

export function GET(request: Request) {
  console.log("request", Object.fromEntries(request.headers));
  return fetch(`${BACKEND_HOST}/notifications/sse`, {
    headers: request.headers,
    signal: request.signal,
    body: request.body,
  });
}
