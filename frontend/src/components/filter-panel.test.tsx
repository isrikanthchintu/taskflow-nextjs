import { useState } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  EMPTY_VIEW,
  FilterPanel,
  viewActiveCount,
  type BoardView
} from "@/components/filter-panel";
import { newLabel } from "@/lib/board-schema";
import { renderWithTheme } from "@/test-utils";

const bug = newLabel("Bug", "#ffd2cc");
const ui = newLabel("UI", "#c9def9");

let latest: BoardView = EMPTY_VIEW;

function Harness({
  initial = EMPTY_VIEW,
  labels = [bug, ui],
  matchCount = 3,
  onClose = jest.fn()
}: {
  initial?: BoardView;
  labels?: (typeof bug)[];
  matchCount?: number;
  onClose?: () => void;
}) {
  const [view, setView] = useState(initial);
  latest = view;
  const [anchor] = useState(() => {
    const element = document.createElement("button");
    document.body.appendChild(element);
    return element;
  });
  return (
    <FilterPanel
      anchorEl={anchor}
      onClose={onClose}
      labels={labels}
      view={view}
      onChange={setView}
      matchCount={matchCount}
    />
  );
}

describe("FilterPanel", () => {
  beforeEach(() => {
    latest = EMPTY_VIEW;
  });

  it("NFR3 opens as a labelled dialog with each group in a fieldset with a legend", () => {
    renderWithTheme(<Harness />);

    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    [
      "Label",
      "Priority",
      "Due",
      "Sort cards by",
      "Sort direction",
      "Group cards by"
    ].forEach((legend) =>
      expect(screen.getByRole("group", { name: legend })).toBeInTheDocument()
    );
  });

  it("FR4.1 filters by label, priority and due state and applies at once", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    await user.click(screen.getByLabelText("Bug"));
    await user.click(screen.getByLabelText("High"));
    await user.click(screen.getByLabelText("Overdue"));

    expect(latest.filter.labelIds).toEqual([bug.id]);
    expect(latest.filter.priorities).toEqual(["high"]);
    expect(latest.filter.dueStates).toEqual(["overdue"]);
    expect(viewActiveCount(latest)).toBe(3);
  });

  it("FR4.1 removes a filter when its checkbox is cleared", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    await user.click(screen.getByLabelText("Medium"));
    await user.click(screen.getByLabelText("Medium"));

    expect(latest.filter.priorities).toEqual([]);
  });

  it("FR4.1 says there are no labels yet when the board has none", () => {
    renderWithTheme(<Harness labels={[]} />);

    expect(
      screen.getByText("No labels yet. Add one in a card.")
    ).toBeInTheDocument();
  });

  it("FR4.2 chooses a sort field and a direction, and Saved order turns the sort off", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    await user.click(screen.getByLabelText("Due date"));
    expect(latest.sort).toEqual({ key: "due", direction: "asc" });

    await user.click(screen.getByLabelText("Down"));
    expect(latest.sort).toEqual({ key: "due", direction: "desc" });

    await user.click(screen.getByLabelText("Saved order"));
    expect(latest.sort).toBeNull();
  });

  it("FR4.3 chooses a group field and Off turns grouping off", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    await user.click(
      screen.getByLabelText("Label", { selector: "input[type=radio]" })
    );
    expect(latest.group).toBe("label");

    await user.click(
      within(
        screen.getByRole("radiogroup", { name: "Group cards by" })
      ).getByLabelText("Off")
    );
    expect(latest.group).toBeNull();
  });

  it("FR4.1 Clear all resets filters, sort and group but keeps the search text", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <Harness
        initial={{
          filter: {
            text: "road",
            labelIds: [bug.id],
            priorities: ["high"],
            dueStates: []
          },
          sort: { key: "priority", direction: "asc" },
          group: "due",
          swimlane: "label"
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(latest.filter).toEqual({ ...EMPTY_VIEW.filter, text: "road" });
    expect(latest.sort).toBeNull();
    expect(latest.group).toBeNull();
    expect(latest.swimlane).toBeNull();
  });

  it("FR10.2 turns swimlanes on by priority or label and off again from the Filter panel", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    expect(latest.swimlane).toBeNull();
    await user.click(screen.getByLabelText("By priority"));
    expect(latest.swimlane).toBe("priority");
    await user.click(screen.getByLabelText("By label"));
    expect(latest.swimlane).toBe("label");
    expect(viewActiveCount(latest)).toBe(1);
    await user.click(screen.getByTestId("filter-swimlane-off"));
    expect(latest.swimlane).toBeNull();
  });

  it("NFR3 announces how many cards match in a polite live region", () => {
    renderWithTheme(<Harness matchCount={3} />);

    expect(screen.getByRole("status")).toHaveTextContent("3 cards match");
  });

  it("NFR3 closes with Escape and with Done", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithTheme(<Harness onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
