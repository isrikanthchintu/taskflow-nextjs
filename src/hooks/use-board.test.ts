import { act, renderHook } from "@testing-library/react";
import { UNDO_MS, UPDATED_IN_ANOTHER_TAB, useBoard } from "@/hooks/use-board";
import { createDefaultData, newCard, newLabel } from "@/lib/board-schema";
import { cardsInList } from "@/lib/board-query";
import {
  DATA_KEY,
  LEGACY_KEY,
  readAppData,
  writeAppData
} from "@/lib/board-storage";
import type { AppData } from "@/types/board";
import type { Task } from "@/types/task";

const legacyTask: Task = {
  id: "stored-1",
  title: "Review pull request",
  description: "Check the open PR for the onboarding flow.",
  status: "in-progress",
  priority: "high",
  dueDate: "2026-11-25",
  createdAt: "2026-11-16T09:00:00.000Z"
};

function stored(): AppData {
  const result = readAppData();
  if (result.status !== "ok") throw new Error("expected stored data");
  return result.data;
}

function seedStorage(titles: string[]): AppData {
  const data = createDefaultData();
  const board = data.boards[0];
  board.cards = titles.map((title) =>
    newCard(board.lists[0].id, {
      title,
      createdAt: `2026-11-0${titles.indexOf(title) + 1}T00:00:00.000Z`
    })
  );
  writeAppData(data);
  return data;
}

function titlesIn(data: AppData, listIndex: number): string[] {
  const board = data.boards[0];
  return cardsInList(board, board.lists[listIndex].id).map(
    (card) => card.title
  );
}

