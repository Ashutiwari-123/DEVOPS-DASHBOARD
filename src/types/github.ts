export type GitHubWorkflowRun = {
  id: number;
  name: string;
  title: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  branch: string | null;
  event: string;
  createdAt: string;
  actor: string;
};

export type GitHubRunsSummary = {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  inProgress: number;
  successRate: number;
};

export type GitHubWorkflow = {
  id: number;
  name: string;
  path: string;
  state: string;
  htmlUrl: string;
};