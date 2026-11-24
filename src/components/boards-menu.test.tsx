import { useState } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardsMenu } from "@/components/boards-menu";
import { createDefaultData, defaultBoard } from "@/lib/board-schema";
import { renderWithTheme, seedData, storedData } from "@/test-utils";
import type { AppData } from "@/types/board";

function Harness({
  onExport = jest.fn(),
  onImport = jest.fn(),
  onOpenRules = jest.fn()
}: {
  onExport?: () => void;
  onImport?: () => void;
  onOpenRules?: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <BoardsMenu
      anchorEl={anchor}
      onOpen={setAnchor}
      onClose={() => setAnchor(null)}
      onExport={onExport}
      onImport={onImport}
      onOpenRules={onOpenRules}
    />
  );
}

function seedBoards(names: string[]): AppData {
  const data = createDefaultData();
  data.boards[0].name = names[0];
  names.slice(1).forEach((name) => data.boards.push(defaultBoard(name)));
  seedData(data);
  return data;
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("boards-menu-button"));
}

describe("BoardsMenu", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("FR7.2 shows the open board's name on the button and lists every open board as a radio item", async () => {
    const user = userEvent.setup();
    seedBoards(["Work", "Home"]);
    renderWithTheme(<Harness />);

    expect(screen.getByTestId("top-bar-board-name")).toHaveTextContent("Work");
    await openMenu(user);

    expect(screen.getByRole("menuitemradio", { name: "Work" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("menuitemradio", { name: "Home" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("FR7.2 switches boards and the stored data reopens the chosen board", async () => {
    const user = userEvent.setup();
    const data = seedBoards(["Work", "Home"]);
    renderWithTheme(<Harness />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: "Home" }));

    await waitFor(() =>
      expect(storedData().activeBoardId).toBe(data.boards[1].id)
    );
    expect(screen.getByTestId("top-bar-board-name")).toHaveTextContent("Home");
  });

  it("FR7.1 creates a board from the New board item and shows how many of 5 are used", async () => {
    const user = userEvent.setup();
    seedBoards(["Work", "Home"]);
    renderWithTheme(<Harness />);

    await openMenu(user);
    expect(
      screen.getByRole("menuitem", { name: /New board \(2 of 5\)/ })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /New board/ }));
    await user.type(screen.getByLabelText("Board name"), "Side project{Enter}");

    await waitFor(() => expect(storedData().boards).toHaveLength(3));
    expect(storedData().boards[2].name).toBe("Side project");
    expect(screen.getByTestId("top-bar-board-name")).toHaveTextContent(
      "Side project"
    );
  });

  it("FR7.1 refuses a blank board name in words and keeps the dialog open", async () => {
    const user = userEvent.setup();
    seedBoards(["Work"]);
    renderWithTheme(<Harness />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /New board/ }));
    await user.click(screen.getByRole("button", { name: "Create board" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/cannot be blank/i)).toBeInTheDocument();
    expect(storedData().boards).toHaveLength(1);
  });

  it("FR7.1 disables New board at the limit and gives the reason in words", async () => {
    const user = userEvent.setup();
    seedBoards(["A", "B", "C", "D", "E"]);
    renderWithTheme(<Harness />);

    await openMenu(user);

    const item = screen.getByTestId("boards-menu-new");
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveTextContent("Board limit reached (5)");
    expect(item).toHaveTextContent("New board (5 of 5)");
  });

  it("FR7.1 renames the open board through a dialog prefilled with its name", async () => {
    const user = userEvent.setup();
    seedBoards(["Work"]);
    renderWithTheme(<Harness />);

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Rename this board" })
    );
    const field = screen.getByLabelText("Board name");
    expect(field).toHaveValue("Work");
    await user.clear(field);
    await user.type(field, "Office{Enter}");

    await waitFor(() => expect(storedData().boards[0].name).toBe("Office"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("boards-menu-button")).toHaveFocus();
  });

  it("FR7.4 archives the open board and the other board becomes the open one", async () => {
    const user = userEvent.setup();
    const data = seedBoards(["Work", "Home"]);
    renderWithTheme(<Harness />);

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Archive this board" })
    );

    await waitFor(() => expect(storedData().boards[0].archived).toBe(true));
    expect(storedData().activeBoardId).toBe(data.boards[1].id);
  });

  it("FR7.4 disables Archive this board when it is the only open board and says why", async () => {
    const user = userEvent.setup();
    seedBoards(["Work"]);
    renderWithTheme(<Harness />);

    await openMenu(user);

    const item = screen.getByTestId("boards-menu-archive-board");
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveTextContent("Keep at least one board open");
  });

  it("FR8.1 FR8.2 hands Export, Import and Rules to the page and closes the menu", async () => {
    const user = userEvent.setup();
    seedBoards(["Work"]);
    const onExport = jest.fn();
    const onImport = jest.fn();
    const onOpenRules = jest.fn();
    renderWithTheme(
      <Harness
        onExport={onExport}
        onImport={onImport}
        onOpenRules={onOpenRules}
      />
    );

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Export this board" })
    );
    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Import a board" }));
    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Rules for this board" })
    );

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onOpenRules).toHaveBeenCalledTimes(1);
  });

  it("FR7.4 links to the Archive page", async () => {
    const user = userEvent.setup();
    seedBoards(["Work"]);
    renderWithTheme(<Harness />);

    await openMenu(user);

    expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveAttribute(
      "href",
      "/archive"
    );
  });

  it("NFR3 opens from the keyboard and Escape returns focus to the boards button", async () => {
    const user = userEvent.setup();
    seedBoards(["Work", "Home"]);
    renderWithTheme(<Harness />);

    act(() => screen.getByTestId("boards-menu-button").focus());
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu", { name: "Boards" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("boards-menu-button")).toHaveFocus();
  });
});
