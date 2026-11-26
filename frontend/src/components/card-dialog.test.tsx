import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardDialog } from "@/components/card-dialog";
import {
  createDefaultData,
  newCard,
  newChecklist,
  newLabel
} from "@/lib/board-schema";
import { LABEL_COLORS, labelTextColor } from "@/lib/label-colors";
import { contrastRatio } from "@/lib/theme-presets";
import { renderWithTheme, seedData, storedData } from "@/test-utils";
import type { Card } from "@/types/board";

function seed(customize: (cards: Card[]) => Card[] = (cards) => cards) {
  const data = createDefaultData();
  const board = data.boards[0];
  const todo = board.lists[0];
  board.labels = [newLabel("Bug", "#ffd2cc")];
  board.cards = customize([
    newCard(todo.id, {
      title: "Fix header",
      description: "Spacing",
      dueDate: "2036-11-20",
      createdAt: "2026-11-01T00:00:00.000Z"
    })
  ]);
  seedData(data);
  return { data, board, todo, card: board.cards[0] };
}

function renderDialog(card: Card | null, listId: string) {
  const onClose = jest.fn();
  renderWithTheme(
    <CardDialog open card={card} listId={listId} onClose={onClose} />
  );
  return onClose;
}

describe("CardDialog", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("FR3.4 refuses a blank title with a message under the field and keeps what was typed", async () => {
    const user = userEvent.setup();
    const { todo } = seed();
    const onClose = renderDialog(null, todo.id);

    await user.type(screen.getByLabelText(/description/i), "Keep me");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(
      screen.getByText("Add a title to save this card")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toHaveValue("Keep me");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("FR3.4 creates a card in the chosen list with its priority and due date", async () => {
    const user = userEvent.setup();
    const { todo } = seed();
    const onClose = renderDialog(null, todo.id);

    await user.type(screen.getByLabelText(/task name/i), "Write docs");
    await user.type(screen.getByLabelText("Due date"), "2036-12-01");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    const created = storedData().boards[0].cards.find(
      (card) => card.title === "Write docs"
    );
    expect(created).toMatchObject({
      listId: todo.id,
      dueDate: "2036-12-01",
      priority: "medium"
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("FR3.1 adds a label in the manager, selects it for the card and saves it by name", async () => {
    const user = userEvent.setup();
    const { todo } = seed();
    renderDialog(null, todo.id);

    await user.click(screen.getByRole("button", { name: "Manage labels" }));
    await user.type(screen.getByLabelText("New label name"), "Urgent");
    await user.selectOptions(screen.getByLabelText("New label color"), "Green");
    await user.click(screen.getByRole("button", { name: "Add label" }));
    await user.type(screen.getByLabelText(/task name/i), "Labelled");
    await user.click(screen.getByLabelText("Urgent"));
    await user.click(screen.getByRole("button", { name: /create task/i }));

    const stored = storedData().boards[0];
    const urgent = stored.labels.find((label) => label.name === "Urgent");
    expect(urgent?.color).toBe("#bfeccd");
    expect(
      stored.cards.find((card) => card.title === "Labelled")?.labelIds
    ).toContain(urgent?.id);
  });

  it("FR3.1 renames, recolors and deletes a label from the manager", async () => {
    const user = userEvent.setup();
    const { card, board } = seed();
    renderDialog(card, card.listId);
    const labelId = board.labels[0].id;

    await user.click(screen.getByRole("button", { name: "Manage labels" }));
    const nameField = screen.getByLabelText("Label name: Bug");
    await user.clear(nameField);
    await user.type(nameField, "Defect{Enter}");
    await user.selectOptions(
      screen.getByLabelText("Color for Defect"),
      "Purple"
    );

    await waitFor(() => {
      const label = storedData().boards[0].labels.find(
        (item) => item.id === labelId
      );
      expect(label).toMatchObject({ name: "Defect", color: "#e0d4f7" });
    });

    await user.click(
      screen.getByRole("button", { name: "Delete label Defect" })
    );

    await waitFor(() => expect(storedData().boards[0].labels).toHaveLength(0));
  });

  it("FR3.2 adds a checklist and items to an existing card and shows progress as it is checked", async () => {
    const user = userEvent.setup();
    const { card } = seed();
    renderDialog(card, card.listId);

    await user.type(
      screen.getByLabelText("New checklist title"),
      "Release steps"
    );
    await user.click(screen.getByRole("button", { name: "Add a checklist" }));
    await user.type(
      screen.getByLabelText("New item in Release steps"),
      "Test on mobile{Enter}"
    );
    await user.type(
      screen.getByLabelText("New item in Release steps"),
      "Merge{Enter}"
    );
    await user.click(screen.getByLabelText("Done: Test on mobile"));

    const checklist = screen.getByRole("region", {
      name: "Checklist Release steps"
    });
    expect(within(checklist).getByRole("status")).toHaveTextContent(
      "1 of 2 done"
    );
    expect(
      storedData().boards[0].cards[0].checklists[0].items.map(
        (item) => item.checked
      )
    ).toEqual([true, false]);
  });

  it("FR3.2 keeps checklist items typed into a new card and saves them with it", async () => {
    const user = userEvent.setup();
    const { todo } = seed();
    renderDialog(null, todo.id);

    await user.type(screen.getByLabelText(/task name/i), "With checklist");
    await user.type(screen.getByLabelText("New checklist title"), "Steps");
    await user.click(screen.getByRole("button", { name: "Add a checklist" }));
    await user.type(screen.getByLabelText("New item in Steps"), "First{Enter}");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    const created = storedData().boards[0].cards.find(
      (card) => card.title === "With checklist"
    );
    expect(created?.checklists[0].title).toBe("Steps");
    expect(created?.checklists[0].items.map((item) => item.text)).toEqual([
      "First"
    ]);
  });

  it("FR3.2 reorders checklist items by keyboard-operable move buttons", async () => {
    const user = userEvent.setup();
    const { card } = seed((cards) => [
      { ...cards[0], checklists: [newChecklist("Steps", ["A", "B", "C"])] }
    ]);
    renderDialog(card, card.listId);

    await user.click(screen.getByRole("button", { name: "Move item down: A" }));

    await waitFor(() =>
      expect(
        storedData().boards[0].cards[0].checklists[0].items.map(
          (item) => item.text
        )
      ).toEqual(["B", "A", "C"])
    );
    expect(
      screen.getByRole("button", { name: "Move item up: B" })
    ).toBeDisabled();
  });

  it("FR3.3 shows Overdue in words next to a past due date", async () => {
    const user = userEvent.setup();
    const { todo } = seed();
    renderDialog(null, todo.id);

    await user.type(screen.getByLabelText("Due date"), "2020-01-01");

    expect(screen.getByTestId("card-dialog-due-state")).toHaveTextContent(
      "Overdue"
    );
  });

  it("FR6.3 duplicates a card with the copy suffix and unchecked items, then closes", async () => {
    const user = userEvent.setup();
    const checklist = newChecklist("Steps", ["A"]);
    checklist.items[0].checked = true;
    const { card } = seed((cards) => [
      { ...cards[0], checklists: [checklist] }
    ]);
    const onClose = renderDialog(card, card.listId);

    await user.click(screen.getByRole("button", { name: "Duplicate" }));

    const copy = storedData().boards[0].cards.find(
      (item) => item.title === "Fix header (copy)"
    );
    expect(copy?.checklists[0].items[0].checked).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  it("FR6.4 saves a card as a template and says so", async () => {
    const user = userEvent.setup();
    const { card } = seed();
    renderDialog(card, card.listId);

    await user.click(screen.getByRole("button", { name: "Save as template" }));

    expect(screen.getByText("Saved as a template")).toBeInTheDocument();
    expect(storedData().boards[0].templates).toHaveLength(1);
  });

  it("FR6.4 offers saved templates when creating a card and uses one", async () => {
    const user = userEvent.setup();
    const { data, board, todo } = seed();
    board.templates = [
      {
        id: "tpl-1",
        title: "Bug template",
        description: "Steps to reproduce",
        priority: "high",
        labelIds: [],
        checklists: []
      }
    ];
    seedData(data);
    const onClose = renderDialog(null, todo.id);

    await user.selectOptions(
      screen.getByLabelText("Start from a template"),
      "Bug template"
    );
    await user.click(screen.getByRole("button", { name: "Use template" }));

    expect(
      storedData().boards[0].cards.some(
        (item) => item.title === "Bug template" && item.priority === "high"
      )
    ).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it("FR6.2 archives a card from the dialog and closes", async () => {
    const user = userEvent.setup();
    const { card } = seed();
    const onClose = renderDialog(card, card.listId);

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(storedData().boards[0].cards[0].archived).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it("FR6.2 deletes a card from the dialog and closes", async () => {
    const user = userEvent.setup();
    const { card } = seed();
    const onClose = renderDialog(card, card.listId);

    await user.click(screen.getByRole("button", { name: "Delete card" }));

    expect(storedData().boards[0].cards).toHaveLength(0);
    expect(onClose).toHaveBeenCalled();
  });

  it("NFR3 closes with Escape without saving, and names the dialog by its heading", async () => {
    const user = userEvent.setup();
    const { card } = seed();
    const onClose = renderDialog(card, card.listId);

    expect(
      screen.getByRole("dialog", { name: "Edit task" })
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/task name/i));
    await user.type(screen.getByLabelText(/task name/i), "Changed");
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
    expect(storedData().boards[0].cards[0].title).toBe("Fix header");
  });

  it("NFR3 gives every label color a name and keeps label text at 4.5 to 1 contrast or better", () => {
    LABEL_COLORS.forEach((entry) => {
      expect(entry.name).not.toBe("");
      expect(
        contrastRatio(labelTextColor(entry.value), entry.value)
      ).toBeGreaterThanOrEqual(4.5);
    });
  });
});
