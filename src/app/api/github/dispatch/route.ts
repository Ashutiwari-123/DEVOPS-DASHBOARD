import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api-response";
import { dispatchWorkflow } from "@/services/github.service";

const dispatchSchema = z.object({
  workflowId: z.union([z.number().int().positive(), z.string().min(1)]),
  ref: z.string().min(1).max(255).default("main"),
  inputs: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = dispatchSchema.parse(await request.json());

    await dispatchWorkflow(payload.workflowId, payload.ref, payload.inputs);

    return apiSuccess(
      {
        message: "Workflow queued successfully",
      },
      {
        status: 202,
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid workflow dispatch request", 400);
    }

    const message =
      error instanceof Error ? error.message : "Unable to run workflow";

    return apiError(message, message.includes("not configured") ? 503 : 502);
  }
}
