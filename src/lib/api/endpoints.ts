import { apiRequest, type ApiSession } from "@/lib/api/client";

export type BoardVisibility = "private" | "workspace" | "public";

export interface ApiWorkspace {
  id: string;
  name: string;
  description: string;
  type: string;
  role: "admin" | "member";
}

export interface ApiBoardSummary {
  id: string;
  workspaceId: string;
  name: string;
  background: string;
  visibility: BoardVisibility;
  isClosed: boolean;
  role: "admin" | "member" | "observer";
  starred?: boolean;
}

export interface ApiLabel {
  id: string;
  name: string;
  color: string;
}

export interface ApiCardSummary {
  id: string;
  title: string;
  listId: string;
  position: string;
  version: number;
  labels: ApiLabel[];
  memberIds: string[];
  checklistCount: number;
  checklistCompletedCount: number;
  attachmentCount: number;
  dueAt: string | null;
  dueComplete: boolean;
  isComplete: boolean;
  lastActivityAt: string | null;
}

export interface ApiListWithCards {
  id: string;
  name: string;
  position: string;
  cards: ApiCardSummary[];
}

export interface ApiBoard extends ApiBoardSummary {
  permissions: { read: boolean; comment: boolean; edit: boolean; manage: boolean; admin: boolean };
  members: Array<{ userId: string; name: string | null; role: string }>;
  lists: ApiListWithCards[];
}

export interface ApiActivity {
  id: string;
  type: string;
  actorId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const api = {
  register: (input: { email: string; name: string; password: string }) =>
    apiRequest<ApiSession>("/auth/register", { method: "POST", body: input, auth: false }),
  login: (input: { email: string; password: string }) =>
    apiRequest<ApiSession>("/auth/login", { method: "POST", body: input, auth: false }),
  workspaces: () => apiRequest<ApiWorkspace[]>("/workspaces"),
  createWorkspace: (input: { name: string; description?: string; type?: string }) =>
    apiRequest<ApiWorkspace>("/workspaces", { method: "POST", body: input }),
  workspaceBoards: (workspaceId: string, closed = false) =>
    apiRequest<ApiBoardSummary[]>(`/workspaces/${workspaceId}/boards${closed ? "?closed=true" : ""}`),
  createBoard: (input: { workspaceId: string; name: string; visibility?: BoardVisibility }) =>
    apiRequest<ApiBoardSummary>("/boards", { method: "POST", body: input }),
  board: (boardId: string) => apiRequest<ApiBoard>(`/boards/${boardId}`),
  recordView: (boardId: string) => apiRequest<unknown>(`/boards/${boardId}/views`, { method: "POST" }),
  closeBoard: (boardId: string) => apiRequest<ApiBoardSummary>(`/boards/${boardId}/close`, { method: "POST" }),
  reopenBoard: (boardId: string) => apiRequest<ApiBoardSummary>(`/boards/${boardId}/reopen`, { method: "POST" }),
  starBoard: (boardId: string) => apiRequest<unknown>(`/boards/${boardId}/star`, { method: "POST" }),
  unstarBoard: (boardId: string) => apiRequest<void>(`/boards/${boardId}/star`, { method: "DELETE" }),
  createList: (boardId: string, name: string) =>
    apiRequest<{ id: string }>(`/boards/${boardId}/lists`, { method: "POST", body: { name } }),
  createCard: (boardId: string, input: { listId: string; title: string }) =>
    apiRequest<{ id: string }>(`/boards/${boardId}/cards`, { method: "POST", body: input }),
  moveCard: (cardId: string, input: { listId: string; position: string; expectedVersion?: number }) =>
    apiRequest<unknown>(`/cards/${cardId}/move`, { method: "POST", body: input }),
  setCardComplete: (cardId: string, complete: boolean) =>
    apiRequest<unknown>(`/cards/${cardId}/${complete ? "complete" : "uncomplete"}`, { method: "POST" }),
  archiveCard: (cardId: string) => apiRequest<unknown>(`/cards/${cardId}/archive`, { method: "POST" }),
  boardActivity: (boardId: string) =>
    apiRequest<{ items: ApiActivity[]; nextCursor: string | null }>(`/boards/${boardId}/activity?limit=15`)
};
