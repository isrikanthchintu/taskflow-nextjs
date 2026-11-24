import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RulesDialog } from "@/components/rules-dialog";
import { createDefaultData, newId, newLabel } from "@/lib/board-schema";
import { renderWithTheme, seedData, storedData } from "@/test-utils";
import type { AppData, Rule } from "@/types/board";

function seed(rules: Rule[] = [], withLabel = true): AppData {
  const data = createDefaultData();
  const board = data.boards[0];
  if (withLabel) board.labels = [newLabel("Urgent", "#ffd2cc")];
  board.rules = rules;
  seedData(data);
  return data;
}

function renderDialog(onClose = jest.fn()) {
  renderWithTheme(<RulesDialog open onClose={onClose} />);
  return onClose;
}

describe("RulesDialog", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("FR11.1 shows No rules yet and a New rule form when the board has no rules", () => {
    seed();
    renderDialog();

    expect(
      screen.getByRole("dialog", { name: /Rules for/ })
    ).toBeInTheDocument();
    expect(screen.getByTestId("rules-empty")).toHaveTextContent("No rules yet");
    expect(screen.getByRole("form", { name: "New rule" })).toBeInTheDocument();
  });

  it("FR11.1 creates a rule: when a card enters a list, move it to another list", async () => {
    const user = userEvent.setup();
    const data = seed();
    const [todo, doing, done] = data.boards[0].lists;
    renderDialog();

    await user.type(screen.getByLabelText("Rule name"), "Finish up");
    await user.selectOptions(screen.getByLabelText("Watched list"), doing.id);
    await user.selectOptions(screen.getByLabelText("Move to list"), done.id);
    await user.click(screen.getByTestId("rule-create"));

    await waitFor(() => expect(storedData().boards[0].rules).toHaveLength(1));
    expect(storedData().boards[0].rules[0]).toMatchObject({
      name: "Finish up",
      enabled: true,
      trigger: { kind: "card-enters-list", listId: doing.id },
      action: { kind: "move-to-list", listId: done.id }
    });
    expect(todo.id).not.toBe(doing.id);
    expect(screen.getByText("Finish up")).toBeInTheDocument();
    expect(
      screen.getByText("When a card enters In progress, move it to Completed")
    ).toBeInTheDocument();
  });

  it("FR11.1 creates a rule: when a checklist is fully checked, add a label", async () => {
    const user = userEvent.setup();
    const data = seed();
    const label = data.boards[0].labels[0];
    renderDialog();

    await user.type(screen.getByLabelText("Rule name"), "Tag finished");
    await user.selectOptions(
      screen.getByLabelText("When"),
      "checklist-complete"
    );
    expect(screen.queryByLabelText("Watched list")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Do"), "add-label");
    await user.selectOptions(screen.getByLabelText("Label to add"), label.id);
    await user.click(screen.getByTestId("rule-create"));

    await waitFor(() => expect(storedData().boards[0].rules).toHaveLength(1));
    expect(storedData().boards[0].rules[0]).toMatchObject({
      trigger: { kind: "checklist-complete" },
      action: { kind: "add-label", labelId: label.id }
    });
  });

  it("FR11.1 creates a rule that sets a chosen priority", async () => {
    const user = userEvent.setup();
    seed();
    renderDialog();

    await user.type(screen.getByLabelText("Rule name"), "Escalate");
    await user.selectOptions(screen.getByLabelText("Do"), "set-priority");
    await user.selectOptions(screen.getByLabelText("Priority to set"), "low");
    await user.click(screen.getByTestId("rule-create"));

    await waitFor(() => expect(storedData().boards[0].rules).toHaveLength(1));
    expect(storedData().boards[0].rules[0].action).toEqual({
      kind: "set-priority",
      priority: "low"
    });
  });

  it("FR11.1 refuses a blank rule name in words and adds nothing", async () => {
    const user = userEvent.setup();
    seed();
    renderDialog();

    await user.click(screen.getByTestId("rule-create"));

    expect(screen.getByTestId("rule-error")).toHaveTextContent(
      "A rule name cannot be blank."
    );
    expect(storedData().boards[0].rules).toHaveLength(0);
  });

  it("FR11.1 says so in words when a rule would add a label but the board has none", async () => {
    const user = userEvent.setup();
    seed([], false);
    renderDialog();

    await user.type(screen.getByLabelText("Rule name"), "Tag");
    await user.selectOptions(screen.getByLabelText("Do"), "add-label");
    await user.click(screen.getByTestId("rule-create"));

    expect(screen.getByTestId("rule-error")).toHaveTextContent(
      "Add a label to this board"
    );
    expect(storedData().boards[0].rules).toHaveLength(0);
  });

  it("FR11.1 turns a rule off and on again with its switch", async () => {
    const user = userEvent.setup();
    const data = seed();
    const doing = data.boards[0].lists[1];
    const rule: Rule = {
      id: newId(),
      name: "Escalate",
      enabled: true,
      trigger: { kind: "card-enters-list", listId: doing.id },
      action: { kind: "set-priority", priority: "high" }
    };
    seed([rule]);
    renderDialog();

    await user.click(
      screen.getByRole("switch", { name: "Turn off rule Escalate" })
    );
    await waitFor(() =>
      expect(storedData().boards[0].rules[0].enabled).toBe(false)
    );
    expect(screen.getByTestId(`rule-${rule.id}`)).toHaveTextContent(
      "(turned off)"
    );

    await user.click(
      screen.getByRole("switch", { name: "Turn on rule Escalate" })
    );
    await waitFor(() =>
      expect(storedData().boards[0].rules[0].enabled).toBe(true)
    );
  });

  it("FR11.1 deletes a rule only after a confirmation that names it", async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const rule: Rule = {
      id: newId(),
      name: "Escalate",
      enabled: true,
      trigger: { kind: "checklist-complete" },
      action: { kind: "set-priority", priority: "high" }
    };
    data.boards[0].rules = [rule];
    seedData(data);
    renderDialog();

    await user.click(
      screen.getByRole("button", { name: "Delete rule Escalate" })
    );
    expect(
      screen.getByRole("dialog", { name: "Delete rule 'Escalate'?" })
    ).toBeInTheDocument();
    expect(storedData().boards[0].rules).toHaveLength(1);
    await user.click(screen.getByTestId("confirm-accept"));

    await waitFor(() => expect(storedData().boards[0].rules).toHaveLength(0));
  });

  it("FR11.3 shows a rule whose list was archived as broken, in words and with an icon", () => {
    const data = createDefaultData();
    const [, doing, done] = data.boards[0].lists;
    doing.archived = true;
    const rule: Rule = {
      id: newId(),
      name: "Old rule",
      enabled: true,
      trigger: { kind: "card-enters-list", listId: doing.id },
      action: { kind: "move-to-list", listId: done.id }
    };
    data.boards[0].rules = [rule];
    seedData(data);
    renderDialog();

    const broken = screen.getByTestId(`rule-${rule.id}-broken`);
    expect(broken).toHaveTextContent(
      "Broken: the list it watches was archived or removed. It does nothing."
    );
    expect(broken.querySelector("svg")).not.toBeNull();
  });

  it("FR11.3 names a deleted label as the cause of a broken add-label rule", () => {
    const data = createDefaultData();
    const rule: Rule = {
      id: newId(),
      name: "Tag",
      enabled: true,
      trigger: { kind: "checklist-complete" },
      action: { kind: "add-label", labelId: "gone" }
    };
    data.boards[0].rules = [rule];
    seedData(data);
    renderDialog();

    expect(screen.getByTestId(`rule-${rule.id}-broken`)).toHaveTextContent(
      "Broken: its label was deleted. It does nothing."
    );
  });

  it("FR11.2 tells the user that rules run only on their own actions and never start another rule", () => {
    seed();
    renderDialog();

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Rules run only when you move a card or finish a checklist. A rule's own action never starts another rule."
    );
  });

  it("NFR3 closes with the Close button and keeps each rule's controls reachable", async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    data.boards[0].rules = [
      {
        id: newId(),
        name: "Escalate",
        enabled: true,
        trigger: { kind: "checklist-complete" },
        action: { kind: "set-priority", priority: "high" }
      }
    ];
    seedData(data);
    const onClose = renderDialog();

    const dialog = screen.getByRole("dialog", { name: /Rules for/ });
    expect(
      within(dialog).getByRole("switch", { name: /rule Escalate/ })
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("rules-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
