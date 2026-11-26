"use client";

import { useEffect, useSyncExternalStore } from "react";
import * as ops from "@/lib/board-ops";
import { checklistComplete, runRules, type RuleEvent } from "@/lib/board-rules";
import {
  createDefaultData,
  createPlaceholderData,
  createStarterData
} from "@/lib/board-schema";
import {
  DATA_KEY,
  clearSavedData,
  readAppData,
  readRawSavedData,
  writeAppData,
  type WriteResult
} from "@/lib/board-storage";
import {
  exportBoard as exportBoardText,
  exportFileName,
  importBoard as importBoardText
} from "@/lib/board-transfer";
import type { AppData, Board, Card, Settings } from "@/types/board";

export const UNDO_MS = 10000;
export const UPDATED_IN_ANOTHER_TAB = "Updated in another tab";

export interface UndoState {
  id: number;
  message: string;
}

export interface BoardState {
  data: AppData;
  isReady: boolean;
  saveError: string | null;
  dataError: string | null;
  notice: string | null;
  undoEntry: UndoState | null;
}

type Restore = (data: AppData) => ops.OpResult;
type ApplyOptions = {
  event?: (
    id: string | undefined,
    before: AppData,
    after: AppData
  ) => RuleEvent | null;
  undo?: { message: string; restore: Restore };
  clearUndo?: boolean;
};

const emptyData = createPlaceholderData();
const emptySnapshot: BoardState = {
  data: emptyData,
  isReady: false,
  saveError: null,
  dataError: null,
  notice: null,
  undoEntry: null
};

let snapshot: BoardState = emptySnapshot;
let loadStarted = false;
let undoRestore: Restore | null = null;
let undoTimer: ReturnType<typeof setTimeout> | null = null;
let undoSequence = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(changes: Partial<BoardState>) {
  snapshot = { ...snapshot, ...changes };
  emit();
}

function failure(error: string): ops.OpResult {
  return { ok: false, error };
}

function describeWrite(result: WriteResult): string | null {
  if (result === "ok") return null;
  if (result === "full")
    return "Browser storage is full. This change was not saved. Your earlier saved data is intact.";
  if (result === "blocked")
    return "Saved data could not be read, so nothing is saved. Your stored data is untouched.";
  return "Browser storage is unavailable. This change was not saved. Your earlier saved data is intact.";
}

function clearUndoTimer() {
  if (undoTimer !== null) clearTimeout(undoTimer);
  undoTimer = null;
}

function dropUndo(): Partial<BoardState> {
  clearUndoTimer();
  undoRestore = null;
  return { undoEntry: null };
}

function startUndo(message: string, restore: Restore): UndoState {
  clearUndoTimer();
  undoSequence += 1;
  const entry = { id: undoSequence, message };
  undoRestore = restore;
  undoTimer = setTimeout(() => {
    undoTimer = null;
    undoRestore = null;
    if (snapshot.undoEntry?.id === entry.id) setSnapshot({ undoEntry: null });
  }, UNDO_MS);
  return entry;
}

function apply(
  change: (data: AppData) => ops.OpResult,
  options: ApplyOptions = {}
): ops.OpResult {
  if (!snapshot.isReady) return failure("The board is still loading.");
  if (snapshot.dataError)
    return failure(
      "Your saved data could not be read, so changes are switched off."
    );
  const before = snapshot.data;
  const result = change(before);
  if (!result.ok) return result;

  let next = result.data;
  const event = options.event?.(result.id, before, next) ?? null;
  if (event) next = runRules(next, before.activeBoardId, event).data;

  const saveError = describeWrite(writeAppData(next));
  const undoChanges: Partial<BoardState> = options.undo
    ? { undoEntry: startUndo(options.undo.message, options.undo.restore) }
    : options.clearUndo
      ? dropUndo()
      : {};
  setSnapshot({ data: next, saveError, notice: null, ...undoChanges });
  return result.id === undefined
    ? { ok: true, data: next }
    : { ok: true, data: next, id: result.id };
}

function onActive<A extends unknown[]>(
  op: (data: AppData, boardId: string, ...args: A) => ops.OpResult
): (...args: A) => ops.OpResult {
  return (...args: A) => apply((data) => op(data, data.activeBoardId, ...args));
}

function findBoard(
  data: AppData,
  boardId: string = data.activeBoardId
): Board | undefined {
  return data.boards.find((board) => board.id === boardId);
}

function findCard(data: AppData, cardId: string): Card | undefined {
  return findBoard(data)?.cards.find((card) => card.id === cardId);
}

function enteredList(listId: string): ApplyOptions["event"] {
  return (id) =>
    id ? { kind: "card-entered-list", cardId: id, listId } : null;
}

function addCard(listId: string, input: ops.CardInput) {
  return apply((data) => ops.addCard(data, data.activeBoardId, listId, input), {
    event: enteredList(listId)
  });
}

