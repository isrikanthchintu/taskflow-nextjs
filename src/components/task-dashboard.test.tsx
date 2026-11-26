import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskDashboard } from "@/components/task-dashboard";
import { DATA_KEY, LEGACY_KEY } from "@/lib/board-storage";
import { createDefaultData, newCard } from "@/lib/board-schema";
import { renderWithTheme, seedData, storedData } from "@/test-utils";

function pillValue(label: string): string {
  const summary = screen.getByRole("region", { name: "Task summary" });
  const pill = within(summary).getByText(label).parentElement;
  if (!pill) throw new Error(`Count pill for "${label}" not found`);
  return within(pill).getByTestId("count-pill-value").textContent ?? "";
}

async function renderReadyDashboard() {
  const user = userEvent.setup();
  renderWithTheme(<TaskDashboard />);
  await waitFor(() =>
    expect(screen.queryByText("Loading your tasks...")).not.toBeInTheDocument()
  );
  return user;
}

async function waitForDialogClosed() {
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
}

describe("TaskDashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates a task via the New task form and updates the list and count pills", async () => {
    const user = await renderReadyDashboard();
    const initialTotal = Number(pillValue("Total tasks"));
    const initialTodo = Number(pillValue("To do"));

    await user.click(screen.getByRole("button", { name: /new task/i }));
    await user.type(screen.getByLabelText(/task name/i), "Draft proposal");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(await screen.findByText("Draft proposal")).toBeInTheDocument();
    await waitForDialogClosed();
    expect(pillValue("Total tasks")).toBe(String(initialTotal + 1));
    expect(pillValue("To do")).toBe(String(initialTodo + 1));
  });

  it("cycles a task's list via its status control and updates count pills", async () => {
    const user = await renderReadyDashboard();
    const todoTitle = "Update component documentation";
    const initialTodo = Number(pillValue("To do"));
    const initialInProgress = Number(pillValue("In progress"));

    await user.click(
      screen.getByRole("button", { name: `Mark ${todoTitle} as In progress` })
    );

    await waitFor(() =>
      expect(pillValue("To do")).toBe(String(initialTodo - 1))
    );
    expect(pillValue("In progress")).toBe(String(initialInProgress + 1));
  });

  it("FR6.2 deletes a task, updates the count pills and offers an undo that restores it", async () => {
    const user = await renderReadyDashboard();
    const title = "Fix mobile navigation spacing";
    const initialTotal = Number(pillValue("Total tasks"));

    await user.click(screen.getByRole("button", { name: `Delete ${title}` }));

    await waitFor(() =>
      expect(screen.queryByText(title)).not.toBeInTheDocument()
    );
    expect(pillValue("Total tasks")).toBe(String(initialTotal - 1));
    expect(screen.getByTestId("undo-snackbar")).toHaveTextContent(
      "Card deleted"
    );

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(pillValue("Total tasks")).toBe(String(initialTotal));
  });

  it("FR4.1 filters the task list using the search box", async () => {
    const user = await renderReadyDashboard();

    await user.type(
      screen.getByRole("textbox", { name: /search tasks/i }),
      "roadmap"
    );

    expect(screen.getByText("Review the product roadmap")).toBeInTheDocument();
    expect(
      screen.queryByText("Update component documentation")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Fix mobile navigation spacing")
    ).not.toBeInTheDocument();
  });

  it("FR4.4 does not render the old status-filter tabs", async () => {
    await renderReadyDashboard();

    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByText("All tasks")).not.toBeInTheDocument();
  });

  it("FR3.4 opens the edit dialog prefilled with a card's current fields when the card is clicked", async () => {
    const user = await renderReadyDashboard();
    const title = "Update component documentation";

    await user.click(screen.getByText(title));

    expect(
      screen.getByRole("heading", { name: "Edit task" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/task name/i)).toHaveValue(title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      "Document reusable UI patterns and usage examples."
    );
  });

  it("FR3.4 submits the edit dialog and never moves the card to another list", async () => {
    const user = await renderReadyDashboard();
    const title = "Update component documentation";

    await user.click(screen.getByText(title));
    await user.clear(screen.getByLabelText(/task name/i));
    await user.type(
      screen.getByLabelText(/task name/i),
      "Update component docs"
    );
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText("Update component docs")
    ).toBeInTheDocument();
    await waitForDialogClosed();
    expect(screen.queryByText(title)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /mark update component docs as in progress/i
      })
    ).toBeInTheDocument();
  });

  it("FR4.1 narrows the board from the Filter panel and shows the active count on the button", async () => {
    const user = await renderReadyDashboard();

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(screen.getByLabelText("High"));
    await user.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Filters, 1 active" })
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Review the product roadmap")).toBeInTheDocument();
    expect(
      screen.queryByText("Update component documentation")
    ).not.toBeInTheDocument();
  });

  it("FR2.2 adds a custom list and shows it with its own count pill", async () => {
    const user = await renderReadyDashboard();

    await user.click(screen.getByRole("button", { name: "Add a list" }));
    await user.type(screen.getByLabelText("List name"), "Review{Enter}");

    expect(
      await screen.findByRole("heading", { name: "Review" })
    ).toBeInTheDocument();
    expect(pillValue("Review")).toBe("0");
    expect(screen.getByText("No cards yet")).toBeInTheDocument();
  });

  it("FR1.2 shows cards converted from the earlier saved tasks", async () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([
        {
          id: "old-1",
          title: "Old card",
          description: "",
          status: "in-progress",
          priority: "low",
          dueDate: "",
          createdAt: "2026-11-01T00:00:00.000Z"
        }
      ])
    );

    await renderReadyDashboard();

    expect(screen.getByText("Old card")).toBeInTheDocument();
    expect(pillValue("In progress")).toBe("1");
  });

  it("FR1.3 shows the unreadable-data message and leaves the data untouched", async () => {
    window.localStorage.setItem(DATA_KEY, "{not json");

    await renderReadyDashboard();

    const banner = screen.getByTestId("banner-data-error");
    expect(banner).toHaveTextContent("Your saved data could not be read");
    expect(screen.getByRole("button", { name: /new task/i })).toBeDisabled();
    expect(window.localStorage.getItem(DATA_KEY)).toBe("{not json");
  });

  it("recovers from data written by a newer version after a confirmed reset", async () => {
    const newer = { ...createDefaultData(), version: 99 };
    window.localStorage.setItem(DATA_KEY, JSON.stringify(newer));

    const user = await renderReadyDashboard();

    expect(screen.getByTestId("banner-data-error")).toHaveTextContent(
      "written by a newer version"
    );
    await user.click(screen.getByRole("button", { name: "Reset saved data" }));
    await user.click(screen.getByTestId("confirm-accept"));

    await waitFor(() =>
      expect(screen.queryByTestId("banner-data-error")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /new task/i })).toBeEnabled();
    expect(storedData().version).toBe(2);
  });

  it("FR1.5 warns in words when 90 percent of the card limit is in use", async () => {
    const data = createDefaultData();
    const board = data.boards[0];
    board.cards = Array.from({ length: 180 }, (_, index) =>
      newCard(board.lists[0].id, { title: `Card ${index}` })
    );
    seedData(data);

    await renderReadyDashboard();

    expect(
      screen.getByText("You have used 180 of 200 cards in total")
    ).toBeInTheDocument();
  });

  it("FR1.1 saves a created card so it is still there after a reload", async () => {
    const user = await renderReadyDashboard();

    await user.click(screen.getByRole("button", { name: /new task/i }));
    await user.type(screen.getByLabelText(/task name/i), "Persisted card");
    await user.click(screen.getByRole("button", { name: /create task/i }));
    await waitForDialogClosed();

    expect(
      storedData().boards[0].cards.some(
        (card) => card.title === "Persisted card"
      )
    ).toBe(true);
  });

  it("FR2.1 labels the board region landmarks and links to the archive and settings pages", async () => {
    await renderReadyDashboard();

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Archive" })).toHaveAttribute(
      "href",
      "/archive"
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
  });
});
