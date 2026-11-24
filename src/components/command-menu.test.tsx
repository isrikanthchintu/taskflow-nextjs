import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CommandMenu,
  filterCommands,
  type Command
} from "@/components/command-menu";
import { renderWithTheme } from "@/test-utils";

function makeCommands(): {
  runs: Record<string, jest.Mock>;
  list: Command[];
} {
  const runs = {
    "new-card": jest.fn(),
    "new-list": jest.fn(),
    "focus-search": jest.fn(),
    "switch-board": jest.fn(),
    "open-settings": jest.fn(),
    "export-board": jest.fn()
  };
  const labels: Record<string, string> = {
    "new-card": "New card",
    "new-list": "New list",
    "focus-search": "Go to search",
    "switch-board": "Switch board",
    "open-settings": "Open settings",
    "export-board": "Export this board"
  };
  const list: Command[] = Object.entries(runs).map(([id, run]) => ({
    id,
    label: labels[id],
    run
  }));
  return { runs, list };
}

function Harness({ commands }: { commands: Command[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button data-testid="opener" onClick={() => setOpen(true)}>
        Open commands
      </button>
      <CommandMenu
        open={open}
        onClose={() => setOpen(false)}
        commands={commands}
      />
    </>
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("opener"));
  return screen.getByRole("combobox");
}

describe("CommandMenu", () => {
  it("FR9.1 filterCommands matches the typed text without regard to case", () => {
    const { list } = makeCommands();

    expect(filterCommands(list, "NEW").map((item) => item.id)).toEqual([
      "new-card",
      "new-list"
    ]);
    expect(filterCommands(list, "  ")).toHaveLength(list.length);
    expect(filterCommands(list, "zzz")).toEqual([]);
  });

  it("FR9.1 lists the available actions and filters them as you type", async () => {
    const user = userEvent.setup();
    const { list } = makeCommands();
    renderWithTheme(<Harness commands={list} />);

    const input = await openMenu(user);
    expect(screen.getAllByRole("option")).toHaveLength(6);

    await user.type(input, "new l");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      screen.getByRole("option", { name: /New list/ })
    ).toBeInTheDocument();
  });

  it("FR9.1 runs the highlighted command when Enter is pressed and closes the menu", async () => {
    const user = userEvent.setup();
    const commands = makeCommands();
    renderWithTheme(<Harness commands={commands.list} />);

    const input = await openMenu(user);
    await user.type(input, "search{Enter}");

    await waitFor(() =>
      expect(commands.runs["focus-search"]).toHaveBeenCalledTimes(1)
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("FR9.1 moves the highlight with the arrow keys before Enter runs", async () => {
    const user = userEvent.setup();
    const commands = makeCommands();
    renderWithTheme(<Harness commands={commands.list} />);

    await openMenu(user);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    await waitFor(() =>
      expect(commands.runs["focus-search"]).toHaveBeenCalledTimes(1)
    );
    expect(commands.runs["new-card"]).not.toHaveBeenCalled();
  });

  it("FR9.1 closes with Escape without running anything and returns focus to the opener", async () => {
    const user = userEvent.setup();
    const commands = makeCommands();
    renderWithTheme(<Harness commands={commands.list} />);

    await openMenu(user);
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("opener")).toHaveFocus();
    Object.values(commands.runs).forEach((run) =>
      expect(run).not.toHaveBeenCalled()
    );
  });

  it("FR9.1 says so in words when nothing matches and Enter runs nothing", async () => {
    const user = userEvent.setup();
    const commands = makeCommands();
    renderWithTheme(<Harness commands={commands.list} />);

    const input = await openMenu(user);
    await user.type(input, "zzz{Enter}");

    expect(screen.getByTestId("command-menu-empty")).toHaveTextContent(
      "No command matches that."
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("FR9.1 does not run a disabled command", async () => {
    const user = userEvent.setup();
    const run = jest.fn();
    renderWithTheme(
      <Harness
        commands={[{ id: "new-card", label: "New card", disabled: true, run }]}
      />
    );

    const input = await openMenu(user);
    await user.type(input, "{Enter}");

    expect(run).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("NFR3 names the dialog and links the input to the list of options", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness commands={makeCommands().list} />);

    const input = await openMenu(user);

    expect(
      screen.getByRole("dialog", { name: "Command menu" })
    ).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-controls", "command-menu-list");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "command-option-new-card"
    );
  });
});