function createCardFromTemplate(templateId: string, listId: string) {
  return apply(
    (data) =>
      ops.createCardFromTemplate(data, data.activeBoardId, templateId, listId),
    {
      event: enteredList(listId)
    }
  );
}

function moveCard(cardId: string, toListId: string, index?: number) {
  return apply(
    (data) => ops.moveCard(data, data.activeBoardId, cardId, toListId, index),
    {
      event: (_id, before) =>
        findCard(before, cardId)?.listId !== toListId
          ? { kind: "card-entered-list", cardId, listId: toListId }
          : null
    }
  );
}

function updateChecklistItem(
  cardId: string,
  checklistId: string,
  itemId: string,
  updates: { text?: string; checked?: boolean }
) {
  return apply(
    (data) =>
      ops.updateChecklistItem(
        data,
        data.activeBoardId,
        cardId,
        checklistId,
        itemId,
        updates
      ),
    {
      event: (_id, before, after) => {
        const beforeCard = findCard(before, cardId);
        const afterCard = findCard(after, cardId);
        return beforeCard &&
          afterCard &&
          !checklistComplete(beforeCard) &&
          checklistComplete(afterCard)
          ? { kind: "checklist-completed", cardId }
          : null;
      }
    }
  );
}

function deleteCard(cardId: string) {
  const before = snapshot.data;
  const boardId = before.activeBoardId;
  const board = findBoard(before);
  const index = board
    ? board.cards.findIndex((card) => card.id === cardId)
    : -1;
  const card = board && index >= 0 ? board.cards[index] : undefined;
  return apply((data) => ops.deleteCard(data, data.activeBoardId, cardId), {
    undo: card
      ? {
          message: "Card deleted",
          restore: (data) => ops.reinsertCard(data, boardId, card, index)
        }
      : undefined
  });
}

function deleteArchivedCard(cardId: string) {
  return apply(
    (data) => {
      const card = findCard(data, cardId);
      if (!card) return failure("That card was not found.");
      if (!card.archived)
        return failure("Only an archived card can be deleted permanently.");
      return ops.deleteCard(data, data.activeBoardId, cardId);
    },
    { clearUndo: true }
  );
}

function archiveCard(cardId: string) {
  const boardId = snapshot.data.activeBoardId;
  return apply((data) => ops.archiveCard(data, data.activeBoardId, cardId), {
    undo: {
      message: "Card archived",
      restore: (data) => ops.restoreCard(data, boardId, cardId)
    }
  });
}

function archiveList(listId: string) {
  const boardId = snapshot.data.activeBoardId;
  return apply((data) => ops.archiveList(data, data.activeBoardId, listId), {
    undo: {
      message: "List archived",
      restore: (data) => ops.restoreList(data, boardId, listId)
    }
  });
}

function archiveBoard(boardId: string) {
  return apply((data) => ops.archiveBoard(data, boardId), {
    undo: {
      message: "Board archived",
      restore: (data) => {
        const restored = ops.restoreBoard(data, boardId);
        return restored.ok ? ops.switchBoard(restored.data, boardId) : restored;
      }
    }
  });
}

function switchBoard(boardId: string) {
  return apply((data) => ops.switchBoard(data, boardId), { clearUndo: true });
}

function createBoard(name: string) {
  return apply(
    (data) => {
      const created = ops.createBoard(data, name);
      if (!created.ok || !created.id) return created;
      const switched = ops.switchBoard(created.data, created.id);
      return switched.ok ? { ...switched, id: created.id } : switched;
    },
    { clearUndo: true }
  );
}

function importBoard(text: string) {
  return apply((data) => {
    const imported = importBoardText(data, text);
    return imported.ok
      ? { ok: true, data: imported.data, id: imported.id }
      : failure(imported.error);
  });
}

function exportBoardFile(
  boardId?: string
): { fileName: string; text: string } | null {
  const data = snapshot.data;
  const board = findBoard(data, boardId);
  if (!board) return null;
  return {
    fileName: exportFileName(board),
    text: exportBoardText(data, board.id)
  };
}

function updateSettings(updates: Partial<Settings>) {
  return apply((data) => ops.updateSettings(data, updates));
}

function undo(): ops.OpResult {
  const restore = undoRestore;
  if (!restore) return failure("There is nothing to undo.");
  const result = restore(snapshot.data);
  if (!result.ok) {
    setSnapshot(dropUndo());
    return result;
  }
  const saveError = describeWrite(writeAppData(result.data));
  setSnapshot({ data: result.data, saveError, notice: null, ...dropUndo() });
  return result;
}

function dismissNotice() {
  setSnapshot({ notice: null });
}

function dismissSaveError() {
  setSnapshot({ saveError: null });
}

