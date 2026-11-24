import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListMenu } from "@/components/list-menu";
import { useBoard } from "@/hooks/use-board";
import { newList } from "@/lib/board-schema";
import { renderWithTheme } from "@/test-utils";
import type { List } from "@/types/board";

jest.mock("../hooks/use-board", () => ({ useBoard: jest.fn() }));

const mockedUseBoard = useBoard as jest.Mock;

function setup(
  options: { list?: List; index?: number; listCount?: number } = {}
) {
  const actions = {
    renameList: jest.fn().mockReturnValue({ ok: true }),
    reorderList: jest.fn().mockReturnValue({ ok: true }),
    setListDone: jest.fn().mockReturnValue({ ok: true }),
    archiveList: jest.fn().mockReturnValue({ ok: true }),
    setListLimit: jest.fn().mockReturnValue({ ok: true })
  };
  mockedUseBoard.mockReturnValue(actions);
  const list = options.list ?? newList("Review");
  renderWithTheme(
    <ListMenu
      list={list}
      index={options.index ?? 1}
      listCount={options.listCount ?? 3}
    />
  );
  return { ...actions, list };
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: "List actions for Review" })
  );
}

describe("ListMenu", () => {
  it("FR2.2 opens a menu with the list actions from a button named for the list", async () => {
    const user = userEvent.setup();
    setup();

    await openMenu(user);

    [
      "Rename list",
      "Move left",
      "Move right",
      "Mark as done list",
      "Archive list"
    ].forEach((name) =>
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument()
    );
  });

  it("FR2.2 renames the list through a dialog", async () => {
    const user = userEvent.setup();
    const { renameList, list } = setup();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Rename list" }));
    const field = screen.getByLabelText("List name");
    await user.clear(field);
    await user.type(field, "QA{Enter}");

    expect(renameList).toHaveBeenCalledWith(list.id, "QA");
  });

  it("FR2.2 keeps the dialog open and shows the reason when the name is refused", async () => {
    const user = userEvent.setup();
    const { renameList } = setup();
    renameList.mockReturnValue({
      ok: false,
      error: "A list name cannot be blank."
    });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Rename list" }));
    await user.clear(screen.getByLabelText("List name"));
    await user.click(screen.getByRole("button", { name: "Rename" }));

    expect(
      screen.getByText("A list name cannot be blank.")
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("FR2.3 moves the list left and right by menu items, the keyboard alternative to drag", async () => {
    const user = userEvent.setup();
    const { reorderList, list } = setup({ index: 1, listCount: 3 });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Move left" }));
    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Move right" }));

    expect(reorderList).toHaveBeenNthCalledWith(1, list.id, 0);
    expect(reorderList).toHaveBeenNthCalledWith(2, list.id, 2);
  });

  it("FR2.3 disables Move left on the first list and Move right on the last list", async () => {
    const user = userEvent.setup();
    setup({ index: 0, listCount: 1 });

    await openMenu(user);

    expect(screen.getByRole("menuitem", { name: "Move left" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(
      screen.getByRole("menuitem", { name: "Move right" })
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("FR3.3 marks and unmarks the done list", async () => {
    const user = userEvent.setup();
    const { setListDone, list } = setup();

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Mark as done list" })
    );

    expect(setListDone).toHaveBeenCalledWith(list.id, true);
  });

  it("FR3.3 offers to unmark a list that is already the done list", async () => {
    const user = userEvent.setup();
    const done = newList("Review", { done: true });
    const { setListDone } = setup({ list: done });

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Unmark as done list" })
    );

    expect(setListDone).toHaveBeenCalledWith(done.id, false);
  });

  it("FR2.4 archives the list", async () => {
    const user = userEvent.setup();
    const { archiveList, list } = setup();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Archive list" }));

    expect(archiveList).toHaveBeenCalledWith(list.id);
  });

  it("FR10.1 sets a card limit from the menu and saves a whole number", async () => {
    const user = userEvent.setup();
    const { setListLimit, list } = setup();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Set card limit" }));
    await user.type(screen.getByLabelText("Card limit"), "3{Enter}");

    expect(setListLimit).toHaveBeenCalledWith(list.id, 3);
  });

  it("FR10.1 clears the limit when the field is left blank and offers Change card limit for a list that has one", async () => {
    const user = userEvent.setup();
    const limited = newList("Review", { limit: 4 });
    const { setListLimit } = setup({ list: limited });

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Change card limit" })
    );
    const field = screen.getByLabelText("Card limit");
    expect(field).toHaveValue("4");
    await user.clear(field);
    await user.click(screen.getByRole("button", { name: "Save limit" }));

    expect(setListLimit).toHaveBeenCalledWith(limited.id, null);
  });

  it("FR10.1 refuses text, zero and fractions in words and does not save", async () => {
    const user = userEvent.setup();
    const { setListLimit } = setup();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Set card limit" }));
    for (const value of ["abc", "0", "2.5"]) {
      const field = screen.getByLabelText("Card limit");
      await user.clear(field);
      await user.type(field, value);
      await user.click(screen.getByRole("button", { name: "Save limit" }));
      expect(
        screen.getByText(
          "Enter a whole number of 1 or more, or leave it blank."
        )
      ).toBeInTheDocument();
    }

    expect(setListLimit).not.toHaveBeenCalled();
  });

  it("NFR3 returns focus to the list actions button after the rename dialog closes", async () => {
    const user = userEvent.setup();
    setup();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Rename list" }));
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "List actions for Review" })
    ).toHaveFocus();
  });

  it("NFR3 closes with Escape and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    setup();

    await openMenu(user);
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "List actions for Review" })
    ).toHaveFocus();
  });
});
