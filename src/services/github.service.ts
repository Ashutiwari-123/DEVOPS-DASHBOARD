import { env } from "@/lib/env";
import type {
  GitHubRunsSummary,
  GitHubWorkflow,
  GitHubWorkflowRun,
} from "@/types/github";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

type RawWorkflowRun = {
  id: number;
  name: string | null;
  display_title: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_branch: string | null;
  event: string;
  created_at: string;
  actor: {
    login: string;
  } | null;
};

type RawWorkflow = {
  id: number;
  name: string;
  path: string;
  state: string;
  html_url: string;
};

function getConfig() {
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
    throw new Error("GitHub integration is not configured. Check .env.local.");
  }

  return {
    token: env.GITHUB_TOKEN,
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
  };
}

async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = getConfig();

  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listWorkflowRuns(limit = 20) {
  const { owner, repo } = getConfig();
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const result = await githubRequest<{
    workflow_runs: RawWorkflowRun[];
  }>(`/repos/${owner}/${repo}/actions/runs?per_page=${safeLimit}`);

  return result.workflow_runs.map<GitHubWorkflowRun>((run) => ({
    id: run.id,
    name: run.name ?? "Workflow",
    title: run.display_title,
    status: run.status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    branch: run.head_branch,
    event: run.event,
    createdAt: run.created_at,
    actor: run.actor?.login ?? "github",
  }));
}

export function summarizeRuns(runs: GitHubWorkflowRun[]): GitHubRunsSummary {
  const completed = runs.filter((run) => run.status === "completed");

  const successful = completed.filter(
    (run) => run.conclusion === "success",
  ).length;

  const failed = completed.filter(
    (run) => run.conclusion !== null && run.conclusion !== "success",
  ).length;

  return {
    total: runs.length,
    completed: completed.length,
    successful,
    failed,
    inProgress: runs.length - completed.length,
    successRate:
      completed.length === 0
        ? 0
        : Math.round((successful / completed.length) * 100),
  };
}

export async function listWorkflows() {
  const { owner, repo } = getConfig();

  const result = await githubRequest<{
    workflows: RawWorkflow[];
  }>(`/repos/${owner}/${repo}/actions/workflows?per_page=50`);

  return result.workflows.map<GitHubWorkflow>((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    path: workflow.path,
    state: workflow.state,
    htmlUrl: workflow.html_url,
  }));
}

export async function dispatchWorkflow(
  workflowId: number | string,
  ref: string,
  inputs?: Record<string, string>,
) {
  const { owner, repo } = getConfig();

  await githubRequest<void>(
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: "POST",
      body: JSON.stringify({
        ref,
        ...(inputs ? { inputs } : {}),
      }),
    },
  );
}

export function getRepositoryUrl() {
  const { owner, repo } = getConfig();

  return `https://github.com/${owner}/${repo}`;
}
