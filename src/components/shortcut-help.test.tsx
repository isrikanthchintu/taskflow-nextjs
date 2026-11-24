import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortcutHelp } from "@/components/shortcut-help";
import { renderWithTheme } from "@/test-utils";

describe("ShortcutHelp", () => {
  it("FR9.2 lists new card, new list, go to search and switch board with their keys", () => {
    renderWithTheme(<ShortcutHelp open onClose={jest.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    expect(dialog).toBeInTheDocument();
    const list = screen.getByTestId("shortcut-help-list");
    [
      ["New card", "N"],
      ["New list", "L"],
      ["Go to search", "/"],
      ["Switch board", "B"]
    ].forEach(([action, key]) => {
      expect(list).toHaveTextContent(action);
      expect(list).toHaveTextContent(key);
    });
  });

  it("FR9.3 explains that single keys are off while typing or in a dialog", () => {
    renderWithTheme(<ShortcutHelp open onClose={jest.fn()} />);

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "do not work while you type in a field or while a dialog is open"
    );
  });

  it("FR9.2 renders nothing when closed", () => {
    renderWithTheme(<ShortcutHelp open={false} onClose={jest.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("NFR3 closes with the Close button and with Escape", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithTheme(<ShortcutHelp open onClose={onClose} />);

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
