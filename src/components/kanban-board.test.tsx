import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EMPTY_VIEW, type BoardView } from "@/components/filter-panel";
import { KanbanBoard, resolveDragOutcome } from "@/components/kanban-board";
import { columnDroppableId } from "@/components/kanban-column";
import { useBoard } from "@/hooks/use-board";
import { emptyBoard, newCard, newList } from "@/lib/board-schema";
import { renderWithTheme } from "@/test-utils";
import type { Board } from "@/types/board";

jest.mock("../hooks/use-board", () => ({ useBoard: jest.fn() }));
jest.mock("./kanban-column", () => {
  const actual = jest.requireActual("./kanban-column");
  return {
    ...actual,
    KanbanColumn: ({
      list,
      totalCount,
      cards,
      groups,
      reorderNote
    }: {
      list: { id: string; name: string };
      totalCount: number;
      cards: { id: string; title: string }[];
      groups: { key: string }[] | null;
      reorderNote: string | null;
    }) => (
      <div
        data-testid={`mock-column-${list.name}`}
        data-count={totalCount}
        data-note={reorderNote ?? ""}
        data-groups={groups ? groups.map((group) => group.key).join(",") : ""}
      >
        {cards.map((card) => (
          <span key={card.id}>{card.title}</span>
        ))}
      </div>
    )
  };
});

const mockedUseBoard = useBoard as jest.Mock;

function makeBoard(): Board {
  const board = emptyBoard("Work");
  const todo = newList("todo");
  const doing = newList("doing");
  const done = newList("done", { done: true });
  board.lists = [todo, doing, done];
  board.cards = [
    newCard(todo.id, { title: "Alpha", createdAt: "2026-11-01T00:00:00.000Z" }),
    newCard(doing.id, {
      title: "Bravo",
      createdAt: "2026-11-02T00:00:00.000Z"
    }),
    newCard(todo.id, {
      title: "Charlie",
      createdAt: "2026-11-03T00:00:00.000Z"
    }),
    newCard(done.id, { title: "Delta", createdAt: "2026-11-04T00:00:00.000Z" })
  ];
  return board;
}

function view(overrides: Partial<BoardView> = {}): BoardView {
  return { ...EMPTY_VIEW, ...overrides };
}

describe("KanbanBoard rendering", () => {
  let addList: jest.Mock;

  beforeEach(() => {
    addList = jest.fn().mockReturnValue({ ok: true });
    mockedUseBoard.mockReturnValue({
      moveCard: jest.fn(),
      reorderCard: jest.fn(),
      reorderList: jest.fn(),
      addList
    });
  });

  it("FR2.1 groups cards into the board's lists preserving relative array order", () => {
    renderWithTheme(
      <KanbanBoard board={makeBoard()} view={view()} onEditTask={jest.fn()} />
    );

    const todo = screen.getByTestId("mock-column-todo");
    expect(
      within(todo)
        .getAllByText(/Alpha|Charlie/)
        .map((node) => node.textContent)
    ).toEqual(["Alpha", "Charlie"]);
    expect(
      within(screen.getByTestId("mock-column-doing")).getByText("Bravo")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("mock-column-done")).getByText("Delta")
    ).toBeInTheDocument();
  });

  it("FR4.1 filters each list independently by search text, case-insensitive on title and description", () => {
    const filter = { ...EMPTY_VIEW.filter, text: "al" };
    renderWithTheme(
      <KanbanBoard
        board={makeBoard()}
        view={view({ filter })}
        onEditTask={jest.fn()}
      />
    );

    const todo = screen.getByTestId("mock-column-todo");
    expect(within(todo).getByText("Alpha")).toBeInTheDocument();
    expect(within(todo).queryByText("Charlie")).not.toBeInTheDocument();
  });

  it("FR4.4 gives a list with zero search matches its real unfiltered count", () => {
    const filter = { ...EMPTY_VIEW.filter, text: "charlie" };
    renderWithTheme(
      <KanbanBoard
        board={makeBoard()}
        view={view({ filter })}
        onEditTask={jest.fn()}
      />
    );

    const doing = screen.getByTestId("mock-column-doing");
    expect(doing).toHaveAttribute("data-count", "1");
    expect(within(doing).queryByText("Bravo")).not.toBeInTheDocument();
  });

  it("FR4.2 sorts cards and tells each list that reordering is off", () => {
    renderWithTheme(
      <KanbanBoard
        board={makeBoard()}
        view={view({ sort: { key: "created", direction: "desc" } })}
        onEditTask={jest.fn()}
      />
    );

    const todo = screen.getByTestId("mock-column-todo");
    expect(
      within(todo)
        .getAllByText(/Alpha|Charlie/)
        .map((node) => node.textContent)
    ).toEqual(["Charlie", "Alpha"]);
    expect(todo).toHaveAttribute(
      "data-note",
      "Sorted by created date: reordering is off"
    );
  });

  it("FR4.3 groups cards by priority and tells each list that reordering is off", () => {
    renderWithTheme(
      <KanbanBoard
        board={makeBoard()}
        view={view({ group: "priority" })}
        onEditTask={jest.fn()}
      />
    );

    const todo = screen.getByTestId("mock-column-todo");
    expect(todo).toHaveAttribute("data-groups", "medium");
    expect(todo).toHaveAttribute(
      "data-note",
      "Grouped by priority: reordering is off"
    );
  });

  it("FR2.6 shows the empty-board state with an Add a list action when no list is active", () => {
    const board = makeBoard();
    board.lists = board.lists.map((item) => ({ ...item, archived: true }));
    renderWithTheme(
      <KanbanBoard board={board} view={view()} onEditTask={jest.fn()} />
    );

    expect(screen.getByText("This board has no lists yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add a list" })
    ).toBeInTheDocument();
  });

  it("FR2.2 adds a list from the Add a list tile by keyboard-operable controls", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <KanbanBoard board={makeBoard()} view={view()} onEditTask={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Add a list" }));
    await user.type(screen.getByLabelText("List name"), "Review{Enter}");

    expect(addList).toHaveBeenCalledWith("Review");
  });

  it("FR1.5 disables the Add a list tile with the limit named once 10 lists are active", () => {
    const board = makeBoard();
    board.lists = Array.from({ length: 10 }, (_, index) =>
      newList(`List ${index}`)
    );
    renderWithTheme(
      <KanbanBoard board={board} view={view()} onEditTask={jest.fn()} />
    );

    expect(
      screen.getByRole("button", { name: "List limit reached (10)" })
    ).toBeDisabled();
  });
});

