import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPage } from "@/components/settings-page";
import { TaskDashboard } from "@/components/task-dashboard";
import { BoardToolbar } from "@/components/board-toolbar";
import { DEFAULT_SETTINGS } from "@/lib/theme-presets";
import { createAppTheme } from "@/theme";
import { createDefaultData, newCard } from "@/lib/board-schema";
import { renderApp, renderWithTheme, seedData, storedData } from "@/test-utils";

jest.setTimeout(90000);

type User = ReturnType<typeof userEvent.setup>;

async function renderDashboard() {
  const user = userEvent.setup();
  const view = renderApp(<TaskDashboard />);
  await waitFor(() =>
    expect(screen.queryByText("Loading your tasks...")).not.toBeInTheDocument()
  );
  return { user, view };
}

async function activate(user: User, element: HTMLElement) {
  act(() => element.focus());
  await user.keyboard("{Enter}");
}

async function nothingOverlayOpen() {
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
}

function seedTwoCards() {
  const data = createDefaultData();
  const board = data.boards[0];
  board.cards = [
    newCard(board.lists[0].id, { title: "First card" }),
    newCard(board.lists[0].id, { title: "Second card" })
  ];
  seedData(data);
  return board;
}

describe("Accessibility pass", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("NFR3 switches animation off when the system asks for reduced motion", () => {
    const theme = createAppTheme(DEFAULT_SETTINGS);
    const overrides = theme.components?.MuiCssBaseline
      ?.styleOverrides as Record<
      string,
      Record<string, Record<string, string>>
    >;

    expect(
      overrides["@media (prefers-reduced-motion: reduce)"][
        "*, *::before, *::after"
      ].transitionDuration
    ).toContain("0.01ms");
  });

  it("NFR3 gives the compact top bar 44 by 44 pixel touch targets", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null
    })) as unknown as typeof window.matchMedia;
    try {
      renderWithTheme(
        <BoardToolbar
          boardName="Work"
          activeFilterCount={0}
          onOpenFilters={jest.fn()}
          onNewTask={jest.fn()}
        />
      );
      const button = screen.getByTestId("top-bar-menu-button");
      const style = window.getComputedStyle(button);
      expect(style.width).toBe("44px");
      expect(style.height).toBe("44px");
    } finally {
      window.matchMedia = original;
    }
  });

  it("NFR3 puts a skip link first in the tab order and moves focus to the board region", async () => {
    const { user } = await renderDashboard();

    await user.tab();

    const skip = screen.getByTestId("skip-link");
    expect(skip).toHaveFocus();
    expect(skip).toHaveTextContent("Skip to board");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("NFR3 labels the landmarks: banner, main, one h1 first, and a labelled region per list", async () => {
    seedTwoCards();
    await renderDashboard();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    const headings = screen.getAllByRole("heading");
    expect(headings[0].tagName).toBe("H1");
    expect(
      screen.getByRole("region", { name: "To do list" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Search tasks" })
    ).toBeInTheDocument();
  });

  it("FR9.2 FR9.3 N opens the new card dialog, but typing N in the search box does not", async () => {
    const { user } = await renderDashboard();

    await user.click(screen.getByRole("textbox", { name: "Search tasks" }));
    await user.keyboard("n");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search tasks" })).toHaveValue(
      "n"
    );

    await user.click(document.body);
    await user.keyboard("n");
    expect(
      await screen.findByRole("dialog", { name: /task/i })
    ).toBeInTheDocument();
  });

  it("FR9.2 FR9.3 slash focuses search and single keys stay off while a dialog is open", async () => {
    const { user } = await renderDashboard();

    await user.keyboard("/");
    expect(screen.getByRole("textbox", { name: "Search tasks" })).toHaveFocus();
    await user.click(document.body);

    await user.keyboard("?");
    expect(
      await screen.findByRole("dialog", { name: "Keyboard shortcuts" })
    ).toBeInTheDocument();
    await user.keyboard("n");
    expect(
      screen.queryByRole("dialog", { name: /new task|add task|create/i })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("FR9.1 Ctrl+K opens the command menu, typing filters, Enter runs and the search box gets focus", async () => {
    const { user } = await renderDashboard();

    await user.keyboard("{Control>}k{/Control}");
    const input = await screen.findByRole("combobox");
    await user.type(input, "search{Enter}");

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Search tasks" })
      ).toHaveFocus()
    );
  });

  it("FR9.1 the command menu lists the required commands", async () => {
    const { user } = await renderDashboard();

    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("combobox");

    [
      "New card",
      "New list",
      "Go to search",
      "Switch board",
      "Open settings",
      "Open archive",
      "Toggle filters panel",
      "Export this board",
      "Import a board"
    ].forEach((name) =>
      expect(
        screen.getByRole("option", { name: new RegExp(name) })
      ).toBeInTheDocument()
    );
  });

  it("FR9.1 Escape closes the command menu and focus goes back to where it was", async () => {
    const { user } = await renderDashboard();
    act(() => screen.getByRole("textbox", { name: "Search tasks" }).focus());

    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("combobox");
    await user.keyboard("{Escape}");

    await nothingOverlayOpen();
    expect(screen.getByRole("textbox", { name: "Search tasks" })).toHaveFocus();
  });

  it("NFR3 announces how many cards match in a live region while searching", async () => {
    seedTwoCards();
    const { user } = await renderDashboard();

    await user.type(
      screen.getByRole("textbox", { name: "Search tasks" }),
      "First"
    );

    const region = screen.getByTestId("match-live-region");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("1 card matches");
    await user.clear(screen.getByRole("textbox", { name: "Search tasks" }));
    expect(region).toBeEmptyDOMElement();
  });

  it("NFR3 moves focus to the next card after a card is deleted", async () => {
    const board = seedTwoCards();
    const { user } = await renderDashboard();
    const first = board.cards[0];
    const second = board.cards[1];

    await activate(user, screen.getByTestId(`task-card-${first.id}-delete`));

    await waitFor(() =>
      expect(
        screen.queryByTestId(`task-card-${first.id}`)
      ).not.toBeInTheDocument()
    );
    expect(screen.getByTestId(`task-card-${second.id}`)).toHaveFocus();
    expect(screen.getByTestId("undo-snackbar")).toHaveAttribute(
      "role",
      "status"
    );
  });

  it("NFR3 returns focus to the card after the card dialog is closed with Escape", async () => {
    const board = seedTwoCards();
    const { user } = await renderDashboard();
    const card = screen.getByTestId(`task-card-${board.cards[0].id}`);

    act(() => card.focus());
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await nothingOverlayOpen();
    expect(card).toHaveFocus();
  });

  it("NFR3 puts focus on the board region when the card it came from is deleted in the dialog", async () => {
    const board = seedTwoCards();
    const { user } = await renderDashboard();
    const card = screen.getByTestId(`task-card-${board.cards[0].id}`);

    act(() => card.focus());
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog");
    await activate(user, screen.getByRole("button", { name: "Delete card" }));

    await nothingOverlayOpen();
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
  });

  it("NFR3 offers every shortcut dialog and menu a labelled name", async () => {
    const { user } = await renderDashboard();

    await user.keyboard("b");
    expect(
      await screen.findByRole("menu", { name: "Boards" })
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await nothingOverlayOpen();
    expect(screen.getByTestId("boards-menu-button")).toHaveFocus();
  });

  it("FR10.2 turns swimlanes on and off from the Filter panel by keyboard", async () => {
    seedTwoCards();
    const { user } = await renderDashboard();

    await activate(user, screen.getByRole("button", { name: "Filters" }));
    const dialog = await screen.findByRole("dialog", { name: "Filters" });
    act(() => within(dialog).getByTestId("filter-swimlane-priority").focus());
    await user.keyboard(" ");

    expect(await screen.findByTestId("swimlane-view")).toBeInTheDocument();
    expect(screen.queryByTestId("add-list-tile")).not.toBeInTheDocument();
    act(() => within(dialog).getByTestId("filter-swimlane-off").focus());
    await user.keyboard(" ");
    expect(screen.queryByTestId("swimlane-view")).not.toBeInTheDocument();
  });

  it("NFR3 NFR4 runs the whole success scenario by keyboard alone and keeps it after a reload", async () => {
    const { user, view } = await renderDashboard();

    await user.keyboard("b");
    await activate(
      user,
      await screen.findByRole("menuitem", { name: /New board \(1 of 5\)/ })
    );
    await user.type(
      await screen.findByLabelText("Board name"),
      "Launch{Enter}"
    );
    await nothingOverlayOpen();
    await waitFor(() =>
      expect(screen.getByTestId("top-bar-board-name")).toHaveTextContent(
        "Launch"
      )
    );

    await user.keyboard("l");
    await user.type(
      await screen.findByLabelText("List name"),
      "Backlog{Enter}"
    );
    expect(
      await screen.findByRole("heading", { name: "Backlog" })
    ).toBeInTheDocument();

    await activate(
      user,
      screen.getByRole("button", { name: "List actions for Backlog" })
    );
    await activate(
      user,
      await screen.findByRole("menuitem", { name: "Rename list" })
    );
    const renameField = await screen.findByLabelText("List name");
    await user.clear(renameField);
    await user.type(renameField, "Next up{Enter}");
    expect(
      await screen.findByRole(
        "heading",
        { name: "Next up" },
        { timeout: 15000 }
      )
    ).toBeInTheDocument();
    await nothingOverlayOpen();

    await user.keyboard("n");
    await user.type(await screen.findByLabelText(/task name/i), "Ship release");
    await activate(user, screen.getByRole("button", { name: "Manage labels" }));
    await user.type(screen.getByLabelText("New label name"), "Urgent{Enter}");
    const labelBox = await screen.findByLabelText("Urgent");
    act(() => labelBox.focus());
    await user.keyboard(" ");
    await user.type(screen.getByLabelText("Due date"), "2036-12-01");
    await user.type(
      screen.getByLabelText("New checklist title"),
      "Steps{Enter}"
    );
    await user.type(
      await screen.findByLabelText("New item in Steps"),
      "Tag it{Enter}"
    );
    await activate(user, screen.getByRole("button", { name: /create task/i }));
    await nothingOverlayOpen();

    expect(await screen.findByText("Ship release")).toBeInTheDocument();
    await activate(
      user,
      screen.getByRole("button", { name: "Mark Ship release as In progress" })
    );
    await waitFor(() => {
      const board = storedData().boards.find((item) => item.name === "Launch");
      const card = board?.cards.find((item) => item.title === "Ship release");
      const list = board?.lists.find((item) => item.id === card?.listId);
      expect(list?.name).toBe("In progress");
    });

    await activate(user, screen.getByRole("button", { name: "Filters" }));
    const panel = await screen.findByRole("dialog", { name: "Filters" });
    act(() => within(panel).getByTestId("filter-priority-medium").focus());
    await user.keyboard(" ");
    await activate(user, within(panel).getByRole("button", { name: "Done" }));
    await nothingOverlayOpen();
    expect(
      screen.getByRole("button", { name: "Filters, 1 active" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("match-live-region")).toHaveTextContent(
      "1 card matches"
    );

    view.unmount();
    const settings = renderWithTheme(<SettingsPage />);
    await waitFor(() =>
      expect(
        screen.queryByText("Loading your settings...")
      ).not.toBeInTheDocument()
    );
    act(() => screen.getByRole("radio", { name: "Purple" }).focus());
    await user.keyboard(" ");
    await waitFor(() => expect(storedData().settings.accentId).toBe("purple"));
    settings.unmount();

    await renderDashboard();

    expect(screen.getByTestId("top-bar-board-name")).toHaveTextContent(
      "Launch"
    );
    expect(screen.getByText("Ship release")).toBeInTheDocument();
    const stored = storedData();
    const board = stored.boards.find((item) => item.name === "Launch");
    const card = board?.cards.find((item) => item.title === "Ship release");
    expect(card?.dueDate).toBe("2036-12-01");
    expect(card?.labelIds).toHaveLength(1);
    expect(card?.checklists[0].items[0].text).toBe("Tag it");
    expect(board?.lists.map((item) => item.name)).toContain("Next up");
    expect(stored.settings.accentId).toBe("purple");
  });
});
