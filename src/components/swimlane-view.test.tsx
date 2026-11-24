import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EMPTY_VIEW, type BoardView } from "@/components/filter-panel";
import { SwimlaneView } from "@/components/swimlane-view";
import { NO_LABEL_KEY } from "@/lib/board-query";
import { emptyBoard, newCard, newLabel, newList } from "@/lib/board-schema";
import { renderWithTheme } from "@/test-utils";
import type { Board } from "@/types/board";

function makeBoard() {
  const board: Board = emptyBoard("Work");
  const todo = newList("To do");
  const doing = newList("In progress");
  const bug = newLabel("Bug", "#ffd2cc");
  const ui = newLabel("UI", "#c9def9");
  board.lists = [todo, doing];
  board.labels = [bug, ui];
  const both = newCard(todo.id, {
    title: "Both labels",
    priority: "high",
    labelIds: [bug.id, ui.id]
  });
  const plain = newCard(doing.id, { title: "No labels here", priority: "low" });
  const medium = newCard(todo.id, {
    title: "Medium one",
    priority: "medium",
    labelIds: [bug.id]
  });
  board.cards = [both, plain, medium];
  return { board, todo, doing, bug, ui, both, plain, medium };
}

function view(overrides: Partial<BoardView> = {}): BoardView {
  return { ...EMPTY_VIEW, ...overrides };
}

describe("SwimlaneView", () => {
  it("FR10.2 renders nothing while swimlanes are off", () => {
    const { board } = makeBoard();
    renderWithTheme(
      <SwimlaneView board={board} view={view()} onEditTask={jest.fn()} />
    );

    expect(screen.queryByTestId("swimlane-view")).not.toBeInTheDocument();
  });

  it("FR10.2 groups cards into bands by priority across all lists", () => {
    const { board, todo, doing, both, plain, medium } = makeBoard();
    renderWithTheme(
      <SwimlaneView
        board={board}
        view={view({ swimlane: "priority" })}
        onEditTask={jest.fn()}
      />
    );

    expect(
      screen.getByRole("region", { name: "High band" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Medium band" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Low band" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId(`swimlane-cell-high-${todo.id}`)).getByText(
        "Both labels"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId(`swimlane-cell-low-${doing.id}`)).getByText(
        "No labels here"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`swimlane-card-medium-${medium.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`swimlane-card-high-${both.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`swimlane-card-low-${plain.id}`)
    ).toBeInTheDocument();
  });

  it("FR10.2 puts a card with several labels in each of its bands and a card with none under No label", () => {
    const { board, bug, ui, both, plain } = makeBoard();
    renderWithTheme(
      <SwimlaneView
        board={board}
        view={view({ swimlane: "label" })}
        onEditTask={jest.fn()}
      />
    );

    expect(
      screen.getByTestId(`swimlane-card-${bug.id}-${both.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`swimlane-card-${ui.id}-${both.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "No label band" })
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`swimlane-card-${NO_LABEL_KEY}-${plain.id}`)
    ).toBeInTheDocument();
  });

  it("FR10.2 shows each list name with its count inside every band", () => {
    const { board } = makeBoard();
    renderWithTheme(
      <SwimlaneView
        board={board}
        view={view({ swimlane: "priority" })}
        onEditTask={jest.fn()}
      />
    );

    const band = screen.getByRole("region", { name: "High band" });
    expect(
      within(band).getByRole("heading", { name: "To do (1)" })
    ).toBeInTheDocument();
    expect(
      within(band).getByRole("heading", { name: "In progress (0)" })
    ).toBeInTheDocument();
  });

  it("FR10.2 opens the card for editing when a card in a band is activated by keyboard", async () => {
    const user = userEvent.setup();
    const onEditTask = jest.fn();
    const { board, plain } = makeBoard();
    renderWithTheme(
      <SwimlaneView
        board={board}
        view={view({ swimlane: "priority" })}
        onEditTask={onEditTask}
      />
    );

    await user.tab();
    screen.getByTestId(`swimlane-card-low-${plain.id}`).focus();
    await user.keyboard("{Enter}");

    expect(onEditTask).toHaveBeenCalledWith(plain);
  });

  it("FR10.2 applies the current filter to the bands and announces the card count", () => {
    const { board, both } = makeBoard();
    renderWithTheme(
      <SwimlaneView
        board={board}
        view={view({
          swimlane: "priority",
          filter: { ...EMPTY_VIEW.filter, priorities: ["high"] }
        })}
        onEditTask={jest.fn()}
      />
    );

    expect(
      screen.getByTestId(`swimlane-card-high-${both.id}`)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Low band" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("swimlane-status")).toHaveTextContent(
      "Swimlanes by priority: 1 card shown"
    );
    expect(screen.getByTestId("swimlane-status")).toHaveAttribute(
      "role",
      "status"
    );
  });

  it("FR10.2 says No matching cards when the filter hides everything", () => {
    const { board } = makeBoard();
    renderWithTheme(
      <SwimlaneView
        board={board}
        view={view({
          swimlane: "label",
          filter: { ...EMPTY_VIEW.filter, text: "zzzz" }
        })}
        onEditTask={jest.fn()}
      />
    );

    expect(screen.getByTestId("swimlane-empty")).toHaveTextContent(
      "No matching cards"
    );
  });

  it("FR3.1 shows label names as text on cards in a band, not colour alone", () => {
    const { board, both } = makeBoard();
    renderWithTheme(
      <SwimlaneView
        board={board}
        view={view({ swimlane: "priority" })}
        onEditTask={jest.fn()}
      />
    );

    const card = screen.getByTestId(`swimlane-card-high-${both.id}`);
    expect(card).toHaveTextContent("Bug");
    expect(card).toHaveTextContent("UI");
    expect(card).toHaveTextContent("high priority");
  });
});