describe("useBoard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("FR1.1 NFR5 on first run with no saved data seeds starter cards and writes them to storage", () => {
    const { result } = renderHook(() => useBoard());
    expect(result.current.isReady).toBe(true);
    expect(result.current.board.cards.length).toBeGreaterThan(0);
    expect(stored()).toEqual(result.current.data);
  });

  it("FR1.2 loads the old v1 tasks, converts them once and leaves v1 untouched", () => {
    const raw = JSON.stringify([legacyTask]);
    window.localStorage.setItem(LEGACY_KEY, raw);
    const { result } = renderHook(() => useBoard());
    expect(result.current.board.cards.map((card) => card.id)).toEqual([
      "stored-1"
    ]);
    const list = result.current.board.lists.find(
      (item) => item.id === result.current.board.cards[0].listId
    );
    expect(list?.name).toBe("In progress");
    expect(window.localStorage.getItem(LEGACY_KEY)).toBe(raw);
    expect(stored().boards).toHaveLength(1);
  });

  it("FR1.1 loads already-stored v2 data on mount", () => {
    const data = seedStorage(["Stored card"]);
    const { result } = renderHook(() => useBoard());
    expect(result.current.data).toEqual(data);
  });

  it("FR1.1 addCard updates state and persists through a remount", () => {
    seedStorage([]);
    const { result, unmount } = renderHook(() => useBoard());
    const listId = result.current.board.lists[0].id;
    act(() => {
      result.current.addCard(listId, {
        title: "Draft proposal",
        priority: "medium",
        dueDate: "2026-12-01"
      });
    });
    expect(result.current.board.cards[0].title).toBe("Draft proposal");
    expect(stored()).toEqual(result.current.data);
    unmount();
    const again = renderHook(() => useBoard());
    expect(again.result.current.board.cards[0].title).toBe("Draft proposal");
  });

  it("FR1.1 ported: moveCard to another list puts the card after the cards already there", () => {
    seedStorage(["a", "b"]);
    const { result } = renderHook(() => useBoard());
    const [todo, progress] = result.current.board.lists;
    const [first, second] = result.current.board.cards;
    act(() => {
      result.current.moveCard(first.id, progress.id);
    });
    act(() => {
      result.current.moveCard(second.id, progress.id);
    });
    expect(titlesIn(result.current.data, 1)).toEqual(["a", "b"]);
    expect(titlesIn(result.current.data, 0)).toEqual([]);
    expect(todo.id).not.toBe(progress.id);
    expect(stored()).toEqual(result.current.data);
  });

  it("FR1.1 ported: moveCard to the card's own list leaves the order unchanged", () => {
    seedStorage(["a", "b"]);
    const { result } = renderHook(() => useBoard());
    const [first] = result.current.board.cards;
    act(() => {
      result.current.moveCard(first.id, first.listId);
    });
    expect(titlesIn(result.current.data, 0)).toEqual(["a", "b"]);
  });

  it("FR1.1 ported: reorderCard moves a card within its list", () => {
    seedStorage(["a", "b", "c"]);
    const { result } = renderHook(() => useBoard());
    const last = result.current.board.cards[2];
    act(() => {
      result.current.reorderCard(last.id, 0);
    });
    expect(titlesIn(result.current.data, 0)).toEqual(["c", "a", "b"]);
    expect(stored()).toEqual(result.current.data);
  });

  it("FR1.1 ported: updateCard and deleteCard persist", () => {
    seedStorage(["a", "b"]);
    const { result } = renderHook(() => useBoard());
    const [first, second] = result.current.board.cards;
    act(() => {
      result.current.updateCard(first.id, { title: "renamed" });
    });
    act(() => {
      result.current.deleteCard(second.id);
    });
    expect(stored().boards[0].cards.map((card) => card.title)).toEqual([
      "renamed"
    ]);
  });

  it("FR1.1 board and list changes persist and survive a remount", () => {
    const { result, unmount } = renderHook(() => useBoard());
    act(() => {
      result.current.addList("Review");
    });
    act(() => {
      result.current.createBoard("Second");
    });
    const secondId = result.current.board.id;
    unmount();
    const again = renderHook(() => useBoard());
    expect(again.result.current.board.id).toBe(secondId);
    expect(again.result.current.data.boards).toHaveLength(2);
    expect(
      again.result.current.data.boards[0].lists.map((list) => list.name)
    ).toContain("Review");
  });

  it("FR6.2 undo restores a deleted card within 10 seconds", () => {
    jest.useFakeTimers();
    seedStorage(["a", "b", "c"]);
    const { result } = renderHook(() => useBoard());
    const middle = result.current.board.cards[1];
    act(() => {
      result.current.deleteCard(middle.id);
    });
    expect(result.current.board.cards).toHaveLength(2);
    expect(result.current.undoEntry?.message).toBe("Card deleted");
    act(() => {
      jest.advanceTimersByTime(UNDO_MS - 1000);
    });
    expect(result.current.undoEntry).not.toBeNull();
    act(() => {
      result.current.undo();
    });
    expect(result.current.board.cards.map((card) => card.title)).toEqual([
      "a",
      "b",
      "c"
    ]);
    expect(result.current.board.cards[1]).toEqual(middle);
    expect(result.current.undoEntry).toBeNull();
    expect(stored()).toEqual(result.current.data);
  });

  it("FR2.5 deleteArchivedCard removes an archived card with no undo and refuses a live card", () => {
    seedStorage(["a", "b"]);
    const { result } = renderHook(() => useBoard());
    const [first, second] = result.current.board.cards;
    act(() => {
      result.current.archiveCard(first.id);
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.archiveCard(first.id);
    });
    let refused: ReturnType<typeof result.current.deleteArchivedCard> | null =
      null;
    act(() => {
      refused = result.current.deleteArchivedCard(second.id);
    });
    expect(refused).toMatchObject({ ok: false });
    act(() => {
      result.current.deleteArchivedCard(first.id);
    });
    expect(result.current.board.cards.map((card) => card.id)).toEqual([
      second.id
    ]);
    expect(result.current.undoEntry).toBeNull();
  });

  it("FR6.2 undo is gone after 10 seconds", () => {
    jest.useFakeTimers();
    seedStorage(["a", "b"]);
    const { result } = renderHook(() => useBoard());
    act(() => {
      result.current.deleteCard(result.current.board.cards[0].id);
    });
    act(() => {
      jest.advanceTimersByTime(UNDO_MS + 1);
    });
    expect(result.current.undoEntry).toBeNull();
    let outcome = true;
    act(() => {
      outcome = result.current.undo().ok;
    });
    expect(outcome).toBe(false);
    expect(result.current.board.cards).toHaveLength(1);
  });

  it("FR6.2 undo restores an archived card and an archived list with its cards", () => {
    jest.useFakeTimers();
    seedStorage(["a", "b"]);
    const { result } = renderHook(() => useBoard());
    act(() => {
      result.current.archiveCard(result.current.board.cards[0].id);
    });
    expect(
      cardsInList(result.current.board, result.current.board.lists[0].id)
    ).toHaveLength(1);
    act(() => {
      result.current.undo();
    });
    expect(
      cardsInList(result.current.board, result.current.board.lists[0].id)
    ).toHaveLength(2);
    act(() => {
      result.current.archiveList(result.current.board.lists[0].id);
    });
    expect(result.current.board.lists[0].archived).toBe(true);
    act(() => {
      result.current.undo();
    });
    expect(result.current.board.lists[0].archived).toBe(false);
    expect(titlesIn(result.current.data, 0)).toEqual(["a", "b"]);
  });

  it("FR6.2 FR7.2 undo ends when the board is switched", () => {
    jest.useFakeTimers();
    seedStorage(["a", "b"]);
    const { result } = renderHook(() => useBoard());
    const firstBoardId = result.current.board.id;
    act(() => {
      result.current.createBoard("Second");
    });
    act(() => {
      result.current.switchBoard(firstBoardId);
    });
    act(() => {
      result.current.deleteCard(result.current.board.cards[0].id);
    });
    expect(result.current.undoEntry).not.toBeNull();
    const secondId = result.current.data.boards[1].id;
    act(() => {
      result.current.switchBoard(secondId);
    });
    expect(result.current.undoEntry).toBeNull();
    let outcome = true;
    act(() => {
      outcome = result.current.undo().ok;
    });
    expect(outcome).toBe(false);
  });

  it("FR6.2 undo does not carry over a reload", () => {
    jest.useFakeTimers();
    seedStorage(["a"]);
    const first = renderHook(() => useBoard());
    act(() => {
      first.result.current.deleteCard(first.result.current.board.cards[0].id);
    });
    first.unmount();
    const again = renderHook(() => useBoard());
    expect(again.result.current.undoEntry).toBeNull();
  });

  it("NFR4 a storage event from another tab refreshes the data and shows a notice", () => {
    seedStorage(["a"]);
    const { result } = renderHook(() => useBoard());
    expect(result.current.notice).toBeNull();
    const other = stored();
    const board = other.boards[0];
    const changed: AppData = {
      ...other,
      boards: [
        {
          ...board,
          cards: [
            ...board.cards,
            newCard(board.lists[0].id, { title: "From tab two" })
          ]
        }
      ]
    };
    writeAppData(changed);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: DATA_KEY }));
    });
    expect(result.current.board.cards.map((card) => card.title)).toEqual([
      "a",
      "From tab two"
    ]);
    expect(result.current.notice).toBe(UPDATED_IN_ANOTHER_TAB);
    act(() => {
      result.current.dismissNotice();
    });
    expect(result.current.notice).toBeNull();
  });

  it("NFR4 a storage event for another key is ignored", () => {
    seedStorage(["a"]);
    const { result } = renderHook(() => useBoard());
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "something.else" })
      );
    });
    expect(result.current.notice).toBeNull();
  });

  it("FR1.4 NFR4 a failed save sets saveError, keeps earlier stored data and keeps the change on screen", () => {
    seedStorage(["a"]);
    const before = window.localStorage.getItem(DATA_KEY);
    const { result } = renderHook(() => useBoard());
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    act(() => {
      result.current.addCard(result.current.board.lists[0].id, {
        title: "Not saved"
      });
    });
    expect(result.current.saveError).toMatch(/not saved/);
    expect(window.localStorage.getItem(DATA_KEY)).toBe(before);
    expect(result.current.board.cards[0].title).toBe("Not saved");
    jest.restoreAllMocks();
    act(() => {
      result.current.addCard(result.current.board.lists[0].id, {
        title: "Saved now"
      });
    });
    expect(result.current.saveError).toBeNull();
  });

  it("FR1.3 unreadable data sets dataError, refuses changes and leaves the stored text untouched", () => {
    window.localStorage.setItem(DATA_KEY, "{broken");
    const { result } = renderHook(() => useBoard());
    expect(result.current.dataError).toMatch(/could not be read/);
    let outcome = true;
    act(() => {
      outcome = result.current.addList("New").ok;
    });
    expect(outcome).toBe(false);
    expect(window.localStorage.getItem(DATA_KEY)).toBe("{broken");
  });

  it("FR11.1 a rule runs after a user action", () => {
    seedStorage(["a"]);
    const { result } = renderHook(() => useBoard());
    const [, progress, completed] = result.current.board.lists;
    let labelId = "";
    act(() => {
      const created = result.current.addLabel("Done", "#2e7d32");
      labelId = created.ok && created.id ? created.id : "";
    });
    act(() => {
      result.current.addRule({
        name: "Mark done",
        trigger: { kind: "card-enters-list", listId: completed.id },
        action: { kind: "add-label", labelId }
      });
    });
    act(() => {
      result.current.moveCard(result.current.board.cards[0].id, completed.id);
    });
    expect(result.current.board.cards[0].labelIds).toEqual([labelId]);
    expect(progress.id).not.toBe(completed.id);
  });

  it("FR11.2 rules do not loop: two bouncing rules move a card once", () => {
    seedStorage(["a"]);
    const { result } = renderHook(() => useBoard());
    const [todo, progress, completed] = result.current.board.lists;
    act(() => {
      result.current.addRule({
        name: "Progress to completed",
        trigger: { kind: "card-enters-list", listId: progress.id },
        action: { kind: "move-to-list", listId: completed.id }
      });
      result.current.addRule({
        name: "Completed to todo",
        trigger: { kind: "card-enters-list", listId: completed.id },
        action: { kind: "move-to-list", listId: todo.id }
      });
    });
    act(() => {
      result.current.moveCard(result.current.board.cards[0].id, progress.id);
    });
    expect(result.current.board.cards[0].listId).toBe(completed.id);
  });

  it("FR11.1 completing a checklist triggers a checklist-complete rule", () => {
    seedStorage(["a"]);
    const { result } = renderHook(() => useBoard());
    const cardId = result.current.board.cards[0].id;
    const completed = result.current.board.lists[2];
    let checklistId = "";
    let itemId = "";
    act(() => {
      const added = result.current.addChecklist(cardId, "Steps");
      checklistId = added.ok && added.id ? added.id : "";
    });
    act(() => {
      const item = result.current.addChecklistItem(cardId, checklistId, "one");
      itemId = item.ok && item.id ? item.id : "";
    });
    act(() => {
      result.current.addRule({
        name: "Finish",
        trigger: { kind: "checklist-complete" },
        action: { kind: "move-to-list", listId: completed.id }
      });
    });
    act(() => {
      result.current.updateChecklistItem(cardId, checklistId, itemId, {
        checked: true
      });
    });
    expect(result.current.board.cards[0].listId).toBe(completed.id);
  });

  it("FR8.1 FR8.2 exports the open board and imports it as a new board", () => {
    seedStorage(["a"]);
    const { result } = renderHook(() => useBoard());
    const file = result.current.exportBoardFile();
    expect(file?.fileName).toBe("my-board.taskflow.json");
    act(() => {
      result.current.importBoard(file?.text ?? "");
    });
    expect(result.current.data.boards.map((board) => board.name)).toEqual([
      "My board",
      "My board (imported)"
    ]);
    let outcome = true;
    act(() => {
      outcome = result.current.importBoard("junk").ok;
    });
    expect(outcome).toBe(false);
    expect(result.current.data.boards).toHaveLength(2);
  });

  it("FR5.1 FR5.4 settings changes persist", () => {
    const { result } = renderHook(() => useBoard());
    act(() => {
      result.current.updateSettings({ mode: "dark", density: "compact" });
    });
    expect(stored().settings).toMatchObject({
      mode: "dark",
      density: "compact"
    });
  });

  it("FR5.3 a board background change persists for that board only", () => {
    const { result } = renderHook(() => useBoard());
    act(() => {
      result.current.setBoardBackground("forest");
    });
    expect(stored().boards[0].backgroundId).toBe("forest");
  });

  it("NFR1 working with boards makes no network request", () => {
    const fetchSpy = jest.fn();
    Object.defineProperty(globalThis, "fetch", {
      value: fetchSpy,
      configurable: true,
      writable: true
    });
    const { result } = renderHook(() => useBoard());
    act(() => {
      result.current.addCard(result.current.board.lists[0].id, {
        title: "Private"
      });
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(newLabel("x", "#000000").name).toBe("x");
  });
});
