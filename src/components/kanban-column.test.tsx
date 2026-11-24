import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanColumn, columnDroppableId } from "@/components/kanban-column";
import { newCard, newList } from "@/lib/board-schema";
import { renderWithTheme } from "@/test-utils";
import type { CardGroup } from "@/lib/board-query";

jest.mock("./task-card", () => ({
  TaskCard: ({ task }: { task: { title: string } }) => <div>{task.title}</div>
}));
jest.mock("./list-menu", () => ({
  ListMenu: ({ list }: { list: { name: string } }) => (
    <button aria-label={`List actions for ${list.name}`}>menu</button>
  )
}));

const list = newList("To do");
const cards = [
  newCard(list.id, { title: "Task one", priority: "low" }),
  newCard(list.id, { title: "Task two", priority: "medium" })
];

function renderColumn(
  overrides: Partial<React.ComponentProps<typeof KanbanColumn>> = {}
) {
  return renderWithTheme(
    <KanbanColumn
      list={list}
      index={0}
      listCount={1}
      totalCount={cards.length}
      cards={cards}
      lists={[list]}
      labels={[]}
      onEditTask={jest.fn()}
      {...overrides}
    />
  );
}

describe("KanbanColumn", () => {
  it("FR2.1 renders the list name and the unfiltered count even when no cards are visible", () => {
    renderColumn({ totalCount: 5, cards: [] });

    expect(screen.getByRole("heading", { name: "To do" })).toBeInTheDocument();
    expect(
      screen.getByTestId(`kanban-column-${list.id}-count`)
    ).toHaveTextContent("5");
  });

  it("FR2.1 renders one card per visible item inside a labelled list region", () => {
    renderColumn();

    expect(
      screen.getByRole("region", { name: "To do list" })
    ).toBeInTheDocument();
    expect(screen.getByText("Task one")).toBeInTheDocument();
    expect(screen.getByText("Task two")).toBeInTheDocument();
  });

  it("FR2.6 shows No cards yet for a list that has no cards at all", () => {
    renderColumn({ totalCount: 0, cards: [] });

    expect(screen.getByText("No cards yet")).toBeInTheDocument();
    expect(screen.queryByText("No matching cards")).not.toBeInTheDocument();
  });

  it("FR4.4 shows No matching cards, worded differently from an empty list, when a filter hides every card", () => {
    renderColumn({ totalCount: 9, cards: [] });

    expect(screen.getByText("No matching cards")).toBeInTheDocument();
    expect(screen.queryByText("No cards yet")).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`kanban-column-${list.id}-count`)
    ).toHaveTextContent("9");
  });

  it("FR4.2 shows that reordering is off while a sort is on", () => {
    renderColumn({ reorderNote: "Sorted by due date: reordering is off" });

    expect(
      screen.getByTestId(`kanban-column-${list.id}-note`)
    ).toHaveTextContent("Sorted by due date: reordering is off");
  });

  it("FR4.3 shows group headings with counts and lists a multi-label card under each group", () => {
    const both = newCard(list.id, { title: "Two labels" });
    const groups: CardGroup[] = [
      { key: "bug", title: "Bug", cards: [both] },
      { key: "ui", title: "UI", cards: [both, cards[0]] }
    ];
    renderColumn({ cards: [both, cards[0]], groups });

    expect(
      screen.getByRole("heading", { name: "Bug (1)" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "UI (2)" })).toBeInTheDocument();
    expect(screen.getAllByText("Two labels")).toHaveLength(2);
  });

  it("FR2.2 opens the card dialog for this list from Add a card", async () => {
    const user = userEvent.setup();
    const onAddCard = jest.fn();
    renderColumn({ onAddCard });

    await user.click(screen.getByRole("button", { name: "Add a card" }));

    expect(onAddCard).toHaveBeenCalledWith(list.id);
  });

  it("FR1.3 disables Add a card when the data is unreadable", () => {
    renderColumn({ onAddCard: jest.fn(), disabled: true });

    expect(screen.getByRole("button", { name: "Add a card" })).toBeDisabled();
  });

  it("FR10.1 marks a list over its limit in words, 'Over limit: 4 of 3', with an icon, and still offers Add a card", () => {
    renderColumn({
      list: { ...list, limit: 3 },
      totalCount: 4,
      onAddCard: jest.fn()
    });

    const marker = screen.getByTestId(`kanban-column-${list.id}-over-limit`);
    expect(marker).toHaveTextContent("Over limit: 4 of 3");
    expect(marker.querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Add a card" })).toBeEnabled();
  });

  it("FR10.1 shows only the limit when the list is at or under it, and nothing when no limit is set", () => {
    const { unmount } = renderColumn({
      list: { ...list, limit: 3 },
      totalCount: 3
    });

    const status = screen.getByTestId(`kanban-column-${list.id}-limit-status`);
    expect(status).toHaveTextContent("Limit: 3");
    expect(status).not.toHaveTextContent("Over limit");
    expect(
      screen.queryByTestId(`kanban-column-${list.id}-over-limit`)
    ).not.toBeInTheDocument();
    unmount();

    renderColumn({ totalCount: 50 });
    expect(
      screen.getByTestId(`kanban-column-${list.id}-limit-status`)
    ).toBeEmptyDOMElement();
  });

  it("NFR3 announces limit changes in a polite live region that is always present", () => {
    renderColumn({ list: { ...list, limit: 1 }, totalCount: 2 });

    const status = screen.getByTestId(`kanban-column-${list.id}-limit-status`);
    expect(status).toHaveAttribute("role", "status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("FR2.3 exposes a list drag handle and list actions by keyboard-reachable buttons", () => {
    renderColumn();

    expect(
      screen.getByRole("button", { name: "Drag list To do" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "List actions for To do" })
    ).toBeInTheDocument();
    expect(columnDroppableId(list.id)).toBe(`column-${list.id}`);
  });
});