describe("resolveDragOutcome", () => {
  it("FR2.3 resolves a cross-list drop to a move outcome", () => {
    const fullColumns = { todo: ["a", "b"], doing: ["c"], done: [] };

    const result = resolveDragOutcome({
      activeId: "a",
      overId: "c",
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns
    });

    expect(result).toEqual({ kind: "move", id: "a", listId: "doing" });
  });

  it("resolves a same-list reorder drop to a reorder outcome with the correct index", () => {
    const fullColumns = { todo: ["a", "b", "c"], doing: [], done: [] };

    const result = resolveDragOutcome({
      activeId: "a",
      overId: "c",
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns
    });

    expect(result).toEqual({ kind: "reorder", id: "a", newIndex: 2 });
  });

  it("FR4.4 resolves reordering against the full list using the nearest visible neighbor when the list is filtered (ADR-005)", () => {
    const fullColumns = {
      todo: ["a", "hidden", "b", "c"],
      doing: [],
      done: []
    };
    const visibleColumns = { todo: ["a", "b", "c"], doing: [], done: [] };

    const result = resolveDragOutcome({
      activeId: "a",
      overId: "c",
      sourceListId: "todo",
      fullColumns,
      visibleColumns
    });

    expect(result).toEqual({ kind: "reorder", id: "a", newIndex: 3 });
  });

  it("resolves a backward same-list drop (dragging a later card earlier) to the correct reorder index", () => {
    const fullColumns = { todo: ["a", "b", "c"], doing: [], done: [] };

    const result = resolveDragOutcome({
      activeId: "c",
      overId: "a",
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns
    });

    expect(result).toEqual({ kind: "reorder", id: "c", newIndex: 0 });
  });

  it("resolves a drop on the origin position to no outcome", () => {
    const fullColumns = { todo: ["a", "b"], doing: [], done: [] };

    const result = resolveDragOutcome({
      activeId: "b",
      overId: "b",
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns
    });

    expect(result).toEqual({ kind: "none" });
  });

  it("resolves an invalid or cancelled drop (no drop target) to no outcome", () => {
    const fullColumns = { todo: ["a", "b"], doing: [], done: [] };

    const result = resolveDragOutcome({
      activeId: "a",
      overId: null,
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns
    });

    expect(result).toEqual({ kind: "none" });
  });

  it("resolves a drop into an empty target list to a move outcome using the list drop target id", () => {
    const fullColumns = { todo: ["a"], doing: [], done: [] };

    const result = resolveDragOutcome({
      activeId: "a",
      overId: columnDroppableId("doing"),
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns
    });

    expect(result).toEqual({ kind: "move", id: "a", listId: "doing" });
  });

  it("FR4.2 refuses an in-list reorder while a sort or group is on but still allows a move to another list", () => {
    const fullColumns = { todo: ["a", "b", "c"], doing: ["d"], done: [] };

    const reorder = resolveDragOutcome({
      activeId: "a",
      overId: "c",
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns,
      reorderEnabled: false
    });
    const move = resolveDragOutcome({
      activeId: "a",
      overId: "d",
      sourceListId: "todo",
      fullColumns,
      visibleColumns: fullColumns,
      reorderEnabled: false
    });

    expect(reorder).toEqual({ kind: "none" });
    expect(move).toEqual({ kind: "move", id: "a", listId: "doing" });
  });
});
