 import { apiError, apiSuccess } from "@/lib/api-response";
import { listWorkflows } from "@/services/github.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workflows = await listWorkflows();

    return apiSuccess({
      workflows,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load workflows";

    return apiError(
      message,
      message.includes("not configured") ? 503 : 502,
    );
  }
}