import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchiveView } from "@/components/archive-view";
import { createDefaultData, newCard } from "@/lib/board-schema";
import { renderWithTheme, seedData, storedData } from "@/test-utils";

function seedArchive(options: { archivedListCards?: number } = {}) {
  const data = createDefaultData();
  const board = data.boards[0];
  const [todo, doing] = board.lists;
  doing.archived = true;
  const count = options.archivedListCards ?? 2;
  board.cards = [
    ...Array.from({ length: count }, (_, index) =>
      newCard(doing.id, { title: `Review card ${index}` })
    ),
    newCard(todo.id, { title: "Archived task", archived: true }),
    newCard(doing.id, { title: "Stuck task", archived: true })
  ];
  seedData(data);
  return { data, board, todo, doing };
}

async function renderReady() {
  const user = userEvent.setup();
  renderWithTheme(<ArchiveView />);
  await waitFor(() =>
    expect(
      screen.queryByText("Loading your archive...")
    ).not.toBeInTheDocument()
  );
  return user;
}

describe("ArchiveView", () => {
  beforeEach(() => {
    window.localStorage.clear();
    seedArchive();
  });

  it("FR2.4 lists archived lists with their card counts and a Restore action", async () => {
    const { doing } = seedArchive();
    await renderReady();

    const row = screen.getByTestId(`archive-list-${doing.id}`);
    expect(row).toHaveTextContent("In progress (3 cards)");
    expect(
      within(row).getByRole("button", { name: "Restore list In progress" })
    ).toBeInTheDocument();
  });

  it("FR2.4 restores an archived list to the board", async () => {
    const user = userEvent.setup();
    const { doing } = seedArchive();
    renderWithTheme(<ArchiveView />);

    await user.click(
      await screen.findByRole("button", { name: "Restore list In progress" })
    );

    await waitFor(() =>
      expect(screen.getByText("Nothing archived here yet")).toBeInTheDocument()
    );
    expect(
      storedData().boards[0].lists.find((list) => list.id === doing.id)
        ?.archived
    ).toBe(false);
  });

  it("FR2.5 asks for confirmation that names the number of cards, with default focus on Cancel", async () => {
    const user = await renderReady();

    await user.click(
      screen.getByRole("button", {
        name: "Delete list In progress permanently"
      })
    );

    const dialog = screen.getByRole("dialog", {
      name: "Delete 'In progress' permanently?"
    });
    expect(dialog).toHaveTextContent("This deletes the list and its 3 cards.");
    expect(
      within(dialog).getByRole("button", { name: "Delete 3 cards" })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Cancel" })
    ).toHaveFocus();
  });

  it("FR2.5 keeps the list when the confirmation is cancelled with Escape", async () => {
    const { doing } = seedArchive();
    const user = userEvent.setup();
    renderWithTheme(<ArchiveView />);

    await user.click(
      await screen.findByRole("button", {
        name: "Delete list In progress permanently"
      })
    );
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      storedData().boards[0].lists.some((list) => list.id === doing.id)
    ).toBe(true);
  });

  it("FR2.5 deletes the archived list and its cards only after the named confirmation", async () => {
    const { doing } = seedArchive();
    const user = userEvent.setup();
    renderWithTheme(<ArchiveView />);

    await user.click(
      await screen.findByRole("button", {
        name: "Delete list In progress permanently"
      })
    );
    await user.click(screen.getByRole("button", { name: "Delete 3 cards" }));

    await waitFor(() => {
      const board = storedData().boards[0];
      expect(board.lists.some((list) => list.id === doing.id)).toBe(false);
      expect(board.cards.some((card) => card.listId === doing.id)).toBe(false);
    });
  });

  it("FR6.1 restores an archived card from the Cards tab", async () => {
    const user = await renderReady();

    await user.click(screen.getByRole("tab", { name: "Cards" }));
    await user.click(
      screen.getByRole("button", { name: "Restore card Archived task" })
    );

    await waitFor(() =>
      expect(
        storedData().boards[0].cards.find(
          (card) => card.title === "Archived task"
        )?.archived
      ).toBe(false)
    );
  });

  it("FR6.1 says Restore the list first for a card whose list is archived", async () => {
    const user = await renderReady();

    await user.click(screen.getByRole("tab", { name: "Cards" }));

    const stuck = screen
      .getByText("Stuck task")
      .closest("[data-testid^=archive-card-]");
    expect(stuck).toHaveTextContent("Restore the list first");
    expect(
      within(stuck as HTMLElement).queryByRole("button", {
        name: /^Restore card/
      })
    ).not.toBeInTheDocument();
  });

  it("FR2.5 names one card when a single archived card is deleted permanently", async () => {
    const user = await renderReady();

    await user.click(screen.getByRole("tab", { name: "Cards" }));
    await user.click(
      screen.getByRole("button", {
        name: "Delete card Archived task permanently"
      })
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "This deletes 1 card permanently."
    );
    await user.click(screen.getByRole("button", { name: "Delete 1 card" }));

    await waitFor(() =>
      expect(
        storedData().boards[0].cards.some(
          (card) => card.title === "Archived task"
        )
      ).toBe(false)
    );
  });

  it("FR2.5 says a permanent card delete cannot be undone and offers no Undo afterwards", async () => {
    const user = await renderReady();

    await user.click(screen.getByRole("tab", { name: "Cards" }));
    await user.click(
      screen.getByRole("button", {
        name: "Delete card Archived task permanently"
      })
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "This deletes 1 card permanently. This cannot be undone."
    );
    await user.click(screen.getByRole("button", { name: "Delete 1 card" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(screen.queryByTestId("undo-snackbar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" })
    ).not.toBeInTheDocument();
  });

  it("FR2.4 shows Nothing archived here yet on an empty tab", async () => {
    seedData(createDefaultData());
    await renderReady();

    expect(screen.getByTestId("archive-empty")).toHaveTextContent(
      "Nothing archived here yet"
    );
  });

  it("NFR3 offers Back to board and tabs reachable by keyboard", async () => {
    const user = await renderReady();

    expect(screen.getByRole("link", { name: "Back to board" })).toHaveAttribute(
      "href",
      "/"
    );
    await user.click(screen.getByRole("tab", { name: "Lists" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Cards" })).toHaveFocus();
  });
});