function backupSavedData(): { fileName: string; text: string } | null {
  const text = readRawSavedData();
  if (text === null) return null;
  const stamp = new Date().toISOString().slice(0, 10);
  return { fileName: `taskflow-backup-${stamp}.json`, text };
}

function resetSavedData(): ops.OpResult {
  if (!snapshot.dataError) return failure("Your saved data is readable.");
  if (!clearSavedData())
    return failure("Browser storage could not be cleared.");
  const starter = createStarterData();
  setSnapshot({
    data: starter,
    isReady: true,
    saveError: describeWrite(writeAppData(starter)),
    dataError: null,
    notice: null,
    ...dropUndo()
  });
  return { ok: true, data: starter };
}

function unreadableMessage(reason: string): string {
  return `Your saved data could not be read, so nothing will be saved until it is fixed. ${reason}`;
}

function loadOnce() {
  if (loadStarted) return;
  loadStarted = true;
  const result = readAppData();
  if (result.status === "ok") {
    setSnapshot({
      data: result.data,
      isReady: true,
      saveError: null,
      dataError: null
    });
    return;
  }
  if (result.status === "missing") {
    const starter = createStarterData();
    setSnapshot({
      data: starter,
      isReady: true,
      saveError: describeWrite(writeAppData(starter)),
      dataError: null
    });
    return;
  }
  setSnapshot({
    data: createDefaultData(),
    isReady: true,
    saveError: null,
    dataError: unreadableMessage(result.reason)
  });
}

function onStorage(event: StorageEvent) {
  if (!snapshot.isReady) return;
  if (event.key !== null && event.key !== DATA_KEY) return;
  const result = readAppData();
  if (result.status === "ok") {
    setSnapshot({
      data: result.data,
      dataError: null,
      notice: UPDATED_IN_ANOTHER_TAB,
      ...dropUndo()
    });
  } else if (result.status === "unreadable") {
    setSnapshot({ dataError: unreadableMessage(result.reason), ...dropUndo() });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (typeof window !== "undefined")
        window.removeEventListener("storage", onStorage);
      clearUndoTimer();
      undoRestore = null;
      loadStarted = false;
      snapshot = emptySnapshot;
    }
  };
}

function getSnapshot(): BoardState {
  return snapshot;
}

function getServerSnapshot(): BoardState {
  return emptySnapshot;
}

const actions = {
  addList: onActive(ops.addList),
  renameList: onActive(ops.renameList),
  reorderList: onActive(ops.reorderList),
  setListLimit: onActive(ops.setListLimit),
  setListDone: onActive(ops.setListDone),
  archiveList,
  restoreList: onActive(ops.restoreList),
  deleteArchivedList: onActive(ops.deleteArchivedList),
  addCard,
  updateCard: onActive(ops.updateCard),
  moveCard,
  reorderCard: onActive(ops.reorderCard),
  archiveCard,
  restoreCard: onActive(ops.restoreCard),
  duplicateCard: onActive(ops.duplicateCard),
  deleteCard,
  deleteArchivedCard,
  addLabel: onActive(ops.addLabel),
  renameLabel: onActive(ops.renameLabel),
  recolorLabel: onActive(ops.recolorLabel),
  deleteLabel: onActive(ops.deleteLabel),
  addChecklist: onActive(ops.addChecklist),
  renameChecklist: onActive(ops.renameChecklist),
  deleteChecklist: onActive(ops.deleteChecklist),
  addChecklistItem: onActive(ops.addChecklistItem),
  updateChecklistItem,
  reorderChecklistItem: onActive(ops.reorderChecklistItem),
  deleteChecklistItem: onActive(ops.deleteChecklistItem),
  saveAsTemplate: onActive(ops.saveAsTemplate),
  createCardFromTemplate,
  deleteTemplate: onActive(ops.deleteTemplate),
  createBoard,
  renameBoard: (boardId: string, name: string) =>
    apply((data) => ops.renameBoard(data, boardId, name)),
  archiveBoard,
  restoreBoard: (boardId: string) =>
    apply((data) => ops.restoreBoard(data, boardId)),
  deleteArchivedBoard: (boardId: string) =>
    apply((data) => ops.deleteArchivedBoard(data, boardId)),
  switchBoard,
  setBoardBackground: onActive(ops.setBoardBackground),
  updateSettings,
  addRule: onActive(ops.addRule),
  renameRule: onActive(ops.renameRule),
  setRuleEnabled: onActive(ops.setRuleEnabled),
  deleteRule: onActive(ops.deleteRule),
  importBoard,
  exportBoardFile,
  undo,
  backupSavedData,
  resetSavedData,
  dismissNotice,
  dismissSaveError
};

export function useBoard() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    loadOnce();
  }, []);

  const board =
    state.data.boards.find((item) => item.id === state.data.activeBoardId) ??
    state.data.boards[0];

  return { ...state, board, ...actions };
}
