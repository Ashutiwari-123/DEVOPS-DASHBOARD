import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import {
  getRepositoryUrl,
  listWorkflowRuns,
  summarizeRuns,
} from "@/services/github.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const requestedLimit = Number(
      request.nextUrl.searchParams.get("limit") ?? 20,
    );

    const limit = Number.isFinite(requestedLimit)
      ? requestedLimit
      : 20;

    const runs = await listWorkflowRuns(limit);

    return apiSuccess({
      repositoryUrl: getRepositoryUrl(),
      summary: summarizeRuns(runs),
      runs,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load workflow runs";

    return apiError(
      message,
      message.includes("not configured") ? 503 : 502,
    );
  }
}