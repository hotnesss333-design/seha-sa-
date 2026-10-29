import type { Config } from "@netlify/functions";

// Neutral local stub: answers any path that the legacy bundle used to send to an
// external API. No data ever leaves the site; callers receive an empty success.
export default async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(JSON.stringify({ errorCode: 0, data: [], items: [], hasNoData: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

export const config: Config = {
  path: ["/api/v2", "/api/v2/*", "/api/external-stub", "/api/external-stub/*"],
};
