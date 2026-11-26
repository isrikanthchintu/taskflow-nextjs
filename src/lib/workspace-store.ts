export const WORKSPACES_KEY = "taskflow.workspaces.v1";
export const WORKSPACE_NAME_MAX = 100;
export const WORKSPACE_TYPES = [
  "Personal",
  "Team",
  "Business",
  "Education",
  "Other"
] as const;

export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  description: string;
  createdAt: string;
}

export interface WorkspaceInput {
  name: string;
  type: string;
  description?: string;
}

export type WorkspaceResult =
  | { ok: true; workspace: Workspace }
  | { ok: false; field: "name" | "type" | "form"; error: string };

export function validateWorkspaceName(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0) return "Enter a workspace name.";
  if (name.length > WORKSPACE_NAME_MAX) {
    return `Use ${WORKSPACE_NAME_MAX} characters or fewer.`;
  }
  return null;
}

export function readWorkspaces(): Workspace[] {
  try {
    const raw = window.localStorage.getItem(WORKSPACES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Workspace[]) : [];
  } catch {
    return [];
  }
}

export function createWorkspace(input: WorkspaceInput): WorkspaceResult {
  const nameError = validateWorkspaceName(input.name);
  if (nameError) return { ok: false, field: "name", error: nameError };
  if (!WORKSPACE_TYPES.includes(input.type as WorkspaceType)) {
    return { ok: false, field: "type", error: "Choose a workspace type." };
  }

  const name = input.name.trim();
  const existing = readWorkspaces();
  if (existing.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    return {
      ok: false,
      field: "name",
      error: "A workspace with this name already exists."
    };
  }

  const workspace: Workspace = {
    id: crypto.randomUUID(),
    name,
    type: input.type as WorkspaceType,
    description: (input.description ?? "").trim(),
    createdAt: new Date().toISOString()
  };
  try {
    window.localStorage.setItem(
      WORKSPACES_KEY,
      JSON.stringify([...existing, workspace])
    );
  } catch {
    return {
      ok: false,
      field: "form",
      error: "The workspace could not be saved. Try again."
    };
  }
  return { ok: true, workspace };
}
