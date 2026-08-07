 "use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  GitHubRunsSummary,
  GitHubWorkflow,
  GitHubWorkflowRun,
} from "@/types/github";

type RunsResponse = {
  success: boolean;
  data?: {
    repositoryUrl: string;
    summary: GitHubRunsSummary;
    runs: GitHubWorkflowRun[];
  };
  error?: {
    message: string;
  };
};

type WorkflowsResponse = {
  success: boolean;
  data?: {
    workflows: GitHubWorkflow[];
  };
  error?: {
    message: string;
  };
};

type RunFilter = "all" | "success" | "failed";

const emptySummary: GitHubRunsSummary = {
  total: 0,
  completed: 0,
  successful: 0,
  failed: 0,
  inProgress: 0,
  successRate: 0,
};

function getRunStatus(run: GitHubWorkflowRun) {
  if (run.status !== "completed") {
    return {
      label: run.status.replaceAll("_", " "),
      className: "bg-amber-500/10 text-amber-300",
    };
  }

  if (run.conclusion === "success") {
    return {
      label: "success",
      className: "bg-emerald-500/10 text-emerald-300",
    };
  }

  return {
    label: run.conclusion ?? "failed",
    className: "bg-rose-500/10 text-rose-300",
  };
}

export function DevOpsDashboard() {
  const [summary, setSummary] =
    useState<GitHubRunsSummary>(emptySummary);

  const [runs, setRuns] =
    useState<GitHubWorkflowRun[]>([]);

  const [workflows, setWorkflows] =
    useState<GitHubWorkflow[]>([]);

  const [repositoryUrl, setRepositoryUrl] =
    useState("#");

  const [filter, setFilter] =
    useState<RunFilter>("all");

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [runsResponse, workflowsResponse] =
        await Promise.all([
          fetch("/api/github/runs?limit=20", {
            cache: "no-store",
          }),
          fetch("/api/github/workflows", {
            cache: "no-store",
          }),
        ]);

      const runsBody =
        (await runsResponse.json()) as RunsResponse;

      const workflowsBody =
        (await workflowsResponse.json()) as WorkflowsResponse;

      if (!runsResponse.ok || !runsBody.data) {
        throw new Error(
          runsBody.error?.message ??
            "Unable to load GitHub runs",
        );
      }

      if (
        !workflowsResponse.ok ||
        !workflowsBody.data
      ) {
        throw new Error(
          workflowsBody.error?.message ??
            "Unable to load GitHub workflows",
        );
      }

      setSummary(runsBody.data.summary);
      setRuns(runsBody.data.runs);
      setRepositoryUrl(
        runsBody.data.repositoryUrl,
      );
      setWorkflows(
        workflowsBody.data.workflows,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load GitHub data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void loadDashboard(),
      0,
    );

    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const visibleRuns = useMemo(() => {
    if (filter === "success") {
      return runs.filter(
        (run) => run.conclusion === "success",
      );
    }

    if (filter === "failed") {
      return runs.filter(
        (run) =>
          run.status === "completed" &&
          run.conclusion !== "success",
      );
    }

    return runs;
  }, [filter, runs]);

  async function runWorkflow() {
    const workflow = workflows.find(
      (item) =>
        item.name === "CI" &&
        item.state === "active",
    );

    if (!workflow) {
      setMessage(
        "No active CI workflow was found.",
      );
      return;
    }

    setRunning(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/github/dispatch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflowId: workflow.id,
            ref: "main",
          }),
        },
      );

      const body = (await response.json()) as {
        success: boolean;
        data?: {
          message: string;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok) {
        throw new Error(
          body.error?.message ??
            "Unable to start workflow",
        );
      }

      setMessage(
        body.data?.message ??
          "Workflow queued successfully",
      );

      window.setTimeout(
        () => void loadDashboard(),
        3000,
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to start workflow",
      );
    } finally {
      setRunning(false);
    }
  }

  const metrics = [
    {
      label: "Services",
      value: error ? "0" : "1",
      hint: "Connected GitHub repository",
      onClick: () =>
        window.open(
          repositoryUrl,
          "_blank",
          "noopener,noreferrer",
        ),
    },
    {
      label: "Workflow runs",
      value: loading ? "..." : String(summary.total),
      hint: "Latest GitHub Actions activity",
      onClick: () => setFilter("all"),
    },
    {
      label: "Success rate",
      value: loading
        ? "..."
        : `${summary.successRate}%`,
      hint: `${summary.successful} successful runs`,
      onClick: () => setFilter("success"),
    },
    {
      label: "Open alerts",
      value: loading
        ? "..."
        : String(summary.failed),
      hint:
        summary.failed === 0
          ? "All clear"
          : "Failed recent runs",
      onClick: () => setFilter("failed"),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-emerald-400 uppercase">
              DevOps Control Center
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Operations overview
            </h1>

            <p className="mt-3 text-slate-400">
              Live GitHub Actions workflow health
              and activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => void runWorkflow()}
              disabled={
                loading ||
                running ||
                Boolean(error)
              }
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {running
                ? "Starting..."
                : "Run workflow"}
            </button>
          </div>
        </header>

        {(error || message) && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                : "border-sky-500/30 bg-sky-500/10 text-sky-200"
            }`}
          >
            {error ?? message}
          </div>
        )}

        <section className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <button
              key={metric.label}
              type="button"
              onClick={metric.onClick}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-600"
            >
              <p className="text-sm text-slate-400">
                {metric.label}
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {metric.value}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {metric.hint}
              </p>
            </button>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Recent activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Showing {filter} runs
                </p>
              </div>

              <a
                href={`${repositoryUrl}/actions`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-emerald-400"
              >
                View GitHub ↗
              </a>
            </div>

            <div className="mt-5 space-y-3">
              {!loading &&
                visibleRuns.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                    No workflow runs found.
                  </p>
                )}

              {visibleRuns
                .slice(0, 8)
                .map((run) => {
                  const status =
                    getRunStatus(run);

                  return (
                    <a
                      key={run.id}
                      href={run.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-600 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {run.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {run.name} ·{" "}
                          {run.branch ?? "no branch"} ·{" "}
                          {run.actor}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs capitalize ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </a>
                  );
                })}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">
              Integration status
            </h2>

            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex justify-between border-b border-slate-800 pb-4">
                <span>GitHub API</span>
                <span>
                  {error
                    ? "Setup required"
                    : "Connected"}
                </span>
              </li>

              <li className="flex justify-between border-b border-slate-800 pb-4">
                <span>Active workflows</span>
                <span>
                  {
                    workflows.filter(
                      (workflow) =>
                        workflow.state === "active",
                    ).length
                  }
                </span>
              </li>

              <li className="flex justify-between border-b border-slate-800 pb-4">
                <span>Runs in progress</span>
                <span>{summary.inProgress}</span>
              </li>

              <li className="flex justify-between">
                <span>MongoDB</span>
                <span>Next milestone</span>
              </li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}