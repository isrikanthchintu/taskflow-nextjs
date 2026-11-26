import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "@/components/task-card";
import { useBoard } from "@/hooks/use-board";
import { formatDay } from "@/lib/board-query";
import { newCard, newChecklist, newLabel, newList } from "@/lib/board-schema";
import { renderWithTheme } from "@/test-utils";
import type { Card, Label, List } from "@/types/board";

jest.mock("../hooks/use-board", () => ({ useBoard: jest.fn() }));

const mockedUseBoard = useBoard as jest.Mock;

const todo = newList("To do");
const doing = newList("In progress");
const done = newList("Completed", { done: true });

const baseCard: Card = newCard(todo.id, {
  title: "Draft proposal",
  description: "Write the first draft of the client proposal.",
  priority: "medium",
  dueDate: "2036-12-01",
  createdAt: "2026-11-17T09:00:00.000Z"
});

function setup(
  options: { card?: Card; list?: List; lists?: List[]; labels?: Label[] } = {}
) {
  const deleteCard = jest.fn();
  const moveCard = jest.fn();
  mockedUseBoard.mockReturnValue({ deleteCard, moveCard });
  const onEditTask = jest.fn();
  const card = options.card ?? baseCard;
  renderWithTheme(
    <TaskCard
      task={card}
      list={options.list ?? todo}
      lists={options.lists ?? [todo, doing, done]}
      labels={options.labels ?? []}
      onEditTask={onEditTask}
    />
  );
  return { deleteCard, moveCard, onEditTask };
}

function offsetDay(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDay(date);
}

describe("TaskCard", () => {
  it("renders the card's title, description, priority, and due date", () => {
    setup();

    expect(screen.getByText("Draft proposal")).toBeInTheDocument();
    expect(
      screen.getByText("Write the first draft of the client proposal.")
    ).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("Dec 1")).toBeInTheDocument();
  });

  it("shows fallback text when description and due date are empty", () => {
    setup({ card: { ...baseCard, description: "", dueDate: "" } });

    expect(screen.getByText("No description added")).toBeInTheDocument();
    expect(screen.getByText("No due date")).toBeInTheDocument();
  });

  it("applies completed styling when the card is in the done list", () => {
    setup({ list: done, card: { ...baseCard, listId: done.id } });

    expect(screen.getByText("Draft proposal")).toHaveClass("completed-title");
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });

  it("calls deleteCard when the delete control is clicked", async () => {
    const user = userEvent.setup();
    const { deleteCard } = setup();

    await user.click(
      screen.getByRole("button", { name: `Delete ${baseCard.title}` })
    );

    expect(deleteCard).toHaveBeenCalledWith(baseCard.id);
  });

  it("advances the card to the next list via the keyboard-operable control", async () => {
    const user = userEvent.setup();
    const { moveCard } = setup();

    await user.click(
      screen.getByRole("button", {
        name: `Mark ${baseCard.title} as In progress`
      })
    );

    expect(moveCard).toHaveBeenCalledWith(baseCard.id, doing.id);
  });

  it("wraps from the last list back to the first list", async () => {
    const user = userEvent.setup();
    const { moveCard } = setup({
      list: done,
      card: { ...baseCard, listId: done.id }
    });

    await user.click(
      screen.getByRole("button", { name: `Mark ${baseCard.title} as To do` })
    );

    expect(moveCard).toHaveBeenCalledWith(baseCard.id, todo.id);
  });

  it("calls onEditTask when the card is clicked outside its controls", async () => {
    const user = userEvent.setup();
    const { onEditTask, deleteCard, moveCard } = setup();

    await user.click(screen.getByText("Draft proposal"));

    expect(onEditTask).toHaveBeenCalledWith(baseCard);
    expect(deleteCard).not.toHaveBeenCalled();
    expect(moveCard).not.toHaveBeenCalled();
  });

  it("NFR3 opens the card with the Enter key when the card has keyboard focus", async () => {
    const user = userEvent.setup();
    const { onEditTask } = setup();

    screen.getByRole("article", { name: "Card Draft proposal" }).focus();
    await user.keyboard("{Enter}");

    expect(onEditTask).toHaveBeenCalledWith(baseCard);
  });

  it("FR3.1 shows each label by its name, not by color alone", () => {
    const bug = newLabel("Bug", "#ffd2cc");
    const ui = newLabel("UI", "#c9def9");
    setup({
      card: { ...baseCard, labelIds: [bug.id, ui.id] },
      labels: [bug, ui]
    });

    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("UI")).toBeInTheDocument();
  });

  it("FR3.2 shows checklist progress as a count with an accessible name", () => {
    const checklist = newChecklist("Steps", ["one", "two", "three", "four"]);
    checklist.items[0].checked = true;
    setup({ card: { ...baseCard, checklists: [checklist] } });

    expect(
      screen.getByRole("img", { name: "Checklist: 1 of 4 done" })
    ).toHaveTextContent("1/4");
  });

  it("FR3.3 shows Overdue in words for a past due date and Due soon for tomorrow", () => {
    setup({ card: { ...baseCard, dueDate: "2020-01-01" } });
    expect(
      screen.getByTestId(`task-card-${baseCard.id}-due-state`)
    ).toHaveTextContent("Overdue");
  });

  it("FR3.3 shows Due soon in words when the card is due tomorrow", () => {
    setup({ card: { ...baseCard, dueDate: offsetDay(1) } });

    expect(
      screen.getByTestId(`task-card-${baseCard.id}-due-state`)
    ).toHaveTextContent("Due soon");
  });

  it("FR3.3 shows no due state for an overdue card that sits in the done list", () => {
    setup({
      list: done,
      card: { ...baseCard, listId: done.id, dueDate: "2020-01-01" }
    });

    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("FR2.1 hides the status control when the board has a single list", () => {
    setup({ lists: [todo] });

    expect(
      screen.queryByRole("button", { name: /^Mark / })
    ).not.toBeInTheDocument();
  });
});
