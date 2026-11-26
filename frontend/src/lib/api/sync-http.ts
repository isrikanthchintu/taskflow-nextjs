import { apiRequest } from "@/lib/api/client";
import type { BoardSnapshot, SyncApi } from "@/lib/api/board-sync";

const post = (path: string, body?: unknown) => apiRequest<unknown>(path, { method: "POST", body });
const patch = (path: string, body: unknown) => apiRequest<unknown>(path, { method: "PATCH", body });
const remove = (path: string) => apiRequest<unknown>(path, { method: "DELETE" });

export const httpSyncApi: SyncApi = {
  snapshot: (boardId) => apiRequest<BoardSnapshot>(`/boards/${boardId}/snapshot`),
  patchBoard: (boardId, body) => patch(`/boards/${boardId}`, body),
  closeBoard: (boardId) => post(`/boards/${boardId}/close`),
  reopenBoard: (boardId) => post(`/boards/${boardId}/reopen`),
  createList: (boardId, body) => post(`/boards/${boardId}/lists`, body),
  patchList: (listId, body) => patch(`/lists/${listId}`, body),
  moveList: (listId, position) => post(`/lists/${listId}/move`, { position }),
  archiveList: (listId) => post(`/lists/${listId}/archive`),
  restoreList: (listId) => post(`/lists/${listId}/restore`),
  deleteList: (listId) => remove(`/lists/${listId}`),
  createCard: (boardId, body) => post(`/boards/${boardId}/cards`, body),
  patchCard: (cardId, body) => patch(`/cards/${cardId}`, body),
  moveCard: (cardId, listId, position) => post(`/cards/${cardId}/move`, { listId, position }),
  archiveCard: (cardId) => post(`/cards/${cardId}/archive`),
  restoreCard: (cardId) => post(`/cards/${cardId}/restore`),
  deleteCard: (cardId) => remove(`/cards/${cardId}`)
};
