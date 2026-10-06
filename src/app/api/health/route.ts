import { pingDatabase } from "@/server/services/health-service";

// Public on purpose: the load balancer calls it without a session. Never cached, so every call hits the database.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await pingDatabase();
    return Response.json({ status: "ok" });
  } catch (error) {
    console.error(
      JSON.stringify({
        action: "healthCheck",
        code: "DB_UNAVAILABLE",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    // No error details in the response: the endpoint is public.
    return Response.json({ status: "error" }, { status: 503 });
  }
}
