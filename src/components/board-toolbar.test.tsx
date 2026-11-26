import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardToolbar } from "@/components/board-toolbar";
import { renderWithTheme } from "@/test-utils";

function setup(
  overrides: Partial<React.ComponentProps<typeof BoardToolbar>> = {}
) {
  const onOpenFilters = jest.fn();
  const onNewTask = jest.fn();
  renderWithTheme(
    <BoardToolbar
      boardName="Work board"
      activeFilterCount={0}
      onOpenFilters={onOpenFilters}
      onNewTask={onNewTask}
      {...overrides}
    />
  );
  return { onOpenFilters, onNewTask };
}

describe("BoardToolbar", () => {
  it("FR7.2 shows the open board's name as plain text", () => {
    setup();

    expect(screen.getByTestId("top-bar-board-name")).toHaveTextContent(
      "Work board"
    );
  });

  it("FR7.2 shows the boards menu in place of the plain board name when one is given", () => {
    setup({ boardsMenu: <button data-testid="boards-slot">Boards</button> });

    expect(screen.getByTestId("boards-slot")).toBeInTheDocument();
    expect(screen.queryByTestId("top-bar-board-name")).not.toBeInTheDocument();
  });

  it("FR9.1 opens the command menu from a labelled button", async () => {
    const user = userEvent.setup();
    const onOpenCommands = jest.fn();
    setup({ onOpenCommands });

    await user.click(
      screen.getByRole("button", { name: "Open the command menu" })
    );

    expect(onOpenCommands).toHaveBeenCalledTimes(1);
  });

  it("FR4.1 names the Filter button with the number of active filters", () => {
    setup({ activeFilterCount: 2 });

    const button = screen.getByRole("button", { name: "Filters, 2 active" });
    expect(button).toHaveTextContent("Filter 2");
  });

  it("FR4.1 names the Filter button plainly when nothing is active", () => {
    setup();

    expect(screen.getByRole("button", { name: "Filters" })).toHaveTextContent(
      /^Filter$/
    );
  });

  it("FR4.1 opens the filter panel from the Filter button, passing the button as anchor", async () => {
    const user = userEvent.setup();
    const { onOpenFilters } = setup();

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(onOpenFilters).toHaveBeenCalledWith(
      screen.getByRole("button", { name: "Filters" })
    );
  });

  it("FR2.2 starts a new task from the New task button", async () => {
    const user = userEvent.setup();
    const { onNewTask } = setup();

    await user.click(screen.getByRole("button", { name: /new task/i }));

    expect(onNewTask).toHaveBeenCalledTimes(1);
  });

  it("FR1.3 disables New task when adding is switched off", () => {
    setup({ newTaskDisabled: true });

    expect(screen.getByRole("button", { name: /new task/i })).toBeDisabled();
  });

  it("keeps the board toolbar out of the banner landmark so the global bar owns it", () => {
    setup();

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });
});
